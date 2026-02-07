export const RACES = [
    { 
      id: 'human', name: 'Human', desc: 'Versatile.',
      bonus: 'Inventory +20',
      stats: { inventory: 20, health: 0, buyMod: 0, sellMod: 0, combat: 0 } 
    },
    { 
      id: 'dwarf', name: 'Dwarf', desc: 'Greedy Negotiator.',
      bonus: 'Sell for +10% more',
      stats: { inventory: 0, health: 40, buyMod: 0, sellMod: 0.10, combat: 0 } 
    },
    { 
      id: 'elf', name: 'Elf', desc: 'Charismatic.',
      bonus: 'Buy for 10% less',
      stats: { inventory: 5, health: -10, buyMod: 0.10, sellMod: 0, combat: 0 } 
    },
    { 
      id: 'orc', name: 'Orc', desc: 'Intimidating.',
      bonus: 'Huge Inventory & Strong',
      stats: { inventory: 40, health: 20, buyMod: -0.10, sellMod: -0.10, combat: 2 } 
      // Orcs pay 10% more AND sell for 10% less (people hate them), but +2 Combat
    }
];

  
export const CLASSES = [
    { 
      id: 'merchant', name: 'Merchant', desc: 'Born to trade.',
      startingMoney: 1000, 
      startingDebt: 10000
    },
    { 
      id: 'rogue', name: 'Rogue', desc: 'Low Debt.',
      startingMoney: 300, 
      startingDebt: 3000
    },
    { 
      id: 'warrior', name: 'Warrior', desc: 'Fighter.',
      startingMoney: 600, 
      startingDebt: 6000
    }
];

// --- NEW ECONOMY ---
export const BASE_PRICES = { 
    rations: 10, 
    ale: 50, 
    potions: 200, 
    tools: 500, 
    scrolls: 1500, 
    gems: 5000 // Gems are now the "Jackpot" item
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
    // ... Mules/Wagons same as before ...
    { id: 'mule', name: 'Pack Mule', type: 'inventory', value: 20, cost: 1000, desc: "+20 Slots" },
    { id: 'wagon', name: 'Merchant Wagon', type: 'inventory', value: 50, cost: 3000, desc: "+50 Slots" },
    
    // NEW WEAPONS (Combat Bonus instead of flat defense)
    { id: 'dagger', name: 'Iron Dagger', type: 'combat', value: 2, cost: 500, desc: "+2 Combat Roll" },
    { id: 'sword', name: 'Steel Sword', type: 'combat', value: 5, cost: 2000, desc: "+5 Combat Roll" },
    { id: 'axe', name: 'Mithril Axe', type: 'combat', value: 10, cost: 8000, desc: "+10 Combat Roll" },

    // NEW: Consumable
    { id: 'elixir', name: 'Elixir of Life', type: 'heal', value: 0.75, cost: 5000, desc: "Heals 75% HP" }
];

export const EVENTS = [
  { id: 'dragon', text: "A Dragon attacks!", type: 'damage', value: 30 },
  { 
    id: 'mugger', 
    text: "Spin the Goblin bumps into you!", 
    type: 'theft', 
    value: 0.10 
  },
    { 
    id: 'healer', 
    text: "Johann the Cleric blesses your journey.", 
    type: 'heal', 
    value: 25 
  },
  { id: 'find',   text: "You find a coin purse.", type: 'money', value: 200 },
  { id: 'sale',   text: "Market Crash!", type: 'price', value: 0.5 },
  { id: 'riot',   text: "Riots! Prices high.", type: 'price', value: 2.0 },
    { 
    id: 'guards', 
    text: "The City Watch recognizes you!", 
    type: 'guard_encounter', 
    value: 0 // Value calculates dynamically based on wealth
  },
{ id: 'rain', text: "A heavy rainstorm slows your travel.", type: 'flavor', value: 0 },
  { id: 'bards', text: "A troupe of bards sings of your exploits.", type: 'flavor', value: 0 },
  { id: 'ruins', text: "You pass ancient dwarven ruins.", type: 'flavor', value: 0 },
  { id: 'wolf', text: "You hear a wolf howl in the distance.", type: 'flavor', value: 0 },
  { id: 'cart', text: "You fix a broken wheel on your cart.", type: 'flavor', value: 0 }
];

import filter from 'leo-profanity';

// 1. Initialize Base Dictionary
filter.loadDictionary('en');

// 2. Custom Strict List (Add words here that you find slipping through)
// The library misses some compound words or specific slang.
const STRICT_BAN_LIST = [
    'shithead', 'dumbass', 'jackass', 'kickass', 
    'scumbag', 'douchebag', 'asshole'
    // Add more here as you find them
];

export const validateName = (name) => {
    if (!name) return "Name is required.";
    if (name.length > 30) return "Name is too long (Max 30 chars).";
    
    // Normalize: lowercase
    const lowerName = name.toLowerCase();
    
    // Check 1: Library Filter (Standard stuff)
    if (filter.check(name)) return "That name is not allowed.";

    // Check 2: Strict List (Manual overrides)
    // We check if the name *contains* any of these words
    for (const badWord of STRICT_BAN_LIST) {
        if (lowerName.includes(badWord)) {
            return "That name is not allowed.";
        }
    }

    return null; 
};