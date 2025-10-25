import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

try {
  if (!getApps().length) {
    console.log('🔧 Initializing Firebase Admin SDK...');

    // Initialize Admin SDK
    // For local development, you can use a service account key file
    // For production (Vercel/etc), use environment variables
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('📄 Using FIREBASE_SERVICE_ACCOUNT_KEY');
      // Parse the service account JSON from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } else if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      console.log('🆔 Using NEXT_PUBLIC_FIREBASE_PROJECT_ID with default credentials');
      // Fallback: Use project ID from client config
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      console.error('❌ Missing Firebase Admin configuration!');
      console.error('Available env vars:', {
        hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      throw new Error(
        'Firebase Admin SDK requires either FIREBASE_SERVICE_ACCOUNT_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable'
      );
    }
    adminDb = getFirestore(adminApp);
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    adminApp = getApps()[0];
    adminDb = getFirestore(adminApp);
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  throw error;
}

export { adminApp, adminDb };
