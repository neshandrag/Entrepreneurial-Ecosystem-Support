import { useState, useEffect, useCallback } from 'react';
import { startupsApi } from '../services/api';

export interface StartupData {
  _id: string;
  name: string;
  founder: string;
  sector: string;
  type: 'innovation' | 'incubation';
  status: 'pending' | 'active' | 'completed' | 'dropout';
  applicationStatus: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  trlLevel: number;
  email: string;
  submissionDate: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    username: string;
  };
  assignedMentor?: {
    _id: string;
    name: string;
    role: string;
    email: string;
  };
  assignedInvestor?: {
    _id: string;
    name: string;
    firm: string;
    email: string;
  };
  description?: string;
  website?: string;
  linkedinProfile?: string;
  teamSize?: number;
  foundedYear?: number;
  location?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartupStats {
  totalStartups: number;
  innovationStartups: number;
  incubationStartups: number;
  activeStartups: number;
  approvedStartups: number;
  pendingStartups: number;
  trlDistribution: Array<{ _id: number; count: number }>;
  sectorDistribution: Array<{ _id: string; count: number }>;
}

export interface UseStartupsReturn {
  startups: StartupData[];
  stats: StartupStats | null;
  loading: boolean;
  error: string | null;
  refreshStartups: () => Promise<void>;
  refreshStats: () => Promise<void>;
  updateStartupStatus: (id: string, status: string, applicationStatus?: string) => Promise<void>;
}

export const useStartups = (params: any = {}): UseStartupsReturn => {
  const [startups, setStartups] = useState<StartupData[]>([]);
  const [stats, setStats] = useState<StartupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStartups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await startupsApi.getStartups(params);
      setStartups(response.startups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch startups');
      console.error('Error fetching startups:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await startupsApi.getStartupStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching startup stats:', err);
    }
  }, []);

  const updateStartupStatus = useCallback(async (id: string, status: string, applicationStatus?: string) => {
    try {
      const updateData: any = { status };
      if (applicationStatus) {
        updateData.applicationStatus = applicationStatus;
      }
      
      const updatedStartup = await startupsApi.updateStartup(id, updateData);
      
      // Update local state
      setStartups(prev => prev.map(startup => 
        startup._id === id ? { ...startup, ...updateData } : startup
      ));
      
      return updatedStartup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update startup';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const refreshStartups = useCallback(async (): Promise<void> => {
    await fetchStartups();
  }, [fetchStartups]);

  const refreshStats = useCallback(async (): Promise<void> => {
    await fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStartups();
    fetchStats();
  }, [fetchStartups, fetchStats]);

  return {
    startups,
    stats,
    loading,
    error,
    refreshStartups,
    refreshStats,
    updateStartupStatus,
  };
};