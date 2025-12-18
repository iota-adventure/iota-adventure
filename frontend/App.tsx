import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ConnectButton, useCurrentAccount } from '@iota/dapp-kit';
import { 
  GameState, 
  Monster, 
  MonsterTier,
  GameLog, 
  BattleResult,
  HealResult,
} from './types';
import { 
  buildCreateHeroTx,
  buildFightMonsterTx,
  buildHealHeroTx,
  parseBattleEvent,
  parseHealEvent,
  parseHeroCreatedEvent,
  getMonsterForBattle,
} from './services/gameService';
import { useWallet, useGameActions } from './hooks/useWallet';
import { HeroCard } from './components/HeroCard';
import { BattleAnimation } from './components/BattleAnimation';
import { TierSelector } from './components/TierSelector';
import { GameLogPanel } from './components/GameLogPanel';
import { Header } from './components/Header';
import { HeroCardSkeleton, BattleAreaSkeleton } from './components/Skeleton';
import { 
  PLAYER_VISUALS, 
  ENTRY_FEES, 
  NANO_PER_IOTA,
  formatIota,
} from './constants';

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const MAX_LOGS = 10;

const App: React.FC = () => {
  const account = useCurrentAccount();
  const { 
    isConnected, 
    isLoading: isWalletLoading, 
    player, 
    hero, 
    balance,
    healCost,
    networkStatus,
    refreshPlayer,
    error: walletError,
    clearError,
  } = useWallet();
  const { executeWithRefresh, isPending } = useGameActions();

  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [selectedTier, setSelectedTier] = useState<MonsterTier>(MonsterTier.TIER_1);
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [healResult, setHealResult] = useState<HealResult | null>(null);

  useEffect(() => {
    if (gameState === GameState.BATTLING || gameState === GameState.RESULT || gameState === GameState.HEALING) {
      return;
    }
    
    if (isConnected && hero) {
      setGameState(GameState.READY);
    } else if (isConnected && !hero && !isWalletLoading) {
      setGameState(GameState.IDLE);
    } else if (!isConnected) {
      setGameState(GameState.IDLE);
    }
  }, [isConnected, hero, isWalletLoading, gameState]);

  useEffect(() => {
    const preloadImages = () => {
      Object.values(PLAYER_VISUALS).forEach((visual) => {
        const img = new Image();
        img.src = visual.img;
      });
    };
    const timer = setTimeout(preloadImages, 500);
    return () => clearTimeout(timer);
  }, []);

  const addLog = useCallback((message: string, type: GameLog['type'] = 'info') => {
    setLogs(prev => {
      const newLog: GameLog = {
        id: generateId(),
        timestamp: Date.now(),
        message,
        type
      };
      const updated = [newLog, ...prev];
      return updated.slice(0, MAX_LOGS);
    });
  }, []);

  const handleCreateHero = useCallback(async () => {
    if (!isConnected) return;
    
    setGameState(GameState.MINTING);
    addLog('正在建立英雄，請在錢包中確認交易...', 'info');

    try {
      const tx = buildCreateHeroTx();
      const result = await executeWithRefresh(tx);
      
      const heroEvent = parseHeroCreatedEvent(result);
      if (heroEvent) {
        addLog(`🎉 英雄建立成功！ID: ${heroEvent.heroId.slice(0, 8)}...`, 'gain');
        addLog(`交易已確認: ${result.digest.slice(0, 16)}...`, 'tx');
      }
      
      setGameState(GameState.READY);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      addLog(`❌ 建立英雄失敗: ${errorMessage}`, 'danger');
      setGameState(GameState.IDLE);
    }
  }, [isConnected, addLog, executeWithRefresh]);

  const handleStartAdventure = useCallback(async () => {
    if (!hero || !isConnected) return;
    
    const entryFee = ENTRY_FEES[selectedTier];
    if (balance < entryFee) {
      addLog(`❌ IOTA 不足！需要 ${formatIota(entryFee)} IOTA`, 'danger');
      return;
    }
    
    if (hero.hp <= 0) {
      addLog('❌ 英雄已經倒下，請先治療！', 'danger');
      return;
    }

    setGameState(GameState.BATTLING);
    setBattleResult(null);

    const monster = getMonsterForBattle(selectedTier);
    setCurrentMonster(monster);
    addLog(`⚔️ 遭遇了 ${monster.name}！`, 'combat');
    addLog(`💰 支付入場費 ${formatIota(entryFee)} IOTA，請在錢包中確認...`, 'info');

    try {
      const tx = buildFightMonsterTx(hero.id, selectedTier);
      const result = await executeWithRefresh(tx);
      
      const battleEvent = parseBattleEvent(result, monster);
      if (battleEvent) {
        setBattleResult(battleEvent);
        
        if (battleEvent.won) {
          addLog(`🎉 勝利！獲得 ${formatIota(battleEvent.reward)} IOTA 和 ${battleEvent.xpGained} XP`, 'gain');
          if (battleEvent.leveledUp) {
            addLog(`⬆️ 等級提升！現在是 Lv.${battleEvent.newLevel}`, 'gain');
          }
        } else {
          addLog(`💀 戰敗... 受到 ${battleEvent.damageTaken} 點傷害`, 'danger');
        }
        
        addLog(`📜 交易: ${result.digest.slice(0, 16)}...`, 'tx');
      }
      
      setGameState(GameState.RESULT);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      addLog(`❌ 戰鬥失敗: ${errorMessage}`, 'danger');
      setGameState(GameState.READY);
    }
  }, [hero, isConnected, selectedTier, balance, addLog, executeWithRefresh]);

  const handleHeal = useCallback(async () => {
    if (!hero || !isConnected) return;
    
    if (hero.hp >= hero.maxHp) {
      addLog('✨ 英雄已經滿血，不需要治療！', 'info');
      return;
    }
    
    if (balance < healCost) {
      addLog(`❌ IOTA 不足！治療需要 ${formatIota(healCost)} IOTA`, 'danger');
      return;
    }

    setGameState(GameState.HEALING);
    addLog(`🏥 正在治療英雄，需要 ${formatIota(healCost)} IOTA...`, 'info');

    try {
      const tx = buildHealHeroTx(hero.id, healCost);
      const result = await executeWithRefresh(tx);
      
      const healEvent = parseHealEvent(result);
      if (healEvent) {
        setHealResult(healEvent);
        addLog(`💚 治療成功！恢復 ${healEvent.hpRestored} HP，目前 HP: ${healEvent.hpAfter}`, 'gain');
        addLog(`📜 交易: ${result.digest.slice(0, 16)}...`, 'tx');
      }
      
      setGameState(GameState.READY);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      addLog(`❌ 治療失敗: ${errorMessage}`, 'danger');
      setGameState(GameState.READY);
    }
  }, [hero, isConnected, balance, healCost, addLog, executeWithRefresh]);

  const handleContinue = useCallback(() => {
    setGameState(GameState.READY);
    setBattleResult(null);
    setCurrentMonster(null);
  }, []);

  const playerImage = useMemo(() => {
    return player?.imageUrl ?? '';
  }, [player?.imageUrl]);

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in-up">
      <div className="mb-4">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800 flex items-center justify-center">
          <span className="text-4xl">⚔️</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">
          異世界冒險者
        </h1>
        <p className="text-slate-400 max-w-md mx-auto leading-relaxed text-sm sm:text-base">
          每場戰鬥都是一次真實的鏈上隨機數計算。
        </p>
      </div>
      
      <ConnectButton 
        connectText="連接錢包開始冒險"
        className="px-6 py-3 bg-iota-accent text-slate-900 font-semibold rounded-xl hover:brightness-110 transition-all"
      />
    </div>
  );

  const renderCreateHero = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in-up">
      <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mb-2">
        <span className="text-3xl">🗡️</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white">
        歡迎，冒險者
      </h1>
      <p className="text-slate-400 max-w-sm text-sm sm:text-base">
        建立你的第一位英雄，開始異世界冒險之旅
      </p>
      <p className="text-sm text-slate-500">
        餘額: {formatIota(balance)} IOTA
      </p>
      
      {gameState === GameState.MINTING ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-iota-accent border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-sm">正在建立英雄...</span>
        </div>
      ) : (
        <button 
          onClick={handleCreateHero}
          disabled={isPending || isWalletLoading}
          className="px-6 py-3 bg-iota-accent text-slate-900 font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
        >
          建立英雄（免費）
        </button>
      )}
    </div>
  );

  const renderGameContent = () => {
    if (!hero || !player) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full max-w-5xl mx-auto items-start">
        <div className="flex flex-col items-center space-y-6">
          {isWalletLoading ? (
            <HeroCardSkeleton />
          ) : (
            <HeroCard player={player} hero={hero} />
          )}
          
          <div className="w-full max-w-sm">
            <TierSelector
              selectedTier={selectedTier}
              onSelectTier={setSelectedTier}
              heroLevel={hero.level}
              disabled={gameState !== GameState.READY && gameState !== GameState.RESULT}
            />
            
            <div className="flex flex-col gap-3">
              <button 
                disabled={isPending || (gameState !== GameState.READY && gameState !== GameState.RESULT)}
                onClick={handleStartAdventure}
                className="py-3.5 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isPending && gameState === GameState.BATTLING ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    戰鬥中...
                  </>
                ) : (
                  <>開始冒險（{ENTRY_FEES[selectedTier] / NANO_PER_IOTA} IOTA）</>
                )}
              </button>
              
              <button 
                disabled={isPending || (gameState !== GameState.READY && gameState !== GameState.RESULT) || hero.hp >= hero.maxHp}
                onClick={handleHeal}
                className="py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium text-slate-300 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isPending && gameState === GameState.HEALING ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                    治療中...
                  </>
                ) : (
                  <>神殿治療（{formatIota(healCost)} IOTA）</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="flex flex-col bg-slate-900/50 rounded-2xl border-2 border-slate-800 relative overflow-hidden transition-all">
            {(gameState === GameState.BATTLING || gameState === GameState.RESULT) && currentMonster ? (
              <BattleAnimation
                playerImage={playerImage}
                playerName={`Lv.${hero.level} 英雄`}
                monsterImage={currentMonster.imageUrl}
                monsterName={currentMonster.name}
                battleResult={battleResult}
                isWaiting={isPending || gameState === GameState.BATTLING}
              />
            ) : gameState === GameState.RESULT && battleResult ? (
              <div className="min-h-[300px] sm:min-h-[350px] flex flex-col items-center justify-center p-6 animate-fade-in relative">
                <div className={`absolute inset-0 opacity-10 pointer-events-none ${
                  battleResult.won ? 'bg-emerald-500' : 'bg-red-500'
                }`} />

                <h2 className={`text-2xl font-bold mb-5 ${
                  battleResult.won ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {battleResult.won ? '🎉 勝利' : '💀 戰敗'}
                </h2>

                <div className={`w-full max-w-xs p-4 rounded-xl text-center mb-5 relative z-10 ${
                  battleResult.won ? 'bg-emerald-900/30 border border-emerald-700/30' : 'bg-red-900/30 border border-red-700/30'
                }`}>
                  {battleResult.won ? (
                    <>
                      <p className="text-emerald-300 text-xs mb-1">獲得獎勵</p>
                      <p className="text-2xl font-bold text-emerald-400">+{formatIota(battleResult.reward)} IOTA</p>
                      <p className="text-xs text-emerald-300/70 mt-2">+{battleResult.xpGained} XP</p>
                      {battleResult.leveledUp && (
                        <p className="text-sm text-purple-400 font-bold mt-2 animate-bounce">
                          ⬆️ 升級到 Lv.{battleResult.newLevel}！
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-red-300 text-xs mb-1">受到傷害</p>
                      <p className="text-2xl font-bold text-red-400">-{battleResult.damageTaken} HP</p>
                    </>
                  )}
                </div>

                <button 
                  onClick={handleContinue}
                  className="w-full max-w-xs py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition relative z-10"
                >
                  繼續
                </button>
              </div>
            ) : (
              <div className="min-h-[300px] sm:min-h-[350px] flex items-center justify-center p-6 relative">
                {gameState === GameState.HEALING ? (
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-emerald-400">治療中...</p>
                  </div>
                ) : isWalletLoading ? (
                  <BattleAreaSkeleton />
                ) : (
                  <div className="text-center text-slate-500">
                    <p className="text-slate-600 mb-2">準備就緒</p>
                    <p className="text-sm">選擇難度後點擊「開始冒險」</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {gameState === GameState.RESULT && battleResult?.txDigest && (
            <a 
              href={`https://iotascan.com/testnet/tx/${battleResult.txDigest}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-xs text-slate-500 hover:text-iota-accent transition-colors py-2"
            >
              在區塊鏈瀏覽器上查看交易 →
            </a>
          )}

          <GameLogPanel logs={logs} maxLogs={MAX_LOGS} />
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!isConnected) {
      return renderWelcome();
    }

    if (!hero) {
      return renderCreateHero();
    }

    return renderGameContent();
  };

  return (
    <div className="min-h-screen font-sans text-slate-100 bg-slate-950 flex flex-col">
      <Header
        isConnected={isConnected}
        address={account?.address}
        balance={balance}
        networkStatus={networkStatus}
      />

      <main className="flex-1 pt-20 pb-16 px-4">
        {renderContent()}
      </main>

      {walletError && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-900 text-red-100 px-5 py-2.5 rounded-lg flex items-center gap-3 z-50 text-sm max-w-[90vw]">
          <span className="truncate">{walletError}</span>
          <button onClick={clearError} className="text-red-300 hover:text-white flex-shrink-0">×</button>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default App;
