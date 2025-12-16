# IOTA Adventure

A fully on-chain RPG game running on the IOTA network. Create your hero, fight monsters of varying difficulties, level up, and earn IOTA rewards!

---

## Game Rules

### 1. Hero
- **Start**: Every new hero starts at **Level 1** with **100 HP**.
- **Level Up**: Gain XP from battles. Every **100 XP** levels you up.
- **Bonus**: Leveling up fully restores your HP and increases your **Max HP by 10**.

### 2. Monsters & Tiers
There are 4 tiers of monsters. Higher tiers require higher entry fees and are harder to defeat, but offer greater rewards.

| Tier | Entry Fee | Base Win Rate | XP | Reward Multiplier |
| :---: | :---: | :---: | :---: | :---: |
| **1** | 1 IOTA | 80% | 20 | Low |
| **2** | 2 IOTA | 70% | 30 | Medium |
| **3** | 3 IOTA | 60% | 40 | High |
| **4** | 5 IOTA | 50% | 50 | Very High |

> **Note**: Your win rate increases with your Hero Level (up to a max of 95%).

### 3. Battle Mechanics
- **Victory**:
  - You earn IOTA rewards (Base Reward + Random Bonus).
  - You gain XP.
  - You take a small amount of damage.

- **Defeat**:
  - No rewards.
  - No XP.
  - You take a large amount of damage.

### 4. Healing
- If your HP is low, you can visit the healer.
- **Cost**: **5 IOTA**
- **Effect**: Restores HP to **100%**.

### 5. The Bank
- This is a player-vs-pool game. All entry fees and healing costs go into the **Game Bank**.
- Rewards are paid out from the Bank.
- **Warning**: If the Bank runs out of funds, you will only receive whatever is left in the Bank!
