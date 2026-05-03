import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, CheckCheck, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { useNotifications } from '../../../hooks/financial/useNotifications';
import { useAuth } from '../../../hooks/financial/useAuth';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { alertsI18n } from '../../../i18n/alerts';
import { ratiosI18n } from '../../../i18n/ratios';
import { bankLoanI18n } from '../../../i18n/bank-loan';
import { thresholdI18n } from '../../../i18n/thresholds';
import { renderNotificationMessage } from '../../../utils/notification';
import { cn } from '../../../utils/cn';

interface NotificationPopoverProps {
  onNavigate: (page: string) => void;
  unreadCount: number;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  onNavigate,
  unreadCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { token, user, language } = useAuth();
  const { corporates } = useCorporates();
  const t = alertsI18n[language];
  const tLoan = bankLoanI18n[language];
  const popoverRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    isLoading,
    markAsRead,
  } = useNotifications({
    status: 'unread',
    enabled: isOpen && Boolean(user),
    token
  });

  const subsidiaryMap = useMemo(
    () => Object.fromEntries(corporates.map((c) => [c.id, c.name])),
    [corporates],
  );

  const renderMessage = (notification: any) => renderNotificationMessage(notification, language);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const SEVERITY_DOT: Record<'high' | 'medium' | 'low', string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-blue-500',
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-xl transition-all active:scale-95 cursor-pointer",
          isOpen ? "bg-slate-100 text-indigo-600" : "text-slate-500 hover:bg-slate-100"
        )}
      >
        <Bell className={cn("w-5 h-5", isOpen && "fill-indigo-50")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">{t.loadingNotifications}</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">{t.empty}</p>
                  <p className="text-xs text-slate-400 mt-1">{t.allCaughtUp}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.slice(0, 5).map((notification) => {
                    const payload = notification.payload ?? {};
                    const corporateId = String(payload.corporateId ?? '');
                    const ratioName = String(payload.ratioName ?? payload.ratio ?? '');
                    const message = renderMessage(notification);

                    // Determine label
                    let categoryLabel = notification.category;
                    if (notification.category === 'loan-installment-due' || notification.sourceEntityType === 'bank_loan_installment') {
                      categoryLabel = tLoan.installment.sectionTitle;
                    } else if (ratioName && ratiosI18n[language][ratioName as keyof typeof ratiosI18n['id']]) {
                      categoryLabel = ratiosI18n[language][ratioName as keyof typeof ratiosI18n['id']]?.label;
                    }

                    return (
                      <div
                        key={notification.id}
                        className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                        onClick={() => {
                          markAsRead(notification.id);
                        }}
                      >
                        <div className="flex gap-3">
                          <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", SEVERITY_DOT[notification.severity])} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {(subsidiaryMap[corporateId] ?? corporateId) || 'System'}
                              </span>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {format(new Date(notification.createdAt), 'HH:mm')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {message}
                            </p>
                            <p className="text-[10px] text-indigo-500 font-medium mt-1">
                              {categoryLabel}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => {
                  onNavigate('alerts');
                  setIsOpen(false);
                }}
                className="w-full py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.viewAll}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
