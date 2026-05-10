import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "vuefire";
import {
  setClientErrorRemoteSink,
  type ClientErrorEntry,
} from "~/utils/client-error-log";

function isFirebaseErrorLogEnabled(config: {
  public: { firebaseErrorLogEnabled?: unknown };
}) {
  const v = config.public.firebaseErrorLogEnabled;
  return v === true || String(v).toLowerCase() === "true";
}

function installationId(): string {
  const key = "qydah:install-id";
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

function buildFirestorePayload(
  entry: ClientErrorEntry,
  meta: { installationId: string },
) {
  let extraJson: string | null = null;
  if (entry.extra) {
    try {
      extraJson = JSON.stringify(entry.extra).slice(0, 8000);
    } catch {
      extraJson = "[unserializable]";
    }
  }
  return {
    clientTs: entry.t,
    category: entry.category,
    message: entry.message.slice(0, 8000),
    route: entry.route ?? null,
    stack: entry.stack ? entry.stack.slice(0, 12000) : null,
    extraJson,
    installationId: meta.installationId,
    origin:
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : null,
    href:
      typeof window !== "undefined" && window.location?.href
        ? window.location.href.slice(0, 2000)
        : null,
    userAgent:
      typeof navigator !== "undefined"
        ? navigator.userAgent.slice(0, 512)
        : null,
    createdAt: serverTimestamp(),
  };
}

export default defineNuxtPlugin({
  name: "firebase-error-sink",
  enforce: "pre",
  setup() {
    const config = useRuntimeConfig();
    if (!isFirebaseErrorLogEnabled(config)) {
      setClientErrorRemoteSink(null);
      return;
    }

    const db = useFirestore();
    const collectionName =
      (config.public.firebaseErrorLogCollection as string) || "client_errors";
    const installId = installationId();

    setClientErrorRemoteSink(async (entry) => {
      await addDoc(
        collection(db, collectionName),
        buildFirestorePayload(entry, { installationId: installId }),
      );
    });
  },
});
