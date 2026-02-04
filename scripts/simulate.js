// scripts/simulate.js
import { RACES, CLASSES, LOCATIONS, EVENTS, UPGRADES, BASE_PRICES } from '../src/gameData.js';

const SIMULATION_RUNS = 10000;
const MAX_DAYS = 31;

let globalStats = {
    runs: 0, wins: 0, 
    totalScore: 0, 
    scores: [],
    highestScore: -Infinity, lowestScore: Infinity,
    raceStats: {},
    classStats: {},
    deaths: 0,
    bankruptcies: 0,
    dragonsKilled: 0
};

function runSingleGame(race, charClass) {
    let state = {
        money: charClass.startingMoney,
        debt: charClass.startingDebt,
        day: 1,
        inventory: Object.keys(BASE_PRICES).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
        location: LOCATIONS[0],
        prices: { ...BASE_PRICES },
        maxInventory: 50 + race.stats.inventory,
        maxHealth: 100 + race.stats.health,
        health: 100 + race.stats.health,
        combatBonus: (race.stats.combat || 0),
        priceMod: 1.0 // Simplified for sim (Buy/Sell mods average out to ~1.0 impact on profit margin)
    };

    const recalcPrices = (loc) => {
        let newPrices = {};
        for (const item in BASE_PRICES) {
            const volatility = Math.random() * 2.0 + 0.25; 
            const locMod = loc.prices[item] || 1.0;
            newPrices[item] = Math.ceil(BASE_PRICES[item] * volatility * locMod * state.priceMod);
        }
        state.prices = newPrices;
    };

    recalcPrices(state.location);

    while (state.day < MAX_DAYS && state.health > 0) {
        
        // --- 1. SURVIVAL CHECK ---
        // If critical (Bleed threshold is 25%), buy health immediately
        if (state.health < state.maxHealth * 0.35) {
            const cost = 500; 
            if (state.money >= cost) {
                state.money -= cost;
                state.health = Math.min(state.health + 50, state.maxHealth);
            }
        }

        // --- 2. TRADING ---
        // Sell High
        for (const item in state.inventory) {
            if (state.inventory[item] > 0) {
                if (state.prices[item] > BASE_PRICES[item] * 1.2 || state.day === MAX_DAYS) {
                    state.money += state.inventory[item] * state.prices[item];
                    state.inventory[item] = 0;
                }
            }
        }

        // Buy Low
        const currentItems = Object.values(state.inventory).reduce((a, b) => a + b, 0);
        let space = state.maxInventory - currentItems;
        if (space > 0) {
            const deals = Object.keys(BASE_PRICES)
                .map(key => ({ id: key, price: state.prices[key], ratio: state.prices[key] / BASE_PRICES[key] }))
                .sort((a, b) => a.ratio - b.ratio);

            for (let deal of deals) {
                if (space <= 0) break;
                // Reserve 1000g for emergencies
                if (deal.ratio < 0.8 && state.money >= deal.price + 1000) {
                    const canAfford = Math.floor((state.money - 1000) / deal.price);
                    const buyAmount = Math.min(space, canAfford);
                    state.inventory[deal.id] += buyAmount;
                    state.money -= buyAmount * deal.price;
                    space -= buyAmount;
                }
            }
        }

        // --- 3. UPGRADES ---
        if (state.money > 5000 && state.combatBonus < 5) {
            state.money -= 2000;
            state.combatBonus += 5; // Buy Sword
        }

        // --- END TURN ---
        state.day++;
        if (state.debt > 0) state.debt += Math.ceil(state.debt * 0.05);

        // Bleed Check
        if (state.health < state.maxHealth * 0.25) state.health -= 5; 
        else state.health -= 2; 

        if (state.health <= 0) break; 

        let nextLoc;
        do { nextLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]; } 
        while (nextLoc.name === state.location.name);
        state.location = nextLoc;
        
        // Combat
        if (Math.random() <= nextLoc.risk) {
            const eventRoll = Math.random();
            if (eventRoll < 0.3) {
                const isDragon = Math.random() > 0.8;
                const difficulty = isDragon ? 18 : 10;
                const damage = isDragon ? 60 : 20;
                
                const roll = Math.ceil(Math.random() * 20);
                const total = roll + state.combatBonus;

                if (total >= difficulty) {
                    state.money += isDragon ? 1000 : 200; 
                    if (isDragon) globalStats.dragonsKilled++;
                } else {
                    state.health -= damage;
                }
            }
            else if (eventRoll < 0.4) state.money += 200;
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
    
    // TRACKING
    if (result.dead) {
        globalStats.deaths++;
    } else {
        globalStats.totalScore += result.score;
        globalStats.scores.push(result.score);
        
        if (result.score > 0) globalStats.wins++;
        else globalStats.bankruptcies++;

        if (result.score > globalStats.highestScore) globalStats.highestScore = result.score;
        if (result.score < globalStats.lowestScore) globalStats.lowestScore = result.score;
    }

    // Race/Class Balance
    // We track avg score regardless of death (dead = 0 score contribution basically) to see viability
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
console.log("\n--- SCORE (Survivors Only) ---");
console.log(`Highest:    ${globalStats.highestScore.toLocaleString()}`);
console.log(`Median:     ${median.toLocaleString()}`);
console.log(`Lowest:     ${globalStats.lowestScore.toLocaleString()}`);

console.log("\n--- BALANCE: RACES ---");
// Calculates Avg Score of SURVIVORS, but shows Death Rate
const raceBal = Object.entries(globalStats.raceStats)
    .map(([key, data]) => ({ 
        race: key, 
        avg_score: Math.floor(data.total / (data.runs - data.deaths)).toLocaleString(), 
        death_rate: ((data.deaths / data.runs) * 100).toFixed(1) + '%'
    }))
    .sort((a, b) => parseInt(b.avg_score.replace(/,/g,'')) - parseInt(a.avg_score.replace(/,/g,'')));
console.table(raceBal);

console.log("\n--- BALANCE: CLASSES ---");
const classBal = Object.entries(globalStats.classStats)
    .map(([key, data]) => ({ 
        class: key, 
        avg_score: Math.floor(data.total / (data.runs - data.deaths)).toLocaleString(), 
        death_rate: ((data.deaths / data.runs) * 100).toFixed(1) + '%'
    }))
    .sort((a, b) => parseInt(b.avg_score.replace(/,/g,'')) - parseInt(a.avg_score.replace(/,/g,'')));
console.table(classBal);
console.log("==========================================");