import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Path to the service account key file
const serviceAccountPath = path.join(__dirname, '../../firebase-admin-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error('Firebase Admin key file not found. Please download it from Firebase Console and save it as firebase-admin-key.json in the server directory.');
}

const serviceAccount = require(serviceAccountPath);

export { serviceAccount };
