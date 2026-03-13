import { RACES, CLASSES, LOCATIONS, UPGRADES, BASE_PRICES } from '../src/gameData.js';

const SIMULATION_RUNS = 10000;
const MAX_DAYS = 31;

// Mock event pool (replace with DB fetch if needed)
const SIM_EVENTS = [
    // Add realistic event mocks for all types
    { id: 'dragon', type: 'combat', category: 'combat', text: 'Dragon attacks!', enemy: 'Dragon', damage: 60, difficulty: 18, goldLoss: 0 },
    { id: 'mugger', type: 'combat', category: 'combat', text: 'Mugger ambushes!', enemy: 'Spin', damage: 20, difficulty: 12, goldLoss: 0.10 },
    { id: 'healer', type: 'heal', category: 'health', value: 25 },
    { id: 'find', type: 'money', category: 'gold', value: 200 },
    { id: 'sale', type: 'price', category: 'market', value: 0.5 },
    { id: 'riot', type: 'price', category: 'market', value: 2.0 },
    // C3 flavor/check events (mocked)
    { id: 'c3_check_gems', type: 'c3_check', category: 'gems', stat: 'wisdom', difficulty: 13, outcomes: { crit_success: { gems: 25 }, success: { gems: 15 }, fail: { gems: -8 }, crit_fail: { gems: -15 } } },
    { id: 'c3_check_gold', type: 'c3_check', category: 'gold', stat: 'charisma', difficulty: 15, outcomes: { crit_success: { gold: 500 }, success: { gold: 320 }, fail: { gold: -150 }, crit_fail: { gold: -500 } } },
    // ...add more as needed
];

let globalStats = {
    runs: 0, wins: 0, totalScore: 0, scores: [], highestScore: -Infinity, lowestScore: Infinity,
    raceStats: {}, classStats: {}, deaths: 0, bankruptcies: 0, dragonsKilled: 0, guardsEncountered: 0, c3Encounters: 0
};

function runSingleGame(race, charClass) {
    let state = {
        money: charClass.startingMoney,
        debt: charClass.startingDebt,
        day: 1,
        inventory: Object.keys(BASE_PRICES).reduce((acc, key) => ({ ...acc, [key]: { count: 0, avg: 0 } }), {}),
        location: LOCATIONS[0],
        prices: { ...BASE_PRICES },
        maxInventory: 50 + race.stats.inventory,
        maxHealth: 100 + race.stats.health,
        health: 100 + race.stats.health,
        combatBonus: (race.stats.combat || 0),
        priceMod: 1.0,
        c3EncountersUsed: 0,
        gems: 0,
        gemsAvg: 0,
    };

    const getBuyPrice = (base) => Math.ceil(base * (1.0 - (race.stats.buyMod || 0)));
    const getSellPrice = (base) => Math.floor(base * 0.80 * (1.0 + (race.stats.sellMod || 0)));
    const recalcPrices = (loc) => {
        let newPrices = {};
        for (const item in BASE_PRICES) {
            const volatility = Math.random() * 2.0 + 0.25;
            const locMod = loc.prices[item] || 1.0;
            newPrices[item] = Math.floor(BASE_PRICES[item] * volatility * locMod * state.priceMod);
        }
        state.prices = newPrices;
    };
    recalcPrices(state.location);

    while (state.day < MAX_DAYS && state.health > 0) {
        // Survival logic
        if (state.health < state.maxHealth * 0.35 && state.money >= 500) {
            state.money -= 500;
            state.health = Math.min(state.health + 50, state.maxHealth);
        }

        // Sell logic
        for (const item in state.inventory) {
            const data = state.inventory[item];
            if (data.count > 0) {
                const sellPrice = getSellPrice(state.prices[item]);
                if ((sellPrice > data.avg * 1.1) || state.day === MAX_DAYS) {
                    state.money += data.count * sellPrice;
                    state.inventory[item] = { count: 0, avg: 0 };
                }
            }
        }

        // Buy logic
        const totalItems = Object.values(state.inventory).reduce((a, b) => a + b.count, 0);
        let space = state.maxInventory - totalItems;
        if (space > 0) {
            const deals = Object.keys(BASE_PRICES)
                .map(key => {
                    const buyPrice = getBuyPrice(state.prices[key]);
                    return { id: key, buyPrice, ratio: buyPrice / BASE_PRICES[key] };
                })
                .sort((a, b) => a.ratio - b.ratio);
            for (let deal of deals) {
                if (space <= 0) break;
                if (deal.ratio < 1.0 && state.money >= deal.buyPrice + 2000) {
                    const canAfford = Math.floor((state.money - 2000) / deal.buyPrice);
                    const buyAmount = Math.min(space, canAfford);
                    if (buyAmount > 0) {
                        const currentData = state.inventory[deal.id];
                        const totalValue = (currentData.count * currentData.avg) + (buyAmount * deal.buyPrice);
                        state.inventory[deal.id] = {
                            count: currentData.count + buyAmount,
                            avg: totalValue / (currentData.count + buyAmount)
                        };
                        state.money -= buyAmount * deal.buyPrice;
                        space -= buyAmount;
                    }
                }
            }
        }

        // Upgrades
        if (state.money > 10000 && state.combatBonus < 5) {
            state.money -= 2000;
            state.combatBonus += 5;
        }

        // End turn
        state.day++;
        if (state.debt > 0) state.debt += Math.ceil(state.debt * 0.05);
        if (state.health < state.maxHealth * 0.25) state.health -= 5;
        else state.health -= 2;
        if (state.health <= 0) break;

        // Travel
        let nextLoc;
        do { nextLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]; } while (nextLoc.name === state.location.name);
        state.location = nextLoc;

        // --- EVENT LOGIC ---
        // Simulate realistic event pool selection
        let eventPool = SIM_EVENTS.filter(e => {
            // Filter by day, net worth, etc. if needed
            return true;
        });
        // C3 encounter gating
        if (state.c3EncountersUsed < 2 && Math.random() < 0.15) {
            // Simulate C3 Check event
            const c3Event = SIM_EVENTS.find(e => e.type === 'c3_check');
            if (c3Event) {
                state.c3EncountersUsed++;
                // Simulate player choice: 80% help, 20% walk away
                if (Math.random() < 0.8) {
                    // Roll d20
                    const d20 = Math.ceil(Math.random() * 20);
                    let outcome;
                    if (d20 === 20) outcome = 'crit_success';
                    else if (d20 === 1) outcome = 'crit_fail';
                    else if (d20 + (state[c3Event.stat] || 0) >= c3Event.difficulty) outcome = 'success';
                    else outcome = 'fail';
                    const effect = c3Event.outcomes[outcome];
                    // Harmful crit fail logic
                    if (outcome === 'crit_fail') {
                        if (c3Event.category === 'gems') {
                            // Lose gems
                            state.gems = Math.max(0, state.gems - Math.abs(effect.gems || 10));
                        } else if (c3Event.category === 'gold') {
                            // Lose gold
                            state.money = Math.max(0, state.money + (effect.gold || -500));
                        } else if (c3Event.category === 'health') {
                            // Lose HP
                            state.health = Math.max(0, state.health + (effect.health || -30));
                        } else if (c3Event.category === 'inventory') {
                            // Lose inventory
                            state.maxInventory = Math.max(0, state.maxInventory + (effect.max_inventory || -20));
                        }
                    } else {
                        if (effect.gems) {
                            const newGemCount = state.gems + Math.abs(effect.gems);
                            const newAvg = (state.gems * state.gemsAvg + (effect.gems > 0 ? effect.gems * 0 : 0)) / (newGemCount || 1);
                            state.gems = Math.max(0, newGemCount);
                            state.gemsAvg = newAvg;
                        }
                        if (effect.gold) state.money += effect.gold;
                        if (effect.max_inventory) state.maxInventory += effect.max_inventory;
                        if (effect.health) state.health += effect.health;
                    }
                }
                // else: walk away, no effect
            }
        } else {
            // Standard event
            const event = eventPool[Math.floor(Math.random() * eventPool.length)];
            if (!event) continue;
            if (event.type === 'combat') {
                let dmg = event.damage;
                let diff = event.difficulty;
                let goldLoss = event.goldLoss || 0;
                const rollNeeded = diff - state.combatBonus;
                const winChance = (21 - rollNeeded) / 20;
                const costToPay = goldLoss > 0 ? state.money * goldLoss : 0;
                if (winChance > 0.6 || costToPay > 10000 || event.id === 'dragon') {
                    const d20 = Math.ceil(Math.random() * 20);
                    const total = d20 + state.combatBonus;
                    if (d20 === 20) {
                        state.money += 500;
                        if (event.id === 'dragon') globalStats.dragonsKilled++;
                    } else if (d20 === 1) {
                        if (event.id === 'dragon') {
                            Object.keys(state.inventory).forEach(k => state.inventory[k].count = Math.floor(state.inventory[k].count / 2));
                            state.health -= 20;
                        } else {
                            state.money = Math.floor(state.money * 0.5);
                            state.health -= 20;
                        }
                    } else if (total >= diff) {
                        state.money += 200;
                        if (event.id === 'dragon') globalStats.dragonsKilled++;
                    } else {
                        state.health -= dmg;
                        if (goldLoss > 0) state.money -= Math.floor(state.money * goldLoss);
                    }
                } else {
                    if (goldLoss > 0) state.money -= Math.floor(state.money * goldLoss);
                    else state.health -= Math.floor(dmg / 2);
                }
            } else if (event.type === 'money') state.money += event.value;
            else if (event.type === 'heal') state.health = Math.min(state.health + event.value, state.maxHealth);
            else if (event.type === 'price') state.priceMod *= event.value;
        }
        recalcPrices(nextLoc);
    }
    const finalScore = state.money - state.debt;
    return { score: finalScore, dead: state.health <= 0 };
}

// --- RUNNER ---
console.log(`Starting Simulation: ${SIMULATION_RUNS} runs...`);
const startTime = Date.now();
for (let i = 0; i < SIMULATION_RUNS; i++) {
    const r = RACES[Math.floor(Math.random() * RACES.length)];
    const c = CLASSES[Math.floor(Math.random() * CLASSES.length)];
    const result = runSingleGame(r, c);
    globalStats.runs++;
    if (result.dead) globalStats.deaths++;
    else {
        globalStats.totalScore += result.score;
        globalStats.scores.push(result.score);
        if (result.score > 0) globalStats.wins++; else globalStats.bankruptcies++;
        if (result.score > globalStats.highestScore) globalStats.highestScore = result.score;
        if (result.score < globalStats.lowestScore) globalStats.lowestScore = result.score;
    }
    if (!globalStats.raceStats[r.name]) globalStats.raceStats[r.name] = { runs: 0, total: 0, deaths: 0 };
    globalStats.raceStats[r.name].runs++;
    if (result.dead) globalStats.raceStats[r.name].deaths++;
    else globalStats.raceStats[r.name].total += result.score;
    if (!globalStats.classStats[c.name]) globalStats.classStats[c.name] = { runs: 0, total: 0, deaths: 0 };
    globalStats.classStats[c.name].runs++;
    if (result.dead) globalStats.classStats[c.name].deaths++;
    else globalStats.classStats[c.name].total += result.score;
}
const duration = (Date.now() - startTime) / 1000;
globalStats.scores.sort((a, b) => a - b);
const median = globalStats.scores[Math.floor(globalStats.scores.length / 2)] || 0;
console.log("\n==========================================");
console.log(`DWARF WARS SIMULATION REPORT (${duration}s)`);
console.log("==========================================");
console.log(`Total Runs: ${globalStats.runs}`);
console.log(`Survivors:  ${globalStats.runs - globalStats.deaths} (${((1 - globalStats.deaths/globalStats.runs)*100).toFixed(1)}%)`);
console.log(`Deaths:     ${globalStats.deaths} (${((globalStats.deaths/globalStats.runs)*100).toFixed(1)}%)`);
console.log(`Dragons:    ${globalStats.dragonsKilled} killed`);
console.log(`Guards:     ${globalStats.guardsEncountered} encounters`);
console.log("\n--- SCORE (Survivors Only) ---");
console.log(`Highest:    ${globalStats.highestScore.toLocaleString()}`);
console.log(`Median:     ${median.toLocaleString()}`);
console.log(`Lowest:     ${globalStats.lowestScore.toLocaleString()}`);
console.log("\n--- BALANCE: RACES ---");
const raceBal = Object.entries(globalStats.raceStats)
    .map(([key, data]) => ({ race: key, avg_score: data.runs - data.deaths > 0 ? Math.floor(data.total / (data.runs - data.deaths)).toLocaleString() : 0, death_rate: ((data.deaths / data.runs) * 100).toFixed(1) + '%' }))
    .sort((a, b) => parseInt(b.avg_score.replace(/,/g,'')) - parseInt(a.avg_score.replace(/,/g,'')));
console.table(raceBal);
console.log("\n--- BALANCE: CLASSES ---");
const classBal = Object.entries(globalStats.classStats)
    .map(([key, data]) => ({ class: key, avg_score: data.runs - data.deaths > 0 ? Math.floor(data.total / (data.runs - data.deaths)).toLocaleString() : 0, death_rate: ((data.deaths / data.runs) * 100).toFixed(1) + '%' }))
    .sort((a, b) => parseInt(b.avg_score.replace(/,/g,'')) - parseInt(a.avg_score.replace(/,/g,'')));
console.table(classBal);
console.log("==========================================");