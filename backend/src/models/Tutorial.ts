
import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface ITutorial extends Document {
  title: string;
  description: string;
  steps: {
    title: string;
    content: string;
    order: number;
    targetElement?: string; // CSS selector for highlighting
  }[];
  targetAudience: ('startup' | 'mentor' | 'investor' | 'admin')[];
  category: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

const tutorialStepSchema = new Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  order: { type: Number, required: true },
  targetElement: { type: String, trim: true },
}, { _id: false });

const tutorialSchema = new Schema<ITutorial>({
  title: { type: String, required: true, trim: true, unique: true },
  description: { type: String, required: true, trim: true },
  steps: [tutorialStepSchema],
  targetAudience: [{
    type: String,
    enum: ['startup', 'mentor', 'investor', 'admin'],
    required: true,
  }],
  category: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

tutorialSchema.index({ category: 1, isActive: 1 });
tutorialSchema.index({ targetAudience: 1 });

export const Tutorial = mongoose.model<ITutorial>('Tutorial', tutorialSchema);
