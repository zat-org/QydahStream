import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  type Auth,
} from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;
let authReady: Promise<void> | null = null;

function readFirebaseConfig() {
  const config = useRuntimeConfig().public;
  return {
    apiKey: String(config.firebaseApiKey ?? ""),
    authDomain: String(config.firebaseAuthDomain ?? ""),
    projectId: String(config.firebaseProjectId ?? ""),
    appId: String(config.firebaseAppId ?? ""),
    databaseURL: String(config.firebaseDatabaseURL ?? ""),
    storageBucket: String(config.firebaseStorageBucket ?? ""),
    messagingSenderId: String(config.firebaseMessagingSenderId ?? ""),
  };
}

export function isFirebaseConfigured(): boolean {
  if (!import.meta.client) return false;
  const c = readFirebaseConfig();
  return Boolean(c.apiKey && c.projectId && c.appId && c.databaseURL);
}

/** Init Firebase + anonymous auth once. Safe to call repeatedly. */
export async function ensureFirebase(): Promise<{
  app: FirebaseApp;
  auth: Auth;
  db: Database;
} | null> {
  if (!import.meta.client) return null;
  if (!isFirebaseConfigured()) return null;

  if (!app) {
    const firebaseConfig = readFirebaseConfig();
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
  }

  if (!auth || !db) return null;

  if (!authReady) {
    authReady = (async () => {
      if (!auth!.currentUser) {
        await signInAnonymously(auth!);
      }
    })().catch((err) => {
      authReady = null;
      console.warn("[firebase] anonymous sign-in failed", err);
      throw err;
    });
  }

  try {
    await authReady;
  } catch {
    return null;
  }

  return { app, auth, db };
}

export function getFirebaseDb(): Database | null {
  return db;
}
