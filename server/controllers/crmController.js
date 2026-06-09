const Lead = require('../models/Lead');
const Student = require('../models/Student');
const User = require('../models/User');
const { AppError } = require('../middleware/error');
const { logAudit } = require('../utils/logger');

exports.createLead = async (req, res, next) => {
  try {
    const leadData = { ...req.body, branch: req.branchId };
    const newLead = await Lead.create(leadData);

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'CREATE_CRM_LEAD',
      entity: 'Lead',
      entityId: newLead._id,
      req
    });

    res.status(201).json({
      status: 'success',
      data: { lead: newLead }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllLeads = async (req, res, next) => {
  try {
    const query = { branch: req.branchId };

    // Filtering, searching
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) {
      query.$or = [
        { studentName: { $regex: req.query.search, $options: 'i' } },
        { parentName: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: leads.length,
      data: { leads }
    });
  } catch (error) {
    next(error);
  }
};

exports.getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, branch: req.branchId });
    if (!lead) {
      return next(new AppError('No lead found with that ID under this branch', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { lead }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, branch: req.branchId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!lead) {
      return next(new AppError('No lead found with that ID under this branch', 404));
    }

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'UPDATE_CRM_LEAD',
      entity: 'Lead',
      entityId: lead._id,
      req
    });

    res.status(200).json({
      status: 'success',
      data: { lead }
    });
  } catch (error) {
    next(error);
  }
};

exports.addFollowUp = async (req, res, next) => {
  try {
    const { notes, nextFollowUpDate } = req.body;
    const lead = await Lead.findOne({ _id: req.params.id, branch: req.branchId });

    if (!lead) {
      return next(new AppError('No lead found with that ID under this branch', 404));
    }

    lead.followUps.push({ notes, nextFollowUpDate });
    lead.status = 'FollowUp';
    await lead.save();

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'ADD_LEAD_FOLLOWUP',
      entity: 'Lead',
      entityId: lead._id,
      req
    });

    res.status(200).json({
      status: 'success',
      data: { lead }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, branch: req.branchId });
    if (!lead) {
      return next(new AppError('No lead found with that ID under this branch', 404));
    }

    await logAudit({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.branchId,
      action: 'DELETE_CRM_LEAD',
      entity: 'Lead',
      entityId: lead._id,
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
