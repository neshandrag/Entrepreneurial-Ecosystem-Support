
import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IAnalytics extends Document {
  metric: string;
  value: number;
  dimensions: {
    [key: string]: string | number;
  };
  timestamp: Date;
  user?: mongoose.Types.ObjectId | IUser;
}

const analyticsSchema = new Schema<IAnalytics>({
  metric: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  value: {
    type: Number,
    required: true,
  },
  dimensions: {
    type: Map,
    of: Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

analyticsSchema.index({ metric: 1, timestamp: -1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
