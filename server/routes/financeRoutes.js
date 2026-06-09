const express = require('express');
const financeController = require('../controllers/financeController');
const { protect, restrictTo, resolveBranch } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(resolveBranch);

// Categories
router.post('/categories', restrictTo('SuperAdmin', 'Admin', 'Accountant'), financeController.createFeeCategory);
router.get('/categories', financeController.getFeeCategories);

// Assignments & Records
router.post('/assign', restrictTo('SuperAdmin', 'Admin', 'Accountant'), financeController.assignFeeToStudent);
router.get('/records', restrictTo('SuperAdmin', 'Admin', 'Accountant', 'Student', 'Parent'), financeController.getFeeRecords);

// Payments (Razorpay Checkout + Webhook verification)
router.post('/checkout', restrictTo('SuperAdmin', 'Admin', 'Accountant', 'Student', 'Parent'), financeController.createRazorpayOrder);
router.post('/verify', restrictTo('SuperAdmin', 'Admin', 'Accountant', 'Student', 'Parent'), financeController.verifyPayment);

module.exports = router;
