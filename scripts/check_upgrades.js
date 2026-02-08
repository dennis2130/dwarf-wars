import { RACES, CLASSES, UPGRADES } from '../src/gameData.js';

// --- 1. HELPER: The Logic from GameScreen ---
// This duplicates the logic in GameScreen to ensure the test is accurate
function isAvailable(upgrade, raceId, classId) {
    // 1. CHECK BANS
    if (upgrade.ban) {
        // Check Race Ban
        if (Array.isArray(upgrade.ban.race)) {
            if (upgrade.ban.race.includes(raceId)) return false;
        } else if (upgrade.ban.race === raceId) {
            return false;
        }

        // Check Class Ban
        if (Array.isArray(upgrade.ban.class)) {
            if (upgrade.ban.class.includes(classId)) return false;
        } else if (upgrade.ban.class === classId) {
            return false;
        }
    }

    // 2. CHECK REQS
    if (upgrade.req) {
        // Check Race Req
        if (upgrade.req.race) {
            if (Array.isArray(upgrade.req.race)) {
                if (!upgrade.req.race.includes(raceId)) return false;
            } else if (upgrade.req.race !== raceId) {
                return false;
            }
        }

        // Check Class Req
        if (upgrade.req.class) {
            if (Array.isArray(upgrade.req.class)) {
                if (!upgrade.req.class.includes(classId)) return false;
            } else if (upgrade.req.class !== classId) {
                return false;
            }
        }
    }
    
    return true; 
}

// --- 2. VALUE ANALYSIS (Cost Efficiency) ---
console.log("\n==========================================");
console.log("💰 ITEM VALUE ANALYSIS (Cost per Point)");
console.log("==========================================");

const analysis = UPGRADES.map(u => {
    let type = u.type;
    // Consumables are hard to calc value for, so we separate them
    if (type === 'heal') return null; 

    return {
        Item: u.name,
        Type: u.type,
        Bonus: u.value,
        Cost: u.cost,
        "Cost/Pt": Math.floor(u.cost / u.value) // Lower is better deal
    };
}).filter(Boolean); // Remove nulls

// Sort by Type, then by Cost Efficiency
analysis.sort((a, b) => {
    if (a.Type !== b.Type) return a.Type.localeCompare(b.Type);
    return a["Cost/Pt"] - b["Cost/Pt"];
});

console.table(analysis);


// --- 3. AVAILABILITY CHECK (Combo Matrix) ---
console.log("\n==========================================");
console.log("🛡️  AVAILABILITY CHECK (Items per Build)");
console.log("==========================================");

const combos = [];

RACES.forEach(race => {
    CLASSES.forEach(charClass => {
        // Run the filter
        const available = UPGRADES.filter(u => isAvailable(u, race.id, charClass.id));
        
        // Find Exclusive items (ones with requirements)
        const exclusives = available
            .filter(u => u.req)
            .map(u => u.name)
            .join(", ");

        combos.push({
            "Race/Class": `${race.name} ${charClass.name}`,
            "Total Items": available.length,
            "Exclusives": exclusives || "None"
        });
    });
});

console.table(combos);