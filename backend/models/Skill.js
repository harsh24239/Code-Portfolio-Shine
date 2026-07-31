import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    desc: { type: String, required: true },
    pips: { type: Number, default: 5, min: 1, max: 5 },
    category: { type: String, default: 'General' },
  },
  { timestamps: true }
);

export const Skill = mongoose.model('Skill', skillSchema);
