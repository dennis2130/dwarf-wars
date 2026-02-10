import { RACES, CLASSES, LOCATIONS, UPGRADES, BASE_PRICES } from '../src/gameData.js';

const SIMULATION_RUNS = 10000;
const MAX_DAYS = 31;

// Since EVENTS are now in DB, we mock them locally for the sim
const SIM_EVENTS = [
    { id: 'dragon', type: 'damage', text: 'Dragon', enemy: 'Dragon', damage: 60, difficulty: 18, goldLoss: 0 },
    { id: 'mugger', type: 'theft', text: 'Mugger', enemy: 'Spin', damage: 20, difficulty: 12, goldLoss: 0.10 },
    { id: 'healer', type: 'heal', value: 25 },
    { id: 'find', type: 'money', value: 200 },
    { id: 'sale', type: 'price', value: 0.5 },
    { id: 'riot', type: 'price', value: 2.0 },
    // Flavor events ignored for sim speed
];

let globalStats = {
    runs: 0, wins: 0, 
    totalScore: 0, 
    scores: [],
    highestScore: -Infinity, lowestScore: Infinity,
    raceStats: {},
    classStats: {},
    deaths: 0,
    bankruptcies: 0,
    dragonsKilled: 0,
    guardsEncountered: 0 
};

function runSingleGame(race, charClass) {
    // 1. INIT STATE
    let state = {
        money: charClass.startingMoney,
        debt: charClass.startingDebt,
        day: 1,
        // Inventory is now objects with Count and Avg
        inventory: Object.keys(BASE_PRICES).reduce((acc, key) => ({ ...acc, [key]: { count: 0, avg: 0 } }), {}),
        location: LOCATIONS[0],
        prices: { ...BASE_PRICES },
        maxInventory: 50 + race.stats.inventory,
        maxHealth: 100 + race.stats.health,
        health: 100 + race.stats.health,
        combatBonus: (race.stats.combat || 0),
        priceMod: 1.0 
    };

    // --- PRICE HELPERS (Match App.jsx) ---
    const getBuyPrice = (base) => Math.ceil(base * (1.0 - (race.stats.buyMod || 0)));
    const getSellPrice = (base) => Math.floor(base * 0.80 * (1.0 + (race.stats.sellMod || 0)));

    const recalcPrices = (loc) => {
        let newPrices = {};
        for (const item in BASE_PRICES) {
            const volatility = Math.random() * 2.0 + 0.25; 
            const locMod = loc.prices[item] || 1.0;
            // Calculate the "Spot Price" (Base volatility)
            newPrices[item] = Math.floor(BASE_PRICES[item] * volatility * locMod * state.priceMod);
        }
        state.prices = newPrices;
    };

    recalcPrices(state.location);

    while (state.day < MAX_DAYS && state.health > 0) {
        
        // --- 1. SURVIVAL CHECK ---
        if (state.health < state.maxHealth * 0.35) {
            const cost = 500; // Assume buying potions/healing
            if (state.money >= cost) {
                state.money -= cost;
                state.health = Math.min(state.health + 50, state.maxHealth);
            }
        }

        // --- 2. TRADING (Updated for Avg Cost) ---
        
        // A. SELL LOGIC
        for (const item in state.inventory) {
            const data = state.inventory[item];
            if (data.count > 0) {
                const sellPrice = getSellPrice(state.prices[item]);
                
                // Sell if: Profitable (> Avg) OR Last Day
                // We want decent profit, say 10% margin, unless desperate
                if ((sellPrice > data.avg * 1.1) || state.day === MAX_DAYS) {
                    state.money += data.count * sellPrice;
                    state.inventory[item] = { count: 0, avg: 0 };
                }
            }
        }

        // B. BUY LOGIC
        const totalItems = Object.values(state.inventory).reduce((a, b) => a + b.count, 0);
        let space = state.maxInventory - totalItems;
        
        if (space > 0) {
            // Find deals: Compare BUY PRICE to BASE PRICE
            const deals = Object.keys(BASE_PRICES)
                .map(key => {
                    const buyPrice = getBuyPrice(state.prices[key]);
                    return { 
                        id: key, 
                        buyPrice: buyPrice, 
                        ratio: buyPrice / BASE_PRICES[key] 
                    };
                })
                .sort((a, b) => a.ratio - b.ratio);

            for (let deal of deals) {
                if (space <= 0) break;
                
                // Buy if the price is good (below 1.0 ratio typically means below average)
                // Keep 2000g reserve for events
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

        // --- 3. UPGRADES ---
        // Simple Logic: If rich, buy sword
        if (state.money > 10000 && state.combatBonus < 5) {
            state.money -= 2000;
            state.combatBonus += 5; 
        }

        // --- END TURN ---
        state.day++;
        if (state.debt > 0) state.debt += Math.ceil(state.debt * 0.05);

        // Bleed Check
        if (state.health < state.maxHealth * 0.25) state.health -= 5; 
        else state.health -= 2; // Fatigue

        if (state.health <= 0) break; 

        // Travel
        let nextLoc;
        do { nextLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]; } 
        while (nextLoc.name === state.location.name);
        state.location = nextLoc;
        
        // --- EVENT LOGIC (Mirrors App.jsx) ---
        if (Math.random() <= nextLoc.risk) {
            // 1. Calculate Net Worth (Using Sell Price)
            const invVal = Object.keys(state.inventory).reduce((sum, k) => {
                const price = getSellPrice(state.prices[k]);
                return sum + (state.inventory[k].count * price);
            }, 0);
            const netWorth = state.money + invVal;

            let eventPool = [...SIM_EVENTS];
            
            // Rich check: 1 Million
            if (netWorth > 1000000) {
                const guard = { id: 'guards', type: 'guard_encounter', enemy: 'City Watch', damage: 30, difficulty: 14, goldLoss: 0.25 };
                eventPool.push(guard);
                eventPool.push(guard); // Weighted
            }

            const event = eventPool[Math.floor(Math.random() * eventPool.length)];

            // COMBAT
            if (event.type === 'damage' || event.type === 'theft' || event.type === 'guard_encounter') {
                if (event.id === 'guards') globalStats.guardsEncountered++;

                let dmg = event.damage;
                let diff = event.difficulty;
                let goldLoss = event.goldLoss || 0;

                // Scale Guards if rich
                if (event.id === 'guards' && netWorth > 1000000) {
                    dmg = 50; diff = 16;
                }

                // Bot Logic: Pay or Fight?
                const rollNeeded = diff - state.combatBonus;
                const winChance = (21 - rollNeeded) / 20;
                const costToPay = goldLoss > 0 ? state.money * goldLoss : 0;
                
                // Fight if > 60% win chance OR if paying costs > 10k gold OR Dragon (can't pay)
                if (winChance > 0.6 || costToPay > 10000 || event.id === 'dragon') {
                    // FIGHT
                    const d20 = Math.ceil(Math.random() * 20); // Sim doesn't need crypto random
                    const total = d20 + state.combatBonus;

                    if (d20 === 20) {
                        // CRIT SUCCESS
                        state.money += 500; 
                        if (event.id === 'dragon') globalStats.dragonsKilled++;
                    } else if (d20 === 1) {
                        // CRIT FAIL
                        if (event.id === 'dragon') {
                            Object.keys(state.inventory).forEach(k => state.inventory[k].count = Math.floor(state.inventory[k].count / 2));
                            state.health -= 20;
                        } else if (event.id === 'guards') {
                            state.money = Math.floor(state.money * 0.5);
                            state.health -= 20;
                        } else {
                            state.money = Math.floor(state.money * 0.5);
                        }
                    } else if (total >= diff) {
                        // WIN
                        state.money += 200; 
                        if (event.id === 'dragon') globalStats.dragonsKilled++;
                    } else {
                        // LOSS
                        state.health -= dmg;
                        if (goldLoss > 0) state.money -= Math.floor(state.money * goldLoss);
                    }
                } else {
                    // PAY / RUN
                    if (goldLoss > 0) {
                        state.money -= Math.floor(state.money * goldLoss);
                    } else {
                        state.health -= Math.floor(dmg / 2);
                    }
                }
            }
            else if (event.type === 'money') state.money += 200;
            else if (event.type === 'heal') state.health = Math.min(state.health + 25, state.maxHealth);
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
    .map(([key, data]) => ({ 
        race: key, 
        avg_score: data.runs - data.deaths > 0 ? Math.floor(data.total / (data.runs - data.deaths)).toLocaleString() : 0, 
        death_rate: ((data.deaths / data.runs) * 100).toFixed(1) + '%'
    }))
    .sort((a, b) => parseInt(b.avg_score.replace(/,/g,'')) - parseInt(a.avg_score.replace(/,/g,'')));
console.table(raceBal);

console.log("\n--- BALANCE: CLASSES ---");
const classBal = Object.entries(globalStats.classStats)
    .map(([key, data]) => ({ 
        class: key, 
        avg_score: data.runs - data.deaths > 0 ? Math.floor(data.total / (data.runs - data.deaths)).toLocaleString() : 0, 
        death_rate: ((data.deaths / data.runs) * 100).toFixed(1) + '%'
    }))
    .sort((a, b) => parseInt(b.avg_score.replace(/,/g,'')) - parseInt(a.avg_score.replace(/,/g,'')));
console.table(classBal);
console.log("==========================================");