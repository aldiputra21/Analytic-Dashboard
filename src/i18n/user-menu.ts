import { Locale } from './commons';

export interface UserMenuCopy {
  profile: string;
  logout: string;
}

export const userMenuI18n: Record<Locale, UserMenuCopy> = {
  id: {
    profile: 'Profil',
    logout: 'Keluar',
  },
  en: {
    profile: 'Profile',
    logout: 'Logout',
  },
};
