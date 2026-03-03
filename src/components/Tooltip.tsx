import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

interface InfoTooltipProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showIcon?: boolean;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
  title, 
  description, 
  children,
  position = 'top',
  showIcon = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipWidth = 256; // w-64 = 16rem = 256px
      const tooltipHeight = 100; // approximate height
      
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - tooltipHeight - 8;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - 8;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + 8;
          break;
      }

      // Keep tooltip within viewport
      const padding = 8;
      if (left < padding) left = padding;
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding;
      }
      if (top < padding) top = padding;

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  return (
    <>
      <div 
        ref={triggerRef}
        className="relative inline-flex items-center"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children || (
          showIcon && (
            <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 cursor-help transition-colors" />
          )
        )}
      </div>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[99999] w-64 p-3 bg-slate-900 text-white rounded-lg shadow-2xl pointer-events-none"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
          >
            <div className="text-xs font-bold mb-1">{title}</div>
            <div className="text-[10px] text-slate-300 leading-relaxed">{description}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Helper component for labels with tooltips
export const LabelWithTooltip: React.FC<{
  label: string;
  tooltip: { title: string; description: string };
  className?: string;
}> = ({ label, tooltip, className }) => (
  <div className={clsx("flex items-center gap-1.5", className)}>
    <span>{label}</span>
    <InfoTooltip title={tooltip.title} description={tooltip.description} />
  </div>
);
