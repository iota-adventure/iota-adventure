import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Player, PlayerTier, Hero, BattleResult } from '../types';
import { PLAYER_VISUALS, formatIota } from '../constants';

interface HeroCardProps {
  player: Player;
  hero?: Hero | null;
  battleResult?: BattleResult | null;
  showBattleResult?: boolean;
}

export const HeroCard: React.FC<HeroCardProps> = ({ 
  player, 
  hero, 
  battleResult,
  showBattleResult = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [displayHp, setDisplayHp] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  
  const heroData = hero ?? player.hero;

  const level = heroData?.level ?? 1;
  const actualHp = heroData?.hp ?? 0;
  const maxHp = heroData?.maxHp ?? 100;
  const xp = heroData?.xp ?? 0;

  const hpBeforeBattle = battleResult ? actualHp + battleResult.damageTaken : actualHp;

  useEffect(() => {
    if (displayHp === null) {
      setDisplayHp(actualHp);
    }
  }, [actualHp, displayHp]);

  useEffect(() => {
    if (showBattleResult && battleResult && battleResult.damageTaken > 0) {
      setDisplayHp(hpBeforeBattle);
      setIsAnimating(true);

      animationRef.current = setTimeout(() => {
        setDisplayHp(actualHp);

        setTimeout(() => {
          setIsAnimating(false);
        }, 1000);
      }, 500);
      
      return () => {
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
      };
    } else if (!showBattleResult && !isAnimating) {
      setDisplayHp(actualHp);
    }
  }, [showBattleResult, battleResult, actualHp, hpBeforeBattle, isAnimating]);

  const hp = displayHp ?? actualHp;
  
  const visual = PLAYER_VISUALS[player.tier];

  const hpPercent = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  let hpColor = 'bg-emerald-500';
  if (hpPercent < 30) hpColor = 'bg-red-500';
  else if (hpPercent < 60) hpColor = 'bg-amber-500';

  const nextLevelXp = level * 100;
  const xpPercent = nextLevelXp > 0 ? (xp / nextLevelXp) * 100 : 0;

  const handleCopyId = useCallback(async () => {
    if (!heroData?.id) return;
    
    try {
      await navigator.clipboard.writeText(heroData.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  }, [heroData?.id]);

  return (
    <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
        <img 
          key={player.tier}
          src={visual.img} 
          alt={visual.title}
          loading="eager"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-4 pt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">{visual.title}</h2>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-iota-accent">
              Lv.{level}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>HP</span>
            <span className={isAnimating ? 'text-red-400 font-bold' : ''}>
              {Math.round(hp)} / {maxHp}
              {isAnimating && battleResult && (
                <span className="ml-1 text-red-500 animate-pulse">
                  -{battleResult.damageTaken}
                </span>
              )}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
            <div 
              className={`h-full ${hpColor} ${isAnimating ? 'transition-all duration-1000 ease-out' : 'transition-all duration-300'}`} 
              style={{ width: `${Math.max(0, hpPercent)}%` }}
            />
            {isAnimating && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>EXP</span>
            <span>{xp} / {nextLevelXp}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300" 
              style={{ width: `${Math.max(0, xpPercent)}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-500">餘額</span>
          <span className="text-sm font-medium text-iota-accent">{formatIota(player.balance)} IOTA</span>
        </div>
        
        {heroData && (
          <button
            onClick={handleCopyId}
            className="w-full text-xs text-slate-500 hover:text-slate-300 text-center truncate py-1.5 px-2 rounded hover:bg-slate-800 transition-colors cursor-pointer group"
            title="點擊複製完整 ID"
          >
            <span className="font-mono">
              {heroData.id.slice(0, 8)}...{heroData.id.slice(-6)}
            </span>
            <span className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {copied ? '✓ 已複製' : '📋'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
