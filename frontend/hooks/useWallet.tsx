import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { 
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useIotaClient,
} from '@iota/dapp-kit';
import { IotaTransactionBlockResponse } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';
import { Hero, Player, PlayerTier, NetworkStatus } from '../types';
import { 
  getHeroes, 
  getBalance, 
  calculatePlayerTier, 
  getPlayerVisual,
  getGameBankInfo,
} from '../services/gameService';
import { PLAYER_VISUALS, nanoToIota, DEFAULT_HEAL_COST } from '../constants';

interface WalletContextType {
  isConnected: boolean;
  isLoading: boolean;
  address: string | null;
  
  player: Player | null;
  hero: Hero | null;
  balance: number;
  healCost: number;
  networkStatus: NetworkStatus;
  
  refreshPlayer: () => Promise<void>;
  signAndExecute: (tx: Transaction) => Promise<IotaTransactionBlockResponse>;
  setHero: (hero: Hero | null) => void;
  
  error: string | null;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const account = useCurrentAccount();
  const client = useIotaClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [isLoading, setIsLoading] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [hero, setHero] = useState<Hero | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [healCost, setHealCost] = useState<number>(DEFAULT_HEAL_COST);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'slow'>('connected');

  const isConnected = !!account;
  const address = account?.address || null;

  const refreshPlayer = useCallback(async () => {
    if (!address) {
      setPlayer(null);
      setHero(null);
      setBalance(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      const [balanceResult, heroes, bankInfo] = await Promise.all([
        getBalance(address),
        getHeroes(address),
        getGameBankInfo().catch((err) => {
          console.warn('Failed to fetch GameBank info, using defaults:', err.message);
          return { healCost: DEFAULT_HEAL_COST };
        }),
      ]);

      const latency = Date.now() - startTime;
      if (latency > 5000) {
        setNetworkStatus('slow');
      } else {
        setNetworkStatus('connected');
      }

      setBalance(balanceResult);
      setHealCost(bankInfo.healCost);

      const currentHero = heroes.length > 0 ? heroes[0] : null;
      setHero(currentHero);

      const tier = currentHero ? calculatePlayerTier(currentHero.level) : PlayerTier.BRONZE;
      
      setPlayer({
        address,
        hero: currentHero,
        balance: balanceResult,
        tier,
        imageUrl: getPlayerVisual(tier),
      });

    } catch (err: unknown) {
      console.error('Failed to refresh player:', err);
      setError(err instanceof Error ? err.message : '無法取得玩家資料');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const signAndExecute = useCallback(async (tx: Transaction): Promise<IotaTransactionBlockResponse> => {
    if (!account) {
      throw new Error('請先連接錢包');
    }

    try {
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      const response = await client.waitForTransaction({
        digest: result.digest,
        options: {
          showEvents: true,
          showEffects: true,
        },
      });

      return response;
    } catch (err: unknown) {
      console.error('Transaction failed:', err);
      throw err;
    }
  }, [account, signAndExecuteTransaction, client]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (address) {
      refreshPlayer();
    } else {
      setPlayer(null);
      setHero(null);
      setBalance(0);
    }
  }, [address, refreshPlayer]);

  const value: WalletContextType = {
    isConnected,
    isLoading,
    address,
    player,
    hero,
    balance,
    healCost,
    networkStatus,
    refreshPlayer,
    signAndExecute,
    setHero,
    error,
    clearError,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletConnectButtonProps {
  className?: string;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ className }) => {
  return (
    <ConnectButton 
      className={className}
      connectText="🔮 連接錢包"
    />
  );
};

export const useGameActions = () => {
  const { signAndExecute, refreshPlayer, hero, healCost, balance } = useWallet();
  const [isPending, setIsPending] = useState(false);

  const executeWithRefresh = useCallback(async (
    tx: Transaction,
    onSuccess?: (result: IotaTransactionBlockResponse) => void,
    onError?: (error: Error) => void,
  ) => {
    setIsPending(true);
    try {
      const result = await signAndExecute(tx);
      await refreshPlayer();
      onSuccess?.(result);
      return result;
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [signAndExecute, refreshPlayer]);

  return {
    executeWithRefresh,
    isPending,
    hero,
    healCost,
    balance,
  };
};
