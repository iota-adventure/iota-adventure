module iota_adventure::game {
    use iota::coin::{Self, Coin};
    use iota::balance::{Self, Balance};
    use iota::iota::IOTA;
    use iota::random::{Self, Random};
    use iota::event;

    const EHeroIsDead: u64 = 0;
    const EInvalidMonsterTier: u64 = 1;
    const EInsufficientPayment: u64 = 2;
    const EHeroAlreadyFullHp: u64 = 3;
    const EInsufficientBankBalance: u64 = 4;

    const INITIAL_HP: u64 = 100;
    const MAX_HP: u64 = 100;
    const DEFAULT_HEAL_COST: u64 = 5_000_000_000;

    const ENTRY_FEE_TIER_1: u64 = 1_000_000_000;
    const ENTRY_FEE_TIER_2: u64 = 2_000_000_000;
    const ENTRY_FEE_TIER_3: u64 = 3_000_000_000;
    const ENTRY_FEE_TIER_4: u64 = 5_000_000_000;

    const TIER_1: u8 = 1; // +30%
    const TIER_2: u8 = 2; // +20%
    const TIER_3: u8 = 3; // +10%
    const TIER_4: u8 = 4; // +0%

    public struct AdminCap has key {
        id: UID,
    }

    public struct Hero has key {
        id: UID,
        hp: u64,
        max_hp: u64,
        xp: u64,
        level: u64,
    }

    public struct GameBank has key {
        id: UID,
        balance: Balance<IOTA>,
        admin: address,
        heal_cost: u64,
    }

    public struct HeroCreated has copy, drop {
        hero_id: ID,
        owner: address,
    }

    public struct BattleEvent has copy, drop {
        hero_id: ID,
        monster_tier: u8,
        won: bool,
        entry_fee: u64,
        reward: u64,
        xp_gained: u64,
        damage_taken: u64,
        hero_hp_after: u64,
        leveled_up: bool,
        new_level: u64,
    }

    public struct HealEvent has copy, drop {
        hero_id: ID,
        cost: u64,
        hp_restored: u64,
        hp_after: u64,
    }

    public struct LevelUpEvent has copy, drop {
        hero_id: ID,
        new_level: u64,
        xp_threshold: u64,
    }

    public struct DepositEvent has copy, drop {
        amount: u64,
        new_balance: u64,
    }

    public struct HealCostUpdatedEvent has copy, drop {
        old_cost: u64,
        new_cost: u64,
    }

    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        
        let bank = GameBank {
            id: object::new(ctx),
            balance: balance::zero(),
            admin: ctx.sender(),
            heal_cost: DEFAULT_HEAL_COST,
        };

        transfer::transfer(admin_cap, ctx.sender());
        transfer::share_object(bank);
    }

    public fun new_game(ctx: &mut TxContext): Hero {
        let hero = Hero {
            id: object::new(ctx),
            hp: INITIAL_HP,
            max_hp: MAX_HP,
            xp: 0,
            level: 1,
        };

        event::emit(HeroCreated {
            hero_id: object::id(&hero),
            owner: ctx.sender(),
        });

        hero
    }

    entry fun create_hero(ctx: &mut TxContext) {
        let hero = new_game(ctx);
        transfer::transfer(hero, ctx.sender());
    }

    entry fun fight_monster(
        hero: &mut Hero,
        monster_tier: u8,
        payment: Coin<IOTA>,
        r: &Random,
        bank: &mut GameBank,
        ctx: &mut TxContext,
    ) {
        assert!(hero.hp > 0, EHeroIsDead);
        assert!(monster_tier >= TIER_1 && monster_tier <= TIER_4, EInvalidMonsterTier);

        let entry_fee = get_entry_fee(monster_tier);
        let payment_value = coin::value(&payment);
        assert!(payment_value >= entry_fee, EInsufficientPayment);

        let mut payment_balance = coin::into_balance(payment);
        let fee_payment = balance::split(&mut payment_balance, entry_fee);
        balance::join(&mut bank.balance, fee_payment);

        if (balance::value(&payment_balance) > 0) {
            let change = coin::from_balance(payment_balance, ctx);
            transfer::public_transfer(change, ctx.sender());
        } else {
            balance::destroy_zero(payment_balance);
        };

        let mut generator = random::new_generator(r, ctx);

        let win_threshold = get_win_threshold(monster_tier, hero.level);

        let roll = random::generate_u8_in_range(&mut generator, 1, 100);
        let won = (roll as u64) <= win_threshold;

        let (reward, xp_gained, damage_taken) = if (won) {
            let base_reward = get_base_reward(monster_tier);
            let reward_variance = random::generate_u64_in_range(&mut generator, 0, 5);
            let total_reward = (base_reward + reward_variance) * 1_000_000_000;

            let tier_index = (monster_tier - 1) as u64;
            let xp = 20 + (tier_index * 10);

            let (min_dmg, max_dmg) = get_win_damage(monster_tier);
            let damage = random::generate_u64_in_range(&mut generator, min_dmg, max_dmg);

            (total_reward, xp, damage)
        } else {
            let (min_dmg, max_dmg) = get_lose_damage(monster_tier);
            let damage = random::generate_u64_in_range(&mut generator, min_dmg, max_dmg);

            (0, 0, damage)
        };

        if (damage_taken >= hero.hp) {
            hero.hp = 0;
        } else {
            hero.hp = hero.hp - damage_taken;
        };

        hero.xp = hero.xp + xp_gained;

        let leveled_up = try_level_up(hero);

        let mut actual_reward = 0u64;
        if (reward > 0) {
            let bank_balance = balance::value(&bank.balance);
            if (bank_balance >= reward) {
                actual_reward = reward;
                let reward_balance = balance::split(&mut bank.balance, reward);
                let reward_coin = coin::from_balance(reward_balance, ctx);
                transfer::public_transfer(reward_coin, ctx.sender());
            } else if (bank_balance > 0) {
                actual_reward = bank_balance;
                let available_reward = balance::split(&mut bank.balance, bank_balance);
                let reward_coin = coin::from_balance(available_reward, ctx);
                transfer::public_transfer(reward_coin, ctx.sender());
            }
        };

        event::emit(BattleEvent {
            hero_id: object::id(hero),
            monster_tier,
            won,
            entry_fee,
            reward: actual_reward,
            xp_gained,
            damage_taken,
            hero_hp_after: hero.hp,
            leveled_up,
            new_level: hero.level,
        });
    }

    entry fun heal_hero(
        hero: &mut Hero,
        payment: Coin<IOTA>,
        bank: &mut GameBank,
        ctx: &mut TxContext,
    ) {
        assert!(hero.hp < hero.max_hp, EHeroAlreadyFullHp);

        let heal_cost = bank.heal_cost;

        let payment_value = coin::value(&payment);
        assert!(payment_value >= heal_cost, EInsufficientPayment);

        let hp_restored = hero.max_hp - hero.hp;

        let mut payment_balance = coin::into_balance(payment);
        let heal_payment = balance::split(&mut payment_balance, heal_cost);

        balance::join(&mut bank.balance, heal_payment);

        if (balance::value(&payment_balance) > 0) {
            let change = coin::from_balance(payment_balance, ctx);
            transfer::public_transfer(change, ctx.sender());
        } else {
            balance::destroy_zero(payment_balance);
        };

        hero.hp = hero.max_hp;

        event::emit(HealEvent {
            hero_id: object::id(hero),
            cost: heal_cost,
            hp_restored,
            hp_after: hero.hp,
        });
    }

    entry fun deposit(
        _admin: &AdminCap,
        bank: &mut GameBank,
        payment: Coin<IOTA>,
    ) {
        let amount = coin::value(&payment);
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut bank.balance, payment_balance);

        event::emit(DepositEvent {
            amount,
            new_balance: balance::value(&bank.balance),
        });
    }

    entry fun withdraw(
        _admin: &AdminCap,
        bank: &mut GameBank,
        amount: u64,
        ctx: &mut TxContext,
    ) {
        assert!(balance::value(&bank.balance) >= amount, EInsufficientBankBalance);
        let withdrawn = balance::split(&mut bank.balance, amount);
        let coin = coin::from_balance(withdrawn, ctx);
        transfer::public_transfer(coin, ctx.sender());
    }

    entry fun set_heal_cost(
        _admin: &AdminCap,
        bank: &mut GameBank,
        new_cost: u64,
    ) {
        let old_cost = bank.heal_cost;
        bank.heal_cost = new_cost;

        event::emit(HealCostUpdatedEvent {
            old_cost,
            new_cost,
        });
    }

    fun get_entry_fee(monster_tier: u8): u64 {
        if (monster_tier == TIER_1) {
            ENTRY_FEE_TIER_1
        } else if (monster_tier == TIER_2) {
            ENTRY_FEE_TIER_2
        } else if (monster_tier == TIER_3) {
            ENTRY_FEE_TIER_3
        } else {
            ENTRY_FEE_TIER_4
        }
    }

    fun get_win_threshold(monster_tier: u8, hero_level: u64): u64 {
        let base = if (monster_tier == TIER_1) {
            80
        } else if (monster_tier == TIER_2) {
            70
        } else if (monster_tier == TIER_3) {
            60
        } else {
            50
        };

        let level_bonus = if (hero_level > 10) { 10 } else if (hero_level > 1) { hero_level - 1 } else { 0 };

        let total = base + level_bonus;
        if (total > 95) { 95 } else { total }
    }

    fun get_base_reward(monster_tier: u8): u64 {
        if (monster_tier == TIER_1) {
            1
        } else if (monster_tier == TIER_2) {
            2
        } else if (monster_tier == TIER_3) {
            4
        } else {
            8
        }
    }

    fun get_win_damage(monster_tier: u8): (u64, u64) {
        if (monster_tier == TIER_1) {
            (5, 15)
        } else if (monster_tier == TIER_2) {
            (10, 20)
        } else if (monster_tier == TIER_3) {
            (15, 25)
        } else {
            (20, 30)
        }
    }

    fun get_lose_damage(monster_tier: u8): (u64, u64) {
        if (monster_tier == TIER_1) {
            (15, 25)
        } else if (monster_tier == TIER_2) {
            (20, 35)
        } else if (monster_tier == TIER_3) {
            (30, 45)
        } else {
            (40, 60)
        }
    }

    fun try_level_up(hero: &mut Hero): bool {
        let xp_threshold = hero.level * 100;
        
        if (hero.xp >= xp_threshold) {
            hero.level = hero.level + 1;
            hero.xp = hero.xp - xp_threshold;
            hero.max_hp = hero.max_hp + 10;
            hero.hp = hero.max_hp;

            event::emit(LevelUpEvent {
                hero_id: object::id(hero),
                new_level: hero.level,
                xp_threshold,
            });

            if (hero.xp >= hero.level * 100) {
                try_level_up(hero);
            };

            return true
        };

        false
    }

    public fun get_hp(hero: &Hero): u64 {
        hero.hp
    }

    public fun get_max_hp(hero: &Hero): u64 {
        hero.max_hp
    }

    public fun get_xp(hero: &Hero): u64 {
        hero.xp
    }

    public fun get_level(hero: &Hero): u64 {
        hero.level
    }

    public fun is_alive(hero: &Hero): bool {
        hero.hp > 0
    }

    public fun xp_to_next_level(hero: &Hero): u64 {
        let threshold = hero.level * 100;
        if (hero.xp >= threshold) {
            0
        } else {
            threshold - hero.xp
        }
    }

    public fun get_bank_balance(bank: &GameBank): u64 {
        balance::value(&bank.balance)
    }

    public fun get_heal_cost(bank: &GameBank): u64 {
        bank.heal_cost
    }

    public fun get_admin(bank: &GameBank): address {
        bank.admin
    }
}
