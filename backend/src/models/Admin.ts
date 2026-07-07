import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  userId: mongoose.Types.ObjectId;
  adminLevel: 'super_admin' | 'admin' | 'moderator';
  permissions: {
    canManageUsers: boolean;
    canManageStartups: boolean;
    canManageMentors: boolean;
    canManageInvestors: boolean;
    canManageEvents: boolean;
    canManageReports: boolean;
    canManageSettings: boolean;
    canViewAnalytics: boolean;
    canExportData: boolean;
    canDeleteData: boolean;
  };
  
  // Admin profile information
  fullName: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  
  // System access
  lastLogin?: Date;
  loginCount: number;
  failedLoginAttempts: number;
  isLocked: boolean;
  lockedUntil?: Date;
  
  // Activity tracking
  recentActivities: {
    action: string;
    targetType: string;
    targetId?: string;
    description: string;
    timestamp: Date;
    ipAddress?: string;
  }[];
  
  // Settings and preferences
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    dashboardLayout: 'default' | 'compact' | 'detailed';
  };
  
  // Status
  isActive: boolean;
  isVerified: boolean;
  
  createdAt: Date;
  updatedAt: Date;

  // Methods
  logActivity(action: string, targetType: string, description: string, targetId?: string, ipAddress?: string): Promise<this>;
  hasPermission(permission: string): boolean;
  handleFailedLogin(): void;
  handleSuccessfulLogin(): void;
}

const adminSchema = new Schema<IAdmin>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  adminLevel: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin',
    required: true,
  },
  permissions: {
    canManageUsers: {
      type: Boolean,
      default: false,
    },
    canManageStartups: {
      type: Boolean,
      default: true,
    },
    canManageMentors: {
      type: Boolean,
      default: true,
    },
    canManageInvestors: {
      type: Boolean,
      default: true,
    },
    canManageEvents: {
      type: Boolean,
      default: true,
    },
    canManageReports: {
      type: Boolean,
      default: true,
    },
    canManageSettings: {
      type: Boolean,
      default: false,
    },
    canViewAnalytics: {
      type: Boolean,
      default: true,
    },
    canExportData: {
      type: Boolean,
      default: false,
    },
    canDeleteData: {
      type: Boolean,
      default: false,
    },
  },
  
  // Admin profile information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  position: {
    type: String,
    trim: true,
  },
  
  // System access
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  lockedUntil: Date,
  
  // Activity tracking
  recentActivities: [{
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      required: true,
    },
    targetId: String,
    description: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: String,
  }],
  
  // Settings and preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
    language: {
      type: String,
      default: 'en',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    dashboardLayout: {
      type: String,
      enum: ['default', 'compact', 'detailed'],
      default: 'default',
    },
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for better query performance (only for fields that don't have unique: true)
adminSchema.index({ adminLevel: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ isVerified: 1 });
adminSchema.index({ 'recentActivities.timestamp': -1 });

// Method to log admin activity
adminSchema.methods.logActivity = function(action: string, targetType: string, description: string, targetId?: string, ipAddress?: string) {
  this.recentActivities.unshift({
    action,
    targetType,
    targetId,
    description,
    timestamp: new Date(),
    ipAddress,
  });
  
  // Keep only the last 50 activities
  if (this.recentActivities.length > 50) {
    this.recentActivities = this.recentActivities.slice(0, 50);
  }
  
  return this.save();
};

// Method to check if admin has specific permission
adminSchema.methods.hasPermission = function(permission: string): boolean {
  if (this.adminLevel === 'super_admin') {
    return true; // Super admin has all permissions
  }
  
  return this.permissions[permission] === true;
};

// Method to handle failed login attempts
adminSchema.methods.handleFailedLogin = function(): void {
  this.failedLoginAttempts += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts >= 5) {
    this.isLocked = true;
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
};

// Method to handle successful login
adminSchema.methods.handleSuccessfulLogin = function(): void {
  this.lastLogin = new Date();
  this.loginCount += 1;
  this.failedLoginAttempts = 0;
  this.isLocked = false;
  this.lockedUntil = undefined;
};

// Pre-save middleware to set default permissions based on admin level
adminSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('adminLevel')) {
    switch (this.adminLevel) {
      case 'super_admin':
        // Super admin gets all permissions
        this.permissions.canManageUsers = true;
        this.permissions.canManageStartups = true;
        this.permissions.canManageMentors = true;
        this.permissions.canManageInvestors = true;
        this.permissions.canManageEvents = true;
        this.permissions.canManageReports = true;
        this.permissions.canManageSettings = true;
        this.permissions.canViewAnalytics = true;
        this.permissions.canExportData = true;
        this.permissions.canDeleteData = true;
        break;
      case 'admin':
        // Regular admin gets most permissions except sensitive ones
        this.permissions.canManageUsers = false;
        this.permissions.canManageSettings = false;
        this.permissions.canDeleteData = false;
        break;
      case 'moderator':
        // Moderator gets limited permissions
        this.permissions.canManageUsers = false;
        this.permissions.canManageSettings = false;
        this.permissions.canExportData = false;
        this.permissions.canDeleteData = false;
        break;
    }
  }
  
  next();
});

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);