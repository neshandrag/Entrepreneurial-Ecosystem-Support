import { useState, useEffect, useCallback } from 'react';
import { Mentor, CreateMentorData, UpdateMentorData } from '../types';
import { mentorsApi } from '../services/api';

export interface UseMentorsReturn {
  mentors: Mentor[];
  loading: boolean;
  error: string | null;
  createMentor: (mentorData: CreateMentorData) => Promise<Mentor>;
  updateMentor: (mentorData: UpdateMentorData) => Promise<Mentor>;
  deleteMentor: (id: string) => Promise<void>;
  refreshMentors: () => Promise<void>;
}

export const useMentors = (): UseMentorsReturn => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mentorsApi.getMentors();
      const mentorsData = response.mentors || [];
      
      // Transform backend data to frontend format
      const transformedMentors = mentorsData.map((mentor: any) => ({
        id: mentor._id,
        name: mentor.name,
        role: mentor.role,
        email: mentor.email,
        experience: mentor.experience,
        bio: mentor.bio,
        profilePicture: mentor.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
        rating: mentor.rating || 5.0,
        createdAt: mentor.createdAt,
        updatedAt: mentor.updatedAt
      }));
      
      setMentors(transformedMentors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mentors');
      console.error('Error fetching mentors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMentor = useCallback(async (mentorData: CreateMentorData): Promise<Mentor> => {
    try {
      setError(null);
      
      // Add required fields for backend
      const mentorPayload = {
        ...mentorData,
        expertise: ['General Business', 'Startup Strategy'], // Default expertise
        sectors: ['Technology', 'Innovation'], // Default sectors
        availability: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timeSlots: [{ start: '09:00', end: '17:00' }],
          timezone: 'UTC'
        },
        preferences: {
          maxMentees: 5,
          preferredSectors: ['Technology'],
          preferredStages: ['Seed', 'Series A'],
          meetingFrequency: 'monthly'
        }
      };
      
      const response = await mentorsApi.createMentor(mentorPayload);
      const newMentor: Mentor = {
        id: response.mentor._id,
        name: response.mentor.name,
        role: response.mentor.role,
        email: response.mentor.email,
        experience: response.mentor.experience,
        bio: response.mentor.bio,
        profilePicture: response.mentor.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
        rating: response.mentor.rating || 5.0,
        createdAt: response.mentor.createdAt,
        updatedAt: response.mentor.updatedAt
      };
      
      // Update local state
      setMentors(prev => [...prev, newMentor]);
      
      return newMentor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create mentor';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateMentor = useCallback(async (mentorData: UpdateMentorData): Promise<Mentor> => {
    try {
      setError(null);
      const { id, ...updateData } = mentorData;
      const response = await mentorsApi.updateMentor(id, updateData);
      const updatedMentor: Mentor = {
        id: response.mentor._id,
        name: response.mentor.name,
        role: response.mentor.role,
        email: response.mentor.email,
        experience: response.mentor.experience,
        bio: response.mentor.bio,
        profilePicture: response.mentor.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
        rating: response.mentor.rating || 5.0,
        createdAt: response.mentor.createdAt,
        updatedAt: response.mentor.updatedAt
      };
      
      // Update local state
      setMentors(prev => prev.map(mentor => 
        mentor.id === updatedMentor.id ? updatedMentor : mentor
      ));
      
      return updatedMentor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update mentor';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteMentor = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await mentorsApi.deleteMentor(id);
      
      // Update local state
      setMentors(prev => prev.filter(mentor => mentor.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete mentor';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const refreshMentors = useCallback(async (): Promise<void> => {
    await fetchMentors();
  }, [fetchMentors]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  return {
    mentors,
    loading,
    error,
    createMentor,
    updateMentor,
    deleteMentor,
    refreshMentors,
  };
};
