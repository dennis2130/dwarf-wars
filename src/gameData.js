// src/gameData.js

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
      stats: { inventory: 0, health: -10, haggle: 0.05 } // Positive haggle = discount
    },
    { 
      id: 'orc', 
      name: 'Orc', 
      desc: 'Strong but scary.',
      bonus: 'Start with Weapon (Not implemented yet)',
      stats: { inventory: 10, health: 10, haggle: -0.10 } // Negative haggle = price penalty
    }
  ];
  
  export const CLASSES = [
    { 
      id: 'merchant', 
      name: 'Merchant', 
      desc: 'Born to trade.',
      bonus: 'Start with 500g',
      startingMoney: 500,
      startingDebt: 5000
    },
    { 
      id: 'rogue', 
      name: 'Rogue', 
      desc: 'Good at running away.',
      bonus: 'Lower Debt Start (2500g)',
      startingMoney: 100,
      startingDebt: 2500
    },
    { 
      id: 'warrior', 
      name: 'Warrior', 
      desc: 'Ready for a fight.',
      bonus: 'Max Health +50',
      startingMoney: 100,
      startingDebt: 5000
    }
  ];