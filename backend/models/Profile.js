import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    eyebrow: { type: String, default: 'Full-Stack Developer & Code Architect' },
    title1: { type: String, default: 'CODE' },
    titleAccent: { type: String, default: 'IN THE' },
    title2: { type: String, default: 'SHADOWS' },
    subtext: {
      type: String,
      default:
        'Full-stack engineer. Open-source contributor. I build scalable systems, craft pixel-perfect interfaces, and write code that runs silent and fast — like a shadow in the machine.',
    },
    projectsShipped: { type: String, default: '48+' },
    yearsCoding: { type: String, default: '9+' },
    clientsServed: { type: String, default: '31+' },
    status: { type: String, default: 'Taking Missions' },
    statusDetail: {
      type: String,
      default:
        'Available for engagements beginning September 2026. Priority given to long-duration contracts requiring sustained operational focus.',
    },
    email: { type: String, default: 'kumarharsh1851@gmail.com' },
    pgpKey: { type: String, default: 'github.com/harsh24239' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Profile = mongoose.model('Profile', profileSchema);
