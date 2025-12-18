import { IotaClient, IotaTransactionBlockResponse } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';
import { 
  Monster, 
  MonsterTier, 
  Hero, 
  PlayerTier, 
  BattleResult, 
  HealResult,
  MoveHeroFields,
  MoveGameBankFields,
  MoveBattleEventData,
  MoveHealEventData,
  MoveHeroCreatedEventData,
} from '../types';
import { 
  CONTRACT_CONFIG, 
  RPC_URL, 
  ENTRY_FEES, 
  NANO_PER_IOTA,
  PLAYER_VISUALS,
  getRandomMonsterByTier,
  nanoToIota,
  BASE_WIN_RATES,
} from '../constants';

let iotaClient: IotaClient | null = null;

export const getIotaClient = (): IotaClient => {
  if (!iotaClient) {
    iotaClient = new IotaClient({ url: RPC_URL });
  }
  return iotaClient;
};

export const calculatePlayerTier = (level: number): PlayerTier => {
  if (level >= 10) return PlayerTier.GOD;
  switch (level) {
    case 9: return PlayerTier.EMPEROR;
    case 8: return PlayerTier.SAINT;
    case 7: return PlayerTier.KING;
    case 6: return PlayerTier.STAR;
    case 5: return PlayerTier.DIAMOND;
    case 4: return PlayerTier.PLATINUM;
    case 3: return PlayerTier.GOLD;
    case 2: return PlayerTier.SILVER;
    default: return PlayerTier.BRONZE;
  }
};

export const getPlayerVisual = (tier: PlayerTier): string => {
  return PLAYER_VISUALS[tier].img;
};

export const getBalance = async (address: string): Promise<number> => {
  const client = getIotaClient();
  const balance = await client.getBalance({ owner: address });
  return Number(balance.totalBalance);
};

export const getHeroes = async (address: string): Promise<Hero[]> => {
  const client = getIotaClient();
  
  const objects = await client.getOwnedObjects({
    owner: address,
    filter: {
      StructType: `${CONTRACT_CONFIG.packageId}::game::Hero`,
    },
    options: {
      showContent: true,
    },
  });

  const heroes: Hero[] = [];
  
  for (const obj of objects.data) {
    if (obj.data?.content?.dataType === 'moveObject') {
      const fields = obj.data.content.fields as unknown as MoveHeroFields;
      heroes.push({
        id: obj.data.objectId,
        hp: Number(fields.hp),
        maxHp: Number(fields.max_hp),
        xp: Number(fields.xp),
        level: Number(fields.level),
      });
    }
  }

  return heroes;
};

export const getGameBankInfo = async (): Promise<{
  balance: number;
  healCost: number;
  admin: string;
}> => {
  const client = getIotaClient();
  
  const obj = await client.getObject({
    id: CONTRACT_CONFIG.gameBankId,
    options: { showContent: true },
  });

  if (obj.data?.content?.dataType === 'moveObject') {
    const fields = obj.data.content.fields as unknown as MoveGameBankFields;
    return {
      balance: Number(fields.balance),
      healCost: Number(fields.heal_cost),
      admin: fields.admin,
    };
  }

  throw new Error('Failed to fetch GameBank info');
};

export const getHeroById = async (heroId: string): Promise<Hero | null> => {
  const client = getIotaClient();
  
  const obj = await client.getObject({
    id: heroId,
    options: { showContent: true },
  });

  if (obj.data?.content?.dataType === 'moveObject') {
    const fields = obj.data.content.fields as unknown as MoveHeroFields;
    return {
      id: obj.data.objectId,
      hp: Number(fields.hp),
      maxHp: Number(fields.max_hp),
      xp: Number(fields.xp),
      level: Number(fields.level),
    };
  }

  return null;
};

export const buildCreateHeroTx = (): Transaction => {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${CONTRACT_CONFIG.packageId}::game::create_hero`,
    arguments: [],
  });

  return tx;
};

export const buildFightMonsterTx = (
  heroId: string,
  monsterTier: MonsterTier,
): Transaction => {
  const tx = new Transaction();
  
  const entryFee = ENTRY_FEES[monsterTier];

  const [coin] = tx.splitCoins(tx.gas, [entryFee]);

  tx.moveCall({
    target: `${CONTRACT_CONFIG.packageId}::game::fight_monster`,
    arguments: [
      tx.object(heroId),
      tx.pure.u8(monsterTier),
      coin,
      tx.object(CONTRACT_CONFIG.randomObjectId),
      tx.object(CONTRACT_CONFIG.gameBankId),
    ],
  });

  return tx;
};

export const buildHealHeroTx = (
  heroId: string,
  healCost: number,
): Transaction => {
  const tx = new Transaction();

  const [coin] = tx.splitCoins(tx.gas, [healCost]);

  tx.moveCall({
    target: `${CONTRACT_CONFIG.packageId}::game::heal_hero`,
    arguments: [
      tx.object(heroId),
      coin,
      tx.object(CONTRACT_CONFIG.gameBankId),
    ],
  });

  return tx;
};

export const parseBattleEvent = (
  txResponse: IotaTransactionBlockResponse,
  monster: Monster,
): BattleResult | null => {
  if (!txResponse.events) return null;

  const battleEvent = txResponse.events.find(
    (e) => e.type === `${CONTRACT_CONFIG.packageId}::game::BattleEvent`
  );

  if (!battleEvent || !battleEvent.parsedJson) return null;

  const event = battleEvent.parsedJson as MoveBattleEventData;

  return {
    heroId: event.hero_id,
    monsterTier: Number(event.monster_tier),
    won: event.won,
    entryFee: Number(event.entry_fee),
    reward: Number(event.reward),
    xpGained: Number(event.xp_gained),
    damageTaken: Number(event.damage_taken),
    heroHpAfter: Number(event.hero_hp_after),
    leveledUp: event.leveled_up,
    newLevel: Number(event.new_level),
    monster,
    txDigest: txResponse.digest,
  };
};

export const parseHealEvent = (
  txResponse: IotaTransactionBlockResponse,
): HealResult | null => {
  if (!txResponse.events) return null;

  const healEvent = txResponse.events.find(
    (e) => e.type === `${CONTRACT_CONFIG.packageId}::game::HealEvent`
  );

  if (!healEvent || !healEvent.parsedJson) return null;

  const event = healEvent.parsedJson as MoveHealEventData;

  return {
    heroId: event.hero_id,
    cost: Number(event.cost),
    hpRestored: Number(event.hp_restored),
    hpAfter: Number(event.hp_after),
    txDigest: txResponse.digest,
  };
};

export const parseHeroCreatedEvent = (
  txResponse: IotaTransactionBlockResponse,
): { heroId: string; owner: string } | null => {
  if (!txResponse.events) return null;

  const event = txResponse.events.find(
    (e) => e.type === `${CONTRACT_CONFIG.packageId}::game::HeroCreated`
  );

  if (!event || !event.parsedJson) return null;

  const parsed = event.parsedJson as MoveHeroCreatedEventData;
  return {
    heroId: parsed.hero_id,
    owner: parsed.owner,
  };
};

export const getMonsterForBattle = (tier: MonsterTier): Monster => {
  return getRandomMonsterByTier(tier);
};

export const calculateWinRate = (monsterTier: MonsterTier, heroLevel: number): number => {
  const base = BASE_WIN_RATES[monsterTier];
  const levelBonus = heroLevel > 10 ? 10 : heroLevel > 1 ? heroLevel - 1 : 0;
  const total = base + levelBonus;

  return Math.min(total, 95);
};

export const getExpectedRewardRange = (tier: MonsterTier): { min: number; max: number } => {
  const baseRewards: Record<MonsterTier, number> = {
    [MonsterTier.TIER_1]: 1,
    [MonsterTier.TIER_2]: 2,
    [MonsterTier.TIER_3]: 4,
    [MonsterTier.TIER_4]: 8,
  };

  const base = baseRewards[tier];
  return {
    min: base * NANO_PER_IOTA,
    max: (base + 5) * NANO_PER_IOTA,
  };
};

export const formatReward = (rewardNano: number): string => {
  const iota = nanoToIota(rewardNano);
  return `${iota.toFixed(0)} IOTA`;
};

export const waitForTransaction = async (
  digest: string,
): Promise<IotaTransactionBlockResponse> => {
  const client = getIotaClient();
  
  return client.waitForTransaction({
    digest,
    options: {
      showEvents: true,
      showEffects: true,
    },
  });
};

export const CONTRACT_ERRORS: Record<number, string> = {
  0: '英雄已經死亡，無法進行動作',
  1: '無效的怪物等級',
  2: '付款金額不足',
  3: '英雄已滿血，無需治療',
  4: '銀行餘額不足',
};

export const getErrorMessage = (code: number): string => {
  return CONTRACT_ERRORS[code] || `未知錯誤 (code: ${code})`;
};
