import { Investor, CreateInvestorData, UpdateInvestorData } from '../types';
import api from './api';

class InvestorsApi {
  async getInvestors(): Promise<Investor[]> {
    const response = await api.get('/investors');
    if (response.data.success) {
      return response.data.data.investors;
    }
    throw new Error(response.data.message || 'Failed to fetch investors');
  }

  async getInvestorById(id: string): Promise<Investor> {
    const response = await api.get(`/investors/${id}`);
    if (response.data.success) {
      return response.data.data.investor;
    }
    throw new Error(response.data.message || 'Failed to fetch investor');
  }

  async createInvestor(investorData: CreateInvestorData): Promise<Investor> {
    const response = await api.post('/investors', investorData);
    if (response.data.success) {
      return response.data.data.investor;
    }
    throw new Error(response.data.message || 'Failed to create investor');
  }

  async updateInvestor(investorData: UpdateInvestorData): Promise<Investor> {
    const { id, ...updateData } = investorData;
    const response = await api.put(`/investors/${id}`, updateData);
    if (response.data.success) {
      return response.data.data.investor;
    }
    throw new Error(response.data.message || 'Failed to update investor');
  }

  async deleteInvestor(id: string): Promise<void> {
    const response = await api.delete(`/investors/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete investor');
    }
  }
}

export const investorsApi = new InvestorsApi();
