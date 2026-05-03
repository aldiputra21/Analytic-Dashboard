// i18n/alerts.ts - Alerts Inbox translations
import { Locale } from './commons';

export interface AlertsCopy {
  title: string;
  subtitle: string;
  status: {
    unread: string;
    read: string;
    archived: string;
    dismissed: string;
  };
  realtime: {
    sse: string;
    polling: string;
    idle: string;
  };
  actions: {
    refresh: string;
    markRead: string;
    archive: string;
    acknowledge: string;
  };
  empty: string;
  severity: {
    high: string;
    medium: string;
    low: string;
  };
  fields: {
    current: string;
    threshold: string;
  };
  activeAlerts: string;
  noActiveAlerts: string;
  allCaughtUp: string;
  viewAll: string;
  newBadge: string;
  loadingNotifications: string;
}

export const alertsI18n: Record<Locale, AlertsCopy> = {
  id: {
    title: 'Kotak Masuk Pemberitahuan',
    subtitle: 'Pemberitahuan CFD realtime dikirim melalui notifikasi dengan cadangan polling.',
    status: {
      unread: 'Belum Dibaca',
      read: 'Sudah Dibaca',
      archived: 'Diarsipkan',
      dismissed: 'Diabaikan',
    },
    realtime: {
      sse: 'Realtime SSE',
      polling: 'Polling Cadangan',
      idle: 'Diam',
    },
    actions: {
      refresh: 'Segarkan',
      markRead: 'Tandai dibaca',
      archive: 'Arsipkan',
      acknowledge: 'Tandai sudah diketahui',
    },
    empty: 'Tidak ada pemberitahuan di status ini.',
    severity: {
      high: 'Tinggi',
      medium: 'Sedang',
      low: 'Rendah',
    },
    fields: {
      current: 'Sekarang',
      threshold: 'Ambang Batas',
    },
    activeAlerts: 'Pemberitahuan Aktif',
    noActiveAlerts: 'Tidak ada pemberitahuan aktif',
    allCaughtUp: 'Semua sudah beres!',
    viewAll: 'Lihat Semua Pemberitahuan',
    newBadge: 'BARU',
    loadingNotifications: 'Memuat pemberitahuan...',
  },
  en: {
    title: 'Alerts Inbox',
    subtitle: 'Realtime CFD alerts delivered through notifications with polling fallback.',
    status: {
      unread: 'Unread',
      read: 'Read',
      archived: 'Archived',
      dismissed: 'Dismissed',
    },
    realtime: {
      sse: 'Realtime SSE',
      polling: 'Polling Fallback',
      idle: 'Idle',
    },
    actions: {
      refresh: 'Refresh',
      markRead: 'Mark read',
      archive: 'Archive',
      acknowledge: 'Acknowledge',
    },
    empty: 'No alerts in this state.',
    severity: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    },
    fields: {
      current: 'Current',
      threshold: 'Threshold',
    },
    activeAlerts: 'Active Alerts',
    noActiveAlerts: 'No active alerts',
    allCaughtUp: "You're all caught up!",
    viewAll: 'View All Notifications',
    newBadge: 'NEW',
    loadingNotifications: 'Loading notifications...',
  },
};
