import { useState, useEffect, useCallback } from 'react';
import { Event, CreateEventData, UpdateEventData } from '../types';
import { eventsApi } from '../services/api';

export interface UseEventsReturn {
  events: Event[];
  upcomingEvents: Event[];
  completedEvents: Event[];
  categories: string[];
  loading: boolean;
  error: string | null;
  createEvent: (eventData: CreateEventData) => Promise<Event>;
  updateEvent: (eventData: UpdateEventData) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

export const useEvents = (): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [completedEvents, setCompletedEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all events and categorize them
      const response = await eventsApi.getEvents();
      const allEvents = response.events || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcoming = allEvents.filter((event: any) => {
        const eventDate = new Date(event.date);
        return eventDate >= today;
      });
      
      const completed = allEvents.filter((event: any) => {
        const eventDate = new Date(event.date);
        return eventDate < today;
      });
      
      // Extract unique categories
      const uniqueCategories = [...new Set(allEvents.map((event: any) => event.category))];

      setEvents(allEvents);
      setUpcomingEvents(upcoming);
      setCompletedEvents(completed);
      setCategories(uniqueCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (eventData: CreateEventData): Promise<Event> => {
    try {
      setError(null);
      
      // Add required fields for backend
      const eventPayload = {
        ...eventData,
        eventType: 'workshop', // Default event type
        duration: 60, // Default duration in minutes
        registrationRequired: true,
        isFree: true,
        status: 'published',
        isActive: true
      };
      
      const response = await eventsApi.createEvent(eventPayload);
      const newEvent: Event = {
        id: response.event._id,
        title: response.event.title,
        description: response.event.description,
        date: new Date(response.event.date).toISOString().split('T')[0],
        time: response.event.time,
        location: response.event.location,
        category: response.event.category,
        organizedBy: response.event.organizedBy,
        registrationLink: response.event.registrationLink,
        onlineEventUrl: response.event.onlineEventUrl,
        createdAt: response.event.createdAt,
        updatedAt: response.event.updatedAt
      };
      
      // Update local state
      setEvents(prev => [...prev, newEvent]);
      
      // Determine if it's upcoming or completed based on date
      const eventDate = new Date(newEvent.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate >= today) {
        setUpcomingEvents(prev => [...prev, newEvent]);
      } else {
        setCompletedEvents(prev => [...prev, newEvent]);
      }
      
      return newEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateEvent = useCallback(async (eventData: UpdateEventData): Promise<Event> => {
    try {
      setError(null);
      const { id, ...updateData } = eventData;
      const response = await eventsApi.updateEvent(id, updateData);
      const updatedEvent: Event = {
        id: response.event._id,
        title: response.event.title,
        description: response.event.description,
        date: new Date(response.event.date).toISOString().split('T')[0],
        time: response.event.time,
        location: response.event.location,
        category: response.event.category,
        organizedBy: response.event.organizedBy,
        registrationLink: response.event.registrationLink,
        onlineEventUrl: response.event.onlineEventUrl,
        createdAt: response.event.createdAt,
        updatedAt: response.event.updatedAt
      };
      
      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      ));
      
      // Update in appropriate list
      const eventDate = new Date(updatedEvent.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate >= today) {
        setUpcomingEvents(prev => prev.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        ));
        setCompletedEvents(prev => prev.filter(event => event.id !== updatedEvent.id));
      } else {
        setCompletedEvents(prev => prev.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        ));
        setUpcomingEvents(prev => prev.filter(event => event.id !== updatedEvent.id));
      }
      
      return updatedEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await eventsApi.deleteEvent(id);
      
      // Update local state
      setEvents(prev => prev.filter(event => event.id !== id));
      setUpcomingEvents(prev => prev.filter(event => event.id !== id));
      setCompletedEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const refreshEvents = useCallback(async (): Promise<void> => {
    await fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    upcomingEvents,
    completedEvents,
    categories,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
  };
};
