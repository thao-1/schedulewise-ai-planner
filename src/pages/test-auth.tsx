import { AuthTest } from '@/components/auth/AuthTest';

export default function TestAuthPage() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
      <div className="grid gap-6">
        <AuthTest />
        <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow">
          <h2 className="text-lg font-semibold mb-4">Test Credentials</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Test User</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Email: test@example.com<br />
                Password: password123
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p className="font-medium">Note:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>This is just a test component to verify Firebase auth setup</li>
                <li>In a real app, use the login/signup forms</li>
                <li>Make sure to enable Email/Password auth in Firebase Console</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
