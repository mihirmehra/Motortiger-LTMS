import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'LEAD_CREATED',
      'LEAD_UPDATED', 
      'LEAD_SOLD',
      'LEAD_STATUS_CHANGED',
      'LEAD_DELETED',
      'TARGET_CREATED',
      'TARGET_UPDATED',
      'TARGET_DELETED',
      'USER_LOGIN',
      'USER_LOGOUT',
      'SYSTEM_ERROR'
    ]
  },
  entityType: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: ['Lead', 'Target', 'User', 'Team', 'System']
  },
  entityId: {
    type: String,
    required: [true, 'Entity ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);