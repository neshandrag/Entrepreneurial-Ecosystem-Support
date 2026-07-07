
import mongoose, { Document, Schema } from 'mongoose';

export interface IDashboard extends Document {
  userId: mongoose.Types.ObjectId;
  layout: {
    lg: { i: string; x: number; y: number; w: number; h: number; }[];
    md: { i: string; x: number; y: number; w: number; h: number; }[];
    sm: { i: string; x: number; y: number; w: number; h: number; }[];
    xs: { i: string; x: number; y: number; w: number; h: number; }[];
    xxs: { i: string; x: number; y: number; w: number; h: number; }[];
  };
  components: {
    id: string;
    name: string;
    props: any;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const layoutSchema = new Schema({
  i: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  w: { type: Number, required: true },
  h: { type: Number, required: true },
}, { _id: false });

const componentSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  props: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

const dashboardSchema = new Schema<IDashboard>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  layout: {
    lg: [layoutSchema],
    md: [layoutSchema],
    sm: [layoutSchema],
    xs: [layoutSchema],
    xxs: [layoutSchema],
  },
  components: [componentSchema],
}, {
  timestamps: true,
});

dashboardSchema.index({ userId: 1 });

export const Dashboard = mongoose.model<IDashboard>('Dashboard', dashboardSchema);
