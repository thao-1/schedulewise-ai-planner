import mockApi from '@/mocks/mockApi';

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    return mockApi.login(credentials);
  },

  async signup(userData: { email: string; password: string; displayName: string }): Promise<AuthResponse> {
    return mockApi.signup(userData);
  },

  async getCurrentUser(token?: string): Promise<User> {
    if (!token) throw new Error('No token provided');
    return mockApi.getCurrentUser(token);
  },
};

export default authService;
