import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    desc: { type: String, required: true, trim: true, maxlength: 300 },
    pips: { type: Number, default: 5, min: 1, max: 5 },
    iconType: { type: String, default: 'frontend', trim: true, maxlength: 40 },
    category: { type: String, default: 'General' },
  },
  { timestamps: true }
);

export const Skill = mongoose.model('Skill', skillSchema);
