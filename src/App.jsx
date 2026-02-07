import { useState, useEffect } from 'react'
import { RACES, CLASSES, EVENTS, LOCATIONS, UPGRADES, BASE_PRICES, validateName } from './gameData'
import { supabase } from './supabaseClient'

// Import Screens
import StartScreen from './screens/StartScreen';
import GameScreen from './screens/GameScreen';
import ProfileScreen from './screens/ProfileScreen';
import GameOverScreen from './screens/GameOverScreen';
import HelpScreen from './screens/HelpScreen';

function App() {
  // --- STATE ---
  const [session, setSession] = useState(null);
  const [savedChars, setSavedChars] = useState([]);
  const [gameState, setGameState] = useState('start'); 
  const [leaderboard, setLeaderboard] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [splash, setSplash] = useState(true);

  // Player
  const [player, setPlayer] = useState({ name: '', race: null, class: null });
  const [maxInventory, setMaxInventory] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [health, setHealth] = useState(100);
  const [defense, setDefense] = useState(0); 
  const [combatBonus, setCombatBonus] = useState(0);
  const [playerItems, setPlayerItems] = useState([]); 
  const [dragonsKilled, setDragonsKilled] = useState(0);
  const [combatStats, setCombatStats] = useState({ wins: 0, losses: 0, flees: 0 });

  // Game Loop
  const [resources, setResources] = useState({ money: 100, inventory: {} });
  const [debt, setDebt] = useState(5000);
  const [day, setDay] = useState(1);
  const [currentLocation, setCurrentLocation] = useState(LOCATIONS[0]);
  const [currentPrices, setCurrentPrices] = useState(BASE_PRICES);
  const [log, setLog] = useState([]);
  const [eventMsg, setEventMsg] = useState(null);
  const [flash, setFlash] = useState(''); 

  // Combat UI
  const [combatEvent, setCombatEvent] = useState(null); 
  const [isRolling, setIsRolling] = useState(false);
  const [rollTarget, setRollTarget] = useState(null);

  const MAX_DAYS = 31;

  // --- INIT \u0026 AUTH ---
  useEffect(() => {
    fetchLeaderboard();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchSavedCharacters();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchSavedCharacters(); else setSavedChars([]);
    });
    const timer = setTimeout(() => setSplash(false), 2500);
    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  const handleGoogleLogin = async () => await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  const handleLogout = async () => { await supabase.auth.signOut(); setPlayer({ name: '', race: null, class: null }); };

  // --- DATA FETCHING ---
  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('high_scores').select('*').order('final_score', { ascending: false }).limit(500);
    if (data) {
        const clean = data.map(e => validateName(e.player_name) ? { ...e, player_name: "Banned Goblin" } : e);
        setLeaderboard(clean);
    }
  };
  
  const fetchSavedCharacters = async () => { const { data } = await supabase.from('saved_characters').select('*'); if (data) setSavedChars(data); };
  
  const fetchProfile = async () => {
    if (!session) return;
    const { data: logs } = await supabase.from('game_logs').select('*').eq('user_email', session.user.email).order('created_at', { ascending: false });
    if (!logs) return;
    const stats = {
        totalRuns: logs.length,
        totalDeaths: logs.filter(l => l.status === 'Dead' || (l.cause_of_death && l.cause_of_death !== 'Time Limit' && !l.cause_of_death.includes('Quit'))).length,
        totalWins: logs.filter(l => l.score > 0 && l.status !== 'Dead' && (!l.cause_of_death || l.cause_of_death === 'Time Limit')).length,
        highestScore: Math.max(...logs.map(l => l.score), 0),
        dragonsKilled: logs.reduce((acc, l) => acc + (l.combat_stats?.dragons_killed || 0), 0),
        totalGold: logs.reduce((acc, l) => acc + (l.score > 0 ? l.score : 0), 0)
    };
    setProfileData({ stats, history: logs.slice(0, 10) });
    setGameState('profile');
  };

  const saveNewCharacter = async () => {
    if (!session) return;
    if (validateName(player.name)) return alert("Invalid Name");
    const { error } = await supabase.from('saved_characters').insert([{ user_id: session.user.id, name: player.name, race_id: player.race.id, class_id: player.class.id }]);
    if (!error) { alert("Character Saved!"); fetchSavedCharacters(); }
  };

  const deleteCharacter = async (e, id) => {
    e.stopPropagation(); if (!window.confirm("Banish this hero?")) return;
    const { error } = await supabase.from('saved_characters').delete().eq('id', id);
    if (!error) setSavedChars(savedChars.filter(char => char.id !== id));
  };

  const saveScore = async () => {
    setIsSaving(true);
    await supabase.from('high_scores').insert([{ player_name: player.name, race: player.race.name, class: player.class.name, gold: resources.money, debt: debt, final_score: resources.money - debt }]);
    setIsSaving(false);
    fetchLeaderboard();
  };

  const logGameSession = async (status, cause = null) => {
    const sessionData = {
        user_email: session?.user?.email || 'Anonymous', char_name: player.name, race: player.race?.name, class: player.class?.name, score: resources.money - debt, status: status, days_survived: day, upgrades: playerItems.map(i => i.name),
        combat_stats: { ...combatStats, dragons_killed: dragonsKilled }, cause_of_death: cause
    };
    supabase.from('game_logs').insert([sessionData]);
  };

  // --- HELPERS ---
  const triggerFlash = (color) => { setFlash(color); setTimeout(() => setFlash(''), 300); };
  const updateMoney = (amount) => { setResources(prev => ({ ...prev, money: Math.max(0, prev.money + amount) })); };

  // --- GAME LOGIC ---
  const loadCharacter = (char) => {
    const raceObj = RACES.find(r => r.id === char.race_id);
    const classObj = CLASSES.find(c => c.id === char.class_id);
    setPlayer({ name: char.name, race: raceObj, class: classObj });
  };

  const startGame = () => {
    if (validateName(player.name)) return alert("Invalid Name");
    if(!player.race || !player.class) return alert("Complete your character!");

    let inv = 50 + player.race.stats.inventory;
    let hp = 100 + player.race.stats.health;
    let def = player.race.id === 'orc' ? 5 : 0;
    if (player.class.id === 'warrior') hp += 50;
    
    const initialInv = {};
    Object.keys(BASE_PRICES).forEach(key => initialInv[key] = { count: 0, avg: 0 });
    setResources({ money: player.class.startingMoney, inventory: initialInv });
    setDebt(player.class.startingDebt);
    setMaxInventory(inv); setMaxHealth(hp); setHealth(hp); setDefense(def);
    setPlayerItems([]); setCombatBonus(0); setDragonsKilled(0);
    setCombatStats({ wins: 0, losses: 0, flees: 0 });
    setDay(1);
    
    const startLoc = LOCATIONS[0];
    setCurrentLocation(startLoc);
    recalcPrices(startLoc);
    setLog([`Welcome ${player.name}...`, "Good luck."]);
    setGameState('playing');
  };

  const recalcPrices = (locObj, randomEventMod = 1.0) => {
    let newPrices = { ...BASE_PRICES };
    for (const item in newPrices) {
        const volatility = Math.random() * 2.0 + 0.25; 
        const locMod = locObj.prices[item] || 1.0; 
        newPrices[item] = Math.floor(BASE_PRICES[item] * volatility * locMod * randomEventMod);
    }
    setCurrentPrices(newPrices);
  };

  const triggerGameOver = (cause = null) => {
    const isDead = health <= 0;
    let status = 'Win';
    if (isDead || (cause && cause !== 'Time Limit')) status = 'Dead';
    else if (resources.money - debt < 0) status = 'Bankrupt';
    
    logGameSession(status, cause || (isDead ? 'Unknown' : 'Time Limit'));
    setGameState('gameover');
    if (status !== 'Dead') saveScore();
  };

  const triggerRandomEvent = (locObj) => {
    setHealth(h => {
        const threshold = Math.floor(maxHealth * 0.25);
        if (h < threshold) {
            const newH = h - 5;
            if (newH <= 0) setTimeout(() => triggerGameOver("Bleed"), 500);
            triggerFlash('red');
            setLog(prev => ["You are bleeding out! Heal quickly!", ...prev]);
            return newH;
        }
        return h;
    });

    // RISK CHECK
    if (Math.random() > locObj.risk) return recalcPrices(locObj);

    // DYNAMIC EVENT SELECTION
    let eventPool = [...EVENTS];

    // Calculate Net Worth
    const inventoryValue = Object.keys(resources.inventory).reduce((total, item) => {
        const count = resources.inventory[item]?.count || 0;
        const price = currentPrices[item] || 0;
        return total + (count * price);
    }, 0);
    const netWorth = resources.money + inventoryValue;

    // WANTED LOGIC: If rich (> 1.5mil), add Guards to the pool multiple times to increase odds
    if (netWorth > 1500000) {
        eventPool.push(EVENTS.find(e => e.id === 'guards'));
    }

    const event = eventPool[Math.floor(Math.random() * eventPool.length)];

    // COMBAT EVENT Setup
    if (event.type === 'damage' || event.type === 'theft' || event.type === 'guard_encounter') {
        
        let enemyName = "Bandit";
        let dmg = 20;
        let diff = 10;
        let goldLoss = 0;

        if (event.id === 'dragon') {
            enemyName = "Dragon"; dmg = 60; diff = 18;
        } else if (event.id === 'mugger') {
            enemyName = "Spin the Goblin"; dmg = 20; diff = 12; goldLoss = 0.10;
        } else if (event.id === 'guards') {
            enemyName = "City Watch"; 
            // Guards scale with your wealth!
            dmg = 30; 
            diff = 14; 
            goldLoss = 0.25; // They confiscate 25% via "Civil Forfeiture"
        }

        setCombatEvent({
            name: enemyName,
            text: event.text,
            damage: dmg,
            goldLoss: goldLoss,
            difficulty: diff
        });
        return recalcPrices(locObj); 
    }

    let msg = event.text;
    let eventPriceMod = 1.0;
    switch(event.type) {
        case 'heal': setHealth(h => Math.min(h + event.value, maxHealth)); triggerFlash('green'); msg += ` (+${event.value} HP)`; break;
        case 'money': updateMoney(event.value); triggerFlash('gold'); msg += ` (+${event.value} G)`; break;
        case 'price': eventPriceMod = event.value; break;
                case 'flavor': 
            // Do nothing, just show text. 
            // Maybe heal 1 HP for a peaceful day?
            setHealth(h => Math.min(h + 1, maxHealth));
            break;
        default: break;
    }
    setEventMsg({ text: msg, type: event.type });
    setLog(prev => [msg, ...prev]);
    return recalcPrices(locObj, eventPriceMod);
  };

  const startCombatRoll = () => {
      const d20 = Math.ceil(Math.random() * 20);
      setRollTarget(d20);
      setIsRolling(true);
  };

  const handleRollComplete = () => {
      setTimeout(() => { finishCombat(rollTarget); setIsRolling(false); setRollTarget(null); }, 800);
  };

  const generateLoot = (enemyType) => {
    const tier = enemyType === 'Dragon' ? 5 : 1;
    const roll = Math.random();
    if (roll < 0.5) {
        const gold = 100 * tier * (Math.floor(Math.random() * 5) + 1);
        updateMoney(gold); setLog(prev => [`Looted ${gold}g.`, ...prev]); triggerFlash('gold');
    } else if (roll < 0.8) {
        const heal = 10 * tier; setHealth(h => Math.min(h + heal, maxHealth)); setLog(prev => [`Found supplies. Healed ${heal}.`, ...prev]); triggerFlash('green');
    } else {
        const slots = 2 * tier; setMaxInventory(m => m + slots); setLog(prev => [`Found a ${enemyType === 'Dragon' ? 'Chest' : 'Pouch'}. Inv +${slots}.`, ...prev]);
    }
  };

  const finishCombat = (d20Roll) => {
      if (!combatEvent) return;

      const total = d20Roll + combatBonus + (player.race.stats.combat || 0);
      
      // --- 1. CRITICAL SUCCESS (Nat 20) ---
      if (d20Roll === 20) {
          triggerFlash('gold');
          
          // Flavor Text Generator
          let victoryText = `CRITICAL HIT! You obliterated the ${combatEvent.name}!`;
          if (combatEvent.name === 'Dragon') {
              const text = [
                  "You drove your weapon straight into the Dragon's heart!",
                  "You severed the beast's head in a single strike!",
                  "You tricked the Dragon into breathing fire on itself!"
              ];
              victoryText = text[Math.floor(Math.random() * text.length)];
              setDragonsKilled(d => d + 1);
          } 
          else if (combatEvent.name === 'City Watch') {
              const text = [
                  "You knocked the Captain unconscious and the rest fled!",
                  "You vanished into the shadows, leaving them confused.",
                  "You talked your way out of it... then punched them anyway!"
              ];
              victoryText = text[Math.floor(Math.random() * text.length)];
          }
          else {
              // Goblin/Bandit (Spin)
              const text = [
                  `You broke ${combatEvent.name}'s nose with the hilt of your weapon!`,
                  `You kicked ${combatEvent.name} squarely in the ribs, hearing a satisfying crack!`,
                  `You slammed ${combatEvent.name} face-first into the cobblestones!`,
                  `You disarmed ${combatEvent.name} and tossed him into a jagged wall!`
              ];
              victoryText = text[Math.floor(Math.random() * text.length)];
          }

          setLog(prev => [victoryText, ...prev]);
          
          // Double Loot for Crits
          generateLoot(combatEvent.name);
          generateLoot(combatEvent.name);
          setCombatStats(prev => ({ ...prev, wins: prev.wins + 1 }));
      }

      // --- 2. CRITICAL FAILURE (Nat 1) ---
      else if (d20Roll === 1) {
          triggerFlash('red');
          
          // Determine Punishment based on Enemy
          const rollPunishment = Math.random();
          
          // -- A. DRAGON FAILURES --
          if (combatEvent.name === 'Dragon') {
              if (rollPunishment < 0.33) {
                  // SCENARIO: BURNT SUPPLIES (Lose 50% of all items)
                  setResources(prev => {
                      const burnedInv = { ...prev.inventory };
                      Object.keys(burnedInv).forEach(k => {
                          burnedInv[k] = { ...burnedInv[k], count: Math.floor(burnedInv[k].count / 2) };
                      });
                      return { ...prev, inventory: burnedInv };
                  });
                  setLog(prev => ["CRIT FAIL! The Dragon's fire burnt half your inventory!", ...prev]);
                  setHealth(h => h - 20); // Minor dmg on top
              } 
              else if (rollPunishment < 0.66) {
                  // SCENARIO: MAIMED (Lose Max Inventory)
                  const lostSlots = 20;
                  setMaxInventory(m => Math.max(10, m - lostSlots));
                  setLog(prev => [`CRIT FAIL! You got maimed! Max Inventory -${lostSlots}.`, ...prev]);
                  setHealth(h => h - 20);
              } 
              else {
                  // SCENARIO: INCINERATED (Double Damage)
                  const dmg = combatEvent.damage * 2;
                  setHealth(h => {
                      const newH = h - dmg;
                      if (newH <= 0) setTimeout(() => triggerGameOver("Dragon Fire"), 500);
                      return newH;
                  });
                  setLog(prev => [`CRIT FAIL! Direct hit by fire breath! Took ${dmg} dmg.`, ...prev]);
              }
          } 
          
          // -- B. CITY WATCH FAILURES --
          else if (combatEvent.name === 'City Watch') {
              if (rollPunishment < 0.5) {
                  // SCENARIO: PRISON (Lose 2 Days)
                  setDay(d => Math.min(d + 2, MAX_DAYS));
                  // Also heal them since they sat in a cell? Or starve them? Let's starve (Fatigue).
                  setHealth(h => h - 10);
                  setLog(prev => ["CRIT FAIL! You were thrown in the dungeon. Lost 2 Days!", ...prev]);
              } else {
                  // SCENARIO: CIVIL FORFEITURE (Lose 50% Gold)
                  setResources(prev => ({...prev, money: Math.floor(prev.money * 0.5)}));
                  setLog(prev => ["CRIT FAIL! The guards confiscated half your gold!", ...prev]);
                  setHealth(h => h - 20);
              }
          }
          
          // -- C. GOBLIN/BANDIT FAILURES --
          else {
              if (rollPunishment < 0.5) {
                  // SCENARIO: MASTER THIEF (Steal Item)
                  const itemTypes = Object.keys(inventory).filter(k => inventory[k].count > 0);
                  if (itemTypes.length > 0) {
                      const stolenItem = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                      setResources(prev => ({
                          ...prev,
                          inventory: {
                              ...prev.inventory,
                              [stolenItem]: { ...prev.inventory[stolenItem], count: 0 } // Stole ALL of that item
                          }
                      }));
                      setLog(prev => [`CRIT FAIL! Spin stole ALL your ${stolenItem}!`, ...prev]);
                  } else {
                      // Nothing to steal, just dmg
                      setHealth(h => h - 30);
                      setLog(prev => ["CRIT FAIL! He kicked you in the shins. 30 Dmg.", ...prev]);
                  }
              } else {
                  // SCENARIO: MUGGED (Lose 50% Gold)
                  setResources(prev => ({...prev, money: Math.floor(prev.money * 0.5)}));
                  setLog(prev => ["CRIT FAIL! Spin cleaned out your pockets! Lost 50% Gold.", ...prev]);
              }
          }

          setCombatStats(prev => ({ ...prev, losses: prev.losses + 1 }));
      }

      // --- 3. NORMAL RESULT ---
      else if (total >= combatEvent.difficulty) {
          triggerFlash('gold');
          setLog(prev => [`VICTORY! Rolled ${d20Roll} (+${total - d20Roll}) vs DC ${combatEvent.difficulty}.`, ...prev]);
          generateLoot(combatEvent.name);
          if (combatEvent.name === 'Dragon') setDragonsKilled(d => d + 1);
          setCombatStats(prev => ({ ...prev, wins: prev.wins + 1 }));
      } else {
          // NORMAL LOSS
          setHealth(h => {
              const newH = h - combatEvent.damage;
              if (newH <= 0) setTimeout(() => triggerGameOver(combatEvent.name), 500);
              return newH;
          });
          triggerFlash('red');
          setLog(prev => [`DEFEAT! Rolled ${d20Roll} (+${total - d20Roll}) vs DC ${combatEvent.difficulty}. Took ${combatEvent.damage} dmg.`, ...prev]);
          if (combatEvent.goldLoss > 0) setResources(prev => ({...prev, money: Math.floor(prev.money * (1 - combatEvent.goldLoss))}));
          setCombatStats(prev => ({ ...prev, losses: prev.losses + 1 }));
      }
      setCombatEvent(null);
  };

  const resolveRunAway = () => {
      if (!combatEvent) return;
      if (combatEvent.goldLoss > 0) {
          setResources(prev => ({...prev, money: Math.floor(prev.money * (1 - combatEvent.goldLoss))}));
          setLog(prev => [`Paid off the ${combatEvent.name}.`, ...prev]);
      } else {
          setHealth(h => {
              const newH = h - (combatEvent.damage / 2);
              if (newH <= 0) setTimeout(() => triggerGameOver(combatEvent.name + " (Fled)"), 500);
              return newH;
          });
          triggerFlash('red');
          setLog(prev => [`Ran from ${combatEvent.name} but got scorched.`, ...prev]);
      }
      setCombatStats(prev => ({ ...prev, flees: prev.flees + 1 }));
      setCombatEvent(null);
  };

  // --- ACTIONS ---
  const buyItem = (item) => {
    const buyMult = 1.0 - (player.race?.stats.buyMod || 0);
    const cost = Math.ceil(currentPrices[item] * buyMult); 
    setResources(prev => {
        const currentMoney = prev.money; const currentInv = prev.inventory;
        const totalItems = Object.values(currentInv).reduce((a, b) => a + b.count, 0);
        if (totalItems >= maxInventory || currentMoney < cost) return prev;
        const currentItemData = currentInv[item];
        const totalValue = (currentItemData.count * currentItemData.avg) + cost;
        return { money: currentMoney - cost, inventory: { ...currentInv, [item]: { count: currentItemData.count + 1, avg: totalValue / (currentItemData.count + 1) } } };
    });
  };

  const sellItem = (item) => {
    setResources(prev => {
        const currentInv = prev.inventory;
        if (currentInv[item].count <= 0) return prev;
        const sellMult = 1.0 + (player.race?.stats.sellMod || 0);
        const value = Math.floor(currentPrices[item] * sellMult); 
        return { money: prev.money + value, inventory: { ...currentInv, [item]: { ...currentInv[item], count: currentInv[item].count - 1 } } };
    });
  };

  const buyMax = (item) => {
    const buyMult = 1.0 - (player.race?.stats.buyMod || 0);
    const cost = Math.ceil(currentPrices[item] * buyMult); 
    setResources(prev => {
        const totalItems = Object.values(prev.inventory).reduce((a, b) => a + b.count, 0);
        const spaceLeft = maxInventory - totalItems;
        const canAfford = Math.floor(prev.money / cost);
        const amountToBuy = Math.min(spaceLeft, canAfford);
        if (amountToBuy <= 0) return prev; 
        const currentItemData = prev.inventory[item];
        const totalCost = amountToBuy * cost;
        const totalValue = (currentItemData.count * currentItemData.avg) + totalCost;
        return { money: prev.money - totalCost, inventory: { ...prev.inventory, [item]: { count: currentItemData.count + amountToBuy, avg: totalValue / (currentItemData.count + amountToBuy) } } };
    });
  };

  const sellAll = (item) => {
    setResources(prev => {
        const count = prev.inventory[item].count;
        if (count <= 0) return prev;
        const sellMult = 1.0 + (player.race?.stats.sellMod || 0);
        const value = Math.floor(currentPrices[item] * sellMult);
        return { money: prev.money + (value * count), inventory: { ...prev.inventory, [item]: { count: 0, avg: 0 } } };
    });
  };

  const handleSmartMax = (item) => {
    const data = resources.inventory[item];
    const sellMult = 1.0 + (player.race?.stats.sellMod || 0);
    const currentSellPrice = Math.floor(currentPrices[item] * sellMult);
    if (data.count === 0) buyMax(item);
    else if (currentSellPrice > data.avg) sellAll(item);
    else buyMax(item);
  };

  const buyUpgrade = (upgrade) => {
    if (resources.money < upgrade.cost) return setLog(prev => ["Too expensive!", ...prev]);
    if (upgrade.type === 'heal') {
        if (health >= maxHealth) return setLog(prev => ["You are healthy!", ...prev]);
        const healAmount = Math.floor(maxHealth * upgrade.value);
        setHealth(h => Math.min(h + healAmount, maxHealth));
        setResources(prev => ({ ...prev, money: prev.money - upgrade.cost }));
        triggerFlash('green'); return;
    }
    if (playerItems.find(i => i.id === upgrade.id)) return setLog(prev => ["Already own!", ...prev]);
    let newItems = [...playerItems];
    let currentCombatBonus = combatBonus;
    if (upgrade.type === 'combat') {
        const oldWeapon = newItems.find(i => i.type === 'combat');
        if (oldWeapon) { currentCombatBonus -= oldWeapon.value; newItems = newItems.filter(i => i.id !== oldWeapon.id); }
        setCombatBonus(currentCombatBonus + upgrade.value);
    } 
    if (upgrade.type === 'inventory') setMaxInventory(m => m + upgrade.value);
    setResources(prev => ({ ...prev, money: prev.money - upgrade.cost }));
    setPlayerItems([...newItems, upgrade]);
  };

  const payDebt = () => {
    setResources(prev => {
        if (prev.money <= 0 || debt <= 0) return prev;
        const amount = Math.min(prev.money, debt);
        setDebt(d => d - amount);
        setLog(logPrev => [`Paid ${amount}g loan.`, ...logPrev]);
        return { ...prev, money: prev.money - amount };
    });
  };

  const travel = () => {
    if (day >= MAX_DAYS) return triggerGameOver();
    setDay(day + 1);
    if (debt > 0) { setDebt(d => d + Math.ceil(debt * 0.05)); }
    let nextLoc;
    do { nextLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]; } while (nextLoc.name === currentLocation.name);
    setCurrentLocation(nextLoc);
    triggerRandomEvent(nextLoc);
  };

  // --- ROUTER ---
  return (
    <>
      {/* SPLASH */}
      <div onClick={() => setSplash(false)} className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 transition-opacity duration-1000 ${splash ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <img src="/logo.png" alt="Dwarf Wars" className="w-64 h-auto mb-8 animate-in fade-in zoom-in duration-1000" />
        <div className="text-yellow-500 text-xs tracking-[0.5em] font-bold animate-pulse">LOADING REALM...</div>
      </div>

      {gameState === 'start' && <StartScreen player={player} setPlayer={setPlayer} session={session} savedChars={savedChars} leaderboard={leaderboard} onLogin={handleGoogleLogin} onLogout={handleLogout} onStart={startGame} onSave={saveNewCharacter} onDelete={deleteCharacter} onLoad={loadCharacter} onShowProfile={fetchProfile} onShowHelp={() => setGameState('help')}  />}
      
      {gameState === 'profile' && <ProfileScreen profileData={profileData} onClose={() => setGameState('start')} />}
      
      {gameState === 'help' && <HelpScreen onClose={() => setGameState('start')} />}

      {gameState === 'gameover' && <GameOverScreen money={resources.money} debt={debt} isSaving={isSaving} onRestart={() => setGameState('start')} />}
      
      {gameState === 'playing' && <GameScreen 
          player={player} day={day} maxDays={MAX_DAYS} location={currentLocation} resources={resources} health={health} maxHealth={maxHealth} debt={debt} 
          currentPrices={currentPrices} log={log} eventMsg={eventMsg} flash={flash} combatEvent={combatEvent} isRolling={isRolling} rollTarget={rollTarget}
          playerItems={playerItems} onPayDebt={payDebt} onTravel={travel} onRestart={() => { if(window.confirm("Restart?")) { logGameSession('Quit (Restart)'); startGame(); }}} 
          onQuit={() => { if(window.confirm("Quit?")) { logGameSession('Quit (Menu)'); setGameState('start'); }}} 
          onBuy={buyItem} onSell={sellItem} onSmartMax={handleSmartMax} onBuyUpgrade={buyUpgrade} 
          combatActions={{ onRollComplete: handleRollComplete, onRun: resolveRunAway, onFight: startCombatRoll, bonus: combatBonus + (player.race.stats.combat || 0) }}
      />}
    </>
  );
}

export default App