const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Student = require('../models/Student');
const { AppError } = require('../middleware/error');
const { logAudit } = require('../utils/logger');

// Attendance APIs
exports.markAttendance = async (req, res, next) => {
  try {
    const { date, records } = req.body; // records: [{ studentId/employeeId, status, remarks, lateMinutes }]

    if (!records || !Array.isArray(records)) {
      return next(new AppError('Invalid records structure', 400));
    }

    const attendanceRecords = await Promise.all(
      records.map(async record => {
        const query = {
          branch: req.branchId,
          date: new Date(date)
        };

        if (record.studentId) query.student = record.studentId;
        else if (record.employeeId) query.employee = record.employeeId;

        return await Attendance.findOneAndUpdate(
          query,
          { ...record, status: record.status },
          { upsert: true, new: true }
        );
      })
    );

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'MARK_ATTENDANCE',
      entity: 'Attendance',
      req
    });

    res.status(200).json({
      status: 'success',
      results: attendanceRecords.length,
      data: { attendance: attendanceRecords }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { studentId, employeeId, startDate, endDate } = req.query;
    const query = { branch: req.branchId };

    if (studentId) query.student = studentId;
    if (employeeId) query.employee = employeeId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const records = await Attendance.find(query).sort({ date: -1 });

    res.status(200).json({
      status: 'success',
      results: records.length,
      data: { records }
    });
  } catch (error) {
    next(error);
  }
};

// Timetable APIs
exports.createTimetable = async (req, res, next) => {
  try {
    const { class: className, section, dayOfWeek, periods } = req.body;

    const timetable = await Timetable.findOneAndUpdate(
      { branch: req.branchId, class: className, section, dayOfWeek },
      { periods },
      { upsert: true, new: true }
    );

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'UPDATE_TIMETABLE',
      entity: 'Timetable',
      entityId: timetable._id,
      req
    });

    res.status(200).json({
      status: 'success',
      data: { timetable }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTimetable = async (req, res, next) => {
  try {
    const { class: className, section } = req.query;
    const query = { branch: req.branchId };

    if (className) query.class = className;
    if (section) query.section = section;

    const timetables = await Timetable.find(query).populate('periods.teacher', 'firstName lastName');

    res.status(200).json({
      status: 'success',
      data: { timetables }
    });
  } catch (error) {
    next(error);
  }
};

// Exam APIs
exports.createExam = async (req, res, next) => {
  try {
    const examData = { ...req.body, branch: req.branchId };
    const exam = await Exam.create(examData);

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'CREATE_EXAM',
      entity: 'Exam',
      entityId: exam._id,
      req
    });

    res.status(201).json({
      status: 'success',
      data: { exam }
    });
  } catch (error) {
    next(error);
  }
};

exports.getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({ branch: req.branchId }).sort({ startDate: -1 });

    res.status(200).json({
      status: 'success',
      results: exams.length,
      data: { exams }
    });
  } catch (error) {
    next(error);
  }
};

// Result APIs
exports.publishResults = async (req, res, next) => {
  try {
    const { studentId, examId, marksObtained } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return next(new AppError('Exam not found', 404));
    }

    // Grade calculation
    let totalMaxMarks = 0;
    let totalObtainedMarks = 0;

    marksObtained.forEach(mark => {
      const subjectSchedule = exam.schedules.find(s => s.subject === mark.subject);
      totalMaxMarks += subjectSchedule ? subjectSchedule.maxMarks : 100;
      totalObtainedMarks += mark.marks;
    });

    const percentage = totalMaxMarks > 0 ? parseFloat(((totalObtainedMarks / totalMaxMarks) * 100).toFixed(2)) : 0;
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';
    else if (percentage >= 35) grade = 'E';

    const result = await Result.findOneAndUpdate(
      { branch: req.branchId, student: studentId, exam: examId },
      { marksObtained, percentage, grade, isPublished: true },
      { upsert: true, new: true }
    );

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'PUBLISH_RESULT',
      entity: 'Result',
      entityId: result._id,
      req
    });

    res.status(200).json({
      status: 'success',
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

exports.getStudentResults = async (req, res, next) => {
  try {
    const query = { branch: req.branchId };
    
    if (req.query.studentId) query.student = req.query.studentId;
    if (req.query.examId) query.exam = req.query.examId;

    const results = await Result.find(query)
      .populate('student', 'firstName lastName rollNo')
      .populate('exam', 'name term class')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: results.length,
      data: { results }
    });
  } catch (error) {
    next(error);
  }
};
