
import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface ISettings extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: {
      messages: boolean;
      updates: boolean;
      reminders: boolean;
    };
    push: {
      messages: boolean;
      updates: boolean;
      reminders: boolean;
    };
  };
  privacy: {
    showProfileTo: 'everyone' | 'connections' | 'none';
    showActivityStatus: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationSettingsSchema = new Schema({
  messages: { type: Boolean, default: true },
  updates: { type: Boolean, default: true },
  reminders: { type: Boolean, default: true },
}, { _id: false });

const settingsSchema = new Schema<ISettings>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system',
  },
  language: {
    type: String,
    default: 'en',
  },
  notifications: {
    email: notificationSettingsSchema,
    push: notificationSettingsSchema,
  },
  privacy: {
    showProfileTo: {
      type: String,
      enum: ['everyone', 'connections', 'none'],
      default: 'everyone',
    },
    showActivityStatus: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

settingsSchema.index({ userId: 1 });

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
