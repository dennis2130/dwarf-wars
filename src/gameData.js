export const RACES = [
    { 
      id: 'human', 
      name: 'Human', 
      desc: 'Versatile and ambitious.',
      bonus: 'Inventory +5 slots',
      stats: { inventory: 5, health: 0, haggle: 0 } 
    },
    { 
      id: 'dwarf', 
      name: 'Dwarf', 
      desc: 'Sturdy and greedy.',
      bonus: 'Health +20',
      stats: { inventory: 0, health: 20, haggle: 0 } 
    },
    { 
      id: 'elf', 
      name: 'Elf', 
      desc: 'Charismatic and quick.',
      bonus: 'Better Prices (5% discount)',
      stats: { inventory: 0, health: -10, haggle: 0.05 } 
    },
    { 
      id: 'orc', 
      name: 'Orc', 
      desc: 'Strong but scary.',
      bonus: 'Start with Club (Damage Reduction)',
      stats: { inventory: 10, health: 10, haggle: -0.10 } 
    }
  ];
  
export const CLASSES = [
    { 
      id: 'merchant', 
      name: 'Merchant', 
      desc: 'Born to trade.',
      startingMoney: 500,
      startingDebt: 5000
    },
    { 
      id: 'rogue', 
      name: 'Rogue', 
      desc: 'Good at running away.',
      startingMoney: 100,
      startingDebt: 2500
    },
    { 
      id: 'warrior', 
      name: 'Warrior', 
      desc: 'Ready for a fight.',
      startingMoney: 100,
      startingDebt: 5000
    }
];

// --- NEW: LOCATION ECONOMICS ---
// Multipliers: < 1.0 means CHEAP (Supply), > 1.0 means EXPENSIVE (Demand)
export const LOCATIONS = [
    { name: "The Royal City", risk: 0.1, prices: { rations: 1.0, potions: 1.0, gems: 1.2 } }, // High demand for gems
    { name: "Goblin Slums",   risk: 0.4, prices: { rations: 1.5, potions: 0.8, gems: 0.5 } }, // Food scarce, gems stolen/cheap
    { name: "Elven Forest",   risk: 0.2, prices: { rations: 1.0, potions: 0.5, gems: 1.1 } }, // Potions cheap
    { name: "Iron Forge",     risk: 0.1, prices: { rations: 1.2, potions: 1.0, gems: 0.4 } }, // Gems super cheap (Mine)
    { name: "Orc Badlands",   risk: 0.6, prices: { rations: 0.8, potions: 1.5, gems: 0.9 } }  // Food cheap (raids), potions rare
];

// --- NEW: UPGRADES (The 3rd Suggestion) ---
export const UPGRADES = [
    { id: 'mule', name: 'Pack Mule', type: 'inventory', value: 20, cost: 500, desc: "+20 Slots" },
    { id: 'wagon', name: 'Merchant Wagon', type: 'inventory', value: 50, cost: 2000, desc: "+50 Slots" },
    { id: 'shield', name: 'Wooden Shield', type: 'defense', value: 10, cost: 300, desc: "-10 Dmg from Events" },
    { id: 'armor', name: 'Mithril Mail', type: 'defense', value: 30, cost: 5000, desc: "-30 Dmg from Events" }
];

export const EVENTS = [
  { id: 'dragon', text: "A Dragon attacks! You get singed.", type: 'damage', value: 30 },
  { id: 'mugger', text: "A thief bumps into you.", type: 'theft', value: 0.15 },
  { id: 'healer', text: "A cleric blesses you.", type: 'heal', value: 20 },
  { id: 'find',   text: "You find a coin purse.", type: 'money', value: 100 },
  { id: 'sale',   text: "Market Crash! Prices plummeted.", type: 'price', value: 0.5 },
  { id: 'riot',   text: "Riots! Prices are sky high.", type: 'price', value: 2.0 }
];