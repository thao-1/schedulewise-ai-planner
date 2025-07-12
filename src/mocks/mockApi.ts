// Simple in-memory database
const mockDB = {
  users: [
    {
      id: 'mock-user-123',
      email: 'test@example.com',
      password: 'password123', // In a real app, never store passwords in plain text
      displayName: 'Test User',
    },
  ],
};

// Mock API responses
const mockApi = {
  async login(credentials: { email: string; password: string }) {
    const user = mockDB.users.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Return user data without the password
    const { password, ...userData } = user;
    return {
      user: userData,
      token: 'mock-jwt-token',
    };
  },

  async signup(userData: { email: string; password: string; displayName: string }) {
    if (mockDB.users.some((u) => u.email === userData.email)) {
      throw new Error('Email already in use');
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email: userData.email,
      password: userData.password, // In a real app, hash the password
      displayName: userData.displayName,
    };

    mockDB.users.push(newUser);

    // Return user data without the password
    const { password, ...userDataWithoutPassword } = newUser;
    return {
      user: userDataWithoutPassword,
      token: 'mock-jwt-token',
    };
  },

  async getCurrentUser(token?: string) {
    if (!token) {
      throw new Error('No token provided');
    }

    // In a real app, you would validate the token
    const userId = token.split('-')[2]; // Extract user ID from mock token
    const user = mockDB.users.find((u) => u.id === userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Return user data without the password
    const { password, ...userData } = user;
    return userData;
  },
};

export default mockApi;
