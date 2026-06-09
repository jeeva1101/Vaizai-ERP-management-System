const express = require('express');
const crmController = require('../controllers/crmController');
const { protect, restrictTo, resolveBranch } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(resolveBranch);

router.route('/')
  .get(restrictTo('SuperAdmin', 'Admin', 'Principal', 'HR'), crmController.getAllLeads)
  .post(restrictTo('SuperAdmin', 'Admin', 'Principal', 'HR'), crmController.createLead);

router.route('/:id')
  .get(restrictTo('SuperAdmin', 'Admin', 'Principal', 'HR'), crmController.getLead)
  .put(restrictTo('SuperAdmin', 'Admin', 'Principal', 'HR'), crmController.updateLead)
  .delete(restrictTo('SuperAdmin', 'Admin'), crmController.deleteLead);

router.post('/:id/followup', restrictTo('SuperAdmin', 'Admin', 'Principal', 'HR'), crmController.addFollowUp);

module.exports = router;
