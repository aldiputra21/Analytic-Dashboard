import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { Button } from "./button";

interface AlertDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  open?: boolean;        // Alias for isOpen
  onOpenChange?: (open: boolean) => void; // Alias for onClose
  children: React.ReactNode;
}

const AlertDialogContext = React.createContext<{ close: () => void } | null>(null);

const AlertDialog = ({ isOpen, onClose, open, onOpenChange, children }: AlertDialogProps) => {
  const active = open ?? isOpen;
  const close = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  return (
    <AlertDialogContext.Provider value={{ close }}>
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 border border-slate-200"
            >
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertDialogContext.Provider>
  );
};

const AlertDialogContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("space-y-4", className)}>{children}</div>
);

const AlertDialogHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("space-y-2 text-center sm:text-left", className)}>{children}</div>
);

const AlertDialogTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <h2 className={cn("text-xl font-black text-slate-800 tracking-tight", className)}>{children}</h2>
);

const AlertDialogDescription = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <p className={cn("text-sm font-medium text-slate-500 leading-relaxed", className)}>{children}</p>
);

const AlertDialogFooter = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-3 mt-8", className)}>
    {children}
  </div>
);

const AlertDialogAction = ({ children, className, variant = "destructive", onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" }) => {
  const context = React.useContext(AlertDialogContext);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(e);
    // Note: We don't auto-close on Action because it usually involves an async operation
    // that should close the dialog only upon success.
  };

  return (
    <Button 
      variant={variant} 
      className={cn("w-full sm:w-auto px-6 py-3 rounded-2xl cursor-pointer", className)} 
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
};

const AlertDialogCancel = ({ children, className, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const context = React.useContext(AlertDialogContext);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(e);
    context?.close();
  };

  return (
    <Button 
      variant="outline" 
      className={cn("w-full sm:w-auto px-6 py-3 rounded-2xl border-2 border-slate-100 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer", className)} 
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
};

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
};
