import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAcctZHcuXO2oRFJ666i3eYB69w-hFyU5c",
  authDomain: "abrob-gt.firebaseapp.com",
  databaseURL: "https://abrob-gt-default-rtdb.firebaseio.com",
  projectId: "abrob-gt",
  storageBucket: "abrob-gt.firebasestorage.app",
  messagingSenderId: "694104066400",
  appId: "1:694104066400:web:56275dd28165e2f2907605",
  measurementId: "G-1L186SHG9D"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Update these constants in your app
export const UID = "Ko4GQ80LZEg6SYIRkLLV8Mgm4j32";
export const DEVICE_ID = "abrob-gtpay";

// New Path Helpers
export const PATHS = {
  device: `devices/${UID}/${DEVICE_ID}`,
  history: `history/${UID}/${DEVICE_ID}`,
  geofences: `geofences/${UID}`,
  alerts: `alerts/${UID}`,
};

// Property-specific paths
export const getDeviceProperty = (property: string) => `${PATHS.device}/${property}`;

export default app;

