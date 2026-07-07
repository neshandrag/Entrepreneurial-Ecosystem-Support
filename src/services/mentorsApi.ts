import { Mentor, CreateMentorData, UpdateMentorData } from '../types';
import api from './api';

class MentorsApi {
  async getMentors(): Promise<Mentor[]> {
    const response = await api.get('/mentors');
    if (response.data.success) {
      return response.data.data.mentors;
    }
    throw new Error(response.data.message || 'Failed to fetch mentors');
  }

  async getMentorById(id: string): Promise<Mentor> {
    const response = await api.get(`/mentors/${id}`);
    if (response.data.success) {
      return response.data.data.mentor;
    }
    throw new Error(response.data.message || 'Failed to fetch mentor');
  }

  async createMentor(mentorData: CreateMentorData): Promise<Mentor> {
    const response = await api.post('/mentors', mentorData);
    if (response.data.success) {
      return response.data.data.mentor;
    }
    throw new Error(response.data.message || 'Failed to create mentor');
  }

  async updateMentor(mentorData: UpdateMentorData): Promise<Mentor> {
    const { id, ...updateData } = mentorData;
    const response = await api.put(`/mentors/${id}`, updateData);
    if (response.data.success) {
      return response.data.data.mentor;
    }
    throw new Error(response.data.message || 'Failed to update mentor');
  }

  async deleteMentor(id: string): Promise<void> {
    const response = await api.delete(`/mentors/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete mentor');
    }
  }
}

export const mentorsApi = new MentorsApi();
