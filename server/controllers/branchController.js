const Branch = require('../models/Branch');
const User = require('../models/User');
const { AppError } = require('../middleware/error');
const { logAudit } = require('../utils/logger');

exports.createBranch = async (req, res, next) => {
  try {
    const newBranch = await Branch.create(req.body);

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: newBranch._id,
      action: 'CREATE_BRANCH',
      entity: 'Branch',
      entityId: newBranch._id,
      req
    });

    res.status(201).json({
      status: 'success',
      data: { branch: newBranch }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllBranches = async (req, res, next) => {
  try {
    let branches;
    if (req.user.role === 'SuperAdmin') {
      branches = await Branch.find();
    } else {
      // Return branches this user is assigned to
      branches = await Branch.find({ _id: { $in: req.user.branches } });
    }

    res.status(200).json({
      status: 'success',
      results: branches.length,
      data: { branches }
    });
  } catch (error) {
    next(error);
  }
};

exports.getBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return next(new AppError('No branch found with that ID', 404));
    }

    // Security check
    if (req.user.role !== 'SuperAdmin' && !req.user.branches.map(b => b.toString()).includes(req.params.id)) {
      return next(new AppError('You are not authorized to access this branch.', 403));
    }

    res.status(200).json({
      status: 'success',
      data: { branch }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!branch) {
      return next(new AppError('No branch found with that ID', 404));
    }

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: branch._id,
      action: 'UPDATE_BRANCH',
      entity: 'Branch',
      entityId: branch._id,
      req
    });

    res.status(200).json({
      status: 'success',
      data: { branch }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return next(new AppError('No branch found with that ID', 404));
    }

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: branch._id,
      action: 'DELETE_BRANCH',
      entity: 'Branch',
      entityId: branch._id,
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
