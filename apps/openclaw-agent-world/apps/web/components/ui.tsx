import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export const Panel = ({ children, title, className = "", onClick }: { children: React.ReactNode, title?: string, className?: string, onClick?: () => void }) => (
  <div 
    className={`industrial-border bg-zinc-900/50 p-4 ${className}`}
    onClick={onClick}
  >
    {title && (
      <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
        <div className="w-2 h-2 bg-amber-500" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500/80">{title}</h2>
      </div>
    )}
    {children}
  </div>
);

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = "",
  disabled = false
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'outline', 
  className?: string,
  disabled?: boolean
}) => {
  const variants = {
    primary: "bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed",
    outline: "border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 text-xs uppercase tracking-widest transition-all active:scale-95 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Badge = ({ children, color = 'amber', className = "" }: { children: React.ReactNode, color?: 'amber' | 'red' | 'green' | 'blue', className?: string }) => {
  const colors = {
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
    green: "bg-green-500/10 text-green-500 border-green-500/20",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  return (
    <span className={`px-2 py-0.5 text-[10px] border uppercase font-bold ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};

export const Stat = ({ label, value, unit }: { label: string, value: string | number, unit?: string }) => (
  <div className="flex flex-col">
    <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-tighter">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-bold text-zinc-100 tabular-nums">{value}</span>
      {unit && <span className="text-[10px] text-zinc-500 uppercase">{unit}</span>}
    </div>
  </div>
);

export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl industrial-border bg-zinc-900 p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500">{title}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};