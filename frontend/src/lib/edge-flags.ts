import { flag } from 'flags/next';

export type IMaintenanceNotice =
  | {
      enabled: true;
      startTime: string; // Date
      endTime: string; // Date
    }
  | {
      enabled: false;
      startTime?: undefined;
      endTime?: undefined;
    };

export const maintenanceNoticeFlag = flag({
  key: 'maintenance-notice',
  async decide() {
    // Edge config disabled for Railway deployment
    return { enabled: false } as const;
  },
});