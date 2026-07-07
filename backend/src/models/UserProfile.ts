
import mongoose, { Document, Schema } from 'mongoose';

export interface IUserProfile extends Document {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  experience?: {
    title: string;
    company: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
  }[];
  education?: {
    school: string;
    degree: string;
    fieldOfStudy: string;
    startDate: Date;
    endDate?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const socialLinksSchema = new Schema({
  linkedin: { type: String, trim: true },
  twitter: { type: String, trim: true },
  github: { type: String, trim: true },
  website: { type: String, trim: true },
}, { _id: false });

const experienceSchema = new Schema({
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String, trim: true },
}, { _id: false });

const educationSchema = new Schema({
  school: { type: String, required: true, trim: true },
  degree: { type: String, required: true, trim: true },
  fieldOfStudy: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
}, { _id: false });

const userProfileSchema = new Schema<IUserProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  avatar: { type: String, trim: true },
  bio: { type: String, trim: true, maxlength: 500 },
  skills: [{ type: String, trim: true }],
  interests: [{ type: String, trim: true }],
  socialLinks: socialLinksSchema,
  experience: [experienceSchema],
  education: [educationSchema],
}, {
  timestamps: true,
});

userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ skills: 1 });
userProfileSchema.index({ interests: 1 });

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', userProfileSchema);
