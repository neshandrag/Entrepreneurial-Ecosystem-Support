import { Event, CreateEventData, UpdateEventData } from '../types';
import api from './api';

class EventsApi {
  async getEvents(): Promise<Event[]> {
    const response = await api.get('/events');
    if (response.data.success) {
      return response.data.data.events;
    }
    throw new Error(response.data.message || 'Failed to fetch events');
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const response = await api.get('/events?filter=upcoming');
    if (response.data.success) {
      return response.data.data.events;
    }
    throw new Error(response.data.message || 'Failed to fetch upcoming events');
  }

  async getCompletedEvents(): Promise<Event[]> {
    const response = await api.get('/events?filter=completed');
    if (response.data.success) {
      return response.data.data.events;
    }
    throw new Error(response.data.message || 'Failed to fetch completed events');
  }

  async getEventById(id: string): Promise<Event> {
    const response = await api.get(`/events/${id}`);
    if (response.data.success) {
      return response.data.data.event;
    }
    throw new Error(response.data.message || 'Failed to fetch event');
  }

  async createEvent(eventData: CreateEventData): Promise<Event> {
    const response = await api.post('/events', eventData);
    if (response.data.success) {
      return response.data.data.event;
    }
    throw new Error(response.data.message || 'Failed to create event');
  }

  async updateEvent(eventData: UpdateEventData): Promise<Event> {
    const { id, ...updateData } = eventData;
    const response = await api.put(`/events/${id}`, updateData);
    if (response.data.success) {
      return response.data.data.event;
    }
    throw new Error(response.data.message || 'Failed to update event');
  }

  async deleteEvent(id: string): Promise<void> {
    const response = await api.delete(`/events/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete event');
    }
  }

  async getEventCategories(): Promise<string[]> {
    const response = await api.get('/events/categories');
    if (response.data.success) {
      return response.data.data.categories;
    }
    throw new Error(response.data.message || 'Failed to fetch event categories');
  }
}

export const eventsApi = new EventsApi();
