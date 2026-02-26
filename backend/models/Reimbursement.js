import mongoose from 'mongoose';

const reimbursementSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Applicant ID is required'],
    },
    applicantRole: {
      type: String,
      enum: ['employee', 'manager'],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
    },
    category: {
      type: String,
      enum: {
        values: ['travel', 'food', 'medical', 'equipment', 'training', 'other'],
        message: 'Invalid reimbursement category',
      },
      required: [true, 'Category is required'],
    },
    receipt: {
      type: String, // URL or filename (optional for now)
      default: '',
    },
    // Two-level approval flow:
    // Employee: pending -> manager_approved -> admin_approved / rejected at any stage
    // Manager:  pending -> admin_approved / rejected
    status: {
      type: String,
      enum: ['pending', 'manager_approved', 'admin_approved', 'rejected', 'withdrawn'],
      default: 'pending',
    },
    // Manager review (only for employee reimbursements)
    managerReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    managerReviewedAt: {
      type: Date,
      default: null,
    },
    managerNote: {
      type: String,
      trim: true,
      maxlength: [300, 'Manager note cannot exceed 300 characters'],
      default: '',
    },
    // Admin review (final approval for both employee and manager)
    adminReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminReviewedAt: {
      type: Date,
      default: null,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: [300, 'Admin note cannot exceed 300 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

reimbursementSchema.index({ applicantId: 1, status: 1 });
reimbursementSchema.index({ applicantRole: 1, status: 1 });
reimbursementSchema.index({ status: 1 });
reimbursementSchema.index({ createdAt: -1 });

const Reimbursement = mongoose.model('Reimbursement', reimbursementSchema);

export default Reimbursement;
