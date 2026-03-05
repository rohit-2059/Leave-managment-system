import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    let serviceAccount = null;

    // Option 1: Base64 encoded JSON (for Render / cloud hosting - recommended)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const decoded = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        'base64'
      ).toString('utf8');
      serviceAccount = JSON.parse(decoded);
      console.log('Using Firebase credentials from FIREBASE_SERVICE_ACCOUNT_BASE64 env variable');
    }
    // Option 2: Direct JSON string via env variable
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('Using Firebase credentials from FIREBASE_SERVICE_ACCOUNT env variable');
    } else {
      // Option 3: Local file path (for local development)
      const serviceAccountPath = path.resolve(
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './config/serviceAccountKey.json'
      );

      if (existsSync(serviceAccountPath)) {
        serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        console.log('Using Firebase credentials from local file');
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log('Firebase Admin SDK initialized');
    } else {
      console.warn(
        'Firebase credentials not found.'
      );
      console.warn(
        'Set FIREBASE_SERVICE_ACCOUNT env variable or place serviceAccountKey.json in backend/config/'
      );
    }
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
  }
};

export { admin, initializeFirebase };
