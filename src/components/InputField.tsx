import React from 'react';
import { Info } from 'lucide-react';

interface InputFieldProps {
  label: string;
  id: string;
  value: number;
  onChange: (val: number) => void;
  type?: string;
  step?: string;
  suffix?: string;
  hint?: string;
  action?: React.ReactNode;
}

export const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  id, 
  value, 
  onChange, 
  type = "number", 
  step = "0.1",
  suffix,
  hint,
  action
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {action}
        {hint && (
          <div className="group relative">
            <Info size={14} className="cursor-help text-zinc-400 transition-colors hover:text-zinc-600" />
            <div className="absolute bottom-full right-0 mb-2 hidden w-48 rounded-lg bg-zinc-900 p-2 text-[10px] leading-relaxed text-white shadow-xl group-hover:block z-50">
              {hint}
            </div>
          </div>
        )}
      </div>
    </div>
    <div className="relative">
      <input
        id={id}
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 uppercase">
          {suffix}
        </span>
      )}
    </div>
  </div>
);
