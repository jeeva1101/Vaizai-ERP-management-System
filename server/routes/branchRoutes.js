const express = require('express');
const branchController = require('../controllers/branchController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', branchController.getAllBranches);
router.get('/:id', branchController.getBranch);

// Only SuperAdmin can modify branches
router.use(restrictTo('SuperAdmin'));
router.post('/', branchController.createBranch);
router.put('/:id', branchController.updateBranch);
router.delete('/:id', branchController.deleteBranch);

module.exports = router;
