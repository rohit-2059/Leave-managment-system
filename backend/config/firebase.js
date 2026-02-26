import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    const serviceAccountPath = path.resolve(
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './config/serviceAccountKey.json'
    );

    if (existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log('Firebase Admin SDK initialized');
    } else {
      console.warn(
        'Firebase service account key not found at:',
        serviceAccountPath
      );
      console.warn(
        'Google Sign-In will not work. Place your serviceAccountKey.json in backend/config/'
      );
    }
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
  }
};

export { admin, initializeFirebase };
