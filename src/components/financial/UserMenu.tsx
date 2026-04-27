import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown, Shield, Building2 } from 'lucide-react';
import { useAuth } from '../../hooks/financial/useAuth';
import { userMenuI18n } from '../../i18n/user-menu';
import { commonsI18n } from '../../i18n/commons';
import { cn } from '../../utils/cn';

export const UserMenu: React.FC<{ onNavigate: (page: any) => void }> = ({ onNavigate }) => {
  const { user, logout, language } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const t = userMenuI18n[language];
  const common = commonsI18n[language];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const userRoleLabel = user.roleDescription || (user.role === 'owner' ? 'Owner' : user.role === 'bod' ? 'Board of Directors' : 'Subsidiary Manager');

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 active:scale-95"
      >
        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-indigo-200">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="hidden md:flex flex-col items-start leading-none">
          <span className="text-xs font-bold text-slate-900">{user.fullName}</span>
          <span className="text-[10px] font-medium text-slate-500">{userRoleLabel}</span>
        </div>
        <ChevronDown size={14} className={cn('text-slate-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
          <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <div className="px-2 space-y-0.5">
            <button
              onClick={() => { onNavigate('profile'); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <User size={18} />
              </div>
              {t.profile}
            </button>
            
            <div className="py-1">
              <div className="h-px bg-slate-100 mx-3" />
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100/50 flex items-center justify-center text-red-600">
                <LogOut size={18} />
              </div>
              {common.logout || 'Logout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
