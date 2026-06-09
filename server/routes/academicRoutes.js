const express = require('express');
const academicController = require('../controllers/academicController');
const { protect, restrictTo, resolveBranch } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(resolveBranch);

// Attendance
router.post('/attendance', restrictTo('SuperAdmin', 'Admin', 'Principal', 'Teacher'), academicController.markAttendance);
router.get('/attendance', academicController.getAttendanceReport);

// Timetables
router.post('/timetable', restrictTo('SuperAdmin', 'Admin', 'Principal'), academicController.createTimetable);
router.get('/timetable', academicController.getTimetable);

// Exams
router.post('/exams', restrictTo('SuperAdmin', 'Admin', 'Principal'), academicController.createExam);
router.get('/exams', academicController.getExams);

// Results
router.post('/results', restrictTo('SuperAdmin', 'Admin', 'Principal', 'Teacher'), academicController.publishResults);
router.get('/results', academicController.getStudentResults);

module.exports = router;
