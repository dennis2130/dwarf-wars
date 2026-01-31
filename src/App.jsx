import { useState } from 'react'
import { RACES, CLASSES } from './gameData'

function App() {
  // --- APP STATE (Controls which screen we see) ---
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameover'
  
  // --- PLAYER STATE ---
  const [player, setPlayer] = useState({ name: '', race: null, class: null });
  
  // Derived stats (calculated when game starts)
  const [maxInventory, setMaxInventory] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [health, setHealth] = useState(100);
  const [priceMod, setPriceMod] = useState(1); // 1.0 = normal prices

  // --- GAME LOOP STATE ---
  const [money, setMoney] = useState(100);
  const [debt, setDebt] = useState(5000);
  const [day, setDay] = useState(1);
  const [inventory, setInventory] = useState({ rations: 0, potions: 0, gems: 0 });
  const [location, setLocation] = useState("The Royal City");
  const [log, setLog] = useState([]);

  // --- CONFIG ---
  const MAX_DAYS = 31;
  const LOCATIONS = ["The Royal City", "Goblin Slums", "Elven Forest", "Iron Forge", "Orc Badlands"];
  const BASE_PRICES = { rations: 10, potions: 150, gems: 1000 };
  const [currentPrices, setCurrentPrices] = useState(BASE_PRICES);

  // --- START GAME LOGIC ---
  const startGame = () => {
    if(!player.name || !player.race || !player.class) return alert("Complete your character!");

    // 1. Apply Race Bonuses
    let inv = 20 + player.race.stats.inventory;
    let hp = 100 + player.race.stats.health;
    let pm = 1.0 - player.race.stats.haggle; // e.g., 1.0 - 0.05 = 0.95 (Cheaper prices)

    // 2. Apply Class Bonuses
    if (player.class.id === 'warrior') hp += 50;
    
    // 3. Set the State
    setMoney(player.class.startingMoney);
    setDebt(player.class.startingDebt);
    setMaxInventory(inv);
    setMaxHealth(hp);
    setHealth(hp);
    setPriceMod(pm);

    setLog([`Welcome ${player.name} the ${player.race.name} ${player.class.name}!`, "Good luck."]);
    setGameState('playing');
  };

  // --- PLAYING LOGIC ---
  const totalItems = Object.values(inventory).reduce((a, b) => a + b, 0);

  const buyItem = (item) => {
    // Apply the Race's haggling modifier to the price
    const cost = Math.ceil(currentPrices[item] * priceMod); 
    
    if (totalItems >= maxInventory) return setLog(prev => ["Inventory full!", ...prev]);
    
    if (money >= cost) {
      setMoney(money - cost);
      setInventory({ ...inventory, [item]: inventory[item] + 1 }); 
      setLog(prev => [`Bought ${item} for ${cost}g`, ...prev]);
    } else {
      setLog(prev => ["Not enough gold!", ...prev]);
    }
  };

  const sellItem = (item) => {
    if (inventory[item] > 0) {
      // Selling price uses the same modifier (fair market value)
      const value = Math.floor(currentPrices[item] * priceMod); 
      setMoney(money + value);
      setInventory({ ...inventory, [item]: inventory[item] - 1 });
      setLog(prev => [`Sold ${item} for ${value}g`, ...prev]);
    }
  };

  const payDebt = () => {
    if (money > 0 && debt > 0) {
      const amount = Math.min(money, debt);
      setMoney(money - amount);
      setDebt(debt - amount);
      setLog(prev => [`Paid ${amount}g to the Loan Shark.`, ...prev]);
    }
  };

  const travel = () => {
    if (day >= MAX_DAYS) return alert("Game Over! Time's up!");
    
    setDay(day + 1);
    
    // Interest Logic
    if (debt > 0) {
      const interest = Math.ceil(debt * 0.10);
      setDebt(d => d + interest);
      setLog(prev => [`Day ${day+1}: Interest accrued ${interest}g`, ...prev]);
    } else {
      setLog(prev => [`Day ${day+1}: A new dawn.`, ...prev]);
    }

    const nextLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    setLocation(nextLoc);

    // Randomize Prices
    const newPrices = { ...BASE_PRICES };
    for (const item in newPrices) {
      const volatility = Math.random() * 0.5 + 0.75; 
      newPrices[item] = Math.floor(BASE_PRICES[item] * volatility);
    }
    setCurrentPrices(newPrices);
  };

  // --- SCREEN 1: CHARACTER CREATION ---
  if (gameState === 'start') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 p-6 max-w-md mx-auto border-x border-slate-700">
        <h1 className="text-3xl font-bold text-yellow-500 mb-6 text-center">Dwarf Wars</h1>
        
        <div className="space-y-6">
          {/* NAME INPUT */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input 
              type="text" 
              className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-yellow-500 outline-none transition-colors"
              placeholder="Enter name..."
              onChange={(e) => setPlayer({...player, name: e.target.value})}
            />
          </div>

          {/* RACE SELECTION */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Race</label>
            <div className="grid grid-cols-2 gap-2">
              {RACES.map(r => (
                <button 
                  key={r.id}
                  onClick={() => setPlayer({...player, race: r})}
                  className={`p-3 rounded border text-sm text-left transition-all ${player.race?.id === r.id ? 'bg-yellow-900 border-yellow-500' : 'bg-slate-800 border-slate-600 hover:bg-slate-700'}`}
                >
                  <div className="font-bold text-yellow-500">{r.name}</div>
                  <div className="text-xs text-slate-300">{r.bonus}</div>
                </button>
              ))}
            </div>
          </div>

          {/* CLASS SELECTION */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Class</label>
            <div className="grid grid-cols-1 gap-2">
              {CLASSES.map(c => (
                <button 
                  key={c.id}
                  onClick={() => setPlayer({...player, class: c})}
                  className={`p-3 rounded border text-sm text-left transition-all ${player.class?.id === c.id ? 'bg-blue-900 border-blue-500' : 'bg-slate-800 border-slate-600 hover:bg-slate-700'}`}
                >
                  <div className="font-bold text-blue-400">{c.name}</div>
                  <div className="text-xs text-slate-300">{c.desc} <span className="text-slate-500">({c.bonus})</span></div>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={startGame}
            disabled={!player.name || !player.race || !player.class}
            className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-lg mt-4 text-lg transition-all"
          >
            Begin Adventure
          </button>
        </div>
      </div>
    );
  }

  // --- SCREEN 2: MAIN GAME ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 max-w-md mx-auto border-x border-slate-700">
      
      {/* HEADER */}
      <header className="flex justify-between items-start mb-4 border-b border-slate-700 pb-2">
        <div>
            <h1 className="text-xl font-bold text-yellow-500">{player.name}</h1>
            <p className="text-xs text-slate-400">{player.race?.name} {player.class?.name}</p>
        </div>
        <div className="text-right text-sm">
          <p>Day: <span className="text-white font-bold">{day}/{MAX_DAYS}</span></p>
          <p className="text-xs text-blue-400">{location}</p>
        </div>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-slate-800 p-2 rounded shadow">
           <div className="text-xs text-slate-400">GOLD</div>
           <div className="text-green-400 font-bold">{money}</div>
        </div>
        <div className="bg-slate-800 p-2 rounded shadow">
           <div className="text-xs text-slate-400">DEBT</div>
           <div className="text-red-400 font-bold">{debt}</div>
           {debt > 0 && <button onClick={payDebt} className="text-[10px] underline text-blue-400">Pay</button>}
        </div>
        <div className="bg-slate-800 p-2 rounded shadow">
           <div className="text-xs text-slate-400">HEALTH</div>
           <div className="text-blue-400 font-bold">{health}/{maxHealth}</div>
        </div>
      </div>

      {/* MARKETPLACE */}
      <div className="mb-4">
        <h2 className="text-xs font-bold mb-2 text-slate-500 uppercase tracking-widest">Marketplace</h2>
        <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
            {Object.keys(currentPrices).map((item) => (
            <div key={item} className="flex justify-between items-center p-3 border-b border-slate-700 last:border-0">
                <div className="w-1/3 capitalize font-bold text-slate-300">{item}</div>
                <div className="w-1/3 text-center text-yellow-500 font-mono">
                  {Math.ceil(currentPrices[item] * priceMod)} g
                </div>
                <div className="w-1/3 flex justify-end gap-2">
                <button onClick={() => buyItem(item)} className="bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-xs font-bold transition-colors">Buy</button>
                <button onClick={() => sellItem(item)} className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs font-bold transition-colors">Sell</button>
                </div>
            </div>
            ))}
        </div>
      </div>

      {/* INVENTORY */}
      <div className="mb-4">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inventory</h2>
          <span className="text-xs text-slate-400">{totalItems} / {maxInventory} Slots</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm text-center">
          {Object.entries(inventory).map(([key, count]) => (
            <div key={key} className="bg-slate-800 p-2 rounded border border-slate-700">
              <div className="capitalize text-slate-400 text-xs mb-1">{key}</div>
              <div className="text-white font-bold text-lg">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTION */}
      <button 
        onClick={travel}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg shadow-lg mb-4 text-lg active:scale-95 transition-all"
      >
        Travel to New Location
      </button>

      {/* LOG */}
      <div className="bg-black p-3 rounded-lg h-32 overflow-y-auto text-xs font-mono text-green-500 border border-slate-700 shadow-inner">
        {log.map((entry, i) => (
          <div key={i} className="mb-1 border-b border-gray-900 pb-1 last:border-0"> &gt; {entry}</div>
        ))}
      </div>

    </div>
  )
}

export default App