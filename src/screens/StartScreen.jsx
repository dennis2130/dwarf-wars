import { useState, useEffect, useRef } from 'react'; 
import { RACES, CLASSES } from '../gameData'; 
import { Shield, Menu, User, LogOut, BookOpen } from 'lucide-react';

export default function StartScreen({ 
    player, setPlayer, 
    session, leaderboard, 
    onLogin, onLogout, onStart, onShowProfile, onShowHelp, userProfile
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [leaderboardTab, setLeaderboardTab] = useState('day'); 
    
     // --- SCROLL LOGIC ---
    const scrollRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    const [hasStarted, setHasStarted] = useState(false); // Track if initial delay is done

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        let animationFrameId;
        let startTimeoutId;
        
        // Counter to control speed (defined OUTSIDE the loop)
        let tick = 0; 

        const scroll = () => {
            if (isPaused) return; // Don't fight the user

            tick++;
            
            // SPEED CONTROL:
            // % 2 = Half Speed (30fps)
            // % 3 = Third Speed (20fps) - Good for reading
            if (tick % 3 === 0) {
                container.scrollTop += 1;
            }

            // Infinite Loop Logic
            if (container.scrollTop >= (container.scrollHeight / 2)) {
                container.scrollTop = 0;
            }
            
            animationFrameId = requestAnimationFrame(scroll);
        };

        if (!hasStarted) {
            // Initial Load: Wait 2.5s for splash screen
            startTimeoutId = setTimeout(() => {
                setHasStarted(true);
                animationFrameId = requestAnimationFrame(scroll);
            }, 2500);
        } else if (!isPaused) {
            // Resume immediately if not paused and already started
            animationFrameId = requestAnimationFrame(scroll);
        }

        return () => {
            clearTimeout(startTimeoutId);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPaused, hasStarted, leaderboardTab, leaderboard]);

    // --- GAME LOGIC ---
    const toggleRace = (r) => {
        setPlayer(prev => ({ ...prev, race: prev.race?.id === r.id ? null : r }));
    };

    const toggleClass = (c) => {
        setPlayer(prev => ({ ...prev, class: prev.class?.id === c.id ? null : c }));
    };

    const getPlayButtonText = () => {
        if (!player.race && !player.class) return "PLAY RANDOM BUILD";
        if (!player.race) return "PLAY RANDOM RACE";
        if (!player.class) return "PLAY RANDOM CLASS";
        return "PLAY";
    };

    const getFilteredLeaderboard = () => {
        const now = new Date();
        const filtered = leaderboard.filter(score => {
            const scoreDate = new Date(score.created_at);
            if (leaderboardTab === 'day') {
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                return scoreDate >= oneDayAgo;
            }
            if (leaderboardTab === 'week') {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return scoreDate >= oneWeekAgo;
            }
            if (leaderboardTab === 'month') {
                const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return scoreDate >= oneMonthAgo;
            }
            return true;
        });
        return filtered.slice(0, 20); 
    };

    const listToRender = [...getFilteredLeaderboard(), ...getFilteredLeaderboard()];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-6 max-w-md mx-auto border-x border-slate-700 font-sans">
            
            {/* HEADER */}
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-yellow-500 tracking-tighter flex items-center gap-2"><Shield size={24}/> DWARF WARS</h1>
                {!session ? (
                    <button onClick={onLogin} className="text-xs bg-white text-black px-3 py-2 rounded font-bold hover:bg-gray-200">G Login</button>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-[10px] text-slate-400 uppercase">Player</div>
                            <div className="text-xs font-bold text-yellow-500">{userProfile?.gamertag}</div>
                        </div>
                        <div className="relative">
                            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-slate-400 hover:text-white"><Menu size={24} /></button>
                            {menuOpen && (
                                <div className="absolute right-0 top-10 bg-slate-800 border border-slate-600 rounded shadow-xl w-48 z-50 overflow-hidden">
                                    <button onClick={onShowProfile} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"><User size={16}/> My Profile</button>
                                    <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700 border-t border-slate-700 flex items-center gap-2"><LogOut size={16}/> Logout</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* DRAGON ART */}
            <div className="flex justify-center mb-4 relative z-0">
                <img 
                    src="/dragon.png" 
                    alt="Dragon Hoard" 
                    className="h-28 w-auto object-contain opacity-90 drop-shadow-lg" 
                />
            </div>

            {/* LEADERBOARD CONTAINER */}
            <div className="mb-8 bg-black/30 rounded-lg border border-slate-800 h-40 relative overflow-hidden shadow-inner">
                
                {/* 1. TITLE */}
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest absolute top-0 left-0 right-0 bg-slate-900/90 p-2 z-10 border-b border-slate-800 text-center">
                    Global Leaders
                </h3>
                
                {/* 2. TABS */}
                <div className="absolute top-8 left-0 right-0 bg-slate-900/90 z-10 px-2">
                    <div className="flex text-xs border-b border-slate-800 mb-2">
                        <button onClick={() => setLeaderboardTab('day')} className={`flex-1 py-1 ${leaderboardTab === 'day' ? 'text-yellow-500 font-bold' : 'text-slate-500'}`}>Today</button>
                        <button onClick={() => setLeaderboardTab('week')} className={`flex-1 py-1 ${leaderboardTab === 'week' ? 'text-yellow-500 font-bold' : 'text-slate-500'}`}>Week</button>
                        <button onClick={() => setLeaderboardTab('month')} className={`flex-1 py-1 ${leaderboardTab === 'month' ? 'text-yellow-500 font-bold' : 'text-slate-500'}`}>Month</button>
                        <button onClick={() => setLeaderboardTab('all')} className={`flex-1 py-1 ${leaderboardTab === 'all' ? 'text-yellow-500 font-bold' : 'text-slate-500'}`}>All Time</button>
                    </div>
                </div>

                {/* 3. SCROLLING LIST (HIDDEN SCROLLBAR) */}
                <div 
                    ref={scrollRef}
                    className="absolute top-16 left-0 right-0 bottom-0 p-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                >
                    <div>
                        {listToRender.map((score, i) => (
                            <div key={i} className="flex justify-between text-sm items-center mb-1 border-b border-slate-800/50 pb-1">
                                <span className="text-slate-400 flex gap-2">
                                    <span className="text-slate-600 font-mono w-4">#{i % 20 + 1}</span> 
                                    {score.gamertag || score.player_name}
                                </span>
                                <span className="text-slate-600 text-[10px]">({score.race} {score.class})</span>
                                <span className={`font-mono ${score.final_score > 0 ? "text-green-500" : "text-red-500"}`}>
                                    {score.final_score.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FORM */}
            <div className="space-y-4">
                
                {/* RACES */}
                <div className="grid grid-cols-2 gap-2">
                    {RACES.map(r => (
                        <button key={r.id} onClick={() => toggleRace(r)} className={`p-2 rounded border text-xs text-left transition-all ${player.race?.id === r.id ? 'bg-yellow-900/50 border-yellow-500' : 'bg-slate-800 border-slate-700'}`}>
                            <div className="font-bold text-slate-200">{r.name}</div>
                            <div className="text-[10px] text-slate-500">{r.bonus}</div>
                        </button>
                    ))}
                </div>

                {/* CLASSES */}
                <div className="grid grid-cols-3 gap-2">
                    {CLASSES.map(c => (
                        <button key={c.id} onClick={() => toggleClass(c)} className={`p-2 rounded border text-xs text-center transition-all ${player.class?.id === c.id ? 'bg-blue-900/50 border-blue-500' : 'bg-slate-800 border-slate-700'}`}>
                            <div className="font-bold text-slate-200">{c.name}</div>
                        </button>
                    ))}
                </div>

                {/* PLAY BUTTON */}
                <div className="flex gap-2 mt-4">
                    <button 
                        onClick={onStart} 
                        className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-4 rounded-lg shadow-lg text-lg transition-all uppercase tracking-wide"
                    >
                        {getPlayButtonText()}
                    </button>
                </div>
            </div>

            {/* HELP BUTTON */}
            <div className="mt-6 flex justify-center">
                <button 
                    onClick={onShowHelp} 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-yellow-500/30 rounded-full text-yellow-500 text-xs font-bold uppercase tracking-widest shadow-lg hover:shadow-yellow-500/20 transition-all active:scale-95 animate-pulse"
                >
                    <BookOpen size={16} /> 
                    Read Rules & Lore
                </button>
            </div>
        </div>
    );
}