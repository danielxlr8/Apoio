import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.support.transfer",
  appName: "supportransfer",
  webDir: "dist", //
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId:
        "610673332843-qrhr8e4i3blb21a17uv56ebcb83tfk6s.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
