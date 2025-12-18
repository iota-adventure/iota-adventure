import React from 'react';
import { ConnectButton } from '@iota/dapp-kit';
import { formatIota } from '../constants';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { NetworkStatus } from '../types';

interface HeaderProps {
  isConnected: boolean;
  address?: string | null;
  balance: number;
  networkStatus: NetworkStatus;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  address,
  balance,
  networkStatus,
}) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-semibold text-base sm:text-lg">IOTA Adventure</span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 hidden sm:inline">
            Testnet
          </span>
          <NetworkStatusIndicator status={networkStatus} />
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {isConnected && (
            <div className="flex items-center gap-2 sm:gap-3 text-sm">
              <span className="text-slate-500 hidden md:inline font-mono text-xs">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <span className="font-medium text-iota-accent text-xs sm:text-sm">
                {formatIota(balance)} IOTA
              </span>
            </div>
          )}
          <div className="[&_button]:!py-1.5 [&_button]:!px-3 [&_button]:!text-sm [&_button]:!h-auto [&_button]:!min-h-0 [&_img]:!w-5 [&_img]:!h-5">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
