import filter from 'leo-profanity';

// --- METADATA ---
export const GAME_META = {
    version: "v1.1.6", // Change this number here to update everywhere!
    studio: "2130 Studios",
    releaseNotes: [
      {
        version: "1.1.6",
        date: "2026-03-12",
        status: "current",
        notes: [
          "Channel 3 check events received a full voice pass for stronger flavor and more consistent tone",
          "Failure and critical failure outcomes for C3 checks were reworked so bad rolls feel materially punishing",
          "Added 13 new monster encounters: goblins, trolls, hydras, vampires, liches, necromancers, and a beholder",
          "Roll modifier breakdown now appears on all event modals so you can always see what contributed to your roll",
          "Roll result now shows explicit math: Rolled X + Bonus Y = Z",
          "Profile screen now includes a tabbed Personal Build Breakdown (Race / Class / Combinations) with win rate, avg score, best, worst, and bankrupt rate",
          "Lifetime Service run count now excludes restarts and resets",
          "Channel 3 leaderboard now only shows players with a linked Channel 3 account",
          "Long-press hold-to-repeat temporarily disabled on market Buy and Sell buttons",
        ],
      },
      {
        version: "1.1.5",
        date: "2026-03-04",
        status: "stable",
        notes: [
          "Event Manager development tool for creating and testing game events",
          "Form-based event configuration with real-time JSON preview",
          "Ability to create, edit, and manage combat/skill check event configs",
          "Supabase integration for event persistence and global event pool management",
          "Dev tools accessible in development mode only from start screen",
          "Channel 3 logo integration on navigation buttons",
          "Arrow icon styling improvements on return buttons",
          "Enhanced game logs analyzer with comprehensive performance tables",
          "Race balance analysis: win rates, death rates, average scores by race",
          "Class balance analysis: performance breakdown by class",
          "Race/Class combo analysis: top 15 combinations ranked by performance",
          "Quit game filtering: excludes Quit (Menu) and Quit (Restart) from statistics for accuracy",
          "RLS bypass with SERVICE_ROLE_KEY support for secure database analysis",
        ],
      },
      {
        version: "1.1.4",
        date: "2026-03-03",
        status: "stable",
    notes: [
      "Rebalanced Orc and Merchant race stats for improved viability",
      "Increased useLongPress delay for better UX on button interactions",
      "Fixed hasTraded flag being set on failed trade actions (insufficient funds/inventory)",
    ],
  },
      {
        version: "1.1.3",
        date: "2026-02-24",
        status: "stable",
        notes: [
          "Enhanced Channel 3 integration for improved in-game browser compatibility",
          "Improvements to game over screen handling with Channel 3 support",
          "Better account linking and profile synchronization",
          "Bug fixes and stability improvements for Channel 3 API communication",
        ],
      },
      {
        version: "1.1.2",
        date: "2026-02-23",
        status: "stable",
        notes: [
          "Full Channel 3 integration with automatic account linking",
          "Channel 3 user authentication and profile support",
          "Seamless profile migration for existing gamer tags",
          "Support for Channel 3 profile images in user profiles",
          "Comprehensive Channel 3 API integration finalized",
          "Improved game session logging with Channel 3 data",
        ],
      },
      {
        version: "1.1.1",
        date: "2026-02-08",
        status: "archive",
        notes: [
          "Major overhaul of market system with improved pricing mechanics",
          "Complete redesign of user profile pages with stats tracking",
          "Enhanced character performance analytics and history",
          "Optimization of trading calculations",
          "Improved inventory management interface",
        ],
      },
      {
        version: "1.1.0",
        date: "2026-02-09",
        status: "archive",
        notes: [
          "Introduction of Dragon encounters with unique combat mechanics",
          "Random build selection at game start for variety",
          "Migration of events database to Supabase for better scalability",
          "Screen cleanup and improved user interface",
          "Enhanced random event system balance",
          "New named characters for flavor events",
        ],
      },
      {
        version: "1.0.0",
        date: "2026-02-01",
        status: "archive",
        notes: [
          "Initial release of Dwarf Wars on production servers",
          "Complete trading system with 6 item types (rations, ale, potions, tools, scrolls, gems)",
          "Combat system with 6 races and 6 classes with unique bonuses",
          "4 unique locations with dynamic pricing and risk mechanics",
          "Real-time leaderboards with daily, weekly, monthly, and all-time filters",
          "Google authentication and character profile management",
          "Game session logging and comprehensive analytics",
          "Profanity filtering for gamer tags",
          "31-day gameplay with debt interest mechanics",
          "Upgrade system with permanent stat-boosting items",
        ],
      },
    ]
};

export const RACES = [
    { 
      id: 'human', name: 'Human', desc: 'Versatile.',
      bonus: 'Inventory +20',
      stats: {
        inventory: 20,
        health: 10,
        buyMod: 0,
        sellMod: 0,
        combat: 1,
        wisdom: 0,
        intelligence: 0,
        charisma: 0,
        dexterity: 0,
        constitution: 0,
        stealth: 0
      }
    },
    { 
      id: 'dwarf', name: 'Dwarf', desc: 'Greedy Negotiator.',
      bonus: 'Sell for +10% more',
      stats: {
        inventory: 0,
        health: 40,
        buyMod: 0,
        sellMod: 0.10,
        combat: 0,
        wisdom: 0,
        intelligence: 0,
        charisma: 0,
        dexterity: 0,
        constitution: 0,
        stealth: 0
      }
    },
    { 
      id: 'elf', name: 'Elf', desc: 'Charismatic.',
      bonus: 'Buy for 15% less',
      stats: {
        inventory: 5,
        health: -10,
        buyMod: 0.15,
        sellMod: 0,
        combat: 0,
        wisdom: 0,
        intelligence: 0,
        charisma: 0,
        dexterity: 0,
        constitution: 0,
        stealth: 0
      }
    },
    { 
      id: 'orc', name: 'Orc', desc: 'Intimidating.',
      bonus: 'Huge Inventory & Strong',
      stats: {
        inventory: 40,
        health: 20,
        buyMod: -0.05,
        sellMod: -0.05,
        combat: 2,
        wisdom: 0,
        intelligence: 0,
        charisma: 0,
        dexterity: 0,
        constitution: 0,
        stealth: 0
      }
    },
        { 
      id: 'kobold', name: 'Kobold', desc: 'Dragon Servant.',
      bonus: 'Combat +5 vs Dragons, Horde Tactics',
      stats: {
        inventory: 30,
        health: -20,
        buyMod: 0,
        sellMod: 0,
        combat: 0,
        wisdom: 0,
        intelligence: 0,
        charisma: 0,
        dexterity: 0,
        constitution: 0,
        stealth: 0
      }
    },
    { 
      id: 'halfling', name: 'Halfling', desc: 'Slippery.',
      bonus: 'Combat +5 vs Guards',
      stats: {
        inventory: 5,
        health: -15,
        buyMod: 0.05,
        sellMod: 0.05,
        combat: 0,
        wisdom: 0,
        intelligence: 0,
        charisma: 0,
        dexterity: 0,
        constitution: 0,
        stealth: 0
      }
    }
];
  
export const CLASSES = [
    { 
      id: 'bard', name: 'Bard', desc: 'Charismatic.',
      startingMoney: 600, 
      startingDebt: 2000,
      stats: {
        combat: 0,
        wisdom: 0,
        intelligence: 0,
        charisma: 0,
        dexterity: 0,
        constitution: 0,
        stealth: 0
      }
    },
    { 
      id: 'merchant', name: 'Merchant', desc: 'Born to trade.',
      startingMoney: 2000, 
      startingDebt: 10000,
      stats: {
        combat: 0,
        wisdom: 0,
        intelligence: 0,
        charisma: 0,
        dexterity: 0,
        constitution: 0,
        stealth: 0
      }
    },
    { 
      id: 'monk', name: 'Monk', desc: 'Self-sufficient.',
      startingMoney: 0, 
      startingDebt: 0,
      stats: {
        combat: 0,
        wisdom: 0,
        intelligence: 0,
        charisma: 0,
        dexterity: 0,
        constitution: 0,
        stealth: 0
      }
    },
    { 
      id: 'rogue', name: 'Rogue', desc: 'Hidden in Shadows.',
      startingMoney: 300, 
      startingDebt: 3000,
      stats: {
        combat: 0,
        wisdom: 0,
        intelligence: 0,
        charisma: 0,
        dexterity: 0,
        constitution: 0,
        stealth: 0
      }
    },
    { 
      id: 'warrior', name: 'Warrior', desc: 'Fighter.',
      startingMoney: 600, 
      startingDebt: 6000,
      stats: {
        combat: 0,
        wisdom: 0,
        intelligence: 0,
        charisma: 0,
        dexterity: 0,
        constitution: 0,
        stealth: 0
      }
    }, 
    { 
      id: 'wizard', name: 'Wizard', desc: 'Arcane Power.',
      startingMoney: 1000, 
      startingDebt: 6000,
      stats: {
        combat: 0,
        wisdom: 0,
        intelligence: 0,
        charisma: 0,
        dexterity: 0,
        constitution: 0,
        stealth: 0
      }
    }
];

// --- ECONOMY ---
export const BASE_PRICES = { 
    rations: 10, 
    ale: 50, 
    potions: 200, 
    tools: 500, 
    scrolls: 1500, 
    gems: 5000 
};

export const LOCATIONS = [
    { 
        name: "The Royal City", risk: 0.1, 
        prices: { rations: 1.0, ale: 1.2, potions: 1.0, tools: 0.8, scrolls: 1.0, gems: 1.2 } 
    },
    { 
        name: "Goblin Slums", risk: 0.4, 
        prices: { rations: 1.5, ale: 0.5, potions: 0.8, tools: 1.2, scrolls: 0.5, gems: 0.5 } 
    },
    { 
        name: "Elven Forest", risk: 0.2, 
        prices: { rations: 1.0, ale: 1.5, potions: 0.5, tools: 1.5, scrolls: 0.8, gems: 1.1 } 
    },
    { 
        name: "Iron Forge", risk: 0.1, 
        prices: { rations: 1.2, ale: 0.8, potions: 1.0, tools: 0.5, scrolls: 1.2, gems: 0.4 } 
    },
    { 
        name: "Orc Badlands", risk: 0.6, 
        prices: { rations: 0.8, ale: 0.8, potions: 1.5, tools: 1.0, scrolls: 1.5, gems: 0.9 } 
    }
];

export const UPGRADES = [
    // --- INVENTORY ---
    { id: 'mule', name: 'Pack Mule', type: 'inventory', value: 20, cost: 1000, desc: "+20 Slots" },
    { id: 'wagon', name: 'Merchant Wagon', type: 'inventory', value: 50, cost: 3000, desc: "+50 Slots" },

    // --- DEFENSE ---
    { id: 'jerkin', name: 'Leather Jerkin', type: 'defense', value: 5, cost: 800, desc: "-5 Dmg Taken" },
    { id: 'chain', name: 'Chain Mail', type: 'defense', value: 10, cost: 2000, desc: "-10 Dmg Taken", ban: { class: ['wizard', 'monk'], race: ['halfling','kobold'] } },
    { id: 'plate', name: 'Plate Armor', type: 'defense', value: 20, cost: 5000, desc: "-20 Dmg Taken", req: { class: 'warrior' } },
    { id: 'cloak', name: 'Shadow Cloak', type: 'defense', value: 15, cost: 3500, desc: "-15 Dmg Taken", req: { class: 'rogue' } },
    
    // --- WEAPONS (Standard) ---
    // WARRIOR BALANCE: Banned Warrior from Steel Sword & Hammer. 
    // They must go Dagger -> Great Sword -> Mithril Axe.
    { id: 'dagger', name: 'Iron Dagger', type: 'combat', value: 2, cost: 500, desc: "+2 Combat Roll", ban: { class: 'wizard' } },
    
    { id: 'sword', name: 'Steel Sword', type: 'combat', value: 5, cost: 2000, desc: "+5 Combat Roll", 
      ban: { race: ['halfling','kobold'], class: ['wizard', 'warrior'] } },
    
    { id: 'hammer', name: 'War Hammer', type: 'combat', value: 8, cost: 8000, desc: "+8 Combat Roll", 
      ban: { race: ['halfling','kobold', 'orc'], class: ['wizard','bard','rogue', 'warrior']} }, 

     // --- CLASS SPECIFIC ---
    { id: 'crossbow', name: 'Crossbow', type: 'combat', value: 5, cost: 3000, desc: "+5 Combat", req: { class: 'rogue' } },
    { id: 'sword2', name: 'Great Sword', type: 'combat', value: 7, cost: 3000, desc: "+7 Combat", req: { class: 'warrior' }, ban: {race: ['orc']} },
    { id: 'scroll', name: 'Scroll: Frost Fingers', type: 'combat', value: 2, cost: 800, desc: "+2 Combat", req: { class: 'wizard' } },
    { id: 'scroll1', name: 'Scroll: Acid Arrow', type: 'combat', value: 4, cost: 2000, desc: "+3 Combat", req: { class: 'wizard' } },
    { id: 'scroll2', name: 'Scroll: Fireball', type: 'combat', value: 7, cost: 7000, desc: "+7 Combat", req: { class: 'wizard' } },
    { id: 'axe3', name: 'Mithril Axe', type: 'combat', value: 10, cost: 10000, desc: "+10 Combat Roll", ban: { race: 'halfling' } , req: { class: 'warrior' } },
    { id: 'lute', name: 'Master Lute', type: 'combat', value: 6, cost: 4500, desc: "+6 Combat", req: { class: 'bard' } },
    { id: 'whip', name: 'Whip', type: 'combat', value: 5, cost: 3000, desc: "+5 Combat", req: { class: 'merchant' } },
    { id: 'staff', name: 'Staff', type: 'combat', value: 6, cost: 4500, desc: "+6 Combat", req: { class: 'monk' } },

    // --- RACE SPECIFIC ---
    { id: 'axe2', name: 'Orcish Axe', type: 'combat', value: 6, cost: 6000, desc: "+6 Combat", req: { race: 'orc' } },
    { id: 'slingshot', name: 'Halfling Sling', type: 'combat', value: 4, cost: 1500, desc: "+4 Combat", req: { race: 'halfling' } },
    { id: 'spear', name: 'Kobold Spear', type: 'combat', value: 4, cost: 1500, desc: "+4 Combat", req: { race: 'kobold' } },

    // --- CONSUMABLE ---
    { id: 'elixir', name: 'Elixir of Life', type: 'heal', value: 0.75, cost: 10000, desc: "Heals 75% HP" }
];

// --- PROFANITY FILTER ---
filter.loadDictionary('en');
const STRICT_BAN_LIST = [
    'shithead', 'dumbass', 'jackass', 'kickass', 
    'scumbag', 'douchebag', 'asshole'
];

export const validateName = (name) => {
    if (!name) return "Name is required.";
    if (name.length > 30) return "Name is too long (Max 30 chars).";
    const lowerName = name.toLowerCase();
    if (filter.check(name)) return "That name is not allowed.";
    for (const badWord of STRICT_BAN_LIST) {
        if (lowerName.includes(badWord)) {
            return "That name is not allowed.";
        }
    }
    return null; 
};