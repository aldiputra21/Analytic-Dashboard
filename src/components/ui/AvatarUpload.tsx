import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  language: 'id' | 'en';
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onUpload,
  language,
}) => {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInitials = (url: string | null): string => {
    if (!url) return 'U';
    // Extract initials from URL if it contains user info, otherwise default
    return 'U';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!hasValidExtension || !ALLOWED_TYPES.includes(file.type)) {
      const errorMsg =
        language === 'id'
          ? 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.'
          : 'File format not supported. Use JPG, PNG, or WebP.';
      setError(errorMsg);
      toast.error(errorMsg);
      e.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg =
        language === 'id'
          ? 'Ukuran file terlalu besar. Maksimal 2MB.'
          : 'File size too large. Maximum 2MB.';
      setError(errorMsg);
      toast.error(errorMsg);
      e.target.value = '';
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      await onUpload(file);
      const successMsg =
        language === 'id'
          ? 'Avatar berhasil diunggah'
          : 'Avatar uploaded successfully';
      toast.success(successMsg);
    } catch (err: any) {
      const errorMsg = err.message || (language === 'id' ? 'Gagal mengunggah avatar' : 'Failed to upload avatar');
      setError(errorMsg);
      toast.error(errorMsg);
      // Reset preview on error
      setPreview(currentAvatarUrl);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-2xl border-2 border-slate-200 bg-linear-to-br from-indigo-50 to-blue-50 flex items-center justify-center overflow-hidden shadow-md">
          {preview ? (
            <img
              src={preview}
              alt="Avatar preview"
              className="w-full h-full object-cover"
              onError={() => setPreview(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-16 h-16 rounded-full bg-indigo-200 flex items-center justify-center text-2xl font-black text-indigo-600">
                {getInitials(currentAvatarUrl)}
              </div>
            </div>
          )}
        </div>

        {/* Upload Overlay */}
        <label className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
          <div className="flex flex-col items-center gap-1">
            <Upload size={24} className="text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-tight">
              {language === 'id' ? 'Ubah' : 'Change'}
            </span>
          </div>
          <input
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
        </label>

        {/* Loading Indicator */}
        {isUploading && (
          <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="text-center">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
          {language === 'id' ? 'Format: JPG, PNG, WebP' : 'Format: JPG, PNG, WebP'}
        </p>
        <p className="text-xs text-slate-400">
          {language === 'id' ? 'Maksimal 2MB' : 'Maximum 2MB'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
          <X size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};
