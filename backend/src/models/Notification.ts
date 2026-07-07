import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  message: string;
  type: 'signup' | 'application' | 'review' | 'feedback' | 'milestone' | 'info';
  read: boolean;
  createdAt: Date;
  link?: string; // Optional link for the notification
  userName?: string; // Optional user name for context
  userEmail?: string; // Optional user email for context
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['signup', 'application', 'review', 'feedback', 'milestone', 'info'],
    default: 'info',
  },
  read: {
    type: Boolean,
    default: false,
  },
  link: String,
  userName: String,
  userEmail: String,
}, {
  timestamps: true,
});

notificationSchema.index({ userId: 1, read: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
