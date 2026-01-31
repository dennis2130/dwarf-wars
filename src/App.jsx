import { useState, useEffect } from 'react'
import { RACES, CLASSES, EVENTS } from './gameData'
import { supabase } from './supabaseClient'

function App() {
  // --- AUTH STATE ---
  const [session, setSession] = useState(null);
  const [savedChars, setSavedChars] = useState([]);

  // --- APP STATE ---
  const [gameState, setGameState] = useState('start'); 
  const [leaderboard, setLeaderboard] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- PLAYER STATE ---
  const [player, setPlayer] = useState({ name: '', race: null, class: null });
  const [maxInventory, setMaxInventory] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [health, setHealth] = useState(100);
  const [priceMod, setPriceMod] = useState(1); 

  // --- GAME LOOP STATE ---
  const [money, setMoney] = useState(100);
  const [debt, setDebt] = useState(5000);
  const [day, setDay] = useState(1);
  const [inventory, setInventory] = useState({ rations: 0, potions: 0, gems: 0 });
  const [location, setLocation] = useState("The Royal City");
  const [log, setLog] = useState([]);
  const [eventMsg, setEventMsg] = useState(null);

  // --- CONFIG ---
  const MAX_DAYS = 31;
  const LOCATIONS = ["The Royal City", "Goblin Slums", "Elven Forest", "Iron Forge", "Orc Badlands"];
  const BASE_PRICES = { rations: 10, potions: 150, gems: 1000 };
  const [currentPrices, setCurrentPrices] = useState(BASE_PRICES);

  // --- INIT ---
  useEffect(() => {
    // 1. Get Leaderboard
    fetchLeaderboard();

    // 2. Check Login Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchSavedCharacters();
    });

    // 3. Listen for Login/Logout events
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
      options: { redirectTo: window.location.origin } // Come back to localhost or vercel
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
      { 
        user_id: session.user.id,
        name: player.name,
        race_id: player.race.id,
        class_id: player.class.id
      }
    ]);
    if (!error) {
        alert("Character Saved!");
        fetchSavedCharacters();
    }
  };

  const saveScore = async () => {
    setIsSaving(true);
    await supabase.from('high_scores').insert([{
        player_name: player.name,
        race: player.race.name,
        class: player.class.name,
        gold: money,
        debt: debt,
        final_score: money - debt
    }]);
    setIsSaving(false);
    fetchLeaderboard();
  };

  // --- GAME ENGINE ---
  const loadCharacter = (char) => {
    // Reconstruct the objects from the IDs saved in DB
    const raceObj = RACES.find(r => r.id === char.race_id);
    const classObj = CLASSES.find(c => c.id === char.class_id);
    setPlayer({ name: char.name, race: raceObj, class: classObj });
  };

  const startGame = () => {
    if(!player.name || !player.race || !player.class) return alert("Complete your character!");

    let inv = 20 + player.race.stats.inventory;
    let hp = 100 + player.race.stats.health;
    let pm = 1.0 - player.race.stats.haggle;
    if (player.class.id === 'warrior') hp += 50;
    
    setMoney(player.class.startingMoney);
    setDebt(player.class.startingDebt);
    setMaxInventory(inv);
    setMaxHealth(hp);
    setHealth(hp);
    setPriceMod(pm);
    setDay(1);
    setInventory({ rations: 0, potions: 0, gems: 0 });
    setLog([`Welcome ${player.name} the ${player.race.name} ${player.class.name}!`, "Good luck."]);
    setGameState('playing');
  };

  const triggerGameOver = () => {
    setGameState('gameover');
    saveScore();
  };

  const triggerRandomEvent = (baseNewPrices) => {
    if (Math.random() > 0.3) { setEventMsg(null); return baseNewPrices; }
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    let msg = event.text;
    let prices = { ...baseNewPrices };

    switch(event.type) {
        case 'damage':
            const dmg = event.value;
            setHealth(h => {
                const newH = h - dmg;
                if (newH <= 0) setTimeout(triggerGameOver, 500);
                return newH;
            });
            msg += ` (-${dmg} Health)`;
            break;
        case 'heal': setHealth(h => Math.min(h + event.value, maxHealth)); msg += ` (+${event.value} Health)`; break;
        case 'money': setMoney(m => m + event.value); msg += ` (+${event.value} Gold)`; break;
        case 'theft': const lost = Math.floor(money * event.value); setMoney(m => m - lost); msg += ` (Lost ${lost} Gold)`; break;
        case 'price': for (const item in prices) { prices[item] = Math.ceil(prices[item] * event.value); } break;
        default: break;
    }
    setEventMsg({ text: msg, type: event.type });
    setLog(prev => [msg, ...prev]);
    return prices;
  };

  const buyItem = (item) => {
    const cost = Math.ceil(currentPrices[item] * priceMod); 
    const totalItems = Object.values(inventory).reduce((a, b) => a + b, 0);
    if (totalItems >= maxInventory) return setLog(prev => ["Inventory full!", ...prev]);
    if (money >= cost) {
      setMoney(money - cost);
      setInventory({ ...inventory, [item]: inventory[item] + 1 }); 
      setLog(prev => [`Bought ${item} for ${cost}g`, ...prev]);
    } else { setLog(prev => ["Not enough gold!", ...prev]); }
  };

  const sellItem = (item) => {
    if (inventory[item] > 0) {
      const value = Math.floor(currentPrices[item] * priceMod); 
      setMoney(money + value);
      setInventory({ ...inventory, [item]: inventory[item] - 1 });
      setLog(prev => [`Sold ${item} for ${value}g`, ...prev]);
    }
  };

  const travel = () => {
    if (day >= MAX_DAYS) return triggerGameOver();
    setDay(day + 1);
    if (debt > 0) { setDebt(d => d + Math.ceil(debt * 0.10)); }
    const nextLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    setLocation(nextLoc);
    let newPrices = { ...BASE_PRICES };
    for (const item in newPrices) {
      const volatility = Math.random() * 0.5 + 0.75; 
      newPrices[item] = Math.floor(BASE_PRICES[item] * volatility);
    }
    newPrices = triggerRandomEvent(newPrices);
    setCurrentPrices(newPrices);
  };

  // --- RENDER: GAME OVER ---
  if (gameState === 'gameover') {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-5xl font-bold mb-4 text-red-600">GAME OVER</h1>
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
            <h1 className="text-3xl font-bold text-yellow-500 tracking-tighter">DWARF WARS</h1>
            {!session ? (
                <button onClick={handleGoogleLogin} className="text-xs bg-white text-black px-3 py-2 rounded font-bold hover:bg-gray-200">
                    G Login
                </button>
            ) : (
                <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-white">
                    Logout
                </button>
            )}
        </div>

        {/* SAVED CHARACTERS (Only if Logged In) */}
        {session && savedChars.length > 0 && (
            <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Saved Heroes</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {savedChars.map(char => (
                        <div key={char.id} onClick={() => loadCharacter(char)} className="flex-shrink-0 bg-slate-800 p-3 rounded border border-slate-600 w-32 cursor-pointer hover:bg-slate-700">
                            <div className="font-bold text-yellow-500 truncate">{char.name}</div>
                            <div className="text-[10px] text-slate-400">{char.race_id} / {char.class_id}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {/* LEADERBOARD */}
        <div className="mb-8 bg-black/30 rounded-lg p-4 border border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Global Leaders</h3>
            {leaderboard.map((score, i) => (
                <div key={i} className="flex justify-between text-sm items-center mb-1">
                    <span className="text-slate-500">{i+1}. {score.player_name}</span>
                    <span className={score.final_score > 0 ? "text-green-500" : "text-red-500"}>{score.final_score}</span>
                </div>
            ))}
        </div>

        {/* CREATE CHARACTER FORM */}
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
            <button onClick={startGame} disabled={!player.name || !player.race || !player.class} className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-lg text-lg transition-all">
                PLAY
            </button>
            {session && player.name && player.race && player.class && (
                <button onClick={saveNewCharacter} className="bg-slate-700 text-white px-4 rounded-lg border border-slate-600 hover:bg-slate-600">
                    Save
                </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN GAME (PLAYING) ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 max-w-md mx-auto border-x border-slate-700 flex flex-col">
      <header className="flex justify-between items-start mb-4 border-b border-slate-700 pb-2">
        <div><h1 className="text-xl font-bold text-yellow-500">{player.name}</h1><p className="text-xs text-slate-400">{player.race?.name} {player.class?.name}</p></div>
        <div className="text-right text-sm"><p>Day: <span className="text-white font-bold">{day}/{MAX_DAYS}</span></p><p className="text-xs text-blue-400">{location}</p></div>
      </header>

      {eventMsg && <div className={`mb-4 p-3 rounded text-center text-sm font-bold border ${eventMsg.type === 'damage' || eventMsg.type === 'theft' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-green-900/50 border-green-500 text-green-200'}`}>{eventMsg.text}</div>}

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-slate-800 p-2 rounded shadow"><div className="text-xs text-slate-400">GOLD</div><div className="text-green-400 font-bold">{money}</div></div>
        <div className="bg-slate-800 p-2 rounded shadow"><div className="text-xs text-slate-400">DEBT</div><div className="text-red-400 font-bold">{debt}</div>{debt > 0 && <button onClick={payDebt} className="text-[10px] underline text-blue-400">Pay</button>}</div>
        <div className="bg-slate-800 p-2 rounded shadow"><div className="text-xs text-slate-400">HEALTH</div><div className={`${health < 30 ? 'text-red-500 animate-pulse' : 'text-blue-400'} font-bold`}>{health}/{maxHealth}</div></div>
      </div>

      <div className="mb-4"><h2 className="text-xs font-bold mb-2 text-slate-500 uppercase tracking-widest">Marketplace</h2><div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">{Object.keys(currentPrices).map((item) => (<div key={item} className="flex justify-between items-center p-3 border-b border-slate-700 last:border-0"><div className="w-1/3 capitalize font-bold text-slate-300">{item}</div><div className="w-1/3 text-center text-yellow-500 font-mono">{Math.ceil(currentPrices[item] * priceMod)} g</div><div className="w-1/3 flex justify-end gap-2"><button onClick={() => buyItem(item)} className="bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-xs font-bold">Buy</button><button onClick={() => sellItem(item)} className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs font-bold">Sell</button></div></div>))}</div></div>

      <div className="mb-4 flex-grow"><div className="flex justify-between items-end mb-2"><h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inventory</h2><span className="text-xs text-slate-400">{Object.values(inventory).reduce((a, b) => a + b, 0)} / {maxInventory} Slots</span></div><div className="grid grid-cols-3 gap-2 text-sm text-center">{Object.entries(inventory).map(([key, count]) => (<div key={key} className="bg-slate-800 p-2 rounded border border-slate-700"><div className="capitalize text-slate-400 text-xs mb-1">{key}</div><div className="text-white font-bold text-lg">{count}</div></div>))}</div></div>

      <button onClick={travel} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg shadow-lg mb-4 text-lg active:scale-95 transition-all">Travel to New Location</button>

      <div className="bg-black p-3 rounded-lg h-24 overflow-y-auto text-xs font-mono text-green-500 border border-slate-700 shadow-inner">{log.map((entry, i) => <div key={i} className="mb-1 border-b border-gray-900 pb-1 last:border-0"> &gt; {entry}</div>)}</div>
    </div>
  )
}

export default App