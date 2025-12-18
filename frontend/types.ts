export type NetworkStatus = 'connected' | 'disconnected' | 'slow';

export enum GameState {
  IDLE = 'IDLE',
  MINTING = 'MINTING',
  READY = 'READY',
  BATTLING = 'BATTLING',
  HEALING = 'HEALING',
  RESULT = 'RESULT',
}

export enum MonsterTier {
  TIER_1 = 1,
  TIER_2 = 2,
  TIER_3 = 3,
  TIER_4 = 4,
}

export enum PlayerTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
  STAR = 'STAR',
  KING = 'KING',
  SAINT = 'SAINT',
  EMPEROR = 'EMPEROR',
  GOD = 'GOD',
}

export interface Monster {
  id: number;
  name: string;
  description: string;
  tier: MonsterTier;
  imageUrl: string;
  baseReward: number;
  tierLabel: string;
  tierColor: string;
}

export interface Hero {
  id: string;
  hp: number;
  maxHp: number;
  xp: number;
  level: number;
}

export interface Player {
  address: string;
  hero: Hero | null;
  balance: number;
  tier: PlayerTier;
  imageUrl: string;
}

export interface BattleResult {
  heroId: string;
  monsterTier: number;
  won: boolean;
  entryFee: number;
  reward: number;
  xpGained: number;
  damageTaken: number;
  heroHpAfter: number;
  leveledUp: boolean;
  newLevel: number;
  monster: Monster;
  txDigest?: string;
}

export interface HealResult {
  heroId: string;
  cost: number;
  hpRestored: number;
  hpAfter: number;
  txDigest?: string;
}

export interface GameLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'combat' | 'gain' | 'danger' | 'tx';
}

export interface ContractConfig {
  packageId: string;
  gameBankId: string;
  randomObjectId: string;
}

export interface MoveHeroFields {
  id: { id: string };
  hp: string;
  max_hp: string;
  xp: string;
  level: string;
}

export interface MoveGameBankFields {
  id: { id: string };
  balance: string;
  heal_cost: string;
  admin: string;
}

export interface MoveBattleEventData {
  hero_id: string;
  monster_tier: number;
  won: boolean;
  entry_fee: string;
  reward: string;
  xp_gained: string;
  damage_taken: string;
  hero_hp_after: string;
  leveled_up: boolean;
  new_level: string;
}

export interface MoveHealEventData {
  hero_id: string;
  cost: string;
  hp_restored: string;
  hp_after: string;
}

export interface MoveHeroCreatedEventData {
  hero_id: string;
  owner: string;
}
