
import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId | IUser;
  type: 'bug' | 'suggestion' | 'question' | 'general';
  subject: string;
  message: string;
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  screenshot?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['bug', 'suggestion', 'question', 'general'],
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['new', 'in-progress', 'resolved', 'closed'],
    default: 'new',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  screenshot: {
    type: String,
  },
}, {
  timestamps: true,
});

feedbackSchema.index({ status: 1, priority: -1 });
feedbackSchema.index({ user: 1 });

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);
