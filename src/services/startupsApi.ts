import api from './api';

interface StartupDocument {
  id?: string;
  name: string;
  type: string;
  category: string;
  uploadDate: string | Date;
  description?: string;
  fileSize?: string;
  location?: string;
  source?: string;
}

interface StartupWithDocuments {
  id: string;
  name: string;
  founder: string;
  sector: string;
  type: 'innovation' | 'incubation';
  status: 'pending' | 'active' | 'completed' | 'dropout';
  email: string;
  submissionDate: string;
  documents: StartupDocument[];
  documentCount: number;
  userId: {
    id: string;
    fullName: string;
    email: string;
    username: string;
  };
}

interface GetStartupsWithDocumentsParams {
  search?: string;
  sector?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// New interfaces for creating and updating a startup
interface CreateStartupPayload {
  name: string;
  founder: string;
  sector: string;
  type: 'innovation' | 'incubation';
  email: string; // Assuming email is collected during profile setup
  description?: string;
  website?: string;
  linkedinProfile?: string;
  teamSize?: number;
  foundedYear?: number;
  location?: string;
  trlLevel: number;
  coFounderNames?: string[]; // Added from EnterpriseInfo
}

interface UpdateStartupPayload extends Partial<CreateStartupPayload> {}

class StartupsApi {
  async getStartupsWithDocuments(params: GetStartupsWithDocumentsParams = {}): Promise<{
    startups: StartupWithDocuments[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalStartups: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const response = await api.get('/startups/with-documents', { params });
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch startups');
  }

  async createStartupProfile(startupData: CreateStartupPayload): Promise<StartupWithDocuments> {
    const response = await api.post('/startups', startupData);
    
    if (response.data.success) {
      return response.data.data.startup;
    }
    throw new Error(response.data.message || 'Failed to create startup profile');
  }

  async updateStartupProfile(id: string, startupData: UpdateStartupPayload): Promise<StartupWithDocuments> {
    const response = await api.put(`/startups/${id}`, startupData);
    
    if (response.data.success) {
      return response.data.data.startup;
    }
    throw new Error(response.data.message || 'Failed to update startup profile');
  }
}

export const startupsApi = new StartupsApi();
export type { StartupWithDocuments, StartupDocument, GetStartupsWithDocumentsParams, CreateStartupPayload, UpdateStartupPayload };
