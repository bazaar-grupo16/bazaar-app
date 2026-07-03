const fs = require("fs");
const path = require("path");

const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
if (!androidClientId) {
  console.warn(
    "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID not set locally — OAuth scheme omitted from local config. " +
    "It will be injected server-side during EAS build; run `eas env:pull <env>` for local builds."
  );
}

const googleRedirectScheme = androidClientId
  ? `com.googleusercontent.apps.${androidClientId.replace(".apps.googleusercontent.com", "")}`
  : null;

const googleServicesFilePath = process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json";
const hasGoogleServicesFile = fs.existsSync(path.resolve(__dirname, googleServicesFilePath));

export default {
  expo: {
    name: "Bazaar",
    slug: "bazaar-grupo16",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.bazaar.app",
      associatedDomains: ["applinks:bazaar.pib.ar"],
    },
    android: {
      package: "com.bazaar.app",
      ...(hasGoogleServicesFile ? { googleServicesFile: googleServicesFilePath } : {}),
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            { scheme: "https", host: "bazaar.pib.ar", pathPrefix: "/products" },
            { scheme: "https", host: "bazaar.pib.ar", pathPrefix: "/order-polling" },
            { scheme: "https", host: "bazaar.pib.ar", pathPrefix: "/order-result" },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
        ...(googleRedirectScheme
          ? [
              {
                action: "VIEW",
                data: [{ scheme: googleRedirectScheme }],
                category: ["BROWSABLE", "DEFAULT"],
              },
            ]
          : []),
      ],
    },
    web: {
      bundler: "metro",
      output: "single",
    },
    scheme: "bazaar",
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      eas: {
        projectId: "e732a3a7-c154-452b-9582-f87ac91ba8c9",
      },
    },
    owner: "bazaar-grupo16",
    plugins: [
      "expo-secure-store",
      "expo-web-browser",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#ff6900",
          defaultChannel: "default",
        },
      ],
    ],
  },
};
