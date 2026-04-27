import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../../types/financial/user';
import { apiFetch } from '../../services/financial/apiFetch';

interface UpdateProfileInput {
  fullName?: string;
  email?: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

interface UseUserProfileResult {
  profile: UserProfile | null;
  isLoading: boolean;
  update: (data: UpdateProfileInput) => Promise<void>;
  changePassword: (data: ChangePasswordInput) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

/**
 * Hook to manage user profile data and operations.
 * Fetches profile on mount and provides methods to update profile, change password, and upload avatar.
 * Requirements: 25.5
 */
export function useUserProfile(): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch('/api/profile');
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await res.json();
        setProfile(data);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const update = useCallback(async (data: UpdateProfileInput) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      const updated = await res.json();
      setProfile(updated);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(
    async (data: ChangePasswordInput) => {
      setIsLoading(true);
      try {
        const res = await apiFetch('/api/profile/change-password', {
          method: 'POST',
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          throw new Error('Failed to change password');
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const uploadAvatar = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await apiFetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to upload avatar');
      }

      const updated = await res.json();
      setProfile(updated);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    profile,
    isLoading,
    update,
    changePassword,
    uploadAvatar,
  };
}
