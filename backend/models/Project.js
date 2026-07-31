import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    tag: { type: String, required: true },
    description: { type: String, required: true },
    year: { type: String, default: '2026' },
    link: { type: String, default: '' },
    iconText: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Project = mongoose.model('Project', projectSchema);
