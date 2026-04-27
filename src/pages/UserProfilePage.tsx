import React, { useState, useEffect } from 'react';
import { 
  User, Shield, KeyRound, Clock, Building2, 
  Mail, Save, Loader2, Camera, CheckCircle2,
  AlertCircle, ShieldCheck, Laptop, Globe
} from 'lucide-react';
import { useAuth } from '../hooks/financial/useAuth';
import { userProfileI18n } from '../i18n/user-profile';
import { commonsI18n } from '../i18n/commons';
import { toast } from 'sonner';
import { cn } from '../utils/cn';

export const UserProfilePage: React.FC = () => {
  const { 
    user, language, updateProfile, changePassword, uploadAvatar 
  } = useAuth();
  
  const t = userProfileI18n[language];
  const common = commonsI18n[language];

  // Profile Info State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      toast.error(t.validation.fullNameRequired);
      return;
    }
    
    setIsUpdatingProfile(true);
    const res = await updateProfile({ fullName, email });
    setIsUpdatingProfile(false);
    
    if (res.success) {
      toast.success(t.alerts.successProfileUpdate);
    } else {
      toast.error(t.alerts.errorProfileUpdate);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t.validation.passwordsNotMatch);
      return;
    }
    
    setIsChangingPassword(true);
    const res = await changePassword({ currentPassword, newPassword });
    setIsChangingPassword(false);
    
    if (res.success) {
      toast.success(t.alerts.successPasswordChange);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(res.error === 'FRS_INVALID_CREDENTIALS' ? t.alerts.errorCurrentPasswordWrong : t.alerts.errorPasswordChange);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t.pageTitle}</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your account settings and security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile & Password */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Info Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <User size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{t.sections.profileInfo}</h2>
              </div>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border-4 border-white shadow-xl">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User size={48} />
                      )}
                    </div>
                    <button 
                      type="button"
                      className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-white shadow-lg border border-slate-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                    >
                      <Camera size={18} />
                    </button>
                  </div>
                  <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest leading-tight">
                    {t.profileInfo.avatarHint}
                  </p>
                </div>

                <div className="flex-1 w-full space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t.profileInfo.fullName}</label>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t.profileInfo.email}</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 opacity-60">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t.profileInfo.username}</label>
                    <input 
                      type="text" 
                      value={user.username || ''}
                      disabled
                      className="w-full h-12 px-4 rounded-xl bg-slate-100 border border-slate-200 font-semibold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex items-center gap-2 px-6 h-12 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  {isUpdatingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  <span>{t.profileInfo.updateProfile}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <KeyRound size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{t.sections.changePassword}</h2>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t.changePassword.currentPassword}</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t.changePassword.newPassword}</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t.changePassword.confirmPassword}</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-6 h-12 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200 disabled:opacity-50"
                >
                  {isChangingPassword ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                  <span>{t.changePassword.changePasswordBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Security & Activity */}
        <div className="space-y-8">
          {/* Account Security Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h3 className="font-bold text-slate-900">{t.sections.accountSecurity}</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.accountSecurity.emailVerified}</p>
                  <p className="text-sm font-bold text-slate-900">{t.accountSecurity.verified}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.accountSecurity.lastLogin}</p>
                  <p className="text-sm font-bold text-slate-900">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                  <Globe size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.accountSecurity.lastLoginIp}</p>
                  <p className="text-sm font-bold text-slate-900">127.0.0.1 (Localhost)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Corporate Access Summary */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <Building2 size={18} className="text-indigo-600" />
                <h3 className="font-bold text-slate-900">{t.sections.corporateAccess}</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.corporateAccess.role}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">
                    {user.roleName || user.role}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {user.roleDescription}
                  </span>
                </div>
                
                {user.hasFullCorporateAccess && (
                  <div className="mt-4 flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Full Corporate Access Granted</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
