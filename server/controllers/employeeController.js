const Employee = require('../models/Employee');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const Payroll = require('../models/Payroll');
const { AppError } = require('../middleware/error');
const { logAudit } = require('../utils/logger');
const mongoose = require('mongoose');

exports.registerEmployee = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      email,
      password,
      role, // HR, Teacher, Accountant, Principal
      employeeId,
      firstName,
      lastName,
      phone,
      joiningDate,
      department,
      designation,
      basicSalary,
      allowances = [],
      deductions = []
    } = req.body;

    if (!['HR', 'Teacher', 'Accountant', 'Principal'].includes(role)) {
      return next(new AppError('Invalid employee role specified', 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('A user with this email already exists', 400));
    }

    // 1. Create User
    const userAccount = await User.create([{
      email,
      password,
      role,
      branches: [req.branchId],
      activeBranch: req.branchId,
      isEmailVerified: true
    }], { session });

    // 2. Create Employee Profile
    const employeeProfile = await Employee.create([{
      user: userAccount[0]._id,
      branch: req.branchId,
      employeeId,
      firstName,
      lastName,
      phone,
      joiningDate: joiningDate || new Date(),
      department,
      designation,
      salaryStructure: {
        basicSalary,
        allowances,
        deductions
      }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'REGISTER_EMPLOYEE',
      entity: 'Employee',
      entityId: employeeProfile[0]._id,
      req
    });

    res.status(201).json({
      status: 'success',
      data: { employee: employeeProfile[0] }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

exports.getAllEmployees = async (req, res, next) => {
  try {
    const query = { branch: req.branchId };

    if (req.query.department) query.department = req.query.department;
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { employeeId: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query)
      .populate('user', 'email isActive lastLogin')
      .sort({ employeeId: 1 });

    res.status(200).json({
      status: 'success',
      results: employees.length,
      data: { employees }
    });
  } catch (error) {
    next(error);
  }
};

exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, branch: req.branchId })
      .populate('user', 'email isActive lastLogin');

    if (!employee) {
      return next(new AppError('No employee found with that ID under this branch', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { employee }
    });
  } catch (error) {
    next(error);
  }
};

// Leave request actions
exports.submitLeaveRequest = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    
    // Resolve employee associated with user
    const employee = await Employee.findOne({ user: req.user._id, branch: req.branchId });
    if (!employee) {
      return next(new AppError('You do not have an active employee profile in this branch.', 404));
    }

    const leave = await LeaveRequest.create({
      employee: employee._id,
      branch: req.branchId,
      leaveType,
      startDate,
      endDate,
      reason
    });

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'SUBMIT_LEAVE_REQUEST',
      entity: 'LeaveRequest',
      entityId: leave._id,
      req
    });

    res.status(201).json({
      status: 'success',
      data: { leave }
    });
  } catch (error) {
    next(error);
  }
};

exports.getLeaveRequests = async (req, res, next) => {
  try {
    const leaves = await LeaveRequest.find({ branch: req.branchId })
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: leaves.length,
      data: { leaves }
    });
  } catch (error) {
    next(error);
  }
};

exports.approveLeaveRequest = async (req, res, next) => {
  try {
    const { status, comments } = req.body;
    const leave = await LeaveRequest.findOne({ _id: req.params.id, branch: req.branchId });

    if (!leave) {
      return next(new AppError('No leave request found with that ID', 404));
    }

    const reviewer = await Employee.findOne({ user: req.user._id, branch: req.branchId });

    leave.status = status;
    leave.approvedBy = reviewer?._id;
    leave.comments = comments;
    await leave.save();

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: `LEAVE_REQUEST_${status.toUpperCase()}`,
      entity: 'LeaveRequest',
      entityId: leave._id,
      req
    });

    res.status(200).json({
      status: 'success',
      data: { leave }
    });
  } catch (error) {
    next(error);
  }
};

// Payroll calculation & creation
exports.processPayroll = async (req, res, next) => {
  try {
    const { employeeId, month, year, paymentMethod } = req.body;

    const employee = await Employee.findOne({ _id: employeeId, branch: req.branchId });
    if (!employee) {
      return next(new AppError('Employee profile not found.', 404));
    }

    // Check if payroll already run for this period
    const existingPayroll = await Payroll.findOne({ employee: employeeId, month, year });
    if (existingPayroll) {
      return next(new AppError('Payroll already processed for this employee for this month/year.', 400));
    }

    const basicSalary = employee.salaryStructure.basicSalary;
    const allowancesTotal = employee.salaryStructure.allowances.reduce((acc, curr) => acc + curr.amount, 0);
    const deductionsTotal = employee.salaryStructure.deductions.reduce((acc, curr) => acc + curr.amount, 0);
    const netSalary = basicSalary + allowancesTotal - deductionsTotal;

    const payslipUrl = `https://cloudinary.com/mock_payslip_${employeeId}_${month}_${year}.pdf`;

    const payroll = await Payroll.create({
      employee: employeeId,
      branch: req.branchId,
      month,
      year,
      basicSalary,
      allowancesTotal,
      deductionsTotal,
      netSalary,
      status: 'Paid',
      paymentDate: new Date(),
      paymentMethod: paymentMethod || 'BankTransfer',
      payslipUrl
    });

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'PROCESS_PAYROLL',
      entity: 'Payroll',
      entityId: payroll._id,
      req
    });

    res.status(201).json({
      status: 'success',
      data: { payroll }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPayrollHistory = async (req, res, next) => {
  try {
    const query = { branch: req.branchId };
    if (req.query.employeeId) query.employee = req.query.employeeId;

    const payrolls = await Payroll.find(query)
      .populate('employee', 'firstName lastName employeeId department designation')
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      status: 'success',
      results: payrolls.length,
      data: { payrolls }
    });
  } catch (error) {
    next(error);
  }
};
