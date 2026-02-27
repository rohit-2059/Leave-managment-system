import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required'],
    },
    leaveType: {
      type: String,
      enum: {
        values: ['sick', 'casual', 'earned', 'unpaid', 'other'],
        message: 'Invalid leave type',
      },
      required: [true, 'Leave type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'withdrawn'],
      default: 'pending',
    },
    managerNote: {
      type: String,
      trim: true,
      maxlength: [300, 'Manager note cannot exceed 300 characters'],
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    numberOfDays: {
      type: Number,
      min: [0.5, 'Minimum leave is half day'],
    },
    escalatedToAdmin: {
      type: Boolean,
      default: false,
    },
    adminOverride: {
      type: String,
      enum: ['none', 'approved', 'upheld'],
      default: 'none',
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: [300, 'Admin note cannot exceed 300 characters'],
      default: '',
    },
    adminReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminReviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

leaveSchema.pre('save', function () {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
});

leaveSchema.index({ employeeId: 1, status: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ createdAt: -1 });

const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;
