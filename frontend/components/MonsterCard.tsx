import React from 'react';
import { Monster, MonsterTier } from '../types';
import { ENTRY_FEES, nanoToIota } from '../constants';

interface MonsterCardProps {
  monster: Monster;
  isRevealed?: boolean;
}

export const MonsterCard: React.FC<MonsterCardProps> = ({ monster, isRevealed = true }) => {
  if (!monster) return null;

  const getBorderColor = (tier: MonsterTier) => {
    switch (tier) {
      case MonsterTier.TIER_4: return 'border-red-600 shadow-red-900/50';
      case MonsterTier.TIER_3: return 'border-purple-600 shadow-purple-900/50';
      case MonsterTier.TIER_2: return 'border-yellow-600 shadow-yellow-900/50';
      default: return 'border-green-600 shadow-green-900/50';
    }
  };

  const getTierBadge = (tier: MonsterTier) => {
    const fee = nanoToIota(ENTRY_FEES[tier]);
    switch (tier) {
      case MonsterTier.TIER_4: return <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">BOSS ({fee} IOTA)</span>;
      case MonsterTier.TIER_3: return <span className="bg-purple-600 text-white px-2 py-0.5 rounded text-xs font-bold">ELITE ({fee} IOTA)</span>;
      case MonsterTier.TIER_2: return <span className="bg-yellow-600 text-black px-2 py-0.5 rounded text-xs font-bold">VETERAN ({fee} IOTA)</span>;
      default: return <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs font-bold">NOVICE ({fee} IOTA)</span>;
    }
  };

  return (
    <div className={`w-full max-w-sm bg-slate-800 border-2 rounded-xl overflow-hidden shadow-xl transition-all duration-500 ${isRevealed ? getBorderColor(monster.tier) : 'border-slate-700'}`}>
      <div className="relative aspect-square bg-black group">
        {isRevealed ? (
          <>
            <img 
              src={monster.imageUrl} 
              alt={monster.name}
              className="w-full h-full object-cover"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900">
            <span className="text-6xl animate-bounce">❓</span>
          </div>
        )}
        
        {isRevealed && (
          <div className="absolute top-2 right-2">
            {getTierBadge(monster.tier)}
          </div>
        )}
      </div>

      <div className="p-4 text-center">
        {isRevealed ? (
          <>
            <h3 className="text-2xl font-black text-white mb-1 drop-shadow-md">{monster.name}</h3>
            <p className="text-sm text-slate-300 my-2 px-1 leading-relaxed italic border-b border-slate-700/50 pb-2">
              {monster.description}
            </p>
            <div className="flex justify-center gap-4 text-xs text-slate-400 mt-2">
               <span>賞金: <b className="text-iota-gold">{monster.baseReward}~{monster.baseReward + 5}</b> IOTA</span>
               <span>ID: #{monster.id}</span>
            </div>
          </>
        ) : (
          <h3 className="text-xl font-bold text-slate-500">正在搜索敵人...</h3>
        )}
      </div>
    </div>
  );
};