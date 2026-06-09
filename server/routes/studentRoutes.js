const express = require('express');
const studentController = require('../controllers/studentController');
const { protect, restrictTo, resolveBranch } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(resolveBranch);

router.post('/register', restrictTo('SuperAdmin', 'Admin', 'Principal'), studentController.registerStudent);
router.get('/', restrictTo('SuperAdmin', 'Admin', 'Principal', 'Teacher', 'Accountant', 'HR'), studentController.getAllStudents);

router.get('/profile', restrictTo('Student', 'Parent'), studentController.getStudentProfile);

router.route('/:id')
  .get(restrictTo('SuperAdmin', 'Admin', 'Principal', 'Teacher', 'Student', 'Parent'), studentController.getStudent)
  .put(restrictTo('SuperAdmin', 'Admin', 'Principal'), studentController.updateStudent)
  .delete(restrictTo('SuperAdmin', 'Admin', 'Principal'), studentController.deleteStudent);

module.exports = router;
