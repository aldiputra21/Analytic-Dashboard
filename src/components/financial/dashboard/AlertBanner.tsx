import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotifications, NotificationItem } from '../../../hooks/financial/useNotifications';
import { useAuth } from '../../../hooks/financial/useAuth';
import { dashboardI18n } from '../../../i18n/dashboard';
import { renderNotificationMessage } from '../../../utils/notification';
import { cn } from '../../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertBannerProps {
  corporateId?: string;
  className?: string;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ corporateId, className }) => {
  const { language, user, token } = useAuth();
  const { notifications, archive } = useNotifications({
    status: 'unread',
    token: token
  });

  const t = dashboardI18n[language];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter only dashboard alerts for the current company
  const alerts = notifications.filter(n => 
    n.sourceEntityType === 'dashboard-alert' && 
    (!corporateId || n.payload.corporateId === corporateId)
  );

  useEffect(() => {
    if (alerts.length > 0 && currentIndex >= alerts.length) {
      setCurrentIndex(0);
    }
  }, [alerts.length, currentIndex]);

  // Auto-rotate if multiple alerts
  useEffect(() => {
    if (alerts.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % alerts.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [alerts.length]);

  if (alerts.length === 0) return null;

  const currentAlert = alerts[currentIndex];
  const isHigh = currentAlert.severity === 'high';

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await archive(id);
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const next = () => setCurrentIndex(prev => (prev + 1) % alerts.length);
  const prev = () => setCurrentIndex(prev => (prev - 1 + alerts.length) % alerts.length);

  const message = renderNotificationMessage(currentAlert, language);

  return (
    <div className={cn("relative w-full mb-6 overflow-hidden", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAlert.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={cn(
            "relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 shadow-lg backdrop-blur-md",
            isHigh 
              ? "bg-rose-50/80 border-rose-200 text-rose-900" 
              : "bg-amber-50/80 border-amber-200 text-amber-900"
          )}
        >
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-inner",
            isHigh ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
          )}>
            {isHigh ? <AlertCircle className="w-6 h-6 animate-pulse" /> : <AlertTriangle className="w-6 h-6" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                isHigh ? "bg-rose-200/50 text-rose-700" : "bg-amber-200/50 text-amber-700"
              )}>
                {isHigh ? (language === 'id' ? 'KRITIS' : 'CRITICAL') : (language === 'id' ? 'PERINGATAN' : 'WARNING')}
              </span>
              <span className="text-xs opacity-60 font-medium">
                {currentAlert.createdAt ? new Date(currentAlert.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              </span>
            </div>
            <p className="text-sm font-bold truncate">
              {message}
            </p>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-3 pl-4 border-l border-current/10">
            {alerts.length > 1 && (
              <div className="flex items-center gap-1 mr-2">
                <button onClick={prev} className="p-1 hover:bg-current/5 rounded-lg transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono font-bold w-8 text-center">
                  {currentIndex + 1}/{alerts.length}
                </span>
                <button onClick={next} className="p-1 hover:bg-current/5 rounded-lg transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <button
              onClick={(e) => handleDismiss(e, currentAlert.id)}
              className="p-2 hover:bg-current/10 rounded-xl transition-colors group"
              title={language === 'id' ? 'Abaikan' : 'Dismiss'}
            >
              <X className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Progress Bar (if rotating) */}
          {alerts.length > 1 && (
            <div className="absolute bottom-0 left-0 h-1 bg-current/5 w-full">
              <motion.div 
                key={`progress-${currentIndex}`}
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 8, ease: "linear" }}
                className="h-full bg-current/20"
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AlertBanner;
