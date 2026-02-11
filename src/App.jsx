import { useState, useEffect } from 'react'
import { RACES, CLASSES, LOCATIONS, UPGRADES, BASE_PRICES } from './gameData'
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
  const [gameState, setGameState] = useState('start'); 
  const [leaderboard, setLeaderboard] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [splash, setSplash] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [eventPool, setEventPool] = useState([]);

  // Player (Name removed)
  const [player, setPlayer] = useState({ race: null, class: null });
  
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
  const [checkEvent, setCheckEvent] = useState(null);

  const MAX_DAYS = 31;

  // --- INIT & AUTH ---
  useEffect(() => {
    fetchLeaderboard();
    fetchEvents();

    const initSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
            checkProfile(session.user.id);
        }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          checkProfile(session.user.id);
          
          // --- FIX: Clean the URL hash so we don't try to use the token twice ---
          // This removes the #access_token=... junk from the address bar
          if (window.location.hash && window.location.hash.includes('access_token')) {
              const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
              window.history.replaceState({}, document.title, newUrl);
          }
          // ---------------------------------------------------------------------
      } else {
          setUserProfile(null);
      }
    });

    const timer = setTimeout(() => setSplash(false), 2500);
    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('game_events').select('*').eq('is_active', true);
    if (error) console.error("Error loading events:", error);
    else setEventPool(data || []);
  };

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
  const handleLogout = async () => { await supabase.auth.signOut(); setPlayer({ race: null, class: null }); };

  // --- DATA FETCHING ---
  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('high_scores').select('*').order('final_score', { ascending: false }).limit(500);
    if (data) setLeaderboard(data);
  };
  
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

  const saveScore = async () => {
    const scorerName = userProfile?.gamertag || 'Guest';
    setIsSaving(true);
    // Note: We use the Gamertag as the player_name now
    await supabase.from('high_scores').insert([{ 
        player_name: scorerName, 
        gamertag: scorerName, 
        race: player.race.name, 
        class: player.class.name, 
        gold: resources.money, 
        debt: debt, 
        final_score: resources.money - debt 
    }]);
    setIsSaving(false);
    fetchLeaderboard();
  };

  const logGameSession = async (status, cause = null) => {
    const rawScore = resources.money - debt;
    const finalScore = Math.max(0, rawScore);
    const sessionData = {
        user_email: session?.user?.email || 'Anonymous',
        char_name: userProfile?.gamertag || 'Guest', // Log Gamertag instead of Character Name
        gamertag:  userProfile?.gamertag,  
        race: player.race?.name,
        class: player.class?.name,
        score: finalScore,
        status: status,
        days_survived: day,
        upgrades: playerItems.map(i => i.name),
        combat_stats: { ...combatStats, dragons_killed: dragonsKilled, cause_of_death: cause }
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

  // --- HELPER: PRICE CALCULATOR ---
  const getBuyPrice = (basePrice) => {
      const buyMod = player.race?.stats.buyMod || 0;
      return Math.ceil(basePrice * (1.0 - buyMod));
  };

  const getSellPrice = (basePrice) => {
      const sellMod = player.race?.stats.sellMod || 0;
      return Math.floor(basePrice * 0.80 * (1.0 + sellMod));
  };

  const triggerFlash = (color) => { setFlash(color); setTimeout(() => setFlash(''), 300); };
  const updateMoney = (amount) => { setResources(prev => ({ ...prev, money: Math.max(0, prev.money + amount) })); };

  // --- GAME LOGIC ---

  const startGame = () => {
    // 1. Handle Randomization
    let selectedRace = player.race;
    let selectedClass = player.class;

    if (!selectedRace) {
        selectedRace = RACES[Math.floor(Math.random() * RACES.length)];
    }
    if (!selectedClass) {
        selectedClass = CLASSES[Math.floor(Math.random() * CLASSES.length)];
    }

    // 2. Set State
    setPlayer({ race: selectedRace, class: selectedClass });

    // 3. Initialize Stats
    let inv = 50 + selectedRace.stats.inventory;
    let hp = 100 + selectedRace.stats.health;
    let def = selectedRace.id === 'orc' ? 5 : 0;
    if (selectedClass.id === 'warrior') hp += 50;
    
    const initialInv = {};
    Object.keys(BASE_PRICES).forEach(key => initialInv[key] = { count: 0, avg: 0 });
    setResources({ money: selectedClass.startingMoney, inventory: initialInv });
    setDebt(selectedClass.startingDebt);
    setMaxInventory(inv); setMaxHealth(hp); setHealth(hp); setDefense(def);
    setPlayerItems([]); setCombatBonus(0); setDragonsKilled(0);
    setCombatStats({ wins: 0, losses: 0, flees: 0 });
    setDay(1);
    setHasTraded(false);
    setCombatEvent(null);
    setCheckEvent(null);
    setEventMsg(null);
    setIsRolling(false);
    setRollTarget(null);
    
    const startLoc = LOCATIONS[0];
    setCurrentLocation(startLoc);
    recalcPrices(startLoc);
    setLog([`Welcome ${userProfile?.gamertag || 'Wanderer'}...`, "Good luck."]);
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
    setEventMsg(null); 
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

    if (Math.random() > locObj.risk) return recalcPrices(locObj);

    const inventoryValue = Object.keys(resources.inventory).reduce((total, item) => {
        const count = resources.inventory[item]?.count || 0;
        const price = getSellPrice(currentPrices[item] || 0); 
        return total + (count * price);
    }, 0);
    const netWorth = resources.money + inventoryValue;

        // 2. Filter Pool based on Net Worth AND Config Constraints
    let validEvents = eventPool.filter(e => {
        const conf = e.config || {};
        
        // Net Worth Check
        if (netWorth < (e.req_net_worth || 0)) return false;

        // Debt Check (New)
        if (conf.req_debt && debt <= 0) return false;

        // Day Range Check (New)
        if (conf.req_min_day && day < conf.req_min_day) return false;
        if (conf.req_max_day && day > conf.req_max_day) return false;

        return true;
    });

    // --- DEBUG: FORCE TROLL EVENT ---
    // Uncomment this line to test the logic, then delete it!
     //validEvents = validEvents.filter(e => e.slug === 'troll_bridge' || e.slug === 'dragon');    
     //validEvents = validEvents.filter(e => e.slug === 'goon_squad');
    // --------------------------------

    if (validEvents.length === 0) return recalcPrices(locObj);

    if (netWorth > 1000000) {
        const guardEvent = validEvents.find(e => e.slug === 'guards');
        if (guardEvent) {
            validEvents.push(guardEvent);
            validEvents.push(guardEvent);
        }
    }

    const event = validEvents[Math.floor(Math.random() * validEvents.length)];

    // Handle Event Types
    // 1. Combat Event
    if (event.type === 'combat') {
        let stats = event.config; 
        if (event.slug === 'guards' && netWorth > 1000000) {
             stats = { ...stats, damage: 50, difficulty: 16 };
        }
        setCombatEvent({
            name: stats.enemy,
            text: event.text,
            damage: stats.damage,
            goldLoss: stats.gold_loss_pct,
            difficulty: stats.difficulty
        });
        return recalcPrices(locObj); 
    }

    // 2. Skill Check Event (New)

    if (event.type === 'check') {
        
        setCheckEvent({
            title: event.slug.replace('_', ' '), // simple cleanup
            text: event.text,
            config: event.config, // Contains difficulty, outcomes, stat
            result: null // No result yet
        });
        return recalcPrices(locObj);
    }


    let msg = event.text;
    let eventPriceMod = 1.0;
    switch(event.type) {
        case 'heal': setHealth(h => Math.min(h + event.config.value, maxHealth)); triggerFlash('green'); msg += ` (+${event.config.value} HP)`; break;
        case 'money': updateMoney(event.config.value); triggerFlash('gold'); msg += ` (+${event.config.value} G)`; break;
        case 'price': eventPriceMod = event.config.value; break;
        case 'flavor': setHealth(h => Math.min(h + 1, maxHealth)); break;
        default: break;
    }
    setEventMsg({ text: msg, type: event.type });
    setLog(prev => [msg, ...prev]);
    return recalcPrices(locObj, eventPriceMod);
  };

  const startCombatRoll = () => {
      // 1. Create a buffer for a random 32-bit integer
      const array = new Uint32Array(1);
      
      // 2. Fill it with cryptographically strong randomness from the OS
      window.crypto.getRandomValues(array);
      
      // 3. Modulo math: (RandomHugeNumber % 20) gives 0-19. Add 1 to get 1-20.
      const d20 = (array[0] % 20) + 1;
      
      setRollTarget(d20);
      setIsRolling(true);
  };

  const handleRollComplete = () => {
      setTimeout(() => { finishCombat(rollTarget); setIsRolling(false); setRollTarget(null); }, 800);
  };

  const generateLoot = (enemyType) => {
    const tier = enemyType === 'Dragon' ? 5 : 1;
    const roll = Math.random();
    let lootMsg = "";
    
    if (roll < 0.5) {
        const gold = 100 * tier * (Math.floor(Math.random() * 5) + 1);
        updateMoney(gold); 
        lootMsg = `Looted ${gold} gold coins.`;
        triggerFlash('gold');
    } else if (roll < 0.8) {
        const heal = 10 * tier; 
        setHealth(h => Math.min(h + heal, maxHealth)); 
        lootMsg = `Found supplies. Healed ${heal} HP.`;
        triggerFlash('green');
    } else {
        const slots = 2 * tier; 
        setMaxInventory(m => m + slots); 
        lootMsg = `Found a ${enemyType === 'Dragon' ? 'Chest' : 'Pouch'}. Inventory +${slots}.`;
    }
    setLog(prev => [lootMsg, ...prev]);
    return lootMsg; // <--- RETURN THIS
  };

// --- NEW: GENERIC OUTCOME HANDLER ---
  const applyOutcomeEffect = (effect) => {
      let summary = [];

      // 1. Handle Gold (Flat or Percent)
      if (effect.gold) {
          updateMoney(effect.gold);
          summary.push(`${effect.gold > 0 ? '+' : ''}${effect.gold}g`);
      }
      if (effect.gold_pct) {
          const delta = Math.floor(resources.money * effect.gold_pct);
          updateMoney(delta);
          summary.push(`${delta > 0 ? '+' : ''}${delta}g`);
      }

      // 2. Handle Health
      if (effect.health) {
          setHealth(h => {
              const newH = Math.min(h + effect.health, maxHealth);
              if (newH <= 0) setTimeout(() => triggerGameOver("Event Death"), 500);
              return newH;
          });
          summary.push(`${effect.health > 0 ? '+' : ''}${effect.health} HP`);
      }

      // 3. Handle Items
      if (effect.add_item) {
          const item = effect.add_item;
          const count = effect.amount || 1;
          setResources(prev => {
              const currentInv = prev.inventory;
              const totalItems = Object.values(currentInv).reduce((a, b) => a + b.count, 0);
              if (totalItems + count <= maxInventory) {
                  return {
                      ...prev,
                      inventory: {
                          ...currentInv,
                          [item]: { ...currentInv[item], count: currentInv[item].count + count }
                      }
                  };
              }
              return prev;
          });
          summary.push(`+${count} ${item}`);
      }

      if (effect.remove_all_item) {
          setResources(prev => ({
              ...prev,
              inventory: { ...prev.inventory, [effect.remove_all_item]: { count: 0, avg: 0 } }
          }));
          summary.push(`Lost all ${effect.remove_all_item}`);
      }

      // 4. Special Outcomes
      if (effect.zero_gold) {
          setResources(prev => ({ ...prev, money: 0 }));
          summary.push("Lost ALL Gold");
      }
      if (effect.clear_inventory) {
          setResources(prev => {
              const emptyInv = {};
              Object.keys(prev.inventory).forEach(k => emptyInv[k] = { count: 0, avg: 0 });
              return { ...prev, inventory: emptyInv };
          });
          summary.push("Inventory Stripped");
      }
      if (effect.clear_debt) {
          setDebt(0);
          triggerFlash('green');
          summary.push("Debt Cleared!");
      }

      // 5. Force Pay or Hurt (FIXED: Logic moved outside setResources)
      if (effect.force_pay_or_hurt) {
          const { interest_pct, damage } = effect.force_pay_or_hurt;
          const totalOwed = Math.floor(debt * (1.0 + interest_pct));
          
          // Check current resources state directly
          if (resources.money >= totalOwed) {
              setDebt(0);
              updateMoney(-totalOwed);
              triggerFlash('red');
              summary.push(`Forced to pay ${totalOwed}g`);
          } else {
              setHealth(h => {
                  const newH = h - damage;
                  if (newH <= 0) setTimeout(() => triggerGameOver("Debt Collection"), 500);
                  return newH;
              });
              triggerFlash('red');
              summary.push(`Took ${damage} Damage`);
          }
      }

      return summary.join(", ");
  };


const finishCombat = (d20Roll) => {
      if (!combatEvent) return;

      let racialBonus = 0;
      if (player.race.id === 'kobold' && combatEvent.name === 'Dragon') racialBonus = 5;
      if (player.race.id === 'halfling' && combatEvent.name === 'City Watch') racialBonus = 5;

      const total = d20Roll + combatBonus + (player.race.stats.combat || 0) + racialBonus;
      
      let outcome = '';
      let title = '';
      let flavorText = '';
      let lootText = ''; // To store loot results

      // --- 1. CRITICAL SUCCESS ---
      if (d20Roll === 20) {
          outcome = 'crit_success';
          title = 'CRITICAL HIT!';
          flavorText = `You obliterated the ${combatEvent.name}!`;
          triggerFlash('gold');
          
          if (combatEvent.name === 'Dragon') setDragonsKilled(d => d + 1);
          setCombatStats(prev => ({ ...prev, wins: prev.wins + 1 }));
          
          // Double Loot
          const l1 = generateLoot(combatEvent.name);
          const l2 = generateLoot(combatEvent.name);
          lootText = `${l1} ${l2}`;
      }
      // --- 2. CRITICAL FAILURE ---
      else if (d20Roll === 1) {
          outcome = 'crit_fail';
          title = 'CRITICAL FAILURE';
          triggerFlash('red');
          
          // Crit Fail Logic
          const dmg = combatEvent.damage * 1.5;
          setHealth(h => {
             const newH = h - Math.max(0, dmg - defense);
             if (newH <= 0) setTimeout(() => triggerGameOver(combatEvent.name), 500);
             return newH;
          });
          
          let failMsg = `You took ${Math.max(0, dmg - defense)} damage.`;

          if (combatEvent.goldLoss > 0) {
              setResources(prev => ({...prev, money: Math.floor(prev.money * 0.5)}));
              failMsg += " Lost 50% of your gold!";
          }
          
          flavorText = failMsg;
          setCombatStats(prev => ({ ...prev, losses: prev.losses + 1 }));
      }
      // --- 3. NORMAL WIN ---
      else if (total >= combatEvent.difficulty) {
          outcome = 'win';
          title = 'VICTORY';
          flavorText = `You defeated the ${combatEvent.name}.`;
          triggerFlash('gold');
          
          if (combatEvent.name === 'Dragon' && player.race.id !== 'kobold') setDragonsKilled(d => d + 1);
          setCombatStats(prev => ({ ...prev, wins: prev.wins + 1 }));
          
          lootText = generateLoot(combatEvent.name);
      } 
      // --- 4. NORMAL LOSS ---
      else {
          outcome = 'loss';
          title = 'DEFEAT';
          
          const mitigatedDmg = Math.max(0, combatEvent.damage - defense);
          setHealth(h => {
              const newH = h - mitigatedDmg;
              if (newH <= 0) setTimeout(() => triggerGameOver(combatEvent.name), 500);
              return newH;
          });
          
          flavorText = `You took ${mitigatedDmg} damage.`;
          
          if (combatEvent.goldLoss > 0) {
              setResources(prev => ({...prev, money: Math.floor(prev.money * (1 - combatEvent.goldLoss))}));
              flavorText += " They took some of your gold.";
          }
          
          triggerFlash('red');
          setCombatStats(prev => ({ ...prev, losses: prev.losses + 1 }));
      }

      // Log it
      setLog(prev => [`${title}: ${flavorText}`, ...prev]);

      // UPDATE MODAL STATE INSTEAD OF CLOSING
      setCombatEvent(prev => ({
          ...prev,
          result: {
              outcome,
              title,
              text: flavorText,
              loot: lootText,
              roll: d20Roll,
              total: total
          }
      }));
  };

  const closeCombatModal = () => {
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


  // --- SKILL CHECK LOGIC ---

const startCheckRoll = () => {
    // 1. Calculate the Target (True RNG)
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const d20 = (array[0] % 20) + 1;

    setRollTarget(d20);
    setIsRolling(true);
};

const handleCheckRollComplete = () => {
    // Wait for animation to finish
    setTimeout(() => {
        finishCheck(rollTarget);
        setIsRolling(false);
        setRollTarget(null);
    }, 800);
};

    const finishCheck = (d20) => {
        if (!checkEvent) return;

        const config = checkEvent.config;
        
        let bonus = 0;
        if (config.stat === 'combat') bonus = combatBonus + (player.race.stats.combat || 0);
        // ... (other stats if added)
        
        const total = d20 + bonus;

        let outcomeKey = 'fail';
        if (d20 === 20) outcomeKey = 'crit_success';
        else if (d20 === 1) outcomeKey = 'crit_fail';
        else if (total >= config.difficulty) outcomeKey = 'success';

        const outcomeData = config.outcomes[outcomeKey];

        // CAPTURE THE TEXT RESULT
        const effectText = applyOutcomeEffect(outcomeData.effect); 

        const logText = `[${config.stat.toUpperCase()}] Rolled ${d20} + ${bonus} vs DC ${config.difficulty}. ${outcomeKey.toUpperCase()}!`;
        setLog(prev => [logText, ...prev]);
        triggerFlash(outcomeKey.includes('success') ? 'gold' : 'red');

        // PASS TEXT TO MODAL
        setCheckEvent(prev => ({
            ...prev,
            result: {
                outcome: outcomeKey,
                text: outcomeData.text,
                effectText: effectText, // <--- New Field
                roll: d20,
                total: total
            }
        }));
    };

const closeCheckModal = () => {
    setCheckEvent(null);
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
    
    // HEAL LOGIC
    if (upgrade.type === 'heal') {
        if (health >= maxHealth) return setLog(prev => ["You are healthy!", ...prev]);
        const healAmount = Math.floor(maxHealth * upgrade.value);
        setHealth(h => Math.min(h + healAmount, maxHealth));
        setResources(prev => ({ ...prev, money: prev.money - upgrade.cost }));
        triggerFlash('green'); 
        return;
    }

    // DUPLICATE CHECK
    if (playerItems.find(i => i.id === upgrade.id)) return setLog(prev => ["Already own!", ...prev]);

    let newItems = [...playerItems];
    let currentCombatBonus = combatBonus;

    // --- WEAPON SWAP CHECK (The Fix) ---
    if (upgrade.type === 'combat') {
        const oldWeapon = newItems.find(i => i.type === 'combat');
        if (oldWeapon) {
            // Confirm Dialog
            const confirmSwap = window.confirm(`You are carrying a ${oldWeapon.name}. Drop it to equip the ${upgrade.name}?`);
            if (!confirmSwap) return; // User cancelled

            // Remove old bonus and item
            currentCombatBonus -= oldWeapon.value;
            newItems = newItems.filter(i => i.id !== oldWeapon.id);
            setLog(prev => [`Dropped ${oldWeapon.name}.`, ...prev]);
        }
        setCombatBonus(currentCombatBonus + upgrade.value);
    } 
    // -----------------------------------

    if (upgrade.type === 'inventory') setMaxInventory(m => m + upgrade.value);
    
    setResources(prev => ({ ...prev, money: prev.money - upgrade.cost }));
    setPlayerItems([...newItems, upgrade]);
    setLog(prev => [`Bought ${upgrade.name}.`, ...prev]);
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

      {/* UPDATED: Pass userProfile (gamertag) instead of player.name */}
      {gameState === 'start' && <StartScreen player={player} setPlayer={setPlayer} session={session} leaderboard={leaderboard} onLogin={handleGoogleLogin} onLogout={handleLogout} onStart={startGame} onShowProfile={fetchProfile} onShowHelp={() => setGameState('help')} userProfile={userProfile} />}
      
      {gameState === 'profile' && <ProfileScreen profileData={profileData} onClose={() => setGameState('start')} userProfile={userProfile}  onEditTag={() => setShowTagModal(true)}/>}
      
      {gameState === 'help' && <HelpScreen onClose={() => setGameState('start')} />}

      {gameState === 'gameover' && <GameOverScreen money={resources.money} debt={debt} health={health} race={player.race?.name} isSaving={isSaving} onRestart={() => setGameState('start')} />}
      
      {/* UPDATED: Pass gamertag explicitly */}
      {gameState === 'playing' && <GameScreen 
          gamertag={userProfile?.gamertag || 'Wanderer'} // New Prop
          player={player} day={day} maxDays={MAX_DAYS} location={currentLocation} resources={resources} health={health} maxHealth={maxHealth} debt={debt} 
          currentPrices={currentPrices} log={log} eventMsg={eventMsg} flash={flash} combatEvent={combatEvent} isRolling={isRolling} rollTarget={rollTarget}
          playerItems={playerItems} onPayDebt={payDebt} onTravel={handleEndTurn} onRestart={() => { if(window.confirm("Restart?")) { logGameSession('Quit (Restart)'); startGame(); }}} 
          onQuit={() => { if(window.confirm("Quit?")) { logGameSession('Quit (Menu)'); setGameState('start'); }}} 
          getBuyPrice={getBuyPrice}
          getSellPrice={getSellPrice}
          onBuy={buyItem} 
          onBuyMax={buyMax} 
          onSell={sellItem}
          onSellAll={sellAll}
          onBuyUpgrade={buyUpgrade} 
          combatActions={{ onRollComplete: handleRollComplete, onRun: resolveRunAway, onFight: startCombatRoll, bonus: combatBonus + (player.race.stats.combat || 0) }}
          onCloseCombat={closeCombatModal} 
          onWork={doOddJob} hasTraded={hasTraded}
          checkEvent={checkEvent}
          onCheckRoll={startCheckRoll}
          onCheckComplete={handleCheckRollComplete}
          onCloseCheck={closeCheckModal}
      />}
    </>
  );
}

export default App