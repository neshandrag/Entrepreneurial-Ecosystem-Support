export interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: 'individual' | 'enterprise' | 'admin';
  profileComplete: boolean;
  createdAt: string;
  startupId?: string; // Add startupId to User
}

export type TRLLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Profile {
  id?: string; // Profile might not have an ID until saved
  userId?: string;
  // Step 1: Personal Information
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  
  // Step 2: Enterprise Information
  startupName: string;
  entityType: string;
  applicationType: 'innovation' | 'incubation';
  founderName: string;
  coFounderNames: string[];
  sector: string;
  linkedinProfile: string;
  
  // Step 3: Incubation Details
  previouslyIncubated: boolean;
  incubatorName?: string;
  incubatorLocation?: string;
  incubationDuration?: string;
  incubatorType?: string;
  incubationMode?: 'online' | 'offline' | 'hybrid';
  supportsReceived?: string[];
  
  // Step 4: Documentation (assuming these are file paths/URLs after upload)
  aadhaarDoc: string; // required
  incorporationCert?: string;
  msmeCert?: string;
  dpiitCert?: string;
  mouPartnership?: string;
  
  // Step 5: Pitch Deck & Traction
  businessDocuments?: string[]; // Array of document URLs/ids
  tractionDetails?: string; // This could be a text field for details
  balanceSheet?: string; // Document URL/id
  
  // Step 6: Funding Information
  fundingStage: string;
  alreadyFunded: boolean;
  fundingAmount?: number;
  fundingSource?: string;
  fundingDate?: string;

  // TRL Level (assuming this is determined or selected in a step)
  trlLevel: TRLLevel;
}

// This interface mirrors the CreateStartupPayload from startupsApi.ts
// It represents the data sent from the frontend to create a new startup.
export interface FrontendStartupData {
  name: string;
  founder: string;
  sector: string;
  type: 'innovation' | 'incubation';
  email: string;
  description?: string;
  website?: string;
  linkedinProfile?: string;
  teamSize?: number;
  foundedYear?: number;
  location?: string;
  trlLevel: TRLLevel;
  coFounderNames?: string[];
  // Application specific fields that might be set initially
  applicationStatus: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  
  // From IncubationDetails
  previouslyIncubated?: boolean;
  incubatorName?: string;
  incubatorLocation?: string;
  incubationDuration?: string;
  incubatorType?: string;
  incubationMode?: 'online' | 'offline' | 'hybrid';
  supportsReceived?: string[];

  // From Documentation (these would likely be references to uploaded files)
  aadhaarDoc?: string;
  incorporationCert?: string;
  msmeCert?: string;
  dpiitCert?: string;
  mouPartnership?: string;

  // From Pitch Deck & Traction
  businessDocuments?: string[];
  tractionDetails?: string;
  balanceSheet?: string;

  // From FundingInfo
  fundingStage?: string;
  alreadyFunded?: boolean;
  fundingAmount?: number;
  fundingSource?: string;
  fundingDate?: string;
}

// Existing interfaces (Startup is now redundant if FrontendStartupData is used for creation)
// I'll keep it for now but it might be removed later if it causes confusion.
export interface Startup {
  id: string;
  name: string;
  founder: string;
  sector: string;
  type: 'innovation' | 'incubation';
  status: 'pending' | 'active' | 'completed' | 'dropout';
  trlLevel: TRLLevel;
  email: string;
  submissionDate: string;
}

export interface Mentor {
  id: string;
  name: string;
  role: string;
  email: string;
  experience: string;
  bio: string;
  profilePicture: string;
  rating: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMentorData {
  name: string;
  role: string;
  email: string;
  experience: string;
  bio: string;
  profilePicture: string;
}

export interface UpdateMentorData extends Partial<CreateMentorData> {
  id: string;
}

export interface Investor {
  id: string;
  name: string;
  firm: string;
  email: string;
  phoneNumber: string;
  investmentRange: string;
  focusAreas: string[];
  backgroundSummary: string;
  profilePicture: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInvestorData {
  name: string;
  firm: string;
  email: string;
  phoneNumber: string;
  investmentRange: string;
  focusAreas: string[];
  backgroundSummary: string;
  profilePicture: string;
}

export interface UpdateInvestorData extends Partial<CreateInvestorData> {
  id: string;
}

export interface Report {
  id: string;
  name: string;
  type: string;
  dateGenerated: string;
  fileSize: string;
  status: 'ready' | 'processing' | 'error';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReportData {
  name: string;
  type: string;
  dateGenerated: string;
  fileSize: string;
  status: 'ready' | 'processing' | 'error'
}

export interface UpdateReportData extends Partial<CreateReportData> {
  id: string;
}

export interface Document {
  id: string;
  name: string;
  location: string;
  owner: string;
  fileSize: string;
  uploadDate: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDocumentData {
  name: string;
  location: string;
  owner: string;
  fileSize: string;
  uploadDate: string;
  type: string;
}

export interface UpdateDocumentData extends Partial<CreateDocumentData> {
  id: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  organizedBy: string;
  registrationLink?: string;
  onlineEventUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  organizedBy: string;
  registrationLink?: string;
  onlineEventUrl?: string;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
}

