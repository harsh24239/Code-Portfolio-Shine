import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    tag: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 800 },
    year: { type: String, default: '2026', trim: true, maxlength: 30 },
    link: { type: String, default: '', trim: true, maxlength: 500 },
    iconText: { type: String, default: '', trim: true, maxlength: 8 },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Project = mongoose.model('Project', projectSchema);
