import { Document, CreateDocumentData, UpdateDocumentData } from '../types';
import api from './api';

class DocumentsApi {
  async getDocuments(): Promise<Document[]> {
    const response = await api.get('/documents');
    if (response.data.success) {
      return response.data.data.documents;
    }
    throw new Error(response.data.message || 'Failed to fetch documents');
  }

  async getDocumentById(id: string): Promise<Document> {
    const response = await api.get(`/documents/${id}`);
    if (response.data.success) {
      return response.data.data.document;
    }
    throw new Error(response.data.message || 'Failed to fetch document');
  }

  async createDocument(documentData: CreateDocumentData): Promise<Document> {
    const response = await api.post('/documents', documentData);
    if (response.data.success) {
      return response.data.data.document;
    }
    throw new Error(response.data.message || 'Failed to create document');
  }

  async updateDocument(documentData: UpdateDocumentData): Promise<Document> {
    const { id, ...updateData } = documentData;
    const response = await api.put(`/documents/${id}`, updateData);
    if (response.data.success) {
      return response.data.data.document;
    }
    throw new Error(response.data.message || 'Failed to update document');
  }

  async deleteDocument(id: string): Promise<void> {
    const response = await api.delete(`/documents/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete document');
    }
  }
}

export const documentsApi = new DocumentsApi();
