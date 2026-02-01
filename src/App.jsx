/**
 * App.jsx
 *
 * Main React component for Dwarf Wars.
 * Handles all game logic, UI rendering, and state management.
 *
 * Major Features:
 * - Character creation (name, race, class)
 * - Game state management (start, playing, gameover)
 * - Trading system (buy/sell items, price calculation)
 * - Inventory and upgrades
 * - Health, defense, and survival mechanics
 * - Location travel and random events
 * - Debt and scoring system
 * - Supabase integration for authentication, saved characters, and leaderboard
 * - Exit and restart functionality
 *
 * Key Methods:
 * - startGame: Initializes a new game session
 * - triggerGameOver: Ends the game and saves score
 * - buyItem, sellItem: Trading logic
 * - buyUpgrade: Purchase upgrades
 * - payDebt: Pay off debt
 * - travel: Move to a new location and trigger events
 * - handleGoogleLogin, handleLogout: Auth management
 * - fetchLeaderboard, fetchSavedCharacters, saveNewCharacter, deleteCharacter, saveScore: Supabase DB methods
 * - loadCharacter: Load a saved character
 * - recalcPrices, triggerRandomEvent: Price and event logic
 *
 * UI Structure:
 * - Start screen (character creation, login, saved characters)
 * - Main game (market, upgrades, travel, inventory, log)
 * - Game over screen (final score, restart)
 */
import { useState, useEffect } from 'react'
import { RACES, CLASSES, EVENTS, LOCATIONS, UPGRADES, BASE_PRICES } from './gameData' 
import { supabase } from './supabaseClient'
// 1. VISUALS: Import Icons
import { Coins, Skull, Heart, Shield, ShoppingBag, Map, Gem, UtensilsCrossed, FlaskConical, Sword, RotateCcw, LogOut } from 'lucide-react'
import { useRef } from 'react';

function useLongPress(callback, ms = 100) {
  const timerRef = useRef(null);

  const start = () => {
    if (timerRef.current) return;
    callback();
    timerRef.current = setInterval(callback, ms);
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
}


  const MarketItem = ({ item, price, myAvg, haveStock, onBuy, onSell, onSellAll, icon }) => {
    // Determine Profit Color
    let priceColor = "text-yellow-500";
    if (haveStock) {
        if (price > myAvg) priceColor = "text-green-400"; // Profit
        if (price < myAvg) priceColor = "text-red-400";   // Loss
    }

    // Now it is legal to call this hook here!
    const buyEvents = useLongPress(onBuy);
    const sellEvents = useLongPress(onSell);

    return (
        <div className="flex justify-between items-center p-3 border-b border-slate-700 last:border-0">
            <div className="w-1/3">
                <div className="font-bold text-slate-300 flex items-center gap-2 capitalize">
                    {icon} {item}
                </div>
                {haveStock && (
                    <div className="text-[10px] text-slate-500">
                        Avg: {Math.floor(myAvg)}g
                    </div>
                )}
            </div>
            
            <div className={`w-1/3 text-center font-mono ${priceColor}`}>
                {price} g
            </div>
            
            <div className="w-1/3 flex justify-end gap-1">
                <button {...buyEvents} className="bg-green-700 hover:bg-green-600 px-3 py-2 rounded text-xs font-bold active:scale-95 transition-transform select-none">
                    Buy
                </button>
                <button {...sellEvents} className="bg-red-700 hover:bg-red-600 px-3 py-2 rounded text-xs font-bold active:scale-95 transition-transform select-none">
                    Sell
                </button>
                <button onClick={onSellAll} className="bg-slate-700 hover:bg-slate-600 px-2 py-2 rounded text-xs font-bold border border-slate-600" title="Sell All">
                    All
                </button>
            </div>
        </div>
    );
};

function App() {
  // --- AUTH STATE ---
  const [session, setSession] = useState(null);
  const [savedChars, setSavedChars] = useState([]);

  // --- APP STATE ---
  const [gameState, setGameState] = useState('start'); 
  const [leaderboard, setLeaderboard] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('market'); // 'market' or 'equipment'
  
  // --- PLAYER STATE ---
  const [player, setPlayer] = useState({ name: '', race: null, class: null });
  const [maxInventory, setMaxInventory] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [health, setHealth] = useState(100);
  const [defense, setDefense] = useState(0); // Damage reduction
  const [priceMod, setPriceMod] = useState(1); 
  // 3. THEME: Track Upgrades
  const [playerItems, setPlayerItems] = useState([]); 

  // --- GAME LOOP STATE ---
  const [debt, setDebt] = useState(5000);
  const [day, setDay] = useState(1);
  const [currentLocation, setCurrentLocation] = useState(LOCATIONS[0]); // Defaults to Royal City
  const [log, setLog] = useState([]);
  const [eventMsg, setEventMsg] = useState(null);
  const [resources, setResources] = useState({
    money: 100,
    inventory: { rations: { count: 0, avg: 0 }, potions: { count: 0, avg: 0 }, gems: { count: 0, avg: 0 } }
  });
  const { money, inventory } = resources;

  // --- CONFIG ---
  const MAX_DAYS = 31;
  const [currentPrices, setCurrentPrices] = useState(BASE_PRICES);

  // --- INIT ---
  useEffect(() => {
    fetchLeaderboard();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchSavedCharacters();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchSavedCharacters();
      else setSavedChars([]);
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- AUTH FUNCTIONS ---
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPlayer({ name: '', race: null, class: null });
  };

  // --- DB FUNCTIONS ---
  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('high_scores').select('*').order('final_score', { ascending: false }).limit(5);
    if (data) setLeaderboard(data);
  };

  const fetchSavedCharacters = async () => {
    const { data } = await supabase.from('saved_characters').select('*');
    if (data) setSavedChars(data);
  };

  const saveNewCharacter = async () => {
    if (!session) return;
    const { error } = await supabase.from('saved_characters').insert([
      { user_id: session.user.id, name: player.name, race_id: player.race.id, class_id: player.class.id }
    ]);
    if (!error) { alert("Character Saved!"); fetchSavedCharacters(); }
  };

  const deleteCharacter = async (e, id) => {
    e.stopPropagation(); 
    if (!window.confirm("Banish this hero?")) return;
    const { error } = await supabase.from('saved_characters').delete().eq('id', id);
    if (!error) setSavedChars(savedChars.filter(char => char.id !== id));
  };

  const saveScore = async () => {
    setIsSaving(true);
    await supabase.from('high_scores').insert([{
        player_name: player.name,
        race: player.race.name,
        class: player.class.name,
        gold: resources.money,       // UPDATED: was 'money'
        debt: debt,
        final_score: resources.money - debt // UPDATED: was 'money - debt'
    }]);
    setIsSaving(false);
    fetchLeaderboard();
  };

  // --- GAME ENGINE ---
  const loadCharacter = (char) => {
    const raceObj = RACES.find(r => r.id === char.race_id);
    const classObj = CLASSES.find(c => c.id === char.class_id);
    setPlayer({ name: char.name, race: raceObj, class: classObj });
  };

  const startGame = () => {
    if(!player.name || !player.race || !player.class) return alert("Complete your character!");

    let inv = 50 + player.race.stats.inventory;
    let hp = 100 + player.race.stats.health;
    let pm = 1.0 - player.race.stats.haggle;
    let def = 0;
    
    if (player.race.id === 'orc') def += 5; 
    if (player.class.id === 'warrior') hp += 50;
    
    // --- UPDATED: Use setResources instead of setMoney/setInventory ---
    const initialInv = {};
    Object.keys(BASE_PRICES).forEach(key => initialInv[key] = { count: 0, avg: 0 });
    
    setResources({
        money: player.class.startingMoney,
        inventory: initialInv
    });
    // ------------------------------------------------------------------

    setDebt(player.class.startingDebt);
    setMaxInventory(inv);
    setMaxHealth(hp);
    setHealth(hp);
    setPriceMod(pm);
    setDefense(def);
    setPlayerItems([]);
    setDay(1);
    
    // RESET LOCATION & PRICES
    const startLoc = LOCATIONS[0];
    setCurrentLocation(startLoc);
    recalcPrices(startLoc); 

    setLog([`Welcome ${player.name} the ${player.race.name} ${player.class.name}!`, "Good luck."]);
    setGameState('playing');
  };
  // NEW: Restart with same character
  const handleRestart = () => {
    if (window.confirm("Restart this run? You will lose current progress.")) {
        startGame();
    }
  };

  // NEW: Quit to Main Menu
  const handleQuit = () => {
    if (window.confirm("Quit to Character Select?")) {
        setGameState('start');
    }
  };

  const triggerGameOver = () => {
    setGameState('gameover');
    saveScore();
  };

  // 2. LOCATION LOGIC: Calculate prices based on Location factors
  const recalcPrices = (locObj, randomEventMod = 1.0) => {
    let newPrices = { ...BASE_PRICES };
    for (const item in newPrices) {
        // Base * Volatility * Location Modifier * Event Modifier
        const volatility = Math.random() * 2 + 0.25; // Updated Volatility: 0.25 to 2.25
        const locMod = locObj.prices[item] || 1.0; 
        newPrices[item] = Math.floor(BASE_PRICES[item] * volatility * locMod * randomEventMod);
    }
    setCurrentPrices(newPrices);
    return newPrices;
  }

  const updateMoney = (amount) => {
      setResources(prev => ({ ...prev, money: Math.max(0, prev.money + amount) }));
  };

  const triggerRandomEvent = (locObj) => {
    // Risk based on location
    if (Math.random() > locObj.risk) { 
        setEventMsg(null); 
        return recalcPrices(locObj); 
    }

    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    let msg = event.text;
    let eventPriceMod = 1.0;

    switch(event.type) {
        case 'damage':
            const dmg = Math.max(0, event.value - defense);
            setHealth(h => {
                const newH = h - dmg;
                if (newH <= 0) setTimeout(triggerGameOver, 500);
                return newH;
            });
            msg += ` (-${dmg} HP)`;
            break;
        case 'heal': 
            setHealth(h => Math.min(h + event.value, maxHealth)); 
            msg += ` (+${event.value} HP)`; 
            break;
        case 'money': 
            // UPDATE: Use the new helper
            updateMoney(event.value); 
            msg += ` (+${event.value} G)`; 
            break;
        case 'theft': 
            // UPDATE: Calculate theft based on current money
            // We use a functional update here to ensure we steal from the *real* current amount
            setResources(prev => {
                const lost = Math.floor(prev.money * event.value);
                // We have to modify the message "later" or just accept a generic message
                // For simplicity, let's just log the generic message here
                return { ...prev, money: prev.money - lost };
            });
            msg += ` (Thieves struck!)`; 
            break;
        case 'price': 
            eventPriceMod = event.value;
            break;
        default: break;
    }
    setEventMsg({ text: msg, type: event.type });
    setLog(prev => [msg, ...prev]);
    return recalcPrices(locObj, eventPriceMod);
  };


const inventoryRef = useRef(inventory);
useEffect(() => { inventoryRef.current = inventory; }, [inventory]);

const buyItem = (item) => {
    // We calculate cost outside, but everything else happens inside the "Safe Zone"
    const cost = Math.ceil(currentPrices[item] * priceMod); 
    
    setResources(prev => {
        // 1. Validations using the 'prev' snapshot (Guaranteed latest data)
        const currentMoney = prev.money;
        const currentInv = prev.inventory;
        const totalItems = Object.values(currentInv).reduce((a, b) => a + b.count, 0);

        // Fail checks
        if (totalItems >= maxInventory) return prev; // Inventory Full
        if (currentMoney < cost) return prev;        // Not enough cash

        // 2. Perform Math
        const currentItemData = currentInv[item];
        
        // Weighted Average Math: ((OldCount * OldAvg) + NewCost) / NewCount
        const totalValue = (currentItemData.count * currentItemData.avg) + cost;
        const newCount = currentItemData.count + 1;
        const newAvg = totalValue / newCount;

        // 3. Return NEW state (Money and Inventory updated together)
        return {
            money: currentMoney - cost,
            inventory: {
                ...currentInv,
                [item]: { count: newCount, avg: newAvg }
            }
        };
    });
  };

  const sellItem = (item) => {
    setResources(prev => {
        const currentInv = prev.inventory;
        if (currentInv[item].count <= 0) return prev; // Fail check

        const value = Math.floor(currentPrices[item] * priceMod); 
        
        return {
            money: prev.money + value,
            inventory: {
                ...currentInv,
                [item]: { ...currentInv[item], count: currentInv[item].count - 1 }
            }
        };
    });
  };

  const sellAll = (item) => {
    setResources(prev => {
        const currentInv = prev.inventory;
        const count = currentInv[item].count;
        if (count <= 0) return prev;

        const value = Math.floor(currentPrices[item] * priceMod);
        const totalSale = value * count;

        // Optional: We can log here, but React state setters should be pure. 
        // Ideally, log outside, but for this simple app, logging the action separately is fine.
        
        return {
            money: prev.money + totalSale,
            inventory: {
                ...currentInv,
                [item]: { count: 0, avg: 0 }
            }
        };
    });
  };

  // 3. THEME: Buy Upgrades
const buyUpgrade = (upgrade) => {
    // Check against 'money' (which is destructured from resources at the top of component)
    if (money < upgrade.cost) return setLog(prev => ["Too expensive!", ...prev]);
    if (playerItems.find(i => i.id === upgrade.id)) return setLog(prev => ["Already own that!", ...prev]);

    // UPDATE: Use setResources to deduct money
    setResources(prev => ({ ...prev, money: prev.money - upgrade.cost }));
    
    setPlayerItems([...playerItems, upgrade]);
    
    if (upgrade.type === 'inventory') setMaxInventory(m => m + upgrade.value);
    if (upgrade.type === 'defense') setDefense(d => d + upgrade.value);

    setLog(prev => [`Purchased ${upgrade.name}!`, ...prev]);
  };

  const payDebt = () => {
    // We use setResources as the source of truth for the transaction
    setResources(prev => {
        // Validation inside the setter ensures we don't pay with money we don't have
        if (prev.money <= 0 || debt <= 0) return prev;

        const amount = Math.min(prev.money, debt);
        
        // Side Effect: Update Debt (Since Debt is its own state, this is safe to do here)
        setDebt(d => d - amount);
        
        setLog(logPrev => [`Paid ${amount}g loan.`, ...logPrev]);

        // Return new money state
        return { ...prev, money: prev.money - amount };
    });
  };

  const travel = () => {
    if (day >= MAX_DAYS) return triggerGameOver();
    setDay(day + 1);
    if (debt > 0) { setDebt(d => d + Math.ceil(debt * 0.05)); }
    
    let nextLoc;
    do {
        nextLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    } while (nextLoc.name === currentLocation.name);

    setCurrentLocation(nextLoc);
    triggerRandomEvent(nextLoc);
  };

  // --- HELPER: Icon Mapper ---
  const getIcon = (item) => {
    switch(item) {
        case 'rations': return <UtensilsCrossed size={16} />;
        case 'potions': return <FlaskConical size={16} />;
        case 'gems': return <Gem size={16} />;
        default: return <ShoppingBag size={16} />;
    }
  };

  // --- RENDER: GAME OVER ---
  if (gameState === 'gameover') {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-5xl font-bold mb-4 text-red-600 flex items-center gap-2"><Skull size={48}/> GAME OVER</h1>
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 w-full max-w-sm">
                <div className="text-2xl mb-2">Final Score</div>
                <div className={`text-4xl font-bold mb-4 ${money - debt >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {money - debt}
                </div>
                {isSaving ? <p className="animate-pulse text-yellow-500">Saving Score...</p> : <p className="text-green-500">Score Saved!</p>}
            </div>
            <button onClick={() => setGameState('start')} className="mt-8 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold">Play Again</button>
        </div>
    );
  }

  // --- RENDER: START SCREEN ---
  if (gameState === 'start') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 p-6 max-w-md mx-auto border-x border-slate-700">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-yellow-500 tracking-tighter flex items-center gap-2"><Shield size={24}/> DWARF WARS</h1>
            {!session ? (
                <button onClick={handleGoogleLogin} className="text-xs bg-white text-black px-3 py-2 rounded font-bold hover:bg-gray-200">G Login</button>
            ) : (
                <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-white">Logout</button>
            )}
        </div>

        {/* SAVED CHARACTERS */}
        {session && savedChars.length > 0 && (
            <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Saved Heroes</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {savedChars.map(char => (
                        <div key={char.id} onClick={() => loadCharacter(char)} className="relative flex-shrink-0 bg-slate-800 p-3 rounded border border-slate-600 w-32 cursor-pointer hover:bg-slate-700 group">
                            <div className="font-bold text-yellow-500 truncate pr-4">{char.name}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{char.race_id} / {char.class_id}</div>
                            <button onClick={(e) => deleteCharacter(e, char.id)} className="absolute top-1 right-1 text-slate-500 hover:text-red-500 font-bold px-1">✕</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* LEADERBOARD */}
        <div className="mb-8 bg-black/30 rounded-lg p-4 border border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Global Leaders</h3>
            {leaderboard.length === 0 ? (
                <div className="text-xs text-slate-600 italic">No high scores yet...</div>
            ) : (
                leaderboard.map((score, i) => (
                    <div key={i} className="flex justify-between text-sm items-center mb-1 border-b border-slate-800/50 pb-1 last:border-0">
                        <span className="text-slate-400 flex gap-2">
                            <span className="text-slate-600 font-mono w-4">{i+1}.</span> 
                            {score.player_name} 
                            <span className="text-slate-600 text-[10px] hidden sm:inline">({score.race} {score.class})</span>
                        </span>
                        <span className={`font-mono ${score.final_score > 0 ? "text-green-500" : "text-red-500"}`}>
                            {score.final_score.toLocaleString()}
                        </span>
                    </div>
                ))
            )}
        </div>
        
        {/* CREATE CHARACTER */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase mb-1">Name</label>
            <input type="text" value={player.name} className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white outline-none focus:border-yellow-500" placeholder="Enter hero name..." onChange={(e) => setPlayer({...player, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {RACES.map(r => (
              <button key={r.id} onClick={() => setPlayer({...player, race: r})} className={`p-2 rounded border text-xs text-left transition-all ${player.race?.id === r.id ? 'bg-yellow-900/50 border-yellow-500' : 'bg-slate-800 border-slate-700'}`}>
                <div className="font-bold text-slate-200">{r.name}</div>
                <div className="text-[10px] text-slate-500">{r.bonus}</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {CLASSES.map(c => (
              <button key={c.id} onClick={() => setPlayer({...player, class: c})} className={`p-2 rounded border text-xs text-center transition-all ${player.class?.id === c.id ? 'bg-blue-900/50 border-blue-500' : 'bg-slate-800 border-slate-700'}`}>
                <div className="font-bold text-slate-200">{c.name}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={startGame} disabled={!player.name || !player.race || !player.class} className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-lg text-lg transition-all">PLAY</button>
            {session && player.name && player.race && player.class && (<button onClick={saveNewCharacter} className="bg-slate-700 text-white px-4 rounded-lg border border-slate-600 hover:bg-slate-600">Save</button>)}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN GAME (PLAYING) ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 max-w-md mx-auto border-x border-slate-700 flex flex-col">
<header className="flex justify-between items-start mb-4 border-b border-slate-700 pb-2">
        <div>
            <h1 className="text-xl font-bold text-yellow-500">{player.name}</h1>
            <p className="text-xs text-slate-400 capitalize">{player.race?.name} {player.class?.name}</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
            {/* Day and Location */}
            <div className="text-right text-sm">
                <span className="text-white font-bold mr-2">Day {day}/{MAX_DAYS}</span>
                <span className="text-xs text-blue-400 inline-flex items-center gap-1">
                    <Map size={12}/>{currentLocation.name}
                </span>
            </div>

            {/* NEW: Quit / Restart Buttons */}
            <div className="flex gap-2 mt-1">
                <button 
                    onClick={handleRestart} 
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-green-400 hover:bg-slate-700 transition-colors"
                    title="Restart Run"
                >
                    <RotateCcw size={16} />
                </button>
                <button 
                    onClick={handleQuit} 
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                    title="Quit to Menu"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
      </header>

      {eventMsg && <div className={`mb-4 p-3 rounded text-center text-sm font-bold border ${eventMsg.type === 'damage' || eventMsg.type === 'theft' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-green-900/50 border-green-500 text-green-200'}`}>{eventMsg.text}</div>}

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-slate-800 p-2 rounded shadow flex flex-col items-center"><span className="text-xs text-slate-400 flex items-center gap-1"><Coins size={12}/> GOLD</span><span className="text-green-400 font-bold">{money}</span></div>
        <div className="bg-slate-800 p-2 rounded shadow flex flex-col items-center"><span className="text-xs text-slate-400 flex items-center gap-1"><Skull size={12}/> DEBT</span><div className="text-red-400 font-bold">{debt} {debt > 0 && <span onClick={payDebt} className="text-[10px] underline text-blue-400 cursor-pointer ml-1">Pay</span>}</div></div>
        <div className="bg-slate-800 p-2 rounded shadow flex flex-col items-center"><span className="text-xs text-slate-400 flex items-center gap-1"><Heart size={12}/> HP</span><span className={`${health < 30 ? 'text-red-500 animate-pulse' : 'text-blue-400'} font-bold`}>{health}/{maxHealth}</span></div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-700 mb-4">
        <button onClick={() => setActiveTab('market')} className={`flex-1 pb-2 text-sm font-bold ${activeTab === 'market' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500'}`}>Market</button>
        <button onClick={() => setActiveTab('equipment')} className={`flex-1 pb-2 text-sm font-bold ${activeTab === 'equipment' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500'}`}>Armory & Stables</button>
      </div>

      {activeTab === 'market' ? (
        <>
      {/* MARKETPLACE */}
      <div className="mb-4">
        <h2 className="text-xs font-bold mb-2 text-slate-500 uppercase tracking-widest">Marketplace</h2>
        <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
            {Object.keys(currentPrices).map((item) => (
                <MarketItem 
                    key={item}
                    item={item}
                    icon={getIcon(item)}
                    price={Math.ceil(currentPrices[item] * priceMod)}
                    myAvg={inventory[item]?.avg || 0}
                    haveStock={inventory[item]?.count > 0}
                    onBuy={() => buyItem(item)}
                    onSell={() => sellItem(item)}
                    onSellAll={() => sellAll(item)}
                />
            ))}
        </div>
      </div>

      {/* INVENTORY */}
      <div className="mb-4 flex-grow">
        <div className="flex justify-between items-end mb-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inventory</h2>
            <span className="text-xs text-slate-400">
                {Object.values(inventory).reduce((a, b) => a + b.count, 0)} / {maxInventory} Slots
            </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm text-center">
            {Object.entries(inventory).map(([key, data]) => (
                <div key={key} className={`p-2 rounded border border-slate-700 ${data.count > 0 ? 'bg-slate-800' : 'bg-slate-900 opacity-50'}`}>
                    <div className="text-slate-400 text-xs mb-1 capitalize flex justify-center">
                        {getIcon(key)}
                    </div>
                    <div className="text-white font-bold text-lg">
                        {data.count}
                    </div>
                </div>
            ))}
        </div>
      </div>
        </>
      ) : (
        <div className="mb-4 flex-grow">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Available Upgrades</h2>
            <div className="space-y-2">
                {UPGRADES.map((u) => {
                    const owned = playerItems.find(i => i.id === u.id);
                    return (
                        <div key={u.id} className={`flex justify-between items-center p-3 rounded border ${owned ? 'bg-slate-800/50 border-slate-700 opacity-50' : 'bg-slate-800 border-slate-600'}`}>
                            <div className="flex items-center gap-3">
                                {u.type === 'defense' ? <Shield size={20} className="text-blue-400"/> : <ShoppingBag size={20} className="text-green-400"/>}
                                <div>
                                    <div className="font-bold text-sm text-slate-200">{u.name}</div>
                                    <div className="text-[10px] text-slate-400">{u.desc}</div>
                                </div>
                            </div>
                            {owned ? (
                                <span className="text-xs text-green-500 font-bold">OWNED</span>
                            ) : (
                                <button onClick={() => buyUpgrade(u)} className="bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-bold">{u.cost} g</button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
      )}

      <button onClick={travel} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg shadow-lg mb-4 text-lg active:scale-95 transition-all flex items-center justify-center gap-2">
        <Map size={20}/> Travel to New Location
      </button>

      <div className="bg-black p-3 rounded-lg h-24 overflow-y-auto text-xs font-mono text-green-500 border border-slate-700 shadow-inner">
        {log.map((entry, i) => <div key={i} className="mb-1 border-b border-gray-900 pb-1 last:border-0"> &gt; {entry}</div>)}
      </div>
    </div>
  )
}

export default App