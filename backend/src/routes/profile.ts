import express, { Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { Profile } from '../models/Profile';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createProfileSchema = Joi.object({
  // Step 1: Personal Information
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().min(10).max(15).required(),
  location: Joi.string().min(2).max(200).required(),
  
  // Step 2: Enterprise Information
  startupName: Joi.string().min(2).max(200).required(),
  entityType: Joi.string().min(2).max(100).required(),
  applicationType: Joi.string().valid('innovation', 'incubation').required(),
  founderName: Joi.string().min(2).max(100).required(),
  coFounderNames: Joi.array().items(Joi.string().max(100)).allow(null),
  sector: Joi.string().min(2).max(100).required(),
  linkedinProfile: Joi.string().uri().allow('', null),
  
  // Step 3: Incubation Details
  previouslyIncubated: Joi.boolean().default(false),
  incubatorName: Joi.string().max(200).allow('', null),
  incubatorLocation: Joi.string().max(200).allow('', null),
  incubationDuration: Joi.string().max(100).allow('', null),
  incubatorType: Joi.string().max(100).allow('', null),
  incubationMode: Joi.string().valid('online', 'offline', 'hybrid').allow(null),
  supportsReceived: Joi.array().items(Joi.string().max(200)).allow(null),
  
  // Step 4: Documentation
  aadhaarDoc: Joi.string().required(),
  incorporationCert: Joi.string().allow('', null),
  msmeCert: Joi.string().allow('', null),
  dpiitCert: Joi.string().allow('', null),
  mouPartnership: Joi.string().allow('', null),
  
  // Step 5: Pitch Deck & Traction
  businessDocuments: Joi.array().items(Joi.string()).allow(null),
  tractionDetails: Joi.array().items(Joi.string()).allow(null),
  balanceSheet: Joi.string().allow('', null),
  
  // Step 6: Funding Information
  fundingStage: Joi.string().min(1).max(100).required(),
  alreadyFunded: Joi.boolean().default(false),
  fundingAmount: Joi.number().min(0).allow(null),
  fundingSource: Joi.string().max(200).allow('', null),
  fundingDate: Joi.date().iso().allow(null),
});

const updateProfileSchema = Joi.object({
  // Allow partial updates of any field from create schema
  fullName: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  phoneNumber: Joi.string().min(10).max(15),
  location: Joi.string().min(2).max(200),
  startupName: Joi.string().min(2).max(200),
  entityType: Joi.string().min(2).max(100),
  applicationType: Joi.string().valid('innovation', 'incubation'),
  founderName: Joi.string().min(2).max(100),
  coFounderNames: Joi.array().items(Joi.string().max(100)).allow(null),
  sector: Joi.string().min(2).max(100),
  linkedinProfile: Joi.string().uri().allow('', null),
  previouslyIncubated: Joi.boolean(),
  incubatorName: Joi.string().max(200).allow('', null),
  incubatorLocation: Joi.string().max(200).allow('', null),
  incubationDuration: Joi.string().max(100).allow('', null),
  incubatorType: Joi.string().max(100).allow('', null),
  incubationMode: Joi.string().valid('online', 'offline', 'hybrid').allow(null),
  supportsReceived: Joi.array().items(Joi.string().max(200)).allow(null),
  aadhaarDoc: Joi.string(),
  incorporationCert: Joi.string().allow('', null),
  msmeCert: Joi.string().allow('', null),
  dpiitCert: Joi.string().allow('', null),
  mouPartnership: Joi.string().allow('', null),
  businessDocuments: Joi.array().items(Joi.string()).allow(null),
  tractionDetails: Joi.array().items(Joi.string()).allow(null),
  balanceSheet: Joi.string().allow('', null),
  fundingStage: Joi.string().min(1).max(100),
  alreadyFunded: Joi.boolean(),
  fundingAmount: Joi.number().min(0).allow(null),
  fundingSource: Joi.string().max(200).allow('', null),
  fundingDate: Joi.date().iso().allow(null),
}).min(1); // At least one field required for update

// @route   GET /api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await Profile.findOne({ userId: req.user!._id })
    .populate('userId', 'fullName email username');
  
  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found',
    });
  }
  
  res.json({
    success: true,
    data: { profile },
  });
}));

// @route   POST /api/profile
// @desc    Create user profile
// @access  Private
router.post('/', authenticate, validate(createProfileSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  // Check if profile already exists
  const existingProfile = await Profile.findOne({ userId: req.user!._id });
  
  if (existingProfile) {
    return res.status(400).json({
      success: false,
      message: 'Profile already exists. Use PUT to update.',
    });
  }
  
  const profileData = {
    ...req.body,
    userId: req.user!._id,
  };
  
  const profile = new Profile(profileData);
  await profile.save();
  
  // Update user's profileComplete status
  await User.findByIdAndUpdate(req.user!._id, { profileComplete: true });
  
  await profile.populate('userId', 'fullName email username');
  
  res.status(201).json({
    success: true,
    message: 'Profile created successfully',
    data: { profile },
  });
}));

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', authenticate, validate(updateProfileSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await Profile.findOneAndUpdate(
    { userId: req.user!._id },
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true, upsert: true }
  ).populate('userId', 'fullName email username');
  
  // Update user's profileComplete status if profile is substantially complete
  if (profile && profile.completionPercentage >= 80) {
    await User.findByIdAndUpdate(req.user!._id, { profileComplete: true });
  }
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { profile },
  });
}));

// @route   GET /api/profile/completion
// @desc    Get profile completion status
// @access  Private
router.get('/completion', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await Profile.findOne({ userId: req.user!._id });
  
  const completion = {
    hasProfile: !!profile,
    completionPercentage: profile?.completionPercentage || 0,
    isComplete: profile?.isComplete || false,
    missingFields: [],
    nextStep: 'Create your profile to get started',
  };
  
  if (profile) {
    // Determine next step based on completion
    if (profile.completionPercentage < 100) {
      completion.nextStep = 'Complete all required profile fields';
    } else {
      completion.nextStep = 'Profile complete! You can now submit your startup application.';
    }
  }
  
  res.json({
    success: true,
    data: { completion },
  });
}));

// @route   DELETE /api/profile
// @desc    Delete user profile
// @access  Private
router.delete('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await Profile.findOneAndDelete({ userId: req.user!._id });
  
  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found',
    });
  }
  
  // Update user's profileComplete status
  await User.findByIdAndUpdate(req.user!._id, { profileComplete: false });
  
  res.json({
    success: true,
    message: 'Profile deleted successfully',
  });
}));

export default router;
