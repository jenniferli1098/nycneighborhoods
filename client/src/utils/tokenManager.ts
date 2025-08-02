import api from '../config/api';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  description?: string;
  location?: string;
  mapPreferences?: {
    visibleMaps: string[];
  };
}

export const tokenManager = {
  setToken: (token: string): void => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  removeToken: (): void => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  initializeToken: (): void => {
    const token = tokenManager.getToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },

  handleAuthResponse: (response: { token: string; user: User }): User => {
    const { token, user } = response;
    tokenManager.setToken(token);
    return user;
  }
};