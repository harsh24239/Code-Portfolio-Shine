import mongoose from 'mongoose';

const focusAreaSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    desc: { type: String, required: true, trim: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const FocusArea = mongoose.model('FocusArea', focusAreaSchema);
