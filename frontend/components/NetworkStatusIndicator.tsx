import React from 'react';
import { NetworkStatus } from '../types';

interface NetworkStatusIndicatorProps {
  status: NetworkStatus;
  className?: string;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ 
  status,
  className = ''
}) => {
  if (status === 'connected') {
    return null;
  }

  const statusConfig = {
    disconnected: {
      color: 'bg-red-500',
      text: '網路離線',
      icon: '🔴',
    },
    slow: {
      color: 'bg-amber-500',
      text: '網路較慢',
      icon: '🟡',
    },
  };

  const config = statusConfig[status];

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
      <span className="text-slate-400">{config.text}</span>
    </div>
  );
};

export default NetworkStatusIndicator;
