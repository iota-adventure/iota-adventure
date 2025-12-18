import React, { useMemo, useCallback } from 'react';
import { MonsterTier, GameState } from '../types';
import { ENTRY_FEES, NANO_PER_IOTA, BASE_WIN_RATES } from '../constants';
import { calculateWinRate } from '../services/gameService';

interface TierSelectorProps {
  selectedTier: MonsterTier;
  onSelectTier: (tier: MonsterTier) => void;
  heroLevel: number;
  disabled: boolean;
}

interface TierOption {
  tier: MonsterTier;
  label: string;
  fee: number;
  winRate: number;
}

export const TierSelector: React.FC<TierSelectorProps> = ({
  selectedTier,
  onSelectTier,
  heroLevel,
  disabled,
}) => {
  const tiers = useMemo<TierOption[]>(() => [
    { 
      tier: MonsterTier.TIER_1, 
      label: '🟢 簡單', 
      fee: ENTRY_FEES[MonsterTier.TIER_1] / NANO_PER_IOTA, 
      winRate: calculateWinRate(MonsterTier.TIER_1, heroLevel) 
    },
    { 
      tier: MonsterTier.TIER_2, 
      label: '🔵 普通', 
      fee: ENTRY_FEES[MonsterTier.TIER_2] / NANO_PER_IOTA, 
      winRate: calculateWinRate(MonsterTier.TIER_2, heroLevel) 
    },
    { 
      tier: MonsterTier.TIER_3, 
      label: '🟠 困難', 
      fee: ENTRY_FEES[MonsterTier.TIER_3] / NANO_PER_IOTA, 
      winRate: calculateWinRate(MonsterTier.TIER_3, heroLevel) 
    },
    { 
      tier: MonsterTier.TIER_4, 
      label: '🔴 地獄', 
      fee: ENTRY_FEES[MonsterTier.TIER_4] / NANO_PER_IOTA, 
      winRate: calculateWinRate(MonsterTier.TIER_4, heroLevel) 
    },
  ], [heroLevel]);

  const handleSelect = useCallback((tier: MonsterTier) => {
    if (!disabled) {
      onSelectTier(tier);
    }
  }, [disabled, onSelectTier]);

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {tiers.map(({ tier, label, fee, winRate }) => (
        <button
          key={tier}
          onClick={() => handleSelect(tier)}
          disabled={disabled}
          className={`p-3 rounded-lg border-2 transition-all text-sm ${
            selectedTier === tier
              ? 'border-iota-accent bg-iota-accent/20'
              : 'border-slate-600 hover:border-slate-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="font-bold">{label}</div>
          <div className="text-xs text-slate-400">
            {fee} IOTA | 
            <span className="ml-1" title="預估勝率，實際結果由鏈上隨機數決定">
              ~{winRate}%
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default TierSelector;
