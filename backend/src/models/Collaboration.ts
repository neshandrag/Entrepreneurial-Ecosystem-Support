
import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IStartup } from './Startup';

export interface ICollaboration extends Document {
  title: string;
  description: string;
  participants: (mongoose.Types.ObjectId | IUser | IStartup)[];
  participantModel: 'User' | 'Startup';
  type: 'project' | 'discussion' | 'resource-sharing';
  status: 'open' | 'in-progress' | 'closed';
  createdBy: mongoose.Types.ObjectId | IUser;
  messages: {
    sender: mongoose.Types.ObjectId | IUser;
    content: string;
    timestamp: Date;
  }[];
  files: {
    fileName: string;
    fileUrl: string;
    uploadedBy: mongoose.Types.ObjectId | IUser;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const fileSchema = new Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const collaborationSchema = new Schema<ICollaboration>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  participants: [{
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'participantModel',
  }],
  participantModel: {
    type: String,
    required: true,
    enum: ['User', 'Startup'],
  },
  type: {
    type: String,
    enum: ['project', 'discussion', 'resource-sharing'],
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'closed'],
    default: 'open',
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [messageSchema],
  files: [fileSchema],
}, {
  timestamps: true,
});

collaborationSchema.index({ title: 'text', description: 'text' });
collaborationSchema.index({ participants: 1 });
collaborationSchema.index({ type: 1 });
collaborationSchema.index({ status: 1 });

export const Collaboration = mongoose.model<ICollaboration>('Collaboration', collaborationSchema);
