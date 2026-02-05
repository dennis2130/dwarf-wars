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
import { RACES, CLASSES, EVENTS, LOCATIONS, UPGRADES, BASE_PRICES, validateName } from './gameData'
import { supabase } from './supabaseClient'
// 1. VISUALS: Import Icons
import { Coins, Skull, Heart, Shield, ShoppingBag, Map, Gem, UtensilsCrossed, FlaskConical, Sword, RotateCcw, LogOut } from 'lucide-react'
import ScrambleDie from './components/ScrambleDie';
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
  const [splash, setSplash] = useState(true); // Start true = show splash
  const [gameState, setGameState] = useState('start'); 
  const [showHelp, setShowHelp] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('market'); // 'market' or 'equipment'
  const [flash, setFlash] = useState(''); // 'red', 'green', 'gold'

  // --- COMBAT STATE ---
  const [combatEvent, setCombatEvent] = useState(null); // { enemy: 'Thief', damage: 30, gold: 500, dc: 12 }
  const [combatStats, setCombatStats] = useState({ wins: 0, losses: 0, flees: 0 });
  const [combatBonus, setCombatBonus] = useState(0);

  // --- ROLL STATE ---
  const [isRolling, setIsRolling] = useState(false);
  const [rollTarget, setRollTarget] = useState(null);
  
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

  // --- LOGGING FUNCTION ---
  const logGameSession = async (status, cause = null) => {
    // 1. Gather Data
    const sessionData = {
        user_email: session?.user?.email || 'Anonymous',
        char_name: player.name,
        race: player.race?.name,
        class: player.class?.name,
        score: resources.money - debt,
        status: status,
        days_survived: day,
        upgrades: playerItems.map(i => i.name), // Just save names
        combat_stats: combatStats,
        cause_of_death: cause
    };

    // 2. Send to Supabase (Fire and Forget - don't await)
    supabase.from('game_logs').insert([sessionData]).then(({ error }) => {
        if (error) console.error("Telemetry Error:", error);
    });
  };



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
    const { data } = await supabase
      .from('high_scores')
      .select('*')
      .order('final_score', { ascending: false })
      .limit(20); // Increased to 10 so you can see more

    if (data) {
        // Sanitize the data before setting state
        const cleanLeaderboard = data.map(entry => {
            // If validateName returns an error string (meaning it's invalid/profane)
            // We replace the name for the display
            const error = validateName(entry.player_name);
            if (error) {
                return { ...entry, player_name: "Banned Goblin" }; // Thematic Redaction
            }
            return entry;
        });
        setLeaderboard(cleanLeaderboard);
    }
  };
  // --- HELPERS ---
  const triggerFlash = (color) => {
      setFlash(color);
      setTimeout(() => setFlash(''), 300); // Clears it after 300ms
  };

  const fetchSavedCharacters = async () => {
    const { data } = await supabase.from('saved_characters').select('*');
    if (data) setSavedChars(data);
  };

  const saveNewCharacter = async () => {
    if (!session) return;
    
    // Validate Name again (Security best practice)
    const nameError = validateName(player.name);
    if (nameError) return alert(nameError);

    const { error } = await supabase.from('saved_characters').insert([
      { 
        user_id: session.user.id,
        name: player.name, // The filter will ensure this is clean
        race_id: player.race.id,
        class_id: player.class.id
      }
    ]);
    if (!error) {
        alert("Character Saved!");
        fetchSavedCharacters();
    }
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

    const nameError = validateName(player.name);
    if (nameError) return alert(nameError);

    if(!player.name || !player.race || !player.class) return alert("Complete your character!");

    let inv = 50 + player.race.stats.inventory;
    let hp = 100 + player.race.stats.health;
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
    setDefense(def);
    setPlayerItems([]);
    setDay(1);
    setCombatBonus(0); 
    setCombatStats({ wins: 0, losses: 0, flees: 0 });
    
    // RESET LOCATION & PRICES
    const startLoc = LOCATIONS[0];
    setCurrentLocation(startLoc);
    recalcPrices(startLoc); 

    setLog([`Welcome ${player.name} the ${player.race.name} ${player.class.name}!`, "Good luck."]);
    setGameState('playing');
  };
  // NEW: Restart with same character
  const handleRestart = () => {
    if (window.confirm("Restart this run?")) {
        logGameSession('Quit (Restart)'); // Log the reset
        startGame();
    }
  };

  // NEW: Quit to Main Menu
  const handleQuit = () => {
    if (window.confirm("Quit to Character Select?")) {
        logGameSession('Quit (Menu)'); // Log the quit
        setGameState('start');
    }
  };
  const triggerGameOver = (cause = null) => {
    // Determine if dead or just time up
    const isDead = health <= 0;
    const finalScore = resources.money - debt;
    
    let status = 'Win';
    if (isDead) status = 'Dead';
    else if (finalScore < 0) status = 'Bankrupt';
    
    // Log it!
    logGameSession(status, cause || (isDead ? 'Unknown' : 'Time Limit'));

    setGameState('gameover');
    saveScore(); // Keep your high score logic too
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

    const generateLoot = (enemyType) => {
    // 1. Determine Tier (Dragon = High, Bandit = Low)
    const tier = enemyType === 'Dragon' ? 5 : 1;
    
    const roll = Math.random();
    
    if (roll < 0.5) {
        // 50% Chance: Gold Reward
        const gold = 100 * tier * (Math.floor(Math.random() * 5) + 1); // 100-500 for bandit, 500-2500 for Dragon
        updateMoney(gold);
        setLog(prev => [`Looted ${gold}g from the corpse.`, ...prev]);
       triggerFlash('gold');
    } 
    else if (roll < 0.8) {
        // 30% Chance: Health (Found food/bandages)
        const heal = 10 * tier;
        setHealth(h => Math.min(h + heal, maxHealth));
        setLog(prev => [`Found supplies. Healed ${heal} HP.`, ...prev]);
        triggerFlash('green');
    }
    else {
        // 20% Chance: Inventory Slot (Found a bag)
        const slots = 2 * tier;
        setMaxInventory(m => m + slots);
        setLog(prev => [`Found a ${enemyType === 'Dragon' ? 'Chest' : 'Pouch'}. Inventory +${slots}.`, ...prev]);
    }
  };

  const triggerRandomEvent = (locObj) => {
    // 1. BLEED MECHANIC (Replaces Fatigue)
    setHealth(h => {
        const threshold = Math.floor(maxHealth * 0.25); // 25% of MAX health
        if (h < threshold) {
            const newH = h - 5; // Heavier bleed (5 dmg) since it only happens when critical
            if (newH <= 0) setTimeout(triggerGameOver, 500);
            
            // Optional: Log it so player knows why they are dying
            setLog(prev => ["You are bleeding out! Heal quickly!", ...prev]);
            triggerFlash('red'); // Visual feedback
            return newH;
        }
        return h;
    });

    // 2. Risk Check
    if (Math.random() > locObj.risk) { 
        setEventMsg(null); 
        return recalcPrices(locObj); 
    }

    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    
    // 3. COMBAT EVENTS (Modal)
    // If we hit this, we set up the fight and STOP (return).
    if (event.type === 'damage' || event.type === 'theft') {
        setEventMsg(null); // Clear old simple messages
        setCombatEvent({
            name: event.id === 'dragon' ? "Dragon" : "Bandit",
            text: event.text,
            // Dragon = hard (DC 18), Bandit = easy (DC 10)
            damage: event.id === 'dragon' ? 60 : 20,
            goldLoss: event.type === 'theft' ? 0.25 : 0, 
            difficulty: event.id === 'dragon' ? 18 : 10 
        });
        return recalcPrices(locObj); 
    }

    // 4. PEACEFUL EVENTS (Auto-Resolve)
    // We only get here if it wasn't combat.
    let msg = event.text;
    let eventPriceMod = 1.0;

    switch(event.type) {
        case 'heal': 
            setHealth(h => Math.min(h + event.value, maxHealth)); 
            msg += ` (+${event.value} HP)`; 
            break;
        case 'money': 
            updateMoney(event.value); 
            msg += ` (+${event.value} G)`; 
            break;
        case 'price': 
            eventPriceMod = event.value;
            break;
        // Note: 'damage' and 'theft' are removed from here because the IF block caught them
        default: break;
    }

    // Visuals for peaceful events
    if (event.type === 'money') {
        triggerFlash('green');
    }
    
    setEventMsg({ text: msg, type: event.type });
    setLog(prev => [msg, ...prev]);
    return recalcPrices(locObj, eventPriceMod);
  };

// --- COMBAT LOGIC ---

  // 1. User clicks "Fight"
  const startCombatRoll = () => {
      const d20 = Math.ceil(Math.random() * 20); // Decide fate immediately
      setRollTarget(d20); // Save it for the animation
      setIsRolling(true); // Start the animation
  };

  // 2. Animation finishes (Called by ScrambleDie)
  // RENAMED to match your JSX: handleRollComplete
  const handleRollComplete = () => {
      // Small delay to let the user see the final number
      setTimeout(() => {
          finishCombat(rollTarget); // Apply damage/loot
          setIsRolling(false);      // Reset UI
          setRollTarget(null);      // Clear target
      }, 800);
  };

  // 3. The Math (Apply damage/loot)
  const finishCombat = (d20Roll) => {
      if (!combatEvent) return;

      const total = d20Roll + combatBonus + (player.race.stats.combat || 0);
      
      if (total >= combatEvent.difficulty) {
          triggerFlash('gold');
          setLog(prev => [`VICTORY! ...`, ...prev]);
          generateLoot(combatEvent.name);
          
          // TRACK WIN
          setCombatStats(prev => ({ ...prev, wins: prev.wins + 1 }));
      } else {
          setHealth(h => {
              const newH = h - combatEvent.damage;
              if (newH <= 0) setTimeout(() => triggerGameOver(combatEvent.name), 500); // Pass cause of death!
              return newH;
          });
          triggerFlash('red');
          setLog(prev => [`DEFEAT! ...`, ...prev]);
          
          if (combatEvent.goldLoss > 0) {
               setResources(prev => ({...prev, money: Math.floor(prev.money * (1 - combatEvent.goldLoss))}));
          }

          // TRACK LOSS
          setCombatStats(prev => ({ ...prev, losses: prev.losses + 1 }));
      }
      setCombatEvent(null);
  };

  // 4. Handle "Run Away" (No dice needed)
  const resolveRunAway = () => {
      // ... existing logic (payment/damage) ...
      
      // If taking damage from Dragon while running, check death
      if (combatEvent.goldLoss === 0) {
          setHealth(h => {
              const newH = h - (combatEvent.damage / 2);
              if (newH <= 0) setTimeout(() => triggerGameOver(combatEvent.name + " (Fled)"), 500);
              return newH;
          });
      }

      // TRACK FLEE
      setCombatStats(prev => ({ ...prev, flees: prev.flees + 1 }));
      
      setCombatEvent(null);
  };


const inventoryRef = useRef(inventory);
useEffect(() => { inventoryRef.current = inventory; }, [inventory]);

  // --- SPLASH SCREEN TIMER ---
  useEffect(() => {
    // Wait 2.5 seconds, then hide splash
    const timer = setTimeout(() => {
        setSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

const buyItem = (item) => {
    // Calculate Buy Mod (Base 1.0 + Race Mod)
    // Example: Elf has 0.10 buyMod -> 1.0 - 0.10 = 0.90 (10% discount)
    // Example: Orc has -0.10 buyMod -> 1.0 - (-0.10) = 1.10 (10% markup)
    const buyMult = 1.0 - (player.race?.stats.buyMod || 0);
    // We calculate cost outside, but everything else happens inside the "Safe Zone"
    const cost = Math.ceil(currentPrices[item] * buyMult); 
    
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
        if (currentInv[item].count <= 0) return prev; 

        // Calculate Sell Mod (Base 1.0 + Race Mod)
        // Example: Dwarf has 0.10 sellMod -> 1.0 + 0.10 = 1.10 (10% Bonus)
        const sellMult = 1.0 + (player.race?.stats.sellMod || 0);
        
        const value = Math.floor(currentPrices[item] * sellMult); 
        
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

        // Calculate Sell Mod (Base 1.0 + Race Mod)
        // Example: Dwarf has 0.10 sellMod -> 1.0 + 0.10 = 1.10 (10% Bonus)
        const sellMult = 1.0 + (player.race?.stats.sellMod || 0);
        
        const value = Math.floor(currentPrices[item] * sellMult); 
        
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
    if (resources.money < upgrade.cost) return setLog(prev => ["Too expensive!", ...prev]);

    // NEW: Handle Consumables (Don't add to playerItems)
    if (upgrade.type === 'heal') {
        if (health >= maxHealth) return setLog(prev => ["You are already healthy!", ...prev]);
        
        const healAmount = Math.floor(maxHealth * upgrade.value);
        setHealth(h => Math.min(h + healAmount, maxHealth));
        setResources(prev => ({ ...prev, money: prev.money - upgrade.cost }));
        setLog(prev => [`Drank ${upgrade.name}. Felt amazing.`, ...prev]);
        triggerFlash('green'); // Green flash for healing
        return; // EXIT FUNCTION (Don't add to inventory list)
    }
    
    // Check if we already have this specific item
    if (playerItems.find(i => i.id === upgrade.id)) return setLog(prev => ["Already own that!", ...prev]);

    // LOGIC CHANGE: If buying a weapon, remove existing weapon first
    let newItems = [...playerItems];
    let currentCombatBonus = combatBonus;

    if (upgrade.type === 'combat') {
        // Find existing weapon
        const oldWeapon = newItems.find(i => i.type === 'combat');
        if (oldWeapon) {
            // Remove its bonus
            currentCombatBonus -= oldWeapon.value;
            // Remove from list
            newItems = newItems.filter(i => i.id !== oldWeapon.id);
            setLog(prev => [`Discarded ${oldWeapon.name}...`, ...prev]);
        }
        // Add new bonus
        setCombatBonus(currentCombatBonus + upgrade.value);
    } 
    
    // Logic for other types (inventory/defense) stays additive
    if (upgrade.type === 'inventory') setMaxInventory(m => m + upgrade.value);
    // Note: If you have 'defense' items (shields), do you want those to stack? Assuming yes for now.

    setResources(prev => ({ ...prev, money: prev.money - upgrade.cost }));
    setPlayerItems([...newItems, upgrade]);
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
              {/* SPLASH SCREEN */}
        <div 
          onClick={() => setSplash(false)} // Allow skipping by click
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 transition-opacity duration-1000 ${
              splash ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <img 
              src="/logo.png" 
              alt="Dwarf Wars" 
              className="w-64 h-auto mb-8 animate-in fade-in zoom-in duration-1000" 
          />
          
          {/* Loading Spinner or "Tap to Start" text */}
          <div className="text-yellow-500 text-xs tracking-[0.5em] font-bold animate-pulse">
              LOADING REALM...
          </div>
        </div>
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

        {/* LEADERBOARD WINDOW */}
        <div className="mb-8 bg-black/30 rounded-lg border border-slate-800 h-32 overflow-hidden relative">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest absolute top-0 left-0 right-0 bg-slate-900/90 p-2 z-10 border-b border-slate-800 text-center">Global Leaders</h3>
            
            {/* SCROLLING CONTENT */}
            <div className="absolute top-8 left-0 right-0 p-2">
                {/* We duplicate the list so it loops seamlessly */}
                <div className="scrolling-list">
                    {[...leaderboard, ...leaderboard].map((score, i) => (
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
                ))}
                </div>
            </div>
        </div>
        
        {/* CREATE CHARACTER */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase mb-1">Name</label>
            <input type="text" maxLength={30} value={player.name} className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white outline-none focus:border-yellow-500" placeholder="Enter hero name..." onChange={(e) => setPlayer({...player, name: e.target.value})} />
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
          {/* HELP TOGGLE */}
        <div className="mt-6 text-center">
            <button 
                onClick={() => setShowHelp(!showHelp)} 
                className="text-xs text-slate-500 hover:text-yellow-500 underline transition-colors"
            >
                {showHelp ? "Hide Guide" : "Read Lore & Rules"}
            </button>
        </div>

{/* HELP CONTENT (Collapsible) */}
        {showHelp && (
            <div className="mt-4 bg-black/40 rounded-lg p-4 border border-slate-800 text-sm animate-in fade-in slide-in-from-top-4 duration-300 shadow-xl">
                
                {/* LORE */}
                <div className="mb-6">
                    <h3 className="text-yellow-500 font-bold uppercase tracking-widest mb-2 border-b border-slate-800 pb-1 flex items-center gap-2">
                        <Shield size={14}/> The Iron Bank Calls
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed italic">
                        "The Realm is in chaos. Dragons burn the skies, goblins run the slums, and inflation is rampant. 
                        You have <strong>31 Days</strong> to turn your measly pocket change into a fortune."
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed mt-2">
                        Travel between cities, buy low, sell high, and manage your inventory. 
                        But beware—the Loan Shark charges <strong>5% daily interest</strong>. 
                        Pay him back, or face the consequences.
                    </p>
                </div>

                {/* SURVIVAL GUIDE (New Section) */}
                <div className="mb-6">
                    <h3 className="text-red-400 font-bold uppercase tracking-widest mb-2 border-b border-slate-800 pb-1 flex items-center gap-2">
                        <Skull size={14}/> Survival Guide
                    </h3>
                    <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                        <li><strong className="text-white">Combat:</strong> Thieves and Dragons will attack. You can Pay (lose gold) or Fight (Roll D20 + Weapons).</li>
                        <li><strong className="text-white">Bleed:</strong> If your Health drops below 25%, you will bleed out while traveling. Heal up!</li>
                        <li><strong className="text-white">Potions:</strong> The <strong>Elixir of Life</strong> (5000g) heals 75% of your max HP instantly.</li>
                        <li><strong className="text-white">Loot:</strong> Defeating enemies grants Gold, Supplies, or Inventory Slots.</li>
                    </ul>
                </div>

                {/* RACES */}
                <div className="mb-6">
                    <h3 className="text-blue-400 font-bold uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">Races</h3>
                    <div className="space-y-3">
                        {RACES.map(r => (
                            <div key={r.id} className="flex flex-col">
                                <span className="font-bold text-slate-200">{r.name}</span>
                                <span className="text-[10px] text-slate-500 italic">{r.desc}</span>
                                <span className="text-[10px] text-green-400">Bonus: {r.bonus}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CLASSES */}
                <div>
                    <h3 className="text-green-400 font-bold uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">Classes</h3>
                    <div className="space-y-3">
                        {CLASSES.map(c => (
                            <div key={c.id} className="flex flex-col">
                                <span className="font-bold text-slate-200">{c.name}</span>
                                <span className="text-[10px] text-slate-500 italic">{c.desc}</span>
                                <span className="text-[10px] text-green-400">
                                    Start: {c.startingMoney}g / Debt: {c.startingDebt}g
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN GAME (PLAYING) ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-2 max-w-md mx-auto border-x border-slate-700 flex flex-col">
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
        {/* GOLD */}
        <div className="bg-slate-800 p-2 rounded shadow flex flex-col items-center">
            <span className="text-xs text-slate-400 flex items-center gap-1"><Coins size={12}/> GOLD</span>
            <span className="text-green-400 font-bold">{money}</span>
        </div>

        {/* DEBT */}
        <div className="bg-slate-800 p-2 rounded shadow flex flex-col items-center">
            <span className="text-xs text-slate-400 flex items-center gap-1"><Skull size={12}/> DEBT</span>
            <div className="text-red-400 font-bold">
                {debt} {debt > 0 && <span onClick={payDebt} className="text-[10px] underline text-blue-400 cursor-pointer ml-1">Pay</span>}
            </div>
        </div>

        {/* HEALTH (With Bar) */}
        <div className="bg-slate-800 p-2 rounded shadow flex flex-col items-center justify-between w-full">
            <span className="text-xs text-slate-400 flex items-center gap-1"><Heart size={12}/> HP</span>
            <span className={`${health < 30 ? 'text-red-500 animate-pulse' : 'text-blue-400'} font-bold`}>{health}/{maxHealth}</span>
            
            {/* PROGRESS BAR - Now properly nested inside the Health Card */}
            <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1 overflow-hidden border border-slate-700">
                <div 
                    className={`${health < 30 ? 'bg-red-500' : 'bg-blue-500'} h-full transition-all duration-500`} 
                    style={{ width: `${Math.max(0, (health / maxHealth) * 100)}%` }}
                ></div>
            </div>
        </div>
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
            {Object.keys(currentPrices).map((item) => {
                // 1. Calculate the Buy Multiplier (Charisma)
                const buyMult = 1.0 - (player.race?.stats.buyMod || 0);
                
                // 2. Calculate Final Price
                const displayPrice = Math.ceil(currentPrices[item] * buyMult);

                return (
                    <MarketItem 
                        key={item}
                        item={item}
                        icon={getIcon(item)}
                        
                        // 3. Pass the calculated price
                        price={displayPrice} 
                        
                        myAvg={inventory[item]?.avg || 0}
                        haveStock={inventory[item]?.count > 0}
                        onBuy={() => buyItem(item)}
                        onSell={() => sellItem(item)}
                        onSellAll={() => sellAll(item)}
                    />
                );
            })}
        </div>
      </div>

      {/* INVENTORY */}
      <div className="mb-2 flex-grow">
        <div className="flex justify-between items-end mb-1">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inventory</h2>
            <span className="text-[10px] text-slate-400">
                {Object.values(inventory).reduce((a, b) => a + b.count, 0)} / {maxInventory}
            </span>
        </div>
        
        {/* COMPACT GRID: 4 Columns, Tighter Spacing */}
        <div className="grid grid-cols-4 gap-1 text-center">
            {Object.entries(inventory).map(([key, data]) => (
                <div key={key} className={`p-1 rounded border border-slate-700 flex flex-col items-center justify-center ${data.count > 0 ? 'bg-slate-800' : 'bg-slate-900 opacity-40'}`}>
                    <div className="text-slate-400 mb-0.5">
                        {getIcon(key)}
                    </div>
                    {/* Smaller, bolder number */}
                    <div className="text-white font-bold text-sm leading-none">
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

      {/* SCREEN FLASH OVERLAY */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-300 ${
          flash === 'red' ? 'bg-red-500/30' : 
          flash === 'green' ? 'bg-green-500/30' : 
          flash === 'gold' ? 'bg-yellow-500/30' : 
          'opacity-0'
      }`}></div>

      {/* COMBAT MODAL */}
      {combatEvent && (
        <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500 rounded-lg p-6 w-full max-w-sm text-center shadow-2xl animate-in zoom-in duration-200">
                <h2 className="text-2xl text-red-500 font-bold mb-2 uppercase">{combatEvent.name} ATTACK!</h2>
                <p className="text-slate-300 mb-6">{combatEvent.text}</p>

                {/* DICE AREA */}
                <div className="h-40 flex items-center justify-center bg-slate-800 rounded-lg mb-4 relative overflow-hidden border border-slate-700">
                    
                    {isRolling && rollTarget ? (
                        <ScrambleDie 
                            target={rollTarget} 
                            onComplete={handleRollComplete} 
                        />
                    ) : (
                        // Static "Ready to Roll" State
                        <div className="relative w-32 h-32 flex items-center justify-center opacity-50">
                             {/* Static Icon */}
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full text-slate-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 7v10l10 5 10-5V7" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12" />
                             </svg>
                             <div className="absolute text-xl font-bold text-slate-400">D20</div>
                        </div>
                    )}
                </div>
                
                <div className="flex gap-3">
                    {/* RUN BUTTON */}
                    <button 
                        onClick={resolveRunAway} // Changed from resolveCombat('pay')
                        disabled={isRolling} // Disable while rolling
                        className="flex-1 bg-slate-700 hover:bg-slate-600 border border-slate-500 text-slate-200 py-3 rounded disabled:opacity-50"
                    >
                        {combatEvent.goldLoss > 0 ? "Surrender Gold" : "Run Away"}
                    </button>
                    
                    {/* FIGHT BUTTON */}
                    <button 
                        onClick={startCombatRoll} // Changed from resolveCombat('fight')
                        disabled={isRolling} // Disable while rolling
                        className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded flex flex-col items-center justify-center disabled:opacity-50"
                    >
                        {isRolling ? (
                            <span>ROLLING...</span>
                        ) : (
                            <>
                                <span>FIGHT!</span>
                                <span className="text-[10px] font-normal opacity-75">
                                    Roll D20 + {combatBonus + (player.race.stats.combat || 0)}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  )
}

export default App