# Firebase Authentication Setup

This guide will help you set up Firebase Authentication for the ScheduleWise application.

## Prerequisites

1. A Firebase account (https://firebase.google.com/)
2. Node.js and npm installed
3. Basic understanding of React and TypeScript

## Setup Steps

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Give your project a name (e.g., "ScheduleWise")
4. Enable Google Analytics if desired (optional)

### 2. Set Up Authentication

1. In the Firebase Console, go to the "Authentication" section
2. Click on "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

### 3. Get Your Firebase Configuration

1. In the Firebase Console, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on the "</>" (web) icon to register a web app
5. Give your app a nickname (e.g., "ScheduleWise Web")
6. Click "Register app"
7. Copy the Firebase configuration object (it should look like the one below):

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123def456"
};
```

### 4. Configure Environment Variables

1. Rename the `.env.example` file to `.env`
2. Update the `.env` file with your Firebase configuration:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Install Dependencies

Run the following command to install the required dependencies:

```bash
npm install firebase @react-firebase/auth
```

### 6. Test the Authentication

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Navigate to the signup page and create a new account
3. Check the Firebase Console to verify the user was created
4. Log out and log back in to test the login functionality

## Security Rules (Optional)

For production, consider setting up Firebase Security Rules to protect your data. You can find more information in the [Firebase Security Rules documentation](https://firebase.google.com/docs/rules).

## Troubleshooting

- **Authentication Errors**: Check the browser console for error messages
- **Firebase Not Initialized**: Ensure your environment variables are correctly set in the `.env` file
- **CORS Issues**: Make sure your Firebase project has the correct authorized domains in the Firebase Console

## Next Steps

- [ ] Set up Firestore for user data storage
- [ ] Implement email verification
- [ ] Add password reset functionality
- [ ] Set up social authentication providers (Google, GitHub, etc.)
