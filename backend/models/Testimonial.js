import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    quote: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    org: { type: String, required: true },
  },
  { timestamps: true }
);

export const Testimonial = mongoose.model('Testimonial', testimonialSchema);
