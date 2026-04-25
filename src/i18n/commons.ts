// i18n/commons.ts - Shared translations across modules
import { Locale } from './income-statement';

export interface CommonsCopy {
  networkOnline: string;
  networkOffline: string;
  errorFetchMasterData: string;
  errorLoadTable: string;
  retry: string;
}

export const commonsI18n: Record<Locale, CommonsCopy> = {
  id: {
    networkOnline: 'Koneksi kembali terhubung',
    networkOffline: 'Koneksi terputus. Bekerja dalam mode offline.',
    errorFetchMasterData: 'Gagal memuat data pendukung (dropdown)',
    errorLoadTable: 'Gagal memuat data tabel',
    retry: 'Coba Lagi',
  },
  en: {
    networkOnline: 'Network connection restored',
    networkOffline: 'Network connection lost. Working in offline mode.',
    errorFetchMasterData: 'Failed to load master data (dropdown)',
    errorLoadTable: 'Failed to load table data',
    retry: 'Retry',
  },
};
