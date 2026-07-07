import { useState, useEffect, useCallback } from 'react';
import { Investor, CreateInvestorData, UpdateInvestorData } from '../types';
import { investorsApi } from '../services/api';

export interface UseInvestorsReturn {
  investors: Investor[];
  loading: boolean;
  error: string | null;
  createInvestor: (investorData: CreateInvestorData) => Promise<Investor>;
  updateInvestor: (investorData: UpdateInvestorData) => Promise<Investor>;
  deleteInvestor: (id: string) => Promise<void>;
  refreshInvestors: () => Promise<void>;
}

export const useInvestors = (): UseInvestorsReturn => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await investorsApi.getInvestors();
      const investorsData = response.investors || [];
      
      // Transform backend data to frontend format
      const transformedInvestors = investorsData.map((investor: any) => ({
        id: investor._id,
        name: investor.name,
        firm: investor.firm,
        email: investor.email,
        phoneNumber: investor.phoneNumber,
        investmentRange: investor.investmentRange,
        focusAreas: investor.focusAreas,
        backgroundSummary: investor.backgroundSummary,
        profilePicture: investor.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
        createdAt: investor.createdAt,
        updatedAt: investor.updatedAt
      }));
      
      setInvestors(transformedInvestors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch investors');
      console.error('Error fetching investors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvestor = useCallback(async (investorData: CreateInvestorData): Promise<Investor> => {
    try {
      setError(null);
      
      // Add required fields for backend
      const investorPayload = {
        ...investorData,
        preferences: {
          minInvestment: 50000,
          maxInvestment: 2000000,
          preferredSectors: investorData.focusAreas,
          preferredStages: ['Seed', 'Series A'],
          geographicFocus: ['North America'],
          investmentCriteria: ['Strong team', 'Market potential']
        }
      };
      
      const response = await investorsApi.createInvestor(investorPayload);
      const newInvestor: Investor = {
        id: response.investor._id,
        name: response.investor.name,
        firm: response.investor.firm,
        email: response.investor.email,
        phoneNumber: response.investor.phoneNumber,
        investmentRange: response.investor.investmentRange,
        focusAreas: response.investor.focusAreas,
        backgroundSummary: response.investor.backgroundSummary,
        profilePicture: response.investor.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
        createdAt: response.investor.createdAt,
        updatedAt: response.investor.updatedAt
      };
      
      // Update local state
      setInvestors(prev => [...prev, newInvestor]);
      
      return newInvestor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create investor';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateInvestor = useCallback(async (investorData: UpdateInvestorData): Promise<Investor> => {
    try {
      setError(null);
      const { id, ...updateData } = investorData;
      const response = await investorsApi.updateInvestor(id, updateData);
      const updatedInvestor: Investor = {
        id: response.investor._id,
        name: response.investor.name,
        firm: response.investor.firm,
        email: response.investor.email,
        phoneNumber: response.investor.phoneNumber,
        investmentRange: response.investor.investmentRange,
        focusAreas: response.investor.focusAreas,
        backgroundSummary: response.investor.backgroundSummary,
        profilePicture: response.investor.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
        createdAt: response.investor.createdAt,
        updatedAt: response.investor.updatedAt
      };
      
      // Update local state
      setInvestors(prev => prev.map(investor => 
        investor.id === updatedInvestor.id ? updatedInvestor : investor
      ));
      
      return updatedInvestor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update investor';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteInvestor = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await investorsApi.deleteInvestor(id);
      
      // Update local state
      setInvestors(prev => prev.filter(investor => investor.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete investor';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const refreshInvestors = useCallback(async (): Promise<void> => {
    await fetchInvestors();
  }, [fetchInvestors]);

  useEffect(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  return {
    investors,
    loading,
    error,
    createInvestor,
    updateInvestor,
    deleteInvestor,
    refreshInvestors,
  };
};
