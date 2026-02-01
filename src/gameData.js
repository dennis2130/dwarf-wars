export const RACES = [
    { 
      id: 'human', name: 'Human', desc: 'Versatile.',
      bonus: 'Inventory +20', // Buffed
      stats: { inventory: 10, health: 0, haggle: 0 } 
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
      startingMoney: 300, 
      startingDebt: 5000
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

// 1. Force it to load the English dictionary
// (If this still causes issues, we will add a manual list)
filter.loadDictionary('en'); 

export const validateName = (name) => {
    if (!name) return "Name is required.";
    if (name.length > 15) return "Name is too long (Max 15 chars).";
    
    // 2. Clean the input (remove spaces/numbers to catch "b a d w o r d" or "b4dword")
    // This makes the filter much stricter
    const cleanName = name.replace(/[^a-zA-Z]/g, ""); 

    // 3. Check both the raw name AND the cleaned name
    if (filter.check(name) || filter.check(cleanName)) {
        return "That name is not allowed.";
    }
    
    return null; 
};