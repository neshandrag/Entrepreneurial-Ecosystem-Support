
import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IStartup } from './Startup';

export interface IIncubation extends Document {
  startupId: mongoose.Types.ObjectId | IStartup;
  programName: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'terminated';
  mentors: (mongoose.Types.ObjectId | IUser)[];
  milestones: {
    title: string;
    description: string;
    dueDate: Date;
    status: 'pending' | 'in-progress' | 'completed' | 'overdue';
    completedDate?: Date;
  }[];
  progressUpdates: {
    update: string;
    date: Date;
    author: mongoose.Types.ObjectId | IUser;
  }[];
  kpis: {
    name: string;
    value: string | number;
    target: string | number;
    updatedAt: Date;
  }[];
  funding: {
    amount: number;
    currency: string;
    date: Date;
    source: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'overdue'],
    default: 'pending',
  },
  completedDate: { type: Date },
}, { _id: false });

const progressUpdateSchema = new Schema({
  update: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { _id: false });

const kpiSchema = new Schema({
  name: { type: String, required: true, trim: true },
  value: { type: Schema.Types.Mixed, required: true },
  target: { type: Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const fundingSchema = new Schema({
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'USD' },
  date: { type: Date, required: true },
  source: { type: String, required: true, trim: true },
}, { _id: false });

const incubationSchema = new Schema<IIncubation>({
  startupId: {
    type: Schema.Types.ObjectId,
    ref: 'Startup',
    required: true,
    unique: true,
  },
  programName: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated'],
    default: 'active',
  },
  mentors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  milestones: [milestoneSchema],
  progressUpdates: [progressUpdateSchema],
  kpis: [kpiSchema],
  funding: [fundingSchema],
}, {
  timestamps: true,
});

incubationSchema.index({ startupId: 1 });
incubationSchema.index({ status: 1 });
incubationSchema.index({ 'mentors': 1 });

export const Incubation = mongoose.model<IIncubation>('Incubation', incubationSchema);
