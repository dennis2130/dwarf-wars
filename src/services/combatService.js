export const normalizeStatName = (statName) => {
    if (!statName) return 'combat';
    const key = String(statName).toLowerCase();
    const aliases = {
        wis: 'wisdom',
        int: 'intelligence',
        cha: 'charisma',
        dex: 'dexterity',
        con: 'constitution',
        str: 'combat'
    };
    return aliases[key] || key;
};

export const getStatModifier = (source, statName) => {
    if (!source || !statName) return 0;
    const value = source.stats?.[statName];
    return Number.isFinite(value) ? value : 0;
};

export const formatStatLabel = (statName) => {
    if (!statName) return 'Check';
    return statName.charAt(0).toUpperCase() + statName.slice(1);
};

export const getEventRollBonusBreakdown = (event, playerRace, playerClass, combatBonus, playerItems = []) => {
    if (!event || !event.config?.stat) return { total: 0, breakdown: [] };

    const stat = normalizeStatName(event.config.stat);
    const breakdown = [];
    let total = 0;

    const raceStatBonus = getStatModifier(playerRace, stat);
    if (raceStatBonus !== 0) {
        breakdown.push({ label: `${playerRace.name} ${formatStatLabel(stat)}`, value: raceStatBonus });
        total += raceStatBonus;
    }

    const classStatBonus = getStatModifier(playerClass, stat);
    if (classStatBonus !== 0) {
        breakdown.push({ label: `${playerClass.name} ${formatStatLabel(stat)}`, value: classStatBonus });
        total += classStatBonus;
    }

    // Combat-specific sources are additive with general race/class stat bonuses.
    if (stat === 'combat') {
        // Calculate weapon vs elixir bonuses separately
        let weaponBonus = 0;
        let elixirBonus = 0;
        
        // Check playerItems for weapons (type 'combat') and elixirs with combat bonus
        playerItems.forEach(item => {
            if (item.type === 'combat' && typeof item.value === 'number') {
                weaponBonus += item.value;
            }
            if (item.type === 'elixir' && typeof item.value === 'object' && item.value.combat) {
                elixirBonus += item.value.combat;
            }
        });

        if (weaponBonus > 0) {
            breakdown.push({ label: 'Weapon', value: weaponBonus });
            total += weaponBonus;
        }

        if (elixirBonus > 0) {
            breakdown.push({ label: 'Elixir', value: elixirBonus });
            total += elixirBonus;
        }

        if (playerRace.id === 'kobold' && event.slug === 'dragon') {
            breakdown.push({ label: 'Dragon Slayer (Kobold)', value: 5 });
            total += 5;
        }

        if (playerRace.id === 'halfling' && event.slug === 'guards') {
            breakdown.push({ label: 'Guard Evasion (Halfling)', value: 5 });
            total += 5;
        }
    } else {
        // For non-combat stats, check elixir items for bonuses
        let elixirStatBonus = 0;
        playerItems.forEach(item => {
            if (item.type === 'elixir' && typeof item.value === 'object' && item.value[stat]) {
                elixirStatBonus += item.value[stat];
            }
        });

        if (elixirStatBonus !== 0) {
            breakdown.push({ label: 'Elixir', value: elixirStatBonus });
            total += elixirStatBonus;
        }
    }

    return { total, breakdown };
};
