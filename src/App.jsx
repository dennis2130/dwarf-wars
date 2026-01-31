import { useState } from 'react'

function App() {
  // --- STATE (The memory of the game) ---
  const [money, setMoney] = useState(100);
  const [debt, setDebt] = useState(5500); // The "Loan Shark"
  const [day, setDay] = useState(1);
  const [inventory, setInventory] = useState({ rations: 0, potions: 0, gems: 0 });
  const [location, setLocation] = useState("The Royal City");
  const [log, setLog] = useState(["Welcome to Dwarf Wars! Pay off your debt before day 31."]);

  // --- GAME CONFIGURATION ---
  const MAX_DAYS = 31;
  const LOCATIONS = ["The Royal City", "Goblin Slums", "Elven Forest", "Iron Forge", "Orc Badlands"];
  
  // Base prices (we will randomize these later)
  const basePrices = {
    rations: 10,
    potions: 150,
    gems: 1000
  };

  // We need current prices in state so they stay same until you travel
  // For now, we just use base prices, but this prepares us for the randomizer
  const [currentPrices, setCurrentPrices] = useState(basePrices);

  // --- ACTIONS ---

  const buyItem = (item) => {
    const cost = currentPrices[item];
    if (money >= cost) {
      setMoney(money - cost);
      setInventory({ ...inventory, [item]: inventory[item] + 1 }); 
      setLog(prev => [`Bought 1 ${item} for ${cost}g`, ...prev]);
    } else {
      // Flash a little alert or just log it
      setLog(prev => [`Not enough gold for ${item}!`, ...prev]);
    }
  };

  const sellItem = (item) => {
    if (inventory[item] > 0) {
      const value = currentPrices[item]; 
      setMoney(money + value);
      setInventory({ ...inventory, [item]: inventory[item] - 1 });
      setLog(prev => [`Sold 1 ${item} for ${value}g`, ...prev]);
    } else {
      setLog(prev => [`You don't have any ${item} to sell!`, ...prev]);
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
    
    // 1. Advance Day
    const newDay = day + 1;
    setDay(newDay);
    
    // 2. Increase Debt (10% Interest)
    if (debt > 0) {
      const interest = Math.ceil(debt * 0.10);
      setDebt(d => d + interest);
      setLog(prev => [`Day ${newDay}: Interest accrued ${interest}g`, ...prev]);
    } else {
      setLog(prev => [`Day ${newDay}: A new dawn.`, ...prev]);
    }

    // 3. Move to Random Location
    const nextLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    setLocation(nextLoc);

    // 4. Randomize Prices (Simple +/- 25% Swing)
    const newPrices = { ...basePrices };
    for (const item in newPrices) {
      const volatility = Math.random() * 0.5 + 0.75; // Random between 0.75 and 1.25
      newPrices[item] = Math.floor(basePrices[item] * volatility);
    }
    setCurrentPrices(newPrices);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 max-w-md mx-auto border-x border-slate-700">
      
      {/* HEADER */}
      <header className="flex justify-between items-start mb-6 border-b border-slate-700 pb-4">
        <div>
            <h1 className="text-2xl font-bold text-yellow-500">Dwarf Wars</h1>
            <p className="text-xs text-slate-400">Fantasy Finance</p>
        </div>
        <div className="text-right text-sm">
          <p>Day: <span className="text-white font-bold">{day}/{MAX_DAYS}</span></p>
          <p>Loc: <span className="text-blue-400 font-bold">{location}</span></p>
        </div>
      </header>

      {/* STATS BAR */}
      <div className="bg-slate-800 p-4 rounded-lg mb-6 flex justify-between items-center shadow-lg">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Gold</p>
          <p className="text-2xl text-green-400 font-mono font-bold">{money} g</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Loan Shark</p>
          <p className="text-xl text-red-400 font-mono">{debt} g</p>
          {debt > 0 && (
              <button onClick={payDebt} className="text-xs text-blue-400 underline mt-1">Pay Debt</button>
          )}
        </div>
      </div>

      {/* MARKETPLACE */}
      <div className="mb-6">
        <h2 className="text-sm font-bold mb-2 text-slate-500 uppercase tracking-widest">Marketplace</h2>
        <div className="bg-slate-800 rounded-lg overflow-hidden">
            {Object.keys(currentPrices).map((item) => (
            <div key={item} className="flex justify-between items-center p-3 border-b border-slate-700 last:border-0">
                <div className="w-1/3 capitalize font-bold text-slate-300">{item}</div>
                <div className="w-1/3 text-center text-yellow-500 font-mono">{currentPrices[item]} g</div>
                <div className="w-1/3 flex justify-end gap-2">
                <button 
                    onClick={() => buyItem(item)}
                    className="bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-xs font-bold transition-colors">
                    Buy
                </button>
                <button 
                    onClick={() => sellItem(item)}
                    className="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-xs font-bold transition-colors">
                    Sell
                </button>
                </div>
            </div>
            ))}
        </div>
      </div>

      {/* INVENTORY */}
      <div className="mb-6">
        <h2 className="text-sm font-bold mb-2 text-slate-500 uppercase tracking-widest">Inventory</h2>
        <div className="grid grid-cols-3 gap-2 text-sm text-center">
          {Object.entries(inventory).map(([key, count]) => (
            <div key={key} className="bg-slate-800 p-3 rounded border border-slate-700">
              <div className="capitalize text-slate-400 text-xs mb-1">{key}</div>
              <div className="text-white font-bold text-lg">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TRAVEL BUTTON */}
      <button 
        onClick={travel}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg shadow-lg mb-6 text-lg transition-transform active:scale-95">
        Travel to New Location
      </button>

      {/* EVENT LOG */}
      <div className="bg-black p-3 rounded h-32 overflow-y-auto text-xs font-mono text-green-500 border border-slate-700 shadow-inner">
        {log.map((entry, i) => (
          <div key={i} className="mb-1 border-b border-gray-900 pb-1 last:border-0">
             <span className="text-gray-500 mr-2">&gt;</span>{entry}
          </div>
        ))}
      </div>

    </div>
  )
}

export default App