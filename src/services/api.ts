const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    return userData.token || localStorage.getItem('token');
  }
  return localStorage.getItem('token');
};

// Create headers with auth token
const createHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Generic API request function
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = createHeaders();
  
  const config: RequestInit = {
    headers,
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    if (!data.success) {
      throw new Error(data.message || 'API request failed');
    }

    return data.data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    if (data.success && data.data.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify({
        ...data.data.user,
        token: data.data.token
      }));
    }
    
    return data.data;
  },

  signup: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }
    
    if (data.success && data.data.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify({
        ...data.data.user,
        token: data.data.token
      }));
    }
    
    return data.data;
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};

// Startups API
export const startupsApi = {
  getStartups: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    return apiRequest(`/startups?${queryParams}`);
  },

  getStartupsWithDocuments: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    return apiRequest(`/startups/with-documents?${queryParams}`);
  },

  createStartup: async (startupData: any) => {
    return apiRequest('/startups', {
      method: 'POST',
      body: JSON.stringify(startupData),
    });
  },

  updateStartup: async (id: string, startupData: any) => {
    return apiRequest(`/startups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(startupData),
    });
  },

  deleteStartup: async (id: string) => {
    return apiRequest(`/startups/${id}`, {
      method: 'DELETE',
    });
  },

  getStartupStats: async () => {
    return apiRequest('/startups/stats/overview');
  }
};

// Users API
export const usersApi = {
  getUsers: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    return apiRequest(`/users?${queryParams}`);
  },

  getUserStats: async () => {
    return apiRequest('/users/stats/overview');
  }
};

// Documents API
export const documentsApi = {
  getDocuments: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    return apiRequest(`/documents?${queryParams}`);
  },

  uploadDocument: async (formData: FormData) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    
    return data.data;
  },

  deleteDocument: async (id: string) => {
    return apiRequest(`/documents/${id}`, {
      method: 'DELETE',
    });
  },

  getDocumentStats: async () => {
    return apiRequest('/documents/stats/overview');
  }
};

// Events API
export const eventsApi = {
  getEvents: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    return apiRequest(`/events?${queryParams}`);
  },

  createEvent: async (eventData: any) => {
    return apiRequest('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  updateEvent: async (id: string, eventData: any) => {
    return apiRequest(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  deleteEvent: async (id: string) => {
    return apiRequest(`/events/${id}`, {
      method: 'DELETE',
    });
  },

  getEventStats: async () => {
    return apiRequest('/events/stats/overview');
  }
};

// Mentors API
export const mentorsApi = {
  getMentors: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    return apiRequest(`/mentors?${queryParams}`);
  },

  createMentor: async (mentorData: any) => {
    return apiRequest('/mentors', {
      method: 'POST',
      body: JSON.stringify(mentorData),
    });
  },

  updateMentor: async (id: string, mentorData: any) => {
    return apiRequest(`/mentors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mentorData),
    });
  },

  deleteMentor: async (id: string) => {
    return apiRequest(`/mentors/${id}`, {
      method: 'DELETE',
    });
  },

  getMentorStats: async () => {
    return apiRequest('/mentors/stats/overview');
  }
};

// Investors API
export const investorsApi = {
  getInvestors: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    return apiRequest(`/investors?${queryParams}`);
  },

  createInvestor: async (investorData: any) => {
    return apiRequest('/investors', {
      method: 'POST',
      body: JSON.stringify(investorData),
    });
  },

  updateInvestor: async (id: string, investorData: any) => {
    return apiRequest(`/investors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(investorData),
    });
  },

  deleteInvestor: async (id: string) => {
    return apiRequest(`/investors/${id}`, {
      method: 'DELETE',
    });
  },

  getInvestorStats: async () => {
    return apiRequest('/investors/stats/overview');
  }
};

// Reports API
export const reportsApi = {
  getReports: async (params: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });
    
    return apiRequest(`/reports?${queryParams}`);
  },

  createReport: async (reportData: any) => {
    return apiRequest('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  updateReport: async (id: string, reportData: any) => {
    return apiRequest(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reportData),
    });
  },

  deleteReport: async (id: string) => {
    return apiRequest(`/reports/${id}`, {
      method: 'DELETE',
    });
  },

  getReportStats: async () => {
    return apiRequest('/reports/stats/overview');
  }
};
