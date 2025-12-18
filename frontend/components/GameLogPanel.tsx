import React, { useRef, useEffect, useMemo } from 'react';
import { GameLog } from '../types';

interface GameLogPanelProps {
  logs: GameLog[];
  maxLogs?: number;
}

const DEFAULT_MAX_LOGS = 100;

export const GameLogPanel: React.FC<GameLogPanelProps> = ({ 
  logs, 
  maxLogs = DEFAULT_MAX_LOGS 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayLogs = useMemo(() => {
    return logs.slice(0, maxLogs);
  }, [logs, maxLogs]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs.length]);

  const getLogStyles = (type: GameLog['type']): string => {
    switch (type) {
      case 'info': return 'bg-slate-800/50 text-slate-400';
      case 'combat': return 'bg-orange-900/20 text-orange-300';
      case 'gain': return 'bg-emerald-900/20 text-emerald-300';
      case 'danger': return 'bg-red-900/20 text-red-300';
      case 'tx': return 'bg-cyan-900/20 text-cyan-300';
      default: return 'bg-slate-800/50 text-slate-400';
    }
  };

  const sanitizeDigest = (message: string): string => {
    return message.replace(/[<>\"'&]/g, '');
  };

  return (
    <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-800 p-4 overflow-hidden flex flex-col min-h-[200px] sm:min-h-[280px]">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          冒險日誌
        </h3>
        {logs.length > 0 && (
          <span className="text-[10px] text-slate-600">
            {logs.length} 則記錄
          </span>
        )}
      </div>
      
      <div 
        ref={scrollRef}
        className="overflow-y-auto flex-1 space-y-2 text-sm pr-1 scroll-smooth"
      >
        {displayLogs.length === 0 ? (
          <span className="text-slate-600 text-sm">尚無記錄</span>
        ) : (
          displayLogs.map((log) => (
            <div 
              key={log.id} 
              className={`py-2 px-3 rounded-lg text-sm ${getLogStyles(log.type)}`}
            >
              <div className="flex justify-between items-center mb-1 text-[10px] opacity-60">
                <span>
                  {new Date(log.timestamp).toLocaleTimeString([], { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })}
                </span>
              </div>
              <p>{sanitizeDigest(log.message)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GameLogPanel;
