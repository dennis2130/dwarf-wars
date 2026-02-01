import { RACES, CLASSES, LOCATIONS, EVENTS, UPGRADES, BASE_PRICES } from '../src/gameData.js';

const SIMULATION_RUNS = 1000;
const MAX_DAYS = 31;

let globalStats = {
    runs: 0, wins: 0, 
    totalScore: 0, 
    scores: [], // To calc median
    highestScore: -Infinity, lowestScore: Infinity,
    raceStats: {},
    classStats: {}
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
        health: 100 + race.stats.health,
        priceMod: 1.0 - race.stats.haggle
    };

    const recalcPrices = (loc, eventMod = 1.0) => {
        let newPrices = {};
        for (const item in BASE_PRICES) {
            const volatility = Math.random() * 2.0 + 0.25; 
            const locMod = loc.prices[item] || 1.0;
            newPrices[item] = Math.ceil(BASE_PRICES[item] * volatility * locMod * eventMod * state.priceMod);
        }
        state.prices = newPrices;
    };

    recalcPrices(state.location);

    while (state.day < MAX_DAYS && state.health > 0) {
        // --- GREEDY BOT ---
        // 1. SELL High
        for (const item in state.inventory) {
            if (state.inventory[item] > 0) {
                if (state.prices[item] > BASE_PRICES[item] * 1.2 || state.day === MAX_DAYS) {
                    state.money += state.inventory[item] * state.prices[item];
                    state.inventory[item] = 0;
                }
            }
        }

        // 2. BUY Low
        const currentItems = Object.values(state.inventory).reduce((a, b) => a + b, 0);
        let space = state.maxInventory - currentItems;

        if (space > 0) {
            const deals = Object.keys(BASE_PRICES)
                .map(key => ({ id: key, price: state.prices[key], ratio: state.prices[key] / BASE_PRICES[key] }))
                .sort((a, b) => a.ratio - b.ratio);

            for (let deal of deals) {
                if (space <= 0) break;
                if (deal.ratio < 0.8 && state.money >= deal.price) {
                    const canAfford = Math.floor(state.money / deal.price);
                    const buyAmount = Math.min(space, canAfford);
                    state.inventory[deal.id] += buyAmount;
                    state.money -= buyAmount * deal.price;
                    space -= buyAmount;
                }
            }
        }

        // 3. DEBT STRATEGY (Greedy: Only pay at end or if filthy rich)
        if (state.day === MAX_DAYS - 1 || state.money > 100000) {
             const pay = Math.min(state.money, state.debt);
             state.debt -= pay;
             state.money -= pay;
        }

        // End Turn
        state.day++;
        if (state.debt > 0) state.debt += Math.ceil(state.debt * 0.05);

        // Travel
        let nextLoc;
        do { nextLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]; } 
        while (nextLoc.name === state.location.name);
        state.location = nextLoc;
        
        let eventMod = 1.0;
        if (Math.random() <= nextLoc.risk) {
            if (Math.random() > 0.5) state.health -= 10;
            else state.money -= Math.floor(state.money * 0.10);
        }
        recalcPrices(nextLoc, eventMod);
    }

    return { score: state.money - state.debt };
}

// --- RUNNER ---
console.log(`Starting Simulation: ${SIMULATION_RUNS} runs...`);
const startTime = Date.now();

for (let i = 0; i < SIMULATION_RUNS; i++) {
    const r = RACES[Math.floor(Math.random() * RACES.length)];
    const c = CLASSES[Math.floor(Math.random() * CLASSES.length)];
    const result = runSingleGame(r, c);

    globalStats.runs++;
    globalStats.totalScore += result.score;
    globalStats.scores.push(result.score);
    if (result.score > 0) globalStats.wins++;
    if (result.score > globalStats.highestScore) globalStats.highestScore = result.score;
    if (result.score < globalStats.lowestScore) globalStats.lowestScore = result.score;

    // Track Race Balance
    if (!globalStats.raceStats[r.name]) globalStats.raceStats[r.name] = { runs: 0, total: 0 };
    globalStats.raceStats[r.name].runs++;
    globalStats.raceStats[r.name].total += result.score;

    // Track Class Balance
    if (!globalStats.classStats[c.name]) globalStats.classStats[c.name] = { runs: 0, total: 0 };
    globalStats.classStats[c.name].runs++;
    globalStats.classStats[c.name].total += result.score;
}

const duration = (Date.now() - startTime) / 1000;
globalStats.scores.sort((a, b) => a - b);
const median = globalStats.scores[Math.floor(globalStats.scores.length / 2)];

// --- REPORT ---
console.log("\n==========================================");
console.log(`DWARF WARS SIMULATION REPORT (${duration}s)`);
console.log("==========================================");
console.log(`Total Runs: ${globalStats.runs}`);
console.log(`Win Rate:   ${((globalStats.wins / globalStats.runs) * 100).toFixed(1)}%`);
console.log("\n--- SCORE DISTRIBUTION ---");
console.log(`Highest:    ${globalStats.highestScore.toLocaleString()}`);
console.log(`Average:    ${Math.floor(globalStats.totalScore / globalStats.runs).toLocaleString()}`);
console.log(`Median:     ${median.toLocaleString()}`);
console.log(`Lowest:     ${globalStats.lowestScore.toLocaleString()}`);

console.log("\n--- BALANCE: RACES (Avg Score) ---");
const raceBal = Object.entries(globalStats.raceStats)
    .map(([key, data]) => ({ race: key, avg: Math.floor(data.total / data.runs).toLocaleString(), runs: data.runs }))
    .sort((a, b) => parseInt(b.avg.replace(/,/g,'')) - parseInt(a.avg.replace(/,/g,'')));
console.table(raceBal);

console.log("\n--- BALANCE: CLASSES (Avg Score) ---");
const classBal = Object.entries(globalStats.classStats)
    .map(([key, data]) => ({ class: key, avg: Math.floor(data.total / data.runs).toLocaleString(), runs: data.runs }))
    .sort((a, b) => parseInt(b.avg.replace(/,/g,'')) - parseInt(a.avg.replace(/,/g,'')));
console.table(classBal);
console.log("==========================================");