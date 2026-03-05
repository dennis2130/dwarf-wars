// scripts/analyze_logs.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Manually point to the .env file in the root directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') }); // Go up one level to root

// 2. Debug check (Don't paste your real keys here, just check if they are undefined)
console.log("Loading keys from:", path.join(__dirname, '../.env'));
console.log("URL Found:", !!process.env.VITE_SUPABASE_URL);
console.log("Anon Key Found:", !!process.env.VITE_SUPABASE_ANON_KEY);
console.log("Service Key Found:", !!process.env.VITE_SUPERBASE_SERVICE_KEY);

// Load environment variables from .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use SERVICE_ROLE key if available (bypasses RLS), otherwise fall back to ANON key
const supabaseKey = process.env.VITE_SUPERBASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Missing VITE_SUPABASE_URL or VITE_SUPERBASE_SERVICE_KEY/VITE_SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

console.log(`Using ${process.env.VITE_SUPERBASE_SERVICE_KEY ? 'SERVICE_ROLE' : 'ANON'} key for Supabase access\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyze() {
    console.log("Fetching Game Logs...");
    
    // First, try a count query to see if table has data
    const { count, error: countError } = await supabase
        .from('game_logs')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("Count Query Error:", countError);
    } else {
        console.log(`Total records in game_logs table: ${count}`);
    }
    
    // Fetch last 1000 logs
    const { data: logs, error } = await supabase
        .from('game_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

    if (error) {
        console.error("Supabase Query Error:", error.message);
        console.error("Error Details:", error);
        return;
    }

    console.log(`Analyzed ${logs.length} sessions.\n`);

    // Filter out quit games (Menu and Restart)
    const logsFiltered = logs.filter(log => !log.status.includes('Quit'));
    console.log(`After filtering quits: ${logsFiltered.length} sessions.\n`);

    // --- METRICS ---
    let deaths = 0;
    let wins = 0;
    let bankrupt = 0;
    let quits = 0;
    let totalScore = 0;
    let causes = {};
    let racePerformance = {};
    let classPerformance = {};
    let comboPerformance = {};
    let combatTotal = { wins: 0, losses: 0, flees: 0 };

    logsFiltered.forEach(log => {
        // Status Counts
        // FIX: Check cause_of_death too, because sometimes status is wrong
        const isDead = log.status === 'Dead' || (log.cause_of_death && log.cause_of_death !== 'Time Limit' && !log.cause_of_death.includes('Quit'));
        
        if (isDead) deaths++;
        else if (log.status === 'Bankrupt') bankrupt++;
        else if (log.status.includes('Quit')) quits++;
        else wins++;

        // Score (Already filtered quits, so just add all)
        totalScore += log.score;

        // Cause of Death
        if (log.cause_of_death) {
            causes[log.cause_of_death] = (causes[log.cause_of_death] || 0) + 1;
        }

        // Combat Stats (Summing up JSONB data)
        if (log.combat_stats) {
            combatTotal.wins += log.combat_stats.wins || 0;
            combatTotal.losses += log.combat_stats.losses || 0;
            combatTotal.flees += log.combat_stats.flees || 0;
        }

        // Race Balance
        const r = log.race || 'Unknown';
        if (!racePerformance[r]) racePerformance[r] = { runs: 0, score: 0, deaths: 0 };
        racePerformance[r].runs++;
        racePerformance[r].score += log.score;
        if (isDead) racePerformance[r].deaths++;

        // Class Balance
        const c = log.class || 'Unknown';
        if (!classPerformance[c]) classPerformance[c] = { runs: 0, score: 0, deaths: 0 };
        classPerformance[c].runs++;
        classPerformance[c].score += log.score;
        if (isDead) classPerformance[c].deaths++;

        // Race/Class Combo Balance
        const combo = `${r}/${c}`;
        if (!comboPerformance[combo]) comboPerformance[combo] = { runs: 0, score: 0, deaths: 0 };
        comboPerformance[combo].runs++;
        comboPerformance[combo].score += log.score;
        if (isDead) comboPerformance[combo].deaths++;
    });

    // --- REPORT ---
    console.log("=== GLOBAL STATS ===");
    console.log(`Survivors:   ${wins + bankrupt} (${(((wins+bankrupt)/logsFiltered.length)*100).toFixed(1)}%)`);
    console.log(`Deaths:      ${deaths} (${((deaths/logsFiltered.length)*100).toFixed(1)}%)`);
    console.log(`Avg Score:   ${Math.floor(totalScore / logsFiltered.length).toLocaleString()}`);

    console.log("\n=== CAUSE OF DEATH ===");
    console.table(Object.entries(causes).sort((a,b) => b[1] - a[1]).reduce((acc, [k,v]) => ({...acc, [k]: v}), {}));

    console.log("\n=== COMBAT BEHAVIOR ===");
    const totalFights = combatTotal.wins + combatTotal.losses + combatTotal.flees;
    console.log(`Total Encounters: ${totalFights}`);
    console.log(`Fight Rate:       ${(((combatTotal.wins + combatTotal.losses) / totalFights) * 100).toFixed(1)}%`);
    console.log(`Flee Rate:        ${((combatTotal.flees / totalFights) * 100).toFixed(1)}%`);
    console.log(`Win Rate (Fight): ${((combatTotal.wins / (combatTotal.wins + combatTotal.losses)) * 100).toFixed(1)}%`);

    console.log("\n=== RACE BALANCE ===");
    const raceTable = Object.entries(racePerformance).map(([race, stats]) => ({
        race,
        runs: stats.runs,
        avg_score: Math.floor(stats.score / stats.runs).toLocaleString(),
        death_rate: ((stats.deaths / stats.runs) * 100).toFixed(1) + '%'
    })).sort((a,b) => parseInt(b.avg_score.replace(/,/g,'')) - parseInt(a.avg_score.replace(/,/g,'')));
    console.table(raceTable);

    console.log("\n=== CLASS BALANCE ===");
    const classTable = Object.entries(classPerformance).map(([cls, stats]) => ({
        class: cls,
        runs: stats.runs,
        avg_score: Math.floor(stats.score / stats.runs).toLocaleString(),
        death_rate: ((stats.deaths / stats.runs) * 100).toFixed(1) + '%'
    })).sort((a,b) => parseInt(b.avg_score.replace(/,/g,'')) - parseInt(a.avg_score.replace(/,/g,'')));
    console.table(classTable);

    console.log("\n=== RACE/CLASS COMBO (Top 15) ===");
    const comboTable = Object.entries(comboPerformance).map(([combo, stats]) => ({
        combo,
        runs: stats.runs,
        avg_score: Math.floor(stats.score / stats.runs).toLocaleString(),
        death_rate: ((stats.deaths / stats.runs) * 100).toFixed(1) + '%'
    })).sort((a,b) => parseInt(b.avg_score.replace(/,/g,'')) - parseInt(a.avg_score.replace(/,/g,''))).slice(0, 15);
    console.table(comboTable);
}

analyze();