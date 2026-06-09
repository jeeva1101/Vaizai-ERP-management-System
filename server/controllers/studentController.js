const Student = require('../models/Student');
const User = require('../models/User');
const Parent = require('../models/Parent');
const { AppError } = require('../middleware/error');
const { logAudit } = require('../utils/logger');
const mongoose = require('mongoose');

exports.registerStudent = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      email,
      password,
      admissionNo,
      rollNo,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodGroup,
      class: className,
      section,
      parentEmail,
      parentFirstName,
      parentLastName,
      parentPhone,
      relationship
    } = req.body;

    // 1. Create Student User Account
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('A user with this email already exists', 400));
    }

    const userAccount = await User.create([{
      email,
      password,
      role: 'Student',
      branches: [req.branchId],
      activeBranch: req.branchId,
      isEmailVerified: true // Set true for demo/mock ease
    }], { session });

    const studentUserId = userAccount[0]._id;

    // 2. Resolve/Create Parent Account
    let parentId = null;
    if (parentEmail) {
      let parentUser = await User.findOne({ email: parentEmail }).session(session);
      let parentProfile;

      if (!parentUser) {
        // Create Parent User Account
        parentUser = await User.create([{
          email: parentEmail,
          password: 'ParentPassword123!', // Default password
          role: 'Parent',
          branches: [req.branchId],
          activeBranch: req.branchId,
          isEmailVerified: true
        }], { session });

        // Create Parent Profile
        parentProfile = await Parent.create([{
          user: parentUser[0]._id,
          branch: req.branchId,
          firstName: parentFirstName || 'Parent',
          lastName: parentLastName || lastName,
          relationship: relationship || 'Guardian',
          phone: parentPhone || '0000000000',
          children: []
        }], { session });
        
        parentProfile = parentProfile[0];
      } else {
        parentProfile = await Parent.findOne({ user: parentUser._id }).session(session);
      }

      parentId = parentProfile._id;
    }

    // 3. Create Student Profile
    const studentProfile = await Student.create([{
      user: studentUserId,
      branch: req.branchId,
      admissionNo,
      rollNo,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodGroup,
      class: className,
      section,
      parent: parentId
    }], { session });

    // Link student back to parent if present
    if (parentId) {
      await Parent.findByIdAndUpdate(parentId, {
        $addToSet: { children: studentProfile[0]._id }
      }, { session });
    }

    await session.commitTransaction();
    session.endSession();

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'REGISTER_STUDENT',
      entity: 'Student',
      entityId: studentProfile[0]._id,
      req
    });

    res.status(201).json({
      status: 'success',
      data: {
        student: studentProfile[0]
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

exports.getAllStudents = async (req, res, next) => {
  try {
    const query = { branch: req.branchId };

    if (req.query.class) query.class = req.query.class;
    if (req.query.section) query.section = req.query.section;
    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { admissionNo: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .populate('user', 'email isActive')
      .populate('parent')
      .sort({ admissionNo: 1 });

    res.status(200).json({
      status: 'success',
      results: students.length,
      data: { students }
    });
  } catch (error) {
    next(error);
  }
};

exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, branch: req.branchId })
      .populate('user', 'email isActive lastLogin')
      .populate('parent');

    if (!student) {
      return next(new AppError('No student found with that ID under this branch', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { student }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, branch: req.branchId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return next(new AppError('No student found with that ID under this branch', 404));
    }

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'UPDATE_STUDENT',
      entity: 'Student',
      entityId: student._id,
      req
    });

    res.status(200).json({
      status: 'success',
      data: { student }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, branch: req.branchId });
    if (!student) {
      return next(new AppError('No student found with that ID under this branch', 404));
    }

    // Toggle deactivate account
    await User.findByIdAndUpdate(student.user, { isActive: false });
    student.status = 'Suspended';
    await student.save();

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'DEACTIVATE_STUDENT',
      entity: 'Student',
      entityId: student._id,
      req
    });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

exports.getStudentProfile = async (req, res, next) => {
  try {
    let student = await Student.findOne({ user: req.user._id })
      .populate('user', 'email isActive lastLogin')
      .populate('parent')
      .populate('branch');

    if (!student) {
      // Find a default branch to link
      const Branch = require('../models/Branch');
      const defaultBranch = await Branch.findOne() || { _id: req.branchId };
      
      // Auto-create a demo student profile to guarantee the dashboard functions immediately
      student = await Student.create({
        user: req.user._id,
        branch: defaultBranch._id,
        admissionNo: `ADM-${Math.floor(100000 + Math.random() * 900000)}`,
        rollNo: `${Math.floor(1 + Math.random() * 50)}`,
        firstName: req.user.name?.split(' ')[0] || req.user.email.split('@')[0],
        lastName: req.user.name?.split(' ')[1] || 'Student',
        dateOfBirth: new Date('2010-08-20'),
        gender: 'Male',
        class: 'Grade 10',
        section: 'Section A',
        status: 'Active'
      });

      // Populate references
      student = await Student.findById(student._id)
        .populate('user', 'email isActive lastLogin')
        .populate('parent')
        .populate('branch');
    }

    res.status(200).json({
      status: 'success',
      data: { student }
    });
  } catch (error) {
    next(error);
  }
};
