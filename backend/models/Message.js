import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, maxlength: 254 },
    subject: { type: String, default: 'Portfolio Contact', trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 16000 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);
