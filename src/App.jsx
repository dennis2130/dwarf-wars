import { useState, useEffect } from 'react'
import { RACES, CLASSES, EVENTS, LOCATIONS, UPGRADES, BASE_PRICES, validateName } from './gameData'
import { supabase } from './supabaseClient'

// Import Screens
import StartScreen from './screens/StartScreen';
import GameScreen from './screens/GameScreen';
import ProfileScreen from './screens/ProfileScreen';
import GameOverScreen from './screens/GameOverScreen';
import HelpScreen from './screens/HelpScreen';
import GamerTagModal from './screens/GamerTagModal';

function App() {
  // --- STATE ---
  const [session, setSession] = useState(null);
  const [savedChars, setSavedChars] = useState([]);
  const [gameState, setGameState] = useState('start'); 
  const [leaderboard, setLeaderboard] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [splash, setSplash] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showTagModal, setShowTagModal] = useState(false);

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
  const [hasTraded, setHasTraded] = useState(false);

  // Combat UI
  const [combatEvent, setCombatEvent] = useState(null); 
  const [isRolling, setIsRolling] = useState(false);
  const [rollTarget, setRollTarget] = useState(null);

  const MAX_DAYS = 31;

  // --- INIT & AUTH ---
  useEffect(() => {
    fetchLeaderboard();

    const initSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
            fetchSavedCharacters();
            checkProfile(session.user.id);
        }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          fetchSavedCharacters();
          checkProfile(session.user.id);
      } else {
          setSavedChars([]);
          setUserProfile(null);
      }
    });

    const timer = setTimeout(() => setSplash(false), 2500);
    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  const checkProfile = async (userId) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data && data.gamertag) {
          setUserProfile(data);
          setShowTagModal(false);
      } else {
          setShowTagModal(true);
      }
  };

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
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    const { data: history } = await supabase.from('game_logs').select('*').eq('user_email', session.user.email).order('created_at', { ascending: false }).limit(10);

    if (profile && history) {
        setProfileData({ 
            stats: {
                totalRuns: profile.total_runs,
                totalDeaths: profile.total_deaths,
                highestScore: profile.highest_score,
                dragonsKilled: profile.dragons_killed,
                totalGold: profile.total_gold
            }, 
            history 
        });
        setGameState('profile');
    }
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
    const scorerName = userProfile?.gamertag || 'Anonymous';
    setIsSaving(true);
    await supabase.from('high_scores').insert([{ player_name: player.name, gamertag: scorerName, race: player.race.name, class: player.class.name, gold: resources.money, debt: debt, final_score: resources.money - debt }]);
    setIsSaving(false);
    fetchLeaderboard();
  };

  const logGameSession = async (status, cause = null) => {
    const rawScore = resources.money - debt;
    const finalScore = Math.max(0, rawScore);
    const sessionData = {
        user_email: session?.user?.email || 'Anonymous',
        char_name: player.name,
        race: player.race?.name,
        class: player.class?.name,
        score: finalScore,
        status: status,
        days_survived: day,
        upgrades: playerItems.map(i => i.name),
        combat_stats: { ...combatStats, dragons_killed: dragonsKilled, cause_of_death: cause }, 
        gamertag: userProfile?.gamertag || null
    };

    try {
        const promises = [];
        const logPromise = supabase.from('game_logs').insert([sessionData]);
        promises.push(logPromise);

        if (session?.user?.id) {
            const isDead = status === 'Dead';
            const statsPromise = supabase.rpc('update_player_stats', { 
                player_id: session.user.id,
                gold_earned: finalScore,
                is_dead: isDead,
                dragons: dragonsKilled, 
                score: finalScore
            });
            promises.push(statsPromise);
        }
        await Promise.all(promises);
    } catch (err) {
        console.error("Error logging session:", err);
    }
  };

  // --- HELPER: PRICE CALCULATOR (Spread Logic) ---
  const getBuyPrice = (basePrice) => {
      const buyMod = player.race?.stats.buyMod || 0;
      // You buy at 100% (minus race discount)
      return Math.ceil(basePrice * (1.0 - buyMod));
  };

  const getSellPrice = (basePrice) => {
      const sellMod = player.race?.stats.sellMod || 0;
      // You sell at 80% (plus race bonus) -> The Shopkeeper's Spread
      // This prevents "Buy for 100, Sell for 100" loops.
      return Math.floor(basePrice * 0.80 * (1.0 + sellMod));
  };

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
    setHasTraded(false);
    
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
    // BLEED CHECK
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

    // DYNAMIC EVENT POOL
    let eventPool = [...EVENTS];

    // NET WORTH CHECK FOR GUARDS
    const inventoryValue = Object.keys(resources.inventory).reduce((total, item) => {
        const count = resources.inventory[item]?.count || 0;
        const price = getSellPrice(currentPrices[item] || 0); // Use sell price for valuation
        return total + (count * price);
    }, 0);
    const netWorth = resources.money + inventoryValue;

    if (netWorth > 1000000) {
        // Add Guards multiple times to increase odds if rich
        const guardEvent = EVENTS.find(e => e.id === 'guards');
        eventPool.push(guardEvent);
        eventPool.push(guardEvent);
    }

    const event = eventPool[Math.floor(Math.random() * eventPool.length)];

    // COMBAT EVENT Setup
    if (event.combatStats) {
        // Clone stats to avoid modifying constant data
        let stats = { ...event.combatStats };

        // Scale Guard Stats if Rich
        if (event.id === 'guards' && netWorth > 1000000) {
             stats.damage = 50; // Elite Guards
             stats.difficulty = 16;
        }

        setCombatEvent({
            name: stats.name,
            text: event.text,
            damage: stats.damage,
            goldLoss: stats.goldLoss,
            difficulty: stats.difficulty
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

      let racialBonus = 0;
      if (player.race.id === 'kobold' && combatEvent.name === 'Dragon') racialBonus = 5;
      if (player.race.id === 'halfling' && combatEvent.name === 'City Watch') racialBonus = 5;

      const total = d20Roll + combatBonus + (player.race.stats.combat || 0) + racialBonus;
      
      // CRITICAL SUCCESS (Nat 20)
      if (d20Roll === 20) {
          triggerFlash('gold');
          setLog(prev => [`CRITICAL HIT! You obliterated the ${combatEvent.name}!`, ...prev]);
          generateLoot(combatEvent.name);
          generateLoot(combatEvent.name);
          if (combatEvent.name === 'Dragon') setDragonsKilled(d => d + 1);
          setCombatStats(prev => ({ ...prev, wins: prev.wins + 1 }));
      }
      // CRITICAL FAILURE (Nat 1)
      else if (d20Roll === 1) {
          triggerFlash('red');
          // Simplified Crit Fail Logic for readability
          const dmg = combatEvent.damage * 1.5;
          setHealth(h => {
             const newH = h - Math.max(0, dmg - defense);
             if (newH <= 0) setTimeout(() => triggerGameOver(combatEvent.name), 500);
             return newH;
          });
          if (combatEvent.goldLoss > 0) setResources(prev => ({...prev, money: Math.floor(prev.money * 0.5)})); // Lose 50% on Crit Fail
          setLog(prev => [`CRIT FAIL! Disaster strikes!`, ...prev]);
          setCombatStats(prev => ({ ...prev, losses: prev.losses + 1 }));
      }
      // NORMAL WIN
      else if (total >= combatEvent.difficulty) {
          triggerFlash('gold');
          setLog(prev => [`VICTORY! Rolled ${d20Roll} (+${total - d20Roll}) vs DC ${combatEvent.difficulty}.`, ...prev]);
          generateLoot(combatEvent.name);
          if (combatEvent.name === 'Dragon' && player.race.id !== 'kobold') setDragonsKilled(d => d + 1);
          setCombatStats(prev => ({ ...prev, wins: prev.wins + 1 }));
      } 
      // NORMAL LOSS
      else {
          const mitigatedDmg = Math.max(0, combatEvent.damage - defense);
          setHealth(h => {
              const newH = h - mitigatedDmg;
              if (newH <= 0) setTimeout(() => triggerGameOver(combatEvent.name), 500);
              return newH;
          });
          triggerFlash('red');
          setLog(prev => [`DEFEAT! Took ${mitigatedDmg} dmg.`, ...prev]);         
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
  const doOddJob = () => {
      if (day >= MAX_DAYS) return triggerGameOver();
      setDay(day + 1);
      if (debt > 0) { setDebt(d => d + Math.ceil(debt * 0.05)); }

      const wage = Math.floor(Math.random() * 150) + 50; 
      updateMoney(wage);
      setLog(prev => [`Worked odd jobs. Earned ${wage}g.`, ...prev]);
      triggerFlash('green');
      triggerRandomEvent(currentLocation);
  };

  const buyItem = (item) => {
    const cost = getBuyPrice(currentPrices[item]);
    setResources(prev => {
        const currentMoney = prev.money; const currentInv = prev.inventory;
        const totalItems = Object.values(currentInv).reduce((a, b) => a + b.count, 0);
        if (totalItems >= maxInventory || currentMoney < cost) return prev;
        const currentItemData = currentInv[item];
        const totalValue = (currentItemData.count * currentItemData.avg) + cost;
        return { money: currentMoney - cost, inventory: { ...currentInv, [item]: { count: currentItemData.count + 1, avg: totalValue / (currentItemData.count + 1) } } };
    });
    setHasTraded(true);
  };

  const buyMax = (item) => {
    const cost = getBuyPrice(currentPrices[item]);
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
    setHasTraded(true);
  };

  const sellItem = (item) => {
    setResources(prev => {
        const currentInv = prev.inventory;
        if (currentInv[item].count <= 0) return prev;
        const value = getSellPrice(currentPrices[item]); 
        return { money: prev.money + value, inventory: { ...currentInv, [item]: { ...currentInv[item], count: currentInv[item].count - 1 } } };
    });
    setHasTraded(true);
  };

  const sellAll = (item) => {
    setResources(prev => {
        const count = prev.inventory[item].count;
        if (count <= 0) return prev;
        const value = getSellPrice(currentPrices[item]);
        return { money: prev.money + (value * count), inventory: { ...prev.inventory, [item]: { count: 0, avg: 0 } } };
    });
    setHasTraded(true);
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
        setLog(logPrev => [`Paid ${amount}g to the Vault.`, ...logPrev]);
        return { ...prev, money: prev.money - amount };
    });
  };

  const handleEndTurn = () => {
    if (day >= MAX_DAYS) return triggerGameOver();
    setDay(d => d + 1);
    if (debt > 0) { setDebt(d => d + Math.ceil(debt * 0.05)); }
    if (!hasTraded) {
        const wage = Math.floor(Math.random() * 150) + 50;
        updateMoney(wage);
        setLog(prev => [`Worked passage to next city. Earned ${wage}g.`, ...prev]);
        triggerFlash('green');
    }
    setHasTraded(false); 
    let nextLoc;
    do { nextLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]; } 
    while (nextLoc.name === currentLocation.name);
    setCurrentLocation(nextLoc);
    triggerRandomEvent(nextLoc);
  };

  return (
    <>
      <div onClick={() => setSplash(false)} className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 transition-opacity duration-1000 ${splash ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <img src="/logo.png" alt="Dwarf Wars" className="w-64 h-auto mb-8 animate-in fade-in zoom-in duration-1000" />
        <div className="text-yellow-500 text-xs tracking-[0.5em] font-bold animate-pulse">LOADING REALM...</div>
      </div>

      {showTagModal && session && (
        <GamerTagModal 
            session={session} 
            currentTag={userProfile?.gamertag}
            onCancel={userProfile?.gamertag ? () => setShowTagModal(false) : null}
            onComplete={(tag) => {
                setUserProfile({ ...userProfile, gamertag: tag });
                setShowTagModal(false);
            }} 
        />
      )}

      {gameState === 'start' && <StartScreen player={player} setPlayer={setPlayer} session={session} savedChars={savedChars} leaderboard={leaderboard} onLogin={handleGoogleLogin} onLogout={handleLogout} onStart={startGame} onSave={saveNewCharacter} onDelete={deleteCharacter} onLoad={loadCharacter} onShowProfile={fetchProfile} onShowHelp={() => setGameState('help')} userProfile={userProfile} />}
      
      {gameState === 'profile' && <ProfileScreen profileData={profileData} onClose={() => setGameState('start')} userProfile={userProfile}  onEditTag={() => setShowTagModal(true)}/>}
      
      {gameState === 'help' && <HelpScreen onClose={() => setGameState('start')} />}

      {/* UPDATED: Passing Race to GameOverScreen */}
      {gameState === 'gameover' && <GameOverScreen money={resources.money} debt={debt} health={health} race={player.race?.name} isSaving={isSaving} onRestart={() => setGameState('start')} />}
      
      {gameState === 'playing' && <GameScreen 
          player={player} day={day} maxDays={MAX_DAYS} location={currentLocation} resources={resources} health={health} maxHealth={maxHealth} debt={debt} 
          currentPrices={currentPrices} log={log} eventMsg={eventMsg} flash={flash} combatEvent={combatEvent} isRolling={isRolling} rollTarget={rollTarget}
          playerItems={playerItems} onPayDebt={payDebt} onTravel={handleEndTurn} onRestart={() => { if(window.confirm("Restart?")) { logGameSession('Quit (Restart)'); startGame(); }}} 
          onQuit={() => { if(window.confirm("Quit?")) { logGameSession('Quit (Menu)'); setGameState('start'); }}} 
          // UPDATED: Passing Price Helpers and new Actions
          getBuyPrice={getBuyPrice}
          getSellPrice={getSellPrice}
          onBuy={buyItem} 
          onBuyMax={buyMax} 
          onSell={sellItem}
          onSellAll={sellAll}
          onBuyUpgrade={buyUpgrade} 
          combatActions={{ onRollComplete: handleRollComplete, onRun: resolveRunAway, onFight: startCombatRoll, bonus: combatBonus + (player.race.stats.combat || 0) }}
          onWork={doOddJob} hasTraded={hasTraded}
      />}
    </>
  );
}

export default App