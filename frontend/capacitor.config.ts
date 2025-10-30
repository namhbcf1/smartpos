import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.tpcomhb.smartpos',
  appName: 'TPCOMHB Smart POS',
  webDir: 'dist',
  server: {
    // Production API
    url: 'https://namhbcf-uk.pages.dev',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  }
};

export default config;
