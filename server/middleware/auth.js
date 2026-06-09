const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./error');

const protect = async (req, res, next) => {
  try {
    let token;
    
    // 1) Getting token from Authorization header or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.refreshToken) {
      // In cases where we want cookie fallback, but typically Bearer is preferred
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verification of token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+activeBranch +branches');
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!currentUser.isActive) {
      return next(new AppError('This user account has been deactivated.', 403));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    return next(new AppError('Authentication failed. Invalid token.', 401));
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

const resolveBranch = (req, res, next) => {
  // Resolve branch context from x-branch-id header, query parameter, or user's active branch
  const branchId = req.headers['x-branch-id'] || req.query.branchId || (req.user && req.user.activeBranch?.toString());

  if (!branchId && req.user?.role !== 'SuperAdmin') {
    return next(new AppError('No branch context specified. Please select a branch.', 400));
  }

  // If user is not SuperAdmin, verify they are authorized for this branch
  if (req.user && req.user.role !== 'SuperAdmin') {
    const userBranches = req.user.branches.map(b => b.toString());
    if (!userBranches.includes(branchId)) {
      return next(new AppError('Access denied: You are not authorized for this branch.', 403));
    }
  }

  req.branchId = branchId;
  next();
};

module.exports = {
  protect,
  restrictTo,
  resolveBranch
};
