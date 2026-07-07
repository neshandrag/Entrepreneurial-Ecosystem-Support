import { Report, CreateReportData, UpdateReportData } from '../types';
import api from './api';

class ReportsApi {
  async getReports(): Promise<Report[]> {
    const response = await api.get('/reports');
    if (response.data.success) {
      return response.data.data.reports;
    }
    throw new Error(response.data.message || 'Failed to fetch reports');
  }

  async getReportById(id: string): Promise<Report> {
    const response = await api.get(`/reports/${id}`);
    if (response.data.success) {
      return response.data.data.report;
    }
    throw new Error(response.data.message || 'Failed to fetch report');
  }

  async createReport(reportData: CreateReportData): Promise<Report> {
    const response = await api.post('/reports', reportData);
    if (response.data.success) {
      return response.data.data.report;
    }
    throw new Error(response.data.message || 'Failed to create report');
  }

  async updateReport(reportData: UpdateReportData): Promise<Report> {
    const { id, ...updateData } = reportData;
    const response = await api.put(`/reports/${id}`, updateData);
    if (response.data.success) {
      return response.data.data.report;
    }
    throw new Error(response.data.message || 'Failed to update report');
  }

  async deleteReport(id: string): Promise<void> {
    const response = await api.delete(`/reports/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete report');
    }
  }
}

export const reportsApi = new ReportsApi();
