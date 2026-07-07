import { useState, useEffect, useCallback } from 'react';
import { Document, CreateDocumentData, UpdateDocumentData } from '../types';
import { documentsApi } from '../services/api';

export interface UseDocumentsReturn {
  documents: Document[];
  loading: boolean;
  error: string | null;
  createDocument: (documentData: CreateDocumentData) => Promise<Document>;
  updateDocument: (documentData: UpdateDocumentData) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

export const useDocuments = (): UseDocumentsReturn => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await documentsApi.getDocuments();
      setDocuments(response.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDocument = useCallback(async (documentData: CreateDocumentData): Promise<Document> => {
    try {
      setError(null);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', documentData.name);
      formData.append('category', 'other');
      formData.append('description', `Document: ${documentData.name}`);
      
      // Create a dummy file for demo purposes
      const dummyFile = new File(['Document content'], documentData.name, { type: 'text/plain' });
      formData.append('file', dummyFile);
      
      const response = await documentsApi.uploadDocument(formData);
      const newDocument: Document = {
        id: response.document._id,
        name: response.document.name,
        location: response.document.location,
        owner: response.document.owner,
        fileSize: response.document.fileSize,
        uploadDate: new Date(response.document.uploadDate).toISOString().split('T')[0],
        type: response.document.type,
        createdAt: response.document.createdAt,
        updatedAt: response.document.updatedAt
      };
      
      // Update local state
      setDocuments(prev => [newDocument, ...prev]);
      
      return newDocument;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create document';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateDocument = useCallback(async (documentData: UpdateDocumentData): Promise<Document> => {
    try {
      setError(null);
      const updatedDocument = await documentsApi.updateDocument(documentData);
      
      // Update local state
      setDocuments(prev => prev.map(document => 
        document.id === updatedDocument.id ? updatedDocument : document
      ));
      
      return updatedDocument;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update document';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await documentsApi.deleteDocument(id);
      
      // Update local state
      setDocuments(prev => prev.filter(document => document.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const refreshDocuments = useCallback(async (): Promise<void> => {
    await fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    refreshDocuments,
  };
};
