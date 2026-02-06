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
console.log("Key Found:", !!process.env.VITE_SUPABASE_ANON_KEY);

// Load environment variables from .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Or SERVICE_ROLE key if you have RLS enabled

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyze() {
    console.log("Fetching Game Logs...");
    
    // Fetch last 1000 logs
    const { data: logs, error } = await supabase
        .from('game_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

    if (error) {
        console.error("Supabase Error:", error.message);
        return;
    }

    console.log(`Analyzed ${logs.length} sessions.\n`);

    // --- METRICS ---
    let deaths = 0;
    let wins = 0;
    let bankrupt = 0;
    let quits = 0;
    let totalScore = 0;
    let causes = {};
    let racePerformance = {};
    let combatTotal = { wins: 0, losses: 0, flees: 0 };

    logs.forEach(log => {
        // Status Counts
        // FIX: Check cause_of_death too, because sometimes status is wrong
        const isDead = log.status === 'Dead' || (log.cause_of_death && log.cause_of_death !== 'Time Limit' && !log.cause_of_death.includes('Quit'));
        
        if (isDead) deaths++;
        else if (log.status === 'Bankrupt') bankrupt++;
        else if (log.status.includes('Quit')) quits++;
        else wins++;

        // Score (Only count finished games for avg)
        if (!log.status.includes('Quit')) {
            totalScore += log.score;
        }

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
        if (log.status === 'Dead') racePerformance[r].deaths++;
        if (isDead) racePerformance[r].deaths++; // Use the new isDead variable
    });

    // --- REPORT ---
    console.log("=== GLOBAL STATS ===");
    console.log(`Survivors:   ${wins + bankrupt} (${(((wins+bankrupt)/logs.length)*100).toFixed(1)}%)`);
    console.log(`Deaths:      ${deaths} (${((deaths/logs.length)*100).toFixed(1)}%)`);
    console.log(`Quits:       ${quits}`);
    console.log(`Avg Score:   ${Math.floor(totalScore / (logs.length - quits)).toLocaleString()}`);

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
}

analyze();