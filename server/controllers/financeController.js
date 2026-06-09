const FeeCategory = require('../models/FeeCategory');
const FeeRecord = require('../models/FeeRecord');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { AppError } = require('../middleware/error');
const { logAudit } = require('../utils/logger');
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Helper to get Razorpay instance
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'mockkeysecret456'
  });
};

// Fee Categories
exports.createFeeCategory = async (req, res, next) => {
  try {
    const feeCategory = await FeeCategory.create({
      ...req.body,
      branch: req.branchId
    });

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'CREATE_FEE_CATEGORY',
      entity: 'FeeCategory',
      entityId: feeCategory._id,
      req
    });

    res.status(201).json({
      status: 'success',
      data: { feeCategory }
    });
  } catch (error) {
    next(error);
  }
};

exports.getFeeCategories = async (req, res, next) => {
  try {
    const categories = await FeeCategory.find({ branch: req.branchId });
    res.status(200).json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

// Fee Assignments
exports.assignFeeToStudent = async (req, res, next) => {
  try {
    const { studentId, class: className, feeCategoryId, dueDate } = req.body;

    const category = await FeeCategory.findById(feeCategoryId);
    if (!category) {
      return next(new AppError('Fee category not found', 404));
    }

    let students = [];
    if (studentId) {
      const student = await Student.findById(studentId);
      if (student) students.push(student);
    } else if (className) {
      students = await Student.find({ branch: req.branchId, class: className, status: 'Active' });
    }

    if (students.length === 0) {
      return next(new AppError('No matching active students found. Check the class name matches exactly.', 400));
    }

    // Prevent duplicate invoices: skip students who already have this fee category
    const existingRecords = await FeeRecord.find({
      branch: req.branchId,
      feeCategory: feeCategoryId,
      student: { $in: students.map(s => s._id) }
    }).select('student');
    const alreadyInvoicedIds = new Set(existingRecords.map(r => r.student.toString()));
    const newStudents = students.filter(s => !alreadyInvoicedIds.has(s._id.toString()));

    if (newStudents.length === 0) {
      return next(new AppError('All selected students already have an invoice for this fee category.', 400));
    }

    const feeRecords = await Promise.all(
      newStudents.map(student =>
        FeeRecord.create({
          branch: req.branchId,
          student: student._id,
          feeCategory: feeCategoryId,
          dueDate,
          amount: category.amount,
          status: 'Unpaid'
        })
      )
    );

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'ASSIGN_FEES',
      entity: 'FeeRecord',
      req
    });

    res.status(201).json({
      status: 'success',
      results: feeRecords.length,
      skipped: alreadyInvoicedIds.size,
      data: { feeRecords }
    });
  } catch (error) {
    next(error);
  }
};


exports.getFeeRecords = async (req, res, next) => {
  try {
    const query = { branch: req.branchId };
    
    if (req.query.status) query.status = req.query.status;

    // For Student role: auto-resolve their student profile so they always see
    // their own fee records, even if the branch context doesn't perfectly match.
    if (req.user.role === 'Student') {
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (studentProfile) {
        // Use the actual branch the student belongs to (may differ from activeBranch in token)
        query.branch = studentProfile.branch;
        query.student = studentProfile._id;
      } else if (req.query.studentId) {
        query.student = req.query.studentId;
      }
    } else if (req.user.role === 'Parent') {
      // Parent: filter by the child studentId provided from the client
      if (req.query.studentId) query.student = req.query.studentId;
    } else {
      // Admin/Staff: honour optional studentId filter
      if (req.query.studentId) query.student = req.query.studentId;
    }

    const records = await FeeRecord.find(query)
      .populate('student', 'firstName lastName rollNo admissionNo class section')
      .populate('feeCategory')
      .sort({ dueDate: 1 });

    res.status(200).json({
      status: 'success',
      results: records.length,
      data: { records }
    });
  } catch (error) {
    next(error);
  }
};


// Razorpay Payment checkout initialization
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { feeRecordId } = req.body;
    const feeRecord = await FeeRecord.findById(feeRecordId).populate('student');

    if (!feeRecord) {
      return next(new AppError('Fee record not found', 404));
    }

    const amountToPay = feeRecord.amount + feeRecord.fine - feeRecord.discount - feeRecord.paidAmount;
    if (amountToPay <= 0) {
      return next(new AppError('This fee record has already been fully paid', 400));
    }

    const rzp = getRazorpayInstance();
    const orderOptions = {
      amount: amountToPay * 100, // Razorpay takes amounts in paisa (sub-unit)
      currency: 'INR',
      receipt: `receipt_fee_${feeRecordId.toString().substring(15)}_${Math.random().toString(36).substring(2, 7)}`
    };

    // If key is mock, we bypass Razorpay API call to avoid API errors and return mock credentials
    let order;
    if (process.env.RAZORPAY_KEY_ID === 'rzp_test_mockkeyid123') {
      order = {
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount: orderOptions.amount,
        currency: 'INR',
        receipt: orderOptions.receipt,
        status: 'created'
      };
    } else {
      try {
        order = await rzp.orders.create(orderOptions);
      } catch (rzpErr) {
        console.error('Razorpay Order Creation Failed:', rzpErr);
        return next(new AppError(`Razorpay payment initialization failed: ${rzpErr.message}`, 400));
      }
    }

    // Pre-create payment record as pending
    // Use feeRecord.branch (authoritative), not req.branchId which may differ
    // when a student's activeBranch context doesn't perfectly match the fee record's branch.
    await Payment.create({
      branch: feeRecord.branch,
      student: feeRecord.student._id,
      feeRecord: feeRecord._id,
      amount: amountToPay,
      paymentMethod: 'Online',
      razorpayOrderId: order.id,
      transactionStatus: 'Pending',
      receiptNo: orderOptions.receipt
    });

    res.status(200).json({
      status: 'success',
      data: { order, keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123' }
    });
  } catch (error) {
    next(error);
  }
};

// Payment verification
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const payment = await Payment.findOne({ razorpayOrderId }).populate('feeRecord');
    if (!payment) {
      return next(new AppError('Matching payment record not found for this order', 404));
    }

    if (payment.transactionStatus === 'Completed') {
      return res.status(200).json({
        status: 'success',
        message: 'Payment completed and verified successfully',
        data: { payment }
      });
    }

    // Verify signature (only if not mock credentials)
    if (process.env.RAZORPAY_KEY_ID !== 'rzp_test_mockkeyid123') {
      const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const digest = shasum.digest('hex');

      if (digest !== razorpaySignature) {
        payment.transactionStatus = 'Failed';
        await payment.save();
        return next(new AppError('Payment signature verification failed. Transaction invalid.', 400));
      }
    }

    // Update payment record to completed
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.transactionStatus = 'Completed';
    payment.transactionDate = new Date();
    await payment.save();

    // Update corresponding FeeRecord
    const feeRecord = payment.feeRecord;
    feeRecord.paidAmount += payment.amount;
    feeRecord.status = feeRecord.paidAmount >= (feeRecord.amount + feeRecord.fine - feeRecord.discount) ? 'Paid' : 'PartiallyPaid';
    await feeRecord.save();

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'VERIFY_PAYMENT',
      entity: 'Payment',
      entityId: payment._id,
      req
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment completed and verified successfully',
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
};
