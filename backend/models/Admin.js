import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, default: 'admin' },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Only hash if NOT already a bcrypt hash (prevents double-hashing on save)
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // bcrypt hashes always start with $2a$ or $2b$
  if (this.password.startsWith('$2')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export const Admin = mongoose.model('Admin', adminSchema);
