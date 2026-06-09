const AuditLog = require('../models/AuditLog');

const logAudit = async ({
  userId,
  email,
  role,
  branchId,
  action,
  entity,
  entityId,
  changes = {},
  req = null
}) => {
  try {
    const auditData = {
      action,
      entity,
      entityId,
      changes,
      email,
      role
    };

    if (userId) auditData.user = userId;
    if (branchId) auditData.branch = branchId;

    if (req) {
      auditData.ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      auditData.userAgent = req.headers['user-agent'];
      if (!auditData.user && req.user) {
        auditData.user = req.user.id;
        auditData.email = req.user.email;
        auditData.role = req.user.role;
        auditData.branch = auditData.branch || req.user.activeBranch;
      }
    }

    await AuditLog.create(auditData);
  } catch (error) {
    console.error('Audit Logging Failed:', error);
  }
};

module.exports = { logAudit };
