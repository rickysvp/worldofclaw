import React, { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Panel({ children, title, className = '' }: PanelProps) {
  return (
    <div className={`industrial-border bg-zinc-900/50 p-4 ${className}`}>
      {title && (
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
          <div className="w-2 h-2 bg-amber-500"></div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500/80">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({ children, variant = 'primary', className = '', onClick, disabled = false }: ButtonProps) {
  const baseClasses = 'px-4 py-2 text-xs uppercase tracking-widest transition-all active:scale-95';
  
  const variantClasses = {
    primary: 'bg-amber-500 text-black hover:bg-amber-400',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
    outline: 'bg-transparent border border-zinc-700 text-zinc-100 hover:bg-zinc-800/50',
  }[variant];
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: 'amber' | 'red' | 'green' | 'blue';
  className?: string;
}

export function Badge({ children, color = 'amber', className = '' }: BadgeProps) {
  const colorClasses = {
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  }[color];
  
  return (
    <span className={`px-2 py-0.5 text-[10px] border uppercase font-bold ${colorClasses} ${className}`}>
      {children}
    </span>
  );
}

interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
}

export function Stat({ label, value, unit, className = '' }: StatProps) {
  return (
    <div className={`text-center ${className}`}>
      <div className="text-2xl font-bold text-zinc-100 mb-1">
        {value}{unit ? ` ${unit}` : ''}
      </div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500">{title}</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}