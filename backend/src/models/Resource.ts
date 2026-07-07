
import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IResource extends Document {
  title: string;
  description: string;
  type: 'article' | 'video' | 'document' | 'tool' | 'course';
  url?: string;
  fileUrl?: string;
  tags: string[];
  uploadedBy: mongoose.Types.ObjectId | IUser;
  category: string;
  ratings: {
    user: mongoose.Types.ObjectId | IUser;
    rating: number;
    comment?: string;
  }[];
  averageRating: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true },
}, { _id: false });

const resourceSchema = new Schema<IResource>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['article', 'video', 'document', 'tool', 'course'],
    required: true,
  },
  url: { type: String, trim: true },
  fileUrl: { type: String, trim: true },
  tags: [{ type: String, trim: true }],
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true, trim: true },
  ratings: [ratingSchema],
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  viewCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });
resourceSchema.index({ category: 1 });
resourceSchema.index({ type: 1 });
resourceSchema.index({ averageRating: -1 });

// Middleware to calculate average rating
resourceSchema.pre('save', function (next) {
  if (this.isModified('ratings')) {
    const totalRatings = this.ratings.length;
    if (totalRatings > 0) {
      const sumOfRatings = this.ratings.reduce((acc, r) => acc + r.rating, 0);
      this.averageRating = parseFloat((sumOfRatings / totalRatings).toFixed(2));
    } else {
      this.averageRating = 0;
    }
  }
  next();
});

export const Resource = mongoose.model<IResource>('Resource', resourceSchema);
