import { Monster, MonsterTier, PlayerTier, ContractConfig } from './types';

const validateEnvVar = (name: string, value: string | undefined, required: boolean = true): string => {
  const val = value || '';
  if (required && !val) {
    const errorMsg = `Missing required environment variable: ${name}`;
    if (import.meta.env.DEV) {
      console.error(`${errorMsg}. Please set ${name} in your .env file`);
    }
    throw new Error(errorMsg);
  }
  return val;
};

export const CONTRACT_CONFIG: ContractConfig = {
  packageId: validateEnvVar('VITE_PACKAGE_ID', import.meta.env.VITE_PACKAGE_ID),
  gameBankId: validateEnvVar('VITE_GAME_BANK_ID', import.meta.env.VITE_GAME_BANK_ID),
  randomObjectId: import.meta.env.VITE_RANDOM_OBJECT_ID || '0x8',
};

export const isConfigValid = (): boolean => {
  return Boolean(CONTRACT_CONFIG.packageId && CONTRACT_CONFIG.gameBankId);
};

export const NETWORK = (import.meta.env.VITE_NETWORK || 'testnet') as 'mainnet' | 'testnet' | 'devnet' | 'localnet';
export const RPC_URL = import.meta.env.VITE_RPC_URL || `https://api.${NETWORK}.iota.cafe`;

export const NANO_PER_IOTA = 1_000_000_000;

export const ENTRY_FEES: Record<MonsterTier, number> = {
  [MonsterTier.TIER_1]: 1 * NANO_PER_IOTA,
  [MonsterTier.TIER_2]: 2 * NANO_PER_IOTA,
  [MonsterTier.TIER_3]: 3 * NANO_PER_IOTA,
  [MonsterTier.TIER_4]: 5 * NANO_PER_IOTA,
};

export const DEFAULT_HEAL_COST = 5 * NANO_PER_IOTA;

export const INITIAL_HP = 100;
export const MAX_HP = 100;

export const BASE_WIN_RATES: Record<MonsterTier, number> = {
  [MonsterTier.TIER_1]: 80,
  [MonsterTier.TIER_2]: 70,
  [MonsterTier.TIER_3]: 60,
  [MonsterTier.TIER_4]: 50,
};

export const BASE_REWARDS: Record<MonsterTier, number> = {
  [MonsterTier.TIER_1]: 1,
  [MonsterTier.TIER_2]: 2,
  [MonsterTier.TIER_3]: 4,
  [MonsterTier.TIER_4]: 8,
};

export const getTierLabel = (tier: MonsterTier): string => {
  const fee = ENTRY_FEES[tier] / NANO_PER_IOTA;
  switch (tier) {
    case MonsterTier.TIER_1: return `🟢 簡單 (${fee} IOTA)`;
    case MonsterTier.TIER_2: return `🔵 普通 (${fee} IOTA)`;
    case MonsterTier.TIER_3: return `🟠 困難 (${fee} IOTA)`;
    case MonsterTier.TIER_4: return `🔴 地獄級 (${fee} IOTA)`;
  }
};

export const getTierColor = (tier: MonsterTier): string => {
  switch (tier) {
    case MonsterTier.TIER_1: return 'text-green-400';
    case MonsterTier.TIER_2: return 'text-blue-400';
    case MonsterTier.TIER_3: return 'text-orange-400';
    case MonsterTier.TIER_4: return 'text-red-600 font-bold animate-pulse';
  }
};

const GEN_BASE = "https://image.pollinations.ai/prompt";
const STYLE = "anime style, digital fantasy art, 2d illustration, cel shaded, best quality";

const getUrl = (prompt: string, seed: number) => {
  return `${GEN_BASE}/${encodeURIComponent(`${prompt}, ${STYLE}`)}?width=512&height=512&seed=${seed}&nologo=true&model=turbo`;
};

export const MONSTER_DB: Record<number, Monster> = {
  0: {
    id: 0,
    name: '變異史萊姆',
    description: '綠色、半透明、果凍狀、內部有骨頭',
    tier: MonsterTier.TIER_1,
    imageUrl: getUrl('Green slime monster, translucent jelly body, visible white skeleton inside, cute rpg enemy', 0),
    baseReward: 1,
    tierLabel: "🟢 簡單 (1 IOTA)",
    tierColor: "text-green-400"
  },
  1: {
    id: 1,
    name: '森林哥布林',
    description: '綠皮膚、尖耳朵、矮小、破布衣',
    tier: MonsterTier.TIER_1,
    imageUrl: getUrl('Forest Goblin, green skin, pointy ears, small stature, wearing leather rags, holding wooden club, forest background', 1),
    baseReward: 1,
    tierLabel: "🟢 簡單 (1 IOTA)",
    tierColor: "text-green-400"
  },
  2: {
    id: 2,
    name: '巨大毒蜘蛛',
    description: '八隻腳、黑色、紫色毒液、多眼',
    tier: MonsterTier.TIER_1,
    imageUrl: getUrl('Giant spider, black chitin armor, purple glowing eyes, dripping poison, spider web background', 2),
    baseReward: 1,
    tierLabel: "🟢 簡單 (1 IOTA)",
    tierColor: "text-green-400"
  },
  3: {
    id: 3,
    name: '詛咒骷髏',
    description: '白骨架、藍色眼火、手持破盾',
    tier: MonsterTier.TIER_1,
    imageUrl: getUrl('Skeleton warrior, white bones, blue magical flame eyes, holding rusted sword and broken shield, dark dungeon', 3),
    baseReward: 1,
    tierLabel: "🟢 簡單 (1 IOTA)",
    tierColor: "text-green-400"
  },

  4: {
    id: 4,
    name: '狂暴狼人',
    description: '狼頭人身、站立、滿月背景、爪子',
    tier: MonsterTier.TIER_2,
    imageUrl: getUrl('Werewolf warrior, wolf head human body, sharp claws, standing pose, full moon night background', 4),
    baseReward: 2,
    tierLabel: "🔵 普通 (2 IOTA)",
    tierColor: "text-blue-400"
  },
  5: {
    id: 5,
    name: '蠻力半獸人',
    description: '巨大綠皮膚肌肉男、獠牙、大斧頭',
    tier: MonsterTier.TIER_2,
    imageUrl: getUrl('Orc barbarian, massive green muscles, large tusks, holding battle axe, war paint, aggressive', 5),
    baseReward: 2,
    tierLabel: "🔵 普通 (2 IOTA)",
    tierColor: "text-blue-400"
  },
  6: {
    id: 6,
    name: '鷹身女妖',
    description: '女性面孔、鳥身、羽翼、利爪',
    tier: MonsterTier.TIER_2,
    imageUrl: getUrl('Harpy monster, female human face, bird body with feathers, large wings, sharp talons, mountain peak', 6),
    baseReward: 2,
    tierLabel: "🔵 普通 (2 IOTA)",
    tierColor: "text-blue-400"
  },
  7: {
    id: 7,
    name: '迷宮牛頭人',
    description: '牛頭人身、鼻環、巨大圖騰柱',
    tier: MonsterTier.TIER_2,
    imageUrl: getUrl('Minotaur warrior, bull head, nose ring, strong human body, holding totem pillar weapon, stone labyrinth', 7),
    baseReward: 2,
    tierLabel: "🔵 普通 (2 IOTA)",
    tierColor: "text-blue-400"
  },

  8: {
    id: 8,
    name: '鋼鐵魔像',
    description: '全金屬、齒輪、蒸汽龐克風、紅眼',
    tier: MonsterTier.TIER_3,
    imageUrl: getUrl('Iron Golem, steampunk robot, brass and iron gears, glowing red eyes, metallic armor, steam venting', 8),
    baseReward: 4,
    tierLabel: "🟠 困難 (3 IOTA)",
    tierColor: "text-orange-400"
  },
  9: {
    id: 9,
    name: '深海海怪',
    description: '章魚觸手、吸盤、濕滑質感、深藍色',
    tier: MonsterTier.TIER_3,
    imageUrl: getUrl('Deep sea Kraken, giant octopus monster, blue ocean water, tentacles, suction cups, bioluminescence', 9),
    baseReward: 4,
    tierLabel: "🟠 困難 (3 IOTA)",
    tierColor: "text-orange-400"
  },
  10: {
    id: 10,
    name: '死靈法師',
    description: '黑袍、骷髏臉、綠色法術光效',
    tier: MonsterTier.TIER_3,
    imageUrl: getUrl('Evil Necromancer, wearing dark hooded robes, skeletal face, casting green arcane magic, dark aura', 10),
    baseReward: 4,
    tierLabel: "🟠 困難 (3 IOTA)",
    tierColor: "text-orange-400"
  },
  11: {
    id: 11,
    name: '暗夜吸血鬼',
    description: '貴族禮服、蒼白皮膚、嘴角血跡',
    tier: MonsterTier.TIER_3,
    imageUrl: getUrl('Vampire Lord, victorian noble suit, pale skin, red eyes, blood on lips, gothic castle background', 11),
    baseReward: 4,
    tierLabel: "🟠 困難 (3 IOTA)",
    tierColor: "text-orange-400"
  },

  12: {
    id: 12,
    name: '煉獄火元素',
    description: '熔岩身體、黑曜石盔甲、全身火焰',
    tier: MonsterTier.TIER_4,
    imageUrl: getUrl('Fire Elemental Boss, body made of lava, floating obsidian armor, raging fire flames, inferno background', 12),
    baseReward: 8,
    tierLabel: "🔴 地獄級 (5 IOTA)",
    tierColor: "text-red-600 font-bold animate-pulse"
  },
  13: {
    id: 13,
    name: '深淵巨龍',
    description: '黑色鱗片、巨大龍翼、紫色火焰',
    tier: MonsterTier.TIER_4,
    imageUrl: getUrl('Abyssal Dragon, black scales, giant wings, breathing purple fire, dark apocalypse background', 13),
    baseReward: 8,
    tierLabel: "🔴 地獄級 (5 IOTA)",
    tierColor: "text-red-600 font-bold animate-pulse"
  },
  14: {
    id: 14,
    name: '墮落大天使',
    description: '黑色羽翼、光環、黑色聖劍',
    tier: MonsterTier.TIER_4,
    imageUrl: getUrl('Fallen Angel Boss, black feathered wings, dark corrupted halo, holding dark energy sword, dramatic lighting', 14),
    baseReward: 8,
    tierLabel: "🔴 地獄級 (5 IOTA)",
    tierColor: "text-red-600 font-bold animate-pulse"
  },
  15: {
    id: 15,
    name: '虛空支配者',
    description: '宇宙星空材質、多眼球、觸手',
    tier: MonsterTier.TIER_4,
    imageUrl: getUrl('Void Eldritch Horror, cosmic star texture skin, many eyes, tentacles, space background, abstract monster', 15),
    baseReward: 8,
    tierLabel: "🔴 地獄級 (5 IOTA)",
    tierColor: "text-red-600 font-bold animate-pulse"
  },
};

export const getMonstersByTier = (tier: MonsterTier): Monster[] => {
  return Object.values(MONSTER_DB).filter(m => m.tier === tier);
};

export const getRandomMonsterByTier = (tier: MonsterTier): Monster => {
  const monsters = getMonstersByTier(tier);
  return monsters[Math.floor(Math.random() * monsters.length)];
};

export const PLAYER_VISUALS: Record<PlayerTier, { title: string, desc: string, img: string }> = {
  [PlayerTier.BRONZE]: {
    title: '銅級冒險者',
    desc: '麻布衣，生鏽鐵劍，新手村',
    img: getUrl('young anime adventurer, wearing simple hemp tunic, holding a rusty short sword, rookie village background, full body character', 1001),
  },
  [PlayerTier.SILVER]: {
    title: '白銀級冒險者',
    desc: '輕型鋼甲，精鋼長劍，森林戰場',
    img: getUrl('anime knight, silver plate armor, blue cape, holding refined steel sword, forest battlefield background, heroic pose', 2002),
  },
  [PlayerTier.GOLD]: {
    title: '黃金級冒險者',
    desc: '黃金全身鎧甲，發光武器，神殿背景',
    img: getUrl('legendary anime hero, golden glowing armor, holding holy sword, wings of light on back, divine temple background, epic masterpiece', 3003),
  },
  [PlayerTier.PLATINUM]: {
    title: '白金級冒險者',
    desc: '白金光澤鎧甲，背後有小型光翼，神聖感',
    img: getUrl('platinum armor anime paladin, small wings of light, holy aura, sacred sanctuary background, intricate details', 4004),
  },
  [PlayerTier.DIAMOND]: {
    title: '鑽石級冒險者',
    desc: '半透明水晶鎧甲，紫色魔法能量，堅不可摧',
    img: getUrl('diamond crystal armor anime warrior, purple magical energy, translucent armor, crystal cave background', 5005),
  },
  [PlayerTier.STAR]: {
    title: '星辰級冒險者',
    desc: '盔甲鑲嵌星空，手持星系法球，宇宙背景',
    img: getUrl('cosmic armor anime mage warrior, armor inlaid with starry sky, holding galaxy orb, space background', 6006),
  },
  [PlayerTier.KING]: {
    title: '王者級冒險者',
    desc: '華麗皇冠，紅色披風，統治者的氣場，千軍萬馬背景',
    img: getUrl('anime king warrior, ornate crown, red cape, ruler aura, army background, majestic', 7007),
  },
  [PlayerTier.SAINT]: {
    title: '聖級冒險者',
    desc: '全身散發聖光，腳不落地，六翼天使特效',
    img: getUrl('anime saint, radiating holy light, floating, six-winged angel effects, heaven background, divine', 8008),
  },
  [PlayerTier.EMPEROR]: {
    title: '帝級冒險者',
    desc: '黑金相間的霸氣鎧甲，空間碎裂特效，毀滅氣息',
    img: getUrl('anime emperor, black and gold dominator armor, space shattering effects, aura of destruction, ruined world background', 9009),
  },
  [PlayerTier.GOD]: {
    title: '神級冒險者',
    desc: '純能量體，看不清面孔，背後有光輪，超越維度',
    img: getUrl('anime god entity, pure energy body, faceless, halo behind back, transcending dimensions, abstract dimension background', 10010),
  },
};

export const nanoToIota = (nano: number): number => nano / NANO_PER_IOTA;

export const iotaToNano = (iota: number): number => iota * NANO_PER_IOTA;

export const formatIota = (nano: number, decimals: number = 2): string => {
  return nanoToIota(nano).toFixed(decimals);
};

