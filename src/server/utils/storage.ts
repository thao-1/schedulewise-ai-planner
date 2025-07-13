const PREFIX = 'schedulewise_';

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = window.localStorage.getItem(`${PREFIX}${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage`, error);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage`, error);
    }
  },

  remove: (key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(`${PREFIX}${key}`);
      }
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage`, error);
    }
  },

  clear: (): void => {
    try {
      if (typeof window !== 'undefined') {
        Object.keys(window.localStorage)
          .filter(key => key.startsWith(PREFIX))
          .forEach(key => window.localStorage.removeItem(key));
      }
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  },
};
