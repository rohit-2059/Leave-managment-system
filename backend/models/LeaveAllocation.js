import mongoose from 'mongoose';

const leaveAllocationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required'],
      unique: true,
    },
    totalLeaves: {
      type: Number,
      required: [true, 'Total leaves is required'],
      min: [0, 'Total leaves cannot be negative'],
      max: [365, 'Total leaves cannot exceed 365'],
      default: 20,
    },
    leavesTaken: {
      type: Number,
      default: 0,
      min: [0, 'Leaves taken cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

leaveAllocationSchema.virtual('leavesRemaining').get(function () {
  return this.totalLeaves - this.leavesTaken;
});

leaveAllocationSchema.set('toJSON', { virtuals: true });
leaveAllocationSchema.set('toObject', { virtuals: true });

leaveAllocationSchema.index({ employeeId: 1 });

const LeaveAllocation = mongoose.model('LeaveAllocation', leaveAllocationSchema);

export default LeaveAllocation;
