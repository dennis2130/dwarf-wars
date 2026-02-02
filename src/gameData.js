export const RACES = [
    { 
      id: 'human', name: 'Human', desc: 'Versatile.',
      bonus: 'Inventory +10, Health +10', // Buffed
      stats: { inventory: 10, health: 10, haggle: 0 } 
    },
    { 
      id: 'dwarf', name: 'Dwarf', desc: 'Greedy.',
      bonus: 'Health +40',
      stats: { inventory: 0, health: 40, haggle: 0 } // Buffed
    },
    { 
      id: 'elf', name: 'Elf', desc: 'Charismatic.',
      bonus: 'Better Prices (15%)', // Buffed
      stats: { inventory: 10, health: -10, haggle: 0.15 } 
    },
    { 
      id: 'orc', name: 'Orc', desc: 'Strong.',
      bonus: 'Huge Inventory (+20)', // Buffed
      stats: { inventory: 20, health: 20, haggle: -0.15 } 
    }
];
  
export const CLASSES = [
    { 
      id: 'merchant', name: 'Merchant', desc: 'Born to trade.',
      startingMoney: 1000, 
      startingDebt: 5000
    },
    { 
      id: 'rogue', name: 'Rogue', desc: 'Low Debt.',
      startingMoney: 300, 
      startingDebt: 1000
    },
    { 
      id: 'warrior', name: 'Warrior', desc: 'Fighter.',
      startingMoney: 600, 
      startingDebt: 3000
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
    { id: 'mule', name: 'Pack Mule', type: 'inventory', value: 20, cost: 1000, desc: "+20 Slots" },
    { id: 'wagon', name: 'Merchant Wagon', type: 'inventory', value: 50, cost: 3000, desc: "+50 Slots" },
    { id: 'shield', name: 'Wooden Shield', type: 'defense', value: 10, cost: 500, desc: "-10 Dmg" },
    { id: 'armor', name: 'Mithril Mail', type: 'defense', value: 30, cost: 8000, desc: "-30 Dmg" }
];

export const EVENTS = [
  { id: 'dragon', text: "A Dragon attacks!", type: 'damage', value: 30 },
  { id: 'mugger', text: "A thief bumps into you.", type: 'theft', value: 0.10 },
  { id: 'healer', text: "A cleric blesses you.", type: 'heal', value: 25 },
  { id: 'find',   text: "You find a coin purse.", type: 'money', value: 200 },
  { id: 'sale',   text: "Market Crash!", type: 'price', value: 0.5 },
  { id: 'riot',   text: "Riots! Prices high.", type: 'price', value: 2.0 }
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