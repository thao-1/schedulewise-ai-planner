import { User as PassportUser } from 'passport';

declare global {
  namespace Express {
    // Extend the User type to be the same as Passport's User
    interface User extends PassportUser {}

    // Extend the Request interface to include authentication methods
    interface Request {
      user?: User;
      isAuthenticated(): this is AuthenticatedRequest;
      login(user: any, callback: (err: any) => void): void;
      login(user: any, options: any, callback: (err: any) => void): void;
      logout(callback: (err: any) => void): void;
      logout(): void;
    }

    // Interface for authenticated requests
    interface AuthenticatedRequest extends Request {
      user: User;
    }
  }
}
