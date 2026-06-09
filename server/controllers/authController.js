const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Branch = require('../models/Branch');
const { AppError } = require('../middleware/error');
const { logAudit } = require('../utils/logger');

// Generate JWT tokens
const signToken = (id, secret, expiry) => {
  return jwt.sign({ id }, secret, { expiresIn: expiry });
};

const sendTokenResponse = async (user, statusCode, req, res) => {
  const accessToken = signToken(user._id, process.env.JWT_ACCESS_SECRET, process.env.JWT_ACCESS_EXPIRY);
  const refreshToken = signToken(user._id, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRY);

  // Store refresh token in database
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days matching expiry
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production',
    sameSite: 'Lax'
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Remove password from output
  user.password = undefined;
  user.refreshToken = undefined;

  res.status(statusCode).json({
    status: 'success',
    accessToken,
    data: { user }
  });
};

exports.bootstrap = async (req, res, next) => {
  try {
    const existingUser = await User.findOne({ role: 'SuperAdmin' });
    if (existingUser) {
      return next(new AppError('System is already bootstrapped. SuperAdmin exists.', 400));
    }

    const newSuperAdmin = await User.create({
      email: req.body.email,
      password: req.body.password,
      role: 'SuperAdmin',
      isEmailVerified: true
    });

    await logAudit({
      userId: newSuperAdmin._id,
      email: newSuperAdmin.email,
      role: newSuperAdmin.role,
      action: 'BOOTSTRAP_SYSTEM',
      entity: 'User',
      entityId: newSuperAdmin._id,
      req
    });

    await sendTokenResponse(newSuperAdmin, 201, req, res);
  } catch (error) {
    next(error);
  }
};

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('A user with this email already exists', 400));
    }

    // Determine role: if email contains "admin" (case-insensitive), make Admin; otherwise Student
    const isCodeAdmin = email.toLowerCase().includes('admin');
    const role = isCodeAdmin ? 'Admin' : 'Student';

    // Find a default branch to link to the user
    const defaultBranch = await Branch.findOne();
    const branchId = defaultBranch ? defaultBranch._id : null;
    const branches = branchId ? [branchId] : [];

    const newUser = await User.create({
      name: name || email.split('@')[0],
      email,
      password,
      role,
      branches,
      activeBranch: branchId,
      isEmailVerified: true
    });

    await logAudit({
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role,
      action: 'USER_SIGNUP',
      entity: 'User',
      entityId: newUser._id,
      req
    });

    await sendTokenResponse(newUser, 201, req, res);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password +branches +activeBranch');
    if (!user || !(await user.comparePassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    if (!user.isActive) {
      return next(new AppError('This user account has been deactivated.', 403));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await logAudit({
      userId: user._id,
      email: user.email,
      role: user.role,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user._id,
      req
    });

    await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return next(new AppError('Refresh token not found. Please login again.', 401));
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select('+refreshToken +branches +activeBranch');
    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError('Invalid refresh token. Please login again.', 401));
    }

    // Generate new access token
    const accessToken = signToken(user._id, process.env.JWT_ACCESS_SECRET, process.env.JWT_ACCESS_EXPIRY);

    res.status(200).json({
      status: 'success',
      accessToken,
      data: { user }
    });
  } catch (error) {
    return next(new AppError('Invalid refresh token. Please login again.', 401));
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        if (decoded) {
          const user = await User.findById(decoded.id);
          if (user) {
            user.refreshToken = undefined;
            await user.save({ validateBeforeSave: false });
          }
        }
      } catch (_) {
        // Invalid token — nothing to clean up
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production',
      sameSite: 'Lax'
    });

    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};


exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('branches activeBranch');
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

exports.switchBranch = async (req, res, next) => {
  try {
    const { branchId } = req.body;
    const user = req.user;

    if (user.role !== 'SuperAdmin' && !user.branches.map(b => b.toString()).includes(branchId)) {
      return next(new AppError('You are not authorized to access this branch.', 403));
    }

    user.activeBranch = branchId;
    await user.save({ validateBeforeSave: false });

    await logAudit({
      userId: user._id,
      email: user.email,
      role: user.role,
      branchId,
      action: 'SWITCH_BRANCH',
      entity: 'User',
      entityId: user._id,
      req
    });

    res.status(200).json({
      status: 'success',
      message: 'Branch switched successfully',
      data: { activeBranchId: branchId }
    });
  } catch (error) {
    next(error);
  }
};
