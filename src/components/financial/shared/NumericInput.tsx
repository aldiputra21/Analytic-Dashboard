import React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { cn } from '../../../utils/cn';

interface NumericInputProps extends Omit<NumericFormatProps, 'customInput'> {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
  required?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  label,
  error,
  className,
  containerClassName,
  required,
  ...props
}) => {
  return (
    <div className={cn(label || error ? 'space-y-1.5' : '', containerClassName)}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative group/input">
        <NumericFormat
          thousandSeparator="."
          decimalSeparator=","
          className={cn(
            'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-black tabular-nums',
            error ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'hover:border-slate-300',
            props.disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-100' : 'text-slate-800',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-500 mt-1 ml-1 uppercase tracking-wider">
          {error}
        </p>
      )}
    </div>
  );
};
