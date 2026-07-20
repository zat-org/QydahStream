import { ensureFirebase, isFirebaseConfigured } from "~/utils/firebase.client";

/**
 * Warm Firebase anonymous auth on client boot so first pushLog is fast.
 * Does nothing when Firebase env is missing.
 */
export default defineNuxtPlugin({
  name: "firebase-logger",
  parallel: true,
  setup() {
    if (!import.meta.client) return;
    if (!isFirebaseConfigured()) return;
    void ensureFirebase();
  },
});
