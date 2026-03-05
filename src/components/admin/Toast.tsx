'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-accent/10 border-accent/20 text-accent',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-sm transition-all duration-300 ${colors[type]} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      {message}
    </div>
  );
}
