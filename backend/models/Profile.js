import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    eyebrow: { type: String, default: 'Full-Stack Developer & Code Architect', trim: true, maxlength: 120 },
    title1: { type: String, default: 'CODE', trim: true, maxlength: 80 },
    titleAccent: { type: String, default: 'IN THE', trim: true, maxlength: 80 },
    title2: { type: String, default: 'SHADOWS', trim: true, maxlength: 80 },
    subtext: {
      type: String,
      trim: true,
      maxlength: 500,
      default:
        'Full-stack engineer. Open-source contributor. I build scalable systems, craft pixel-perfect interfaces, and write code that runs silent and fast — like a shadow in the machine.',
    },
    projectsShipped: { type: String, default: '6+', trim: true, maxlength: 30 },
    yearsCoding: { type: String, default: '3+', trim: true, maxlength: 30 },
    clientsServed: { type: String, default: '100+', trim: true, maxlength: 30 },
    status: { type: String, default: 'Taking Missions', trim: true, maxlength: 160 },
    statusDetail: {
      type: String,
      trim: true,
      maxlength: 500,
      default:
        'Available for engagements beginning September 2026. Priority given to long-duration contracts requiring sustained operational focus.',
    },
    email: { type: String, default: 'kumarharsh1851@gmail.com', trim: true, maxlength: 254 },
    pgpKey: { type: String, default: 'github.com/harsh24239', trim: true, maxlength: 500 },
    linkedin: { type: String, default: '', trim: true, maxlength: 500 },
    leetcode: { type: String, default: '', trim: true, maxlength: 500 },
    twitter: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

export const Profile = mongoose.model('Profile', profileSchema);
