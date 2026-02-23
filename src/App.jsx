import { useState, useEffect } from 'react'
import { RACES, CLASSES, LOCATIONS, UPGRADES, BASE_PRICES, GAME_META } from './gameData'
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

  // Selections
  const [buildSelection, setBuildSelection] = useState({ race: null, class: null });
  const [player, setPlayer] = useState({ race: null, class: null });
  
  // Game Stats
  const [maxInventory, setMaxInventory] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [health, setHealth] = useState(100);
  const [defense, setDefense] = useState(0); 
  const [combatBonus, setCombatBonus] = useState(0);
  const [playerItems, setPlayerItems] = useState([]); 
  const [dragonsKilled, setDragonsKilled] = useState(0);
  const [combatStats, setCombatStats] = useState({ wins: 0, losses: 0, flees: 0 });

  // Resources
  const [resources, setResources] = useState({ money: 100, inventory: {} });
  const [debt, setDebt] = useState(5000);
  const [day, setDay] = useState(1);
  const [currentLocation, setCurrentLocation] = useState(LOCATIONS[0]);
  const [currentPrices, setCurrentPrices] = useState(BASE_PRICES);
  const [log, setLog] = useState([]);
  const [eventMsg, setEventMsg] = useState(null);
  const [flash, setFlash] = useState(''); 
  const [hasTraded, setHasTraded] = useState(false);

  // --- UNIFIED EVENT STATE (Replaces combatEvent/checkEvent) ---
  const [activeEvent, setActiveEvent] = useState(null); 
  const [isRolling, setIsRolling] = useState(false);
  const [rollTarget, setRollTarget] = useState(null);

  const DEBUG_GAMERTAG = import.meta.env.VITE_DEBUG_GAMERTAG;

  const MAX_DAYS = 31;

  // --- INIT & AUTH ---
  useEffect(() => {
    fetchLeaderboard();
    fetchEvents();

    const initSession = async () => {
        // Check if we are running on Channel 3 (In-Game Browser with C3 API)
        const isChannel3 = window.location.hostname.includes('channel3.gg');

        if (isChannel3) {
            try {
                console.log("Channel 3 Environment Detected. Fetching User Data...");
                
                // Fetch User Data from C3 API (Same Origin)
                const response = await fetch('/api/me');
                
                if (response.ok) {
                    const c3Data = await response.json();
                    
                    if (c3Data.status === 'success' && c3Data.data) {
                        const c3User = c3Data.data;
                        console.log("C3 User Found:", c3User.gamertag);

                        // LOGIC: Link or Create Profile in Supabase
                        await handleChannel3Login(c3User);
                        return; 
                    }
                }
            } catch (err) {
                console.error("Failed to connect to Channel 3 API:", err);
            }
        }

        // Fallback: Standard Supabase Auth (Vercel / Localhost)
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
          if (window.location.hash && window.location.hash.includes('access_token')) {
              const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
              window.history.replaceState({}, document.title, newUrl);
          }
      } else {
          setUserProfile(null);
      }
    });

    const timer = setTimeout(() => setSplash(false), 2500);
    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  // --- NEW HELPER: HANDLE CHANNEL 3 LOGIN ---
  const handleChannel3Login = async (c3User) => {
      // 1. Try to find profile by Channel 3 ID (Use maybeSingle to avoid 406 error)
      let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('channel3_id', c3User.userid)
          .maybeSingle(); // <--- CHANGED FROM .single()

      // 2. If not found by ID, try to find by Gamertag
      if (!profile) {
          const { data: tagProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('gamertag', c3User.gamertag)
              .maybeSingle(); // <--- CHANGED FROM .single()
          
          if (tagProfile) {
              console.log("Found legacy profile by Gamertag. Linking Channel 3 ID...");
              // Update existing profile with C3 ID and profile image
              await supabase
                  .from('profiles')
                  .update({ 
                      channel3_id: c3User.userid,
                      c3_profile_image: c3User.profileimg50 || null // Store the image URL
                  })
                  .eq('id', tagProfile.id);
              
              profile = { 
                ...tagProfile, 
                channel3_id: c3User.userid,
                c3_profile_image: c3User.profileimg50 || null // Ensure current profile object has it
              };
          }
      }

// 3. Create new profile if needed
      if (!profile) {
          console.log("No profile found. Creating new linked profile...");
          
          const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
          
          if (authError) {
              console.error("Anon Login Failed:", authError);
              return; 
          }

          if (authData.session) {
              const newUserId = authData.session.user.id;
              
              const newProfileData = {
                  id: newUserId,
                  gamertag: c3User.gamertag,
                  channel3_id: c3User.userid,
                  c3_profile_image: c3User.profileimg50 || null // Store the image URL
              };

              const { error: insertError } = await supabase
                  .from('profiles')
                  .insert([newProfileData]);
              
              if (!insertError) {
                  // OPTIMIZATION: Don't fetch again. Just use the data we have.
                  // This prevents the 406 error if RLS latency causes a read miss.
                  profile = newProfileData; 
                  setSession(authData.session);
              } else {
                  console.error("Profile creation failed:", insertError);
              }
          }
      } else {
          // 4. Existing profile found. Ensure we have a session to write logs.
          // Also make sure the profile object has the c3_profile_image
          if (!profile.c3_profile_image && c3User.profileimg50) {
              console.log("Existing profile needs Channel 3 image linked.");
               await supabase
                  .from('profiles')
                  .update({ c3_profile_image: c3User.profileimg50 })
                  .eq('id', profile.id);
              profile.c3_profile_image = c3User.profileimg50; // Update local state for consistency
          }

          if (!session) {
             await supabase.auth.signInAnonymously();
          }
      }

      // 5. Final State Update
      if (profile) {
          setUserProfile(profile);
          console.log("Logged in as:", profile.gamertag, "C3 Image:", profile.c3_profile_image);
      }
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('game_events').select('*').eq('is_active', true);
    if (error) console.error("Error loading events:", error);
    else setEventPool(data || []);
  };

  const checkProfile = async (userId) => {
      // CHANGED: .maybeSingle() returns null instead of an error if not found
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (data && data.gamertag) {
          // If we had a c3_profile_image from a C3 login, retain it
          if (userProfile?.c3_profile_image) {
              setUserProfile({ ...data, c3_profile_image: userProfile.c3_profile_image });
          } else {
              setUserProfile(data);
          }
          setShowTagModal(false);
      } else {
          // Only show modal if we aren't on Channel 3 (C3 handles its own profiles)
          if (!window.location.hostname.includes('channel3.gg')) {
              setShowTagModal(true);
          }
      }
  };

  const handleGoogleLogin = async () => await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  
  const handleLogout = async () => { 
      await supabase.auth.signOut(); 
      setPlayer({ race: null, class: null });
      setBuildSelection({ race: null, class: null });
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('high_scores').select('*').order('final_score', { ascending: false }).limit(500);
    if (data) setLeaderboard(data);
  };
  
  const fetchProfile = async () => {
    // 1. If we already loaded a C3 profile, just use that ID
    const targetId = userProfile?.id || session?.user?.id;
    if (!targetId) return;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId) // Use the ID we know is correct
        .maybeSingle();

    const { data: history } = await supabase
        .from('game_logs')
        // We removed email, so we fetch by gamertag now
        .select('*')
        .eq('gamertag', profile?.gamertag) 
        .order('created_at', { ascending: false })
        .limit(10);


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
    const currentTag = userProfile?.gamertag || 'Guest';

    // 1. Identify the Target ID
    const targetId = userProfile?.id || session?.user?.id;
    
    console.log("--- LOGGING SESSION DEBUG ---");
    console.log("Status:", status);
    console.log("Gamertag:", currentTag);
    console.log("Target Profile ID:", targetId);
    console.log("Session ID:", session?.user?.id);

    const sessionData = {
        char_name: currentTag,
        gamertag: currentTag,
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
        
        // Promise 1: Log Insert to Supabase
        const logPromise = supabase.from('game_logs').insert([sessionData]);
        promises.push(logPromise);

        // Promise 2: Stats RPC to Supabase
        if (targetId) {
            const isDead = status === 'Dead';
            console.log("Attempting RPC call 'update_player_stats' for:", targetId);
            
            const statsPromise = supabase.rpc('update_player_stats', { 
                player_id: targetId,
                gold_earned: finalScore,
                is_dead: isDead,
                dragons: dragonsKilled, 
                score: finalScore
            });
            promises.push(statsPromise);
        } else {
            console.warn("!! NO TARGET ID FOUND. Supabase Stats will not be updated. !!");
        }

        // --- NEW: Channel 3 API Call ---
        const isChannel3 = window.location.hostname.includes('channel3.gg');
        const c3UserId = userProfile?.channel3_id; // This was stored during handleChannel3Login

        if (isChannel3 && c3UserId) {
            // IMPORTANT: Replace these with the actual values provided by Joel!
            // You might want to move these to a gameData.js or environment variables
            const CHANNEL3_BOSS_ID = import.meta.env.VITE_C3_BOSS_ID;
            const CHANNEL3_CHEAT_CODE = import.meta.env.VITE_C3_CHEAT_CODE;
            const CHANNEL3_GAME_ID = import.meta.env.VITE_C3_GAME_ID; 

            const channel3Payload = {
                bossid: CHANNEL3_BOSS_ID,
                cheatcode: CHANNEL3_CHEAT_CODE,
                gameid: CHANNEL3_GAME_ID,
                datetime: new Date().toISOString(), // Current ISO timestamp
                sessionid: session?.id || 'UNAUTH_C3_SESSION', // Use Supabase session ID or a fallback
                data: {
                    userid: c3UserId,
                    // Spread all game session data into the 'data' object
                    ...sessionData
                }
            };

            console.log("Sending data to Channel 3:", channel3Payload);

            const c3ApiCallPromise = fetch('https://channel3.gg/api/postgamestats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(channel3Payload)
            })
            .then(response => {
                if (!response.ok) {
                    // Still good to get the text for error messages if it's not 'ok'
                    return response.text().then(text => { throw new Error(`Channel 3 API error: ${response.status} - ${text}`) });
                }
                console.log("Successfully sent game stats to Channel 3.");
                // --- KERNEL OF THE FIX ---
                // If you don't expect or need the response as JSON, don't try to parse it.
                // Just return the response object itself, or nothing.
                return; // Or return response; if you wanted to inspect it later without parsing.
            })
            .catch(error => {
                console.error("Error sending stats to Channel 3:", error);
            });

            promises.push(c3ApiCallPromise);
        } else if (isChannel3 && !c3UserId) {
            console.warn("Channel 3 environment detected, but no c3UserId found. Skipping stats submission to Channel 3.");
        }
        // --- END Channel 3 API Call ---


        const results = await Promise.allSettled(promises); // Use allSettled to ensure all promises run even if one fails

        // Check Supabase Log Result
        const supabaseLogResult = results[0];
        if (supabaseLogResult && supabaseLogResult.status === 'rejected') {
            console.error("Supabase Log Insert Error:", supabaseLogResult.reason);
        } else if (supabaseLogResult && supabaseLogResult.status === 'fulfilled') {
            console.log("Supabase Log Insert Success");
        }

        // Check Supabase Stats RPC Result (only if it was attempted)
        if (targetId && results[1]) {
            const supabaseRpcResult = results[1];
            if (supabaseRpcResult.status === 'rejected') {
                console.error("Supabase RPC Stats Update Error:", supabaseRpcResult.reason);
            } else if (supabaseRpcResult.status === 'fulfilled') {
                console.log("Supabase RPC Stats Update Success");
            }
        }
        // Channel 3 result is handled within its promise chain
        

    } catch (err) {
        console.error("Unexpected error in logGameSession:", err);
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

  // --- HELPER: EVENT OUTCOMES ---
  const applyOutcomeEffect = (effect) => {
      let summary = [];

      // Gold
      if (effect.gold) {
          updateMoney(effect.gold);
          summary.push(`${effect.gold > 0 ? '+' : ''}${effect.gold}g`);
      }
      if (effect.gold_pct) {
          const delta = Math.floor(resources.money * effect.gold_pct);
          updateMoney(delta);
          summary.push(`${delta > 0 ? '+' : ''}${delta}g`);
      }

      // Health
      if (effect.health) {
          setHealth(h => {
              const newH = Math.min(h + effect.health, maxHealth);
              if (newH <= 0) setTimeout(() => triggerGameOver("Event Death"), 500);
              return newH;
          });
          summary.push(`${effect.health > 0 ? '+' : ''}${effect.health} HP`);
      }

      // Items
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

      // Special
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

      // Debt/Hurt Logic
      if (effect.force_pay_or_hurt) {
          const { interest_pct, damage } = effect.force_pay_or_hurt;
          const totalOwed = Math.floor(debt * (1.0 + interest_pct));
          
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

  // --- GAME LOGIC ---

  const startGame = () => {
    // 1. Reset Event State
    setActiveEvent(null);
    setEventMsg(null);
    setIsRolling(false);
    setRollTarget(null);

    // 2. Handle Randomization
    let selectedRace = buildSelection.race; 
    let selectedClass = buildSelection.class;

    if (!selectedRace) selectedRace = RACES[Math.floor(Math.random() * RACES.length)];
    if (!selectedClass) selectedClass = CLASSES[Math.floor(Math.random() * CLASSES.length)];

    setPlayer({ race: selectedRace, class: selectedClass });

    // 3. Init Stats
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

    // Calculate Net Worth for Filters
    const inventoryValue = Object.keys(resources.inventory).reduce((total, item) => {
        const count = resources.inventory[item]?.count || 0;
        const price = getSellPrice(currentPrices[item] || 0); 
        return total + (count * price);
    }, 0);
    const netWorth = resources.money + inventoryValue;

    // 1. FILTERING
    let validEvents = eventPool.filter(e => {
        const conf = e.config || {};
        if (netWorth < (e.req_net_worth || 0)) return false;
        if (conf.req_debt && debt <= 0) return false;
        if (conf.req_min_day && day < conf.req_min_day) return false;
        if (conf.req_max_day && day > conf.req_max_day) return false;
        return true;
    });

    if (validEvents.length === 0) return recalcPrices(locObj);

    // 2. WEIGHTED SELECTION
    const weightedPool = [];
    validEvents.forEach(e => {
        const weight = e.risk_weight || 1; 
        for (let i = 0; i < weight; i++) weightedPool.push(e);
        if (e.slug === 'guards' && netWorth > 1000000) {
            for(let i=0; i<10; i++) weightedPool.push(e);
        }
    });

    const event = weightedPool[Math.floor(Math.random() * weightedPool.length)];

    // 3. UNIFIED EVENT SETUP (Combat + Check)
    if (event.type === 'combat' || event.type === 'check') {
        let config = event.config;
        
        // Handle Scaling
        if (event.slug === 'guards' && netWorth > 1000000) {
             config = { ...config, difficulty: 16 }; 
        }

        setActiveEvent({
            ...event,
            config: config,
            result: null
        });
        return recalcPrices(locObj);
    }

        // 4. SIMPLE EVENTS
    let msg = event.text;
    let eventPriceMod = 1.0;
    
    // NEW: Determine if it's good or bad
    let msgType = 'neutral'; 

    switch(event.type) {
        case 'heal': 
            setHealth(h => Math.min(h + event.config.value, maxHealth)); 
            triggerFlash('green'); 
            msg += ` (+${event.config.value} HP)`; 
            msgType = 'good'; // <--- Explicitly Good
            break;
        case 'money': 
            updateMoney(event.config.value); 
            triggerFlash('gold'); 
            msg += ` (+${event.config.value} G)`; 
            msgType = 'good'; // <--- Explicitly Good
            break;
        case 'price': 
            eventPriceMod = event.config.value; 
            // Market Crash (0.5) is Good for buying? Bad for selling? 
            // Usually events like "Market Crash" are neutral/alert info.
            msgType = 'bad'; 
            break;
        case 'flavor': 
            setHealth(h => Math.min(h + 1, maxHealth)); 
            msgType = 'good'; // Minor heal is good
            break;
        default: 
            msgType = 'bad'; // Default to Alert/Red
            break;
    }

    setEventMsg({ text: msg, type: msgType }); 

    setLog(prev => [msg, ...prev]);
    return recalcPrices(locObj, eventPriceMod);
  };

  // --- UNIFIED ROLL HANDLERS ---
  const startRoll = () => {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      const d20 = (array[0] % 20) + 1;
      setRollTarget(d20);
      setIsRolling(true);
  };

  const handleRollComplete = () => {
      setTimeout(() => { finishEvent(rollTarget); setIsRolling(false); setRollTarget(null); }, 800);
  };

  const finishEvent = (d20) => {
        if (!activeEvent) return;
        const config = activeEvent.config;
        
        let bonus = 0;
        // Combat Bonus
        if (config.stat === 'combat') {
            bonus = combatBonus + (player.race.stats.combat || 0);
            
            // Racial Bonuses (Hardcoded for now, could be in DB later)
            if (player.race.id === 'kobold' && activeEvent.slug === 'dragon') bonus += 5;
            if (player.race.id === 'halfling' && activeEvent.slug === 'guards') bonus += 5;
        }
        
        const total = d20 + bonus;

        let outcomeKey = 'fail';
        if (d20 === 20) outcomeKey = 'crit_success';
        else if (d20 === 1) outcomeKey = 'crit_fail';
        else if (total >= config.difficulty) outcomeKey = 'success';

        const outcomeData = config.outcomes[outcomeKey];
        const effectText = applyOutcomeEffect(outcomeData.effect); 

        // Tracking Stats
        if (activeEvent.type === 'combat') {
            if (outcomeKey.includes('success')) {
                setCombatStats(prev => ({ ...prev, wins: prev.wins + 1 }));
                if (activeEvent.slug === 'dragon') setDragonsKilled(d => d + 1);
            } else {
                setCombatStats(prev => ({ ...prev, losses: prev.losses + 1 }));
            }
        }

        const logText = `[${config.stat.toUpperCase()}] Rolled ${d20} + ${bonus} vs DC ${config.difficulty}. ${outcomeKey.toUpperCase()}!`;
        setLog(prev => [logText, ...prev]);
        triggerFlash(outcomeKey.includes('success') ? 'gold' : 'red');

        setActiveEvent(prev => ({
            ...prev,
            result: {
                outcome: outcomeKey,
                text: outcomeData.text,
                effectText: effectText,
                roll: d20,
                total: total
            }
        }));
  };

  const closeEventModal = () => setActiveEvent(null);

  const resolveRunAway = () => {
      if (!activeEvent) return;
      // Simple penalty for now
      setHealth(h => h - 10);
      setCombatStats(prev => ({ ...prev, flees: prev.flees + 1 }));
      setLog(prev => [`Ran away from ${activeEvent.slug}. Took 10 dmg.`, ...prev]);
      setActiveEvent(null);
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
        if (oldWeapon) {
            const confirmSwap = window.confirm(`You are carrying a ${oldWeapon.name}. Drop it to equip the ${upgrade.name}?`);
            if (!confirmSwap) return; 
            currentCombatBonus -= oldWeapon.value;
            newItems = newItems.filter(i => i.id !== oldWeapon.id);
            setLog(prev => [`Dropped ${oldWeapon.name}.`, ...prev]);
        }
        setCombatBonus(currentCombatBonus + upgrade.value);
    } 
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
    <img src="./logo.png" alt="Dwarf Wars" className="w-64 h-auto mb-8 animate-in fade-in zoom-in duration-1000" />

    <div className="text-yellow-500 text-xs tracking-[0.5em] font-bold animate-pulse mb-2">LOADING REALM...</div>

    {/* NEW STUDIO & VERSION INFO */}
    <div className="flex flex-col items-center gap-1 opacity-50 animate-in slide-in-from-bottom-4 duration-1000 delay-500">
        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{GAME_META.studio}</span>
        <span className="text-[9px] text-slate-600 font-mono">{GAME_META.version}</span>
    </div>
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

      {gameState === 'start' && <StartScreen player={buildSelection} setPlayer={setBuildSelection} session={session} leaderboard={leaderboard} onLogin={handleGoogleLogin} onLogout={handleLogout} onStart={startGame} onShowProfile={fetchProfile} onShowHelp={() => setGameState('help')} userProfile={userProfile} />}
      
      {gameState === 'profile' && <ProfileScreen profileData={profileData} onClose={() => setGameState('start')} userProfile={userProfile}  onEditTag={() => setShowTagModal(true)}/>}
      
      {gameState === 'help' && <HelpScreen onClose={() => setGameState('start')} />}

      {gameState === 'gameover' && <GameOverScreen money={resources.money} debt={debt} health={health} race={player.race?.name} isSaving={isSaving} onRestart={() => setGameState('start')} />}
      
      {gameState === 'playing' && <GameScreen 
          gamertag={userProfile?.gamertag || 'Wanderer'} 
          userProfile={userProfile} // <-- ADD THIS LINE
          player={player} day={day} maxDays={MAX_DAYS} location={currentLocation} resources={resources} health={health} maxHealth={maxHealth} debt={debt} 
          currentPrices={currentPrices} log={log} eventMsg={eventMsg} flash={flash} 
          activeEvent={activeEvent} // UNIFIED EVENT
          isRolling={isRolling} rollTarget={rollTarget}
          playerItems={playerItems} onPayDebt={payDebt} onTravel={handleEndTurn} onRestart={() => { if(window.confirm("Restart?")) { logGameSession('Quit (Restart)'); startGame(); }}} 
          onQuit={() => { if(window.confirm("Quit?")) { logGameSession('Quit (Menu)'); setGameState('start'); }}} 
          getBuyPrice={getBuyPrice}
          getSellPrice={getSellPrice}
          onBuy={buyItem} 
          onBuyMax={buyMax} 
          onSell={sellItem}
          onSellAll={sellAll}
          onBuyUpgrade={buyUpgrade} 
          combatActions={{ onRollComplete: handleRollComplete, onRun: resolveRunAway, bonus: combatBonus + (player.race.stats.combat || 0) }}
          onWork={doOddJob} hasTraded={hasTraded}
          // UNIFIED HANDLERS
          onRoll={startRoll}
          onClose={closeEventModal}
          debugGamertag={DEBUG_GAMERTAG}
      />}
    </>
  );
}

export default App