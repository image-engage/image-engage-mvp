import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.imageengage.app',
  appName: 'imageengage-admin',
  webDir: 'out',
  plugins: {
    Camera: {
      permissions: ['camera']
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff'
    }
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
