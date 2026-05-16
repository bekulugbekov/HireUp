const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    salary: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
    },
    location: { type: String, required: true },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    category: {
      type: String,
      required: true,
      enum: [
        'IT',
        'Marketing',
        'Design',
        'Finance',
        'Education',
        'Healthcare',
        'Engineering',
        'Sales',
        'Other',
      ],
    },
    experience: {
      type: String,
      enum: ['no-experience', 'junior', 'mid', 'senior'],
      default: 'junior',
    },
    type: {
      type: String,
      enum: ['full-time', 'part-time', 'remote', 'contract', 'internship'],
      default: 'full-time',
    },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', company: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
