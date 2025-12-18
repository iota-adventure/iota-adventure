import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BattleResult } from '../types';
import { formatIota } from '../constants';

const ANIMATION_TIMING = {
  SHAKE_DURATION: 1200,
  DAMAGE_NUMBERS_DELAY: 1500,
  RESULT_PHASE_DELAY: 2500,
  ENCOUNTER_TO_CHARGING: 2500,
  ANIMATION_COMPLETE_DELAY: 4000,
} as const;

interface BattleAnimationProps {
  playerImage: string;
  playerName: string;
  monsterImage: string;
  monsterName: string;
  battleResult: BattleResult | null;
  isWaiting: boolean;
  onAnimationComplete?: () => void;
}

type AnimationPhase = 
  | 'idle'
  | 'encounter'
  | 'charging'
  | 'clash'
  | 'result'
  | 'complete';

export const BattleAnimation: React.FC<BattleAnimationProps> = ({
  playerImage,
  playerName,
  monsterImage,
  monsterName,
  battleResult,
  isWaiting,
  onAnimationComplete,
}) => {
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [showDamageNumbers, setShowDamageNumbers] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [showRewardDetails, setShowRewardDetails] = useState(false);
  const [resultShown, setResultShown] = useState(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay);
    timersRef.current.push(timer);
    return timer;
  }, []);

  useEffect(() => {
    if (battleResult && !resultShown) {
      setResultShown(true);
      
      setPhase('clash');
      setShakeScreen(true);
      
      safeSetTimeout(() => {
        setShakeScreen(false);
      }, ANIMATION_TIMING.SHAKE_DURATION);

      safeSetTimeout(() => {
        setShowDamageNumbers(true);
      }, ANIMATION_TIMING.DAMAGE_NUMBERS_DELAY);

      safeSetTimeout(() => {
        setPhase('result');
        setShowRewardDetails(true);
      }, ANIMATION_TIMING.RESULT_PHASE_DELAY);

      safeSetTimeout(() => {
        onAnimationComplete?.();
      }, ANIMATION_TIMING.ANIMATION_COMPLETE_DELAY);
    }
  }, [battleResult, resultShown, safeSetTimeout, onAnimationComplete]);

  useEffect(() => {
    if (isWaiting && !battleResult) {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];

      setShowDamageNumbers(false);
      setShakeScreen(false);
      setShowRewardDetails(false);
      setResultShown(false);

      if (phase === 'idle' || phase === 'result') {
        setPhase('encounter');
        
        safeSetTimeout(() => {
          setPhase('charging');
        }, ANIMATION_TIMING.ENCOUNTER_TO_CHARGING);
      }
    }
  }, [isWaiting, battleResult, phase, safeSetTimeout]);

  useEffect(() => {
    if (!isWaiting && !battleResult) {
      setPhase('idle');
      setShowDamageNumbers(false);
      setShakeScreen(false);
      setShowRewardDetails(false);
      setResultShown(false);
    }
  }, [isWaiting, battleResult]);

  const getPlayerAnimation = () => {
    switch (phase) {
      case 'encounter':
        return 'animate-slide-in-left';
      case 'charging':
        return 'animate-charge-right';
      case 'clash':
        return battleResult?.won ? 'animate-attack-right' : 'animate-hit-left';
      case 'result':
        return battleResult?.won ? 'animate-victory' : 'animate-defeated';
      default:
        return '';
    }
  };

  const getMonsterAnimation = () => {
    switch (phase) {
      case 'encounter':
        return 'animate-slide-in-right';
      case 'charging':
        return 'animate-charge-left';
      case 'clash':
        return battleResult?.won ? 'animate-hit-right' : 'animate-attack-left';
      case 'result':
        return battleResult?.won ? 'animate-defeated' : 'animate-victory';
      default:
        return '';
    }
  };

  return (
    <div className={`relative w-full h-[500px] overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 ${shakeScreen ? 'animate-shake' : ''}`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds.png')] opacity-10"></div>
      
      {(phase === 'clash' || phase === 'result') && (
        <div className={`absolute inset-0 ${battleResult?.won ? 'bg-gradient-radial from-yellow-500/20 to-transparent' : 'bg-gradient-radial from-red-500/20 to-transparent'}`}></div>
      )}
      
      {phase === 'clash' && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          <div className="absolute inset-0 bg-white animate-flash opacity-0"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="text-8xl animate-explode">💥</span>
          </div>
        </div>
      )}

      {(phase === 'encounter' || phase === 'charging') && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <span className={`text-6xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)] ${phase === 'charging' ? 'animate-pulse-fast' : 'animate-bounce-slow'}`}>
            VS
          </span>
        </div>
      )}

      <div className={`absolute left-8 top-1/2 transform -translate-y-1/2 z-10 ${getPlayerAnimation()}`}>
        <div className="relative">
          <div className={`w-32 h-32 rounded-full border-4 overflow-hidden bg-slate-900 shadow-[0_0_30px_rgba(59,130,246,0.5)] ${
            phase === 'charging' ? 'border-yellow-400 animate-glow-blue' : 'border-blue-500'
          }`}>
            <img src={playerImage} alt={playerName} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
            {playerName}
          </div>
          
          {phase === 'result' && battleResult && !battleResult.won && (
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 animate-pulse">
              <span className="text-4xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                -{battleResult.damageTaken}
              </span>
            </div>
          )}
          
          {phase === 'result' && battleResult?.won && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-bounce">
              <span className="text-4xl">🏆</span>
            </div>
          )}
        </div>
      </div>

      <div className={`absolute right-8 top-1/2 transform -translate-y-1/2 z-10 ${getMonsterAnimation()}`}>
        <div className="relative">
          <div className={`w-32 h-32 rounded-full border-4 overflow-hidden bg-slate-900 shadow-[0_0_30px_rgba(239,68,68,0.5)] ${
            phase === 'charging' ? 'border-yellow-400 animate-glow-red' : 'border-red-500'
          }`}>
            <img src={monsterImage} alt={monsterName} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-600 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap max-w-[120px] truncate">
            {monsterName}
          </div>
          
          {phase === 'result' && battleResult?.won && (
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 animate-pulse">
              <span className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
                💀 KO!
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center z-20 w-full px-4">
        {phase === 'encounter' && (
          <div className="animate-fade-in-up">
            <p className="text-2xl font-bold text-orange-400 mb-2">
              ⚔️ 遭遇野生的 {monsterName}！
            </p>
            <p className="text-sm text-slate-400">準備戰鬥...</p>
          </div>
        )}
        {phase === 'charging' && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-xl font-bold text-yellow-400 animate-pulse">
              🔥 蓄力中...等待區塊鏈確認
            </p>
            <div className="flex gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-4 h-4 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-4 h-4 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-xs text-slate-500">鏈上隨機數決定勝負...</p>
          </div>
        )}
        {phase === 'clash' && (
          <div className="text-3xl font-black text-white animate-pulse">
            揍他！
          </div>
        )}
        {phase === 'result' && battleResult && (
          <div className={`animate-scale-in ${battleResult.won ? 'text-yellow-400' : 'text-red-400'}`}>
            {battleResult.won ? (
              <div className="flex flex-col items-center gap-3 bg-black/50 rounded-xl p-4 backdrop-blur-sm">
                <span className="text-4xl font-black animate-bounce">🎉 勝利！</span>
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                  <div className="bg-green-900/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-300">獲得獎勵</p>
                    <p className="text-2xl font-bold text-green-400">+{formatIota(battleResult.reward)}</p>
                    <p className="text-xs text-green-300">IOTA</p>
                  </div>
                  <div className="bg-cyan-900/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-cyan-300">經驗值</p>
                    <p className="text-2xl font-bold text-cyan-400">+{battleResult.xpGained}</p>
                    <p className="text-xs text-cyan-300">XP</p>
                  </div>
                </div>
                {showRewardDetails && battleResult.leveledUp && (
                  <div className="animate-bounce text-xl text-purple-400 font-bold">
                    ⬆️ 等級提升！Lv.{battleResult.newLevel}
                  </div>
                )}
                {showRewardDetails && (
                  <p className="text-sm text-slate-400 animate-fade-in">
                    受到 {battleResult.damageTaken} 點傷害
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 bg-black/50 rounded-xl p-4 backdrop-blur-sm">
                <span className="text-4xl font-black">💀 戰敗...</span>
                <div className="bg-red-900/50 rounded-lg p-4 text-center w-full max-w-xs">
                  <p className="text-xs text-red-300">受到傷害</p>
                  <p className="text-3xl font-bold text-red-400">-{battleResult.damageTaken}</p>
                  <p className="text-xs text-red-300">HP</p>
                </div>
                {showRewardDetails && (
                  <p className="text-sm text-slate-400 animate-fade-in">
                    剩餘 HP: {battleResult.heroHpAfter}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {phase === 'charging' && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-charge-bar"></div>
          </div>
          <p className="text-xs text-center mt-1 text-slate-400">等待鏈上隨機數...</p>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-200px) translateY(-50%); opacity: 0; }
          to { transform: translateX(0) translateY(-50%); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(200px) translateY(-50%); opacity: 0; }
          to { transform: translateX(0) translateY(-50%); opacity: 1; }
        }
        @keyframes chargeRight {
          0%, 100% { transform: translateX(0) translateY(-50%); }
          50% { transform: translateX(15px) translateY(-50%); }
        }
        @keyframes chargeLeft {
          0%, 100% { transform: translateX(0) translateY(-50%); }
          50% { transform: translateX(-15px) translateY(-50%); }
        }
        @keyframes attackRight {
          0% { transform: translateX(0) translateY(-50%); }
          40% { transform: translateX(120px) translateY(-50%) scale(1.2); }
          100% { transform: translateX(0) translateY(-50%); }
        }
        @keyframes attackLeft {
          0% { transform: translateX(0) translateY(-50%); }
          40% { transform: translateX(-120px) translateY(-50%) scale(1.2); }
          100% { transform: translateX(0) translateY(-50%); }
        }
        @keyframes hitLeft {
          0% { transform: translateX(0) translateY(-50%); filter: brightness(1); }
          20% { transform: translateX(-40px) translateY(-50%); filter: brightness(2); }
          100% { transform: translateX(0) translateY(-50%); filter: brightness(1); }
        }
        @keyframes hitRight {
          0% { transform: translateX(0) translateY(-50%); filter: brightness(1); }
          20% { transform: translateX(40px) translateY(-50%); filter: brightness(2); }
          100% { transform: translateX(0) translateY(-50%); filter: brightness(1); }
        }
        @keyframes victory {
          0%, 100% { transform: translateY(-50%) scale(1); }
          50% { transform: translateY(-60%) scale(1.15); }
        }
        @keyframes defeated {
          0% { transform: translateY(-50%) rotate(0deg); opacity: 1; filter: grayscale(0%); }
          100% { transform: translateY(-30%) rotate(20deg); opacity: 0.4; filter: grayscale(100%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.9; }
        }
        @keyframes explode {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          50% { transform: scale(2.5) rotate(180deg); opacity: 1; }
          100% { transform: scale(4) rotate(360deg); opacity: 0; }
        }
        @keyframes floatUp {
          0% { transform: translateX(-50%) translateY(0); opacity: 1; }
          50% { transform: translateX(-50%) translateY(-30px); opacity: 1; }
          100% { transform: translateX(-50%) translateY(-80px); opacity: 0; }
        }
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes chargeBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes glowBlue {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 50px rgba(59, 130, 246, 0.9), 0 0 80px rgba(59, 130, 246, 0.5); }
        }
        @keyframes glowRed {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 50px rgba(239, 68, 68, 0.9), 0 0 80px rgba(239, 68, 68, 0.5); }
        }
        @keyframes pulseFast {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        @keyframes bounceSlow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -65%) scale(1.15); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-slide-in-left { animation: slideInLeft 1s ease-out forwards; }
        .animate-slide-in-right { animation: slideInRight 1s ease-out forwards; }
        .animate-charge-right { animation: chargeRight 0.5s ease-in-out infinite; }
        .animate-charge-left { animation: chargeLeft 0.5s ease-in-out infinite; }
        .animate-attack-right { animation: attackRight 1s ease-out forwards; }
        .animate-attack-left { animation: attackLeft 1s ease-out forwards; }
        .animate-hit-left { animation: hitLeft 0.8s ease-out forwards; }
        .animate-hit-right { animation: hitRight 0.8s ease-out forwards; }
        .animate-victory { animation: victory 1s ease-in-out infinite; }
        .animate-defeated { animation: defeated 2s ease-out forwards; }
        .animate-shake { animation: shake 1.2s ease-in-out; }
        .animate-flash { animation: flash 0.5s ease-out; }
        .animate-explode { animation: explode 1.5s ease-out forwards; }
        .animate-float-up { animation: floatUp 3s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 1s ease-out forwards; }
        .animate-charge-bar { animation: chargeBar 5s ease-in-out infinite; }
        .animate-glow-blue { animation: glowBlue 1s ease-in-out infinite; }
        .animate-glow-red { animation: glowRed 1s ease-in-out infinite; }
        .animate-pulse-fast { animation: pulseFast 0.5s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounceSlow 1.5s ease-in-out infinite; }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default BattleAnimation;
