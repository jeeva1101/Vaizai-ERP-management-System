const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/bootstrap', authController.bootstrap);
router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected routes
router.use(protect);
router.get('/me', authController.getMe);
router.post('/switch-branch', authController.switchBranch);

module.exports = router;
