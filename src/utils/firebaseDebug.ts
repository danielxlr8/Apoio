/**
 * Firebase Debug Utilities
 * 
 * Development-only debugging tools for Firebase connection and configuration.
 * These functions should NOT be used in production code.
 * 
 * @deprecated Use proper logging service in production
 */

export const debugFirebaseConnection = () => {
  if (import.meta.env.PROD) {
    console.warn("Debug functions should not be used in production");
    return null;
  }

  const config = {
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    hostname: window.location.hostname,
    isProduction: import.meta.env.PROD,
  };

  console.group("Firebase Configuration");
  console.table(config);
  console.groupEnd();

  return config;
};

export const logCallCreation = (callData: any) => {
  if (import.meta.env.PROD) return;

  console.group("Call Creation");
  console.log("Data:", callData);
  console.log("Collection: supportCalls");
  console.log("Project:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
  console.log("Timestamp:", new Date().toISOString());
  console.groupEnd();
};

export const logCallsFetch = (role: string) => {
  if (import.meta.env.PROD) return;

  console.group("Fetching Calls");
  console.log("Role:", role);
  console.log("Collection: supportCalls");
  console.log("Project:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
  console.groupEnd();
};
