import mongoose, { Document as MongooseDocument, Schema } from 'mongoose';

export interface IDocument extends MongooseDocument {
  name: string;
  location: string;
  owner: string;
  fileSize: string;
  uploadDate: Date;
  type: string;
  userId: mongoose.Types.ObjectId;
  
  // Additional document information
  originalName: string;
  mimeType: string;
  description?: string;
  category: string;
  
  // Access control
  isPublic: boolean;
  allowedUsers: mongoose.Types.ObjectId[];
  
  // Document metadata
  metadata: {
    pages?: number;
    version?: string;
    checksum?: string;
    lastModified?: Date;
  };
  
  // Status
  status: 'uploading' | 'processing' | 'ready' | 'error';
  errorMessage?: string;
  
  // Tags and keywords
  tags: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>({
  name: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'File location is required'],
  },
  owner: {
    type: String,
    required: [true, 'Document owner is required'],
    trim: true,
  },
  fileSize: {
    type: String,
    required: [true, 'File size is required'],
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    required: [true, 'File type is required'],
    trim: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Additional document information
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
  },
  description: String,
  category: {
    type: String,
    required: [true, 'Document category is required'],
    enum: ['profile', 'startup', 'pitch_deck', 'financial', 'legal', 'other'],
  },
  
  // Access control
  isPublic: {
    type: Boolean,
    default: false,
  },
  allowedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  // Document metadata
  metadata: {
    pages: Number,
    version: String,
    checksum: String,
    lastModified: Date,
  },
  
  // Status
  status: {
    type: String,
    enum: ['uploading', 'processing', 'ready', 'error'],
    default: 'uploading',
  },
  errorMessage: String,
  
  // Tags and keywords
  tags: [String],
}, {
  timestamps: true,
});

// Index for better query performance
documentSchema.index({ userId: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ isPublic: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ uploadDate: -1 });

// Virtual for file size in bytes
documentSchema.virtual('fileSizeBytes').get(function() {
  const size = this.fileSize;
  const units = ['B', 'KB', 'MB', 'GB'];
  const sizes = size.match(/(\d+\.?\d*)\s*([A-Z]+)/i);
  
  if (!sizes) return 0;
  
  const value = parseFloat(sizes[1]);
  const unit = sizes[2].toUpperCase();
  const unitIndex = units.indexOf(unit);
  
  if (unitIndex === -1) return 0;
  
  return Math.round(value * Math.pow(1024, unitIndex));
});

// Ensure virtual fields are serialized
documentSchema.set('toJSON', { virtuals: true });

export const Document = mongoose.model<IDocument>('Document', documentSchema);
