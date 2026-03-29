// Pure event filtering, selection, and resolution logic

export const generateD20Roll = () => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (array[0] % 20) + 1;
};

export const calculateNetWorth = (resources, currentPrices, handleSellPrice) => {
    const inventoryValue = Object.keys(resources.inventory).reduce((total, item) => {
        const count = resources.inventory[item]?.count || 0;
        const price = handleSellPrice(currentPrices[item] || 0);
        return total + (count * price);
    }, 0);
    return resources.money + inventoryValue;
};

export const filterValidEvents = (eventPool, netWorth, day, c3EncountersUsed, debt) => {
    return eventPool.filter(e => {
        const conf = e.config || {};
        
        if (netWorth < (e.req_net_worth || 0)) return false;
        if (conf.req_debt && debt <= 0) return false;
        if (conf.req_min_day && day < conf.req_min_day) return false;
        if (conf.req_max_day && day > conf.req_max_day) return false;
        
        // C3 encounter filtering: day-based net worth thresholds
        // Applies to both type 'c3_check' and events with config.c3_encounter flag
        if (conf.c3_encounter || e.type === 'c3_check') {
            if (c3EncountersUsed >= 3) return false;
            if (day < 15 && netWorth < 1000000) return false;
            if (day >= 15 && netWorth < 10000) return false;
        }
        
        return true;
    });
};

export const weightEvents = (validEvents, netWorth) => {
    const weightedPool = [];
    validEvents.forEach(e => {
        const weight = e.risk_weight || 1;
        for (let i = 0; i < weight; i++) weightedPool.push(e);
        
        if (e.slug === 'guards' && netWorth > 1000000) {
            for (let i = 0; i < 10; i++) weightedPool.push(e);
        }
    });
    return weightedPool;
};

export const selectRandomEvent = (weightedPool) => {
    if (weightedPool.length === 0) return null;
    return weightedPool[Math.floor(Math.random() * weightedPool.length)];
};

export const resolveOutcome = (d20, bonus, difficulty, config) => {
    let outcomeKey = 'fail';
    const total = d20 + bonus;
    
    if (d20 === 20) outcomeKey = 'crit_success';
    else if (d20 === 1) outcomeKey = 'crit_fail';
    else if (total >= difficulty) outcomeKey = 'success';
    
    return {
        outcomeKey,
        d20,
        bonus,
        total,
        outcomeData: config.outcomes[outcomeKey]
    };
};

export const personalizeEventText = (text, c3PlayerName) => {
    if (!c3PlayerName) return text;
    return text.replace('{c3_player_name}', c3PlayerName)
               .replace('{player_name}', c3PlayerName);
};

export const randomizeEventValue = (base) => {
    const variation = base * 0.20;
    const randomOffset = (Math.random() - 0.5) * 2 * variation;
    return Math.floor(base + randomOffset);
};

export const determineEventMessageType = (eventType) => {
    const typeToMessageMap = {
        'heal': 'good',
        'money': 'good',
        'price': 'bad',
        'flavor': 'good',
    };
    return typeToMessageMap[eventType] || 'bad';
};

export const isMonsterCombatEvent = (slug, trackedSlugs = new Set()) => {
    return slug && !trackedSlugs.has(String(slug).trim().toLowerCase());
};
