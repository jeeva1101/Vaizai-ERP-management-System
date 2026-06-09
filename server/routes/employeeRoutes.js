const express = require('express');
const employeeController = require('../controllers/employeeController');
const { protect, restrictTo, resolveBranch } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(resolveBranch);

// Leave Actions (Self submit, HR/Principal view and approve)
router.post('/leaves', employeeController.submitLeaveRequest);
router.get('/leaves', restrictTo('SuperAdmin', 'Admin', 'Principal', 'HR'), employeeController.getLeaveRequests);
router.put('/leaves/:id/approve', restrictTo('SuperAdmin', 'Admin', 'Principal', 'HR'), employeeController.approveLeaveRequest);

// Payroll Actions
router.post('/payroll', restrictTo('SuperAdmin', 'Admin', 'HR', 'Accountant'), employeeController.processPayroll);
router.get('/payroll', restrictTo('SuperAdmin', 'Admin', 'HR', 'Accountant', 'Teacher'), employeeController.getPayrollHistory);

// Employee Management Actions
router.route('/')
  .post(restrictTo('SuperAdmin', 'Admin', 'HR'), employeeController.registerEmployee)
  .get(restrictTo('SuperAdmin', 'Admin', 'Principal', 'HR'), employeeController.getAllEmployees);

router.route('/:id')
  .get(restrictTo('SuperAdmin', 'Admin', 'Principal', 'HR', 'Teacher', 'Accountant'), employeeController.getEmployee);

module.exports = router;
