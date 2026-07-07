import { useState, useEffect, useCallback } from 'react';
import { Report, CreateReportData, UpdateReportData } from '../types';
import { reportsApi } from '../services/api';

export interface UseReportsReturn {
  reports: Report[];
  loading: boolean;
  error: string | null;
  createReport: (reportData: CreateReportData) => Promise<Report>;
  updateReport: (reportData: UpdateReportData) => Promise<Report>;
  deleteReport: (id: string) => Promise<void>;
  refreshReports: () => Promise<void>;
}

export const useReports = (): UseReportsReturn => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsApi.getReports();
      const reportsData = response.reports || [];
      
      // Transform backend data to frontend format
      const transformedReports = reportsData.map((report: any) => ({
        id: report._id,
        name: report.name,
        type: report.type,
        dateGenerated: new Date(report.dateGenerated).toISOString().split('T')[0],
        fileSize: report.fileSize,
        status: report.status,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      }));
      
      setReports(transformedReports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createReport = useCallback(async (reportData: CreateReportData): Promise<Report> => {
    try {
      setError(null);
      
      // Add required fields for backend
      const reportPayload = {
        ...reportData,
        description: `Generated report: ${reportData.name}`,
        parameters: {},
        reportConfig: {
          format: 'pdf',
          filters: {},
        },
        isPublic: false,
        tags: []
      };
      
      const response = await reportsApi.createReport(reportPayload);
      const newReport: Report = {
        id: response.report._id,
        name: response.report.name,
        type: response.report.type,
        dateGenerated: new Date(response.report.dateGenerated).toISOString().split('T')[0],
        fileSize: response.report.fileSize,
        status: response.report.status,
        createdAt: response.report.createdAt,
        updatedAt: response.report.updatedAt
      };
      
      // Update local state
      setReports(prev => [...prev, newReport]);
      
      return newReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create report';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateReport = useCallback(async (reportData: UpdateReportData): Promise<Report> => {
    try {
      setError(null);
      const { id, ...updateData } = reportData;
      const response = await reportsApi.updateReport(id, updateData);
      const updatedReport: Report = {
        id: response.report._id,
        name: response.report.name,
        type: response.report.type,
        dateGenerated: new Date(response.report.dateGenerated).toISOString().split('T')[0],
        fileSize: response.report.fileSize,
        status: response.report.status,
        createdAt: response.report.createdAt,
        updatedAt: response.report.updatedAt
      };
      
      // Update local state
      setReports(prev => prev.map(report => 
        report.id === updatedReport.id ? updatedReport : report
      ));
      
      return updatedReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update report';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteReport = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await reportsApi.deleteReport(id);
      
      // Update local state
      setReports(prev => prev.filter(report => report.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete report';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const refreshReports = useCallback(async (): Promise<void> => {
    await fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    createReport,
    updateReport,
    deleteReport,
    refreshReports,
  };
};
