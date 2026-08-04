import mongoose from 'mongoose';

const focusAreaSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true },
    title: { type: String, required: true },
    desc: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const FocusArea = mongoose.model('FocusArea', focusAreaSchema);
