import { useState } from 'react';
import { RACES, CLASSES, validateName } from '../gameData'; // Note the ../
import { Shield, Menu, User, LogOut, BookOpen } from 'lucide-react';

export default function StartScreen({ 
    player, setPlayer, 
    session, savedChars, leaderboard, 
    onLogin, onLogout, onStart, onSave, onDelete, onLoad, onShowProfile, onShowHelp
}) {
    const [menuOpen, setMenuOpen] = useState(false);

    const [leaderboardTab, setLeaderboardTab] = useState('all'); // 'all', 'month', 'week'
    

const getFilteredLeaderboard = () => {
    const now = new Date();
    const filtered = leaderboard.filter(score => {
        const scoreDate = new Date(score.created_at);
        if (leaderboardTab === 'week') {
            const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
            return scoreDate >= oneWeekAgo;
        }
        if (leaderboardTab === 'month') {
            const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
            return scoreDate >= oneMonthAgo;
        }
        return true;
    });
    
    // LIMIT TO TOP 20 HERE
    return filtered.slice(0, 20); 
};

const listToRender = [...getFilteredLeaderboard(), ...getFilteredLeaderboard()];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-6 max-w-md mx-auto border-x border-slate-700">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-yellow-500 tracking-tighter flex items-center gap-2"><Shield size={24}/> DWARF WARS</h1>
                {!session ? (
                    <button onClick={onLogin} className="text-xs bg-white text-black px-3 py-2 rounded font-bold hover:bg-gray-200">G Login</button>
                ) : (
                    <div className="relative">
                        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-slate-400 hover:text-white"><Menu size={24} /></button>
                        {menuOpen && (
                            <div className="absolute right-0 top-10 bg-slate-800 border border-slate-600 rounded shadow-xl w-48 z-50 overflow-hidden">
                                <button onClick={onShowProfile} className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"><User size={16}/> My Profile</button>
                                <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700 border-t border-slate-700 flex items-center gap-2"><LogOut size={16}/> Logout</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SAVED CHARS */}
            {session && savedChars.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Saved Heroes</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {savedChars.map(char => (
                            <div key={char.id} onClick={() => onLoad(char)} className="relative flex-shrink-0 bg-slate-800 p-3 rounded border border-slate-600 w-32 cursor-pointer hover:bg-slate-700 group">
                                <div className="font-bold text-yellow-500 truncate pr-4">{char.name}</div>
                                <div className="text-[10px] text-slate-400 capitalize">{char.race_id} / {char.class_id}</div>
                                <button onClick={(e) => onDelete(e, char.id)} className="absolute top-1 right-1 text-slate-500 hover:text-red-500 font-bold px-1">✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* LEADERBOARD CONTAINER */}
            <div className="mb-8 bg-black/30 rounded-lg border border-slate-800 h-40 relative overflow-hidden">
                
                {/* 1. TITLE (Fixed to top of box) */}
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest absolute top-0 left-0 right-0 bg-slate-900/90 p-2 z-10 border-b border-slate-800 text-center">
                    Global Leaders
                </h3>
                {/* LEADERBOARD (Auto Scroll) */}
                <div className="absolute top-8 left-0 right-0 bg-slate-900/90 z-10 px-2">
                    <div className="flex text-xs border-b border-slate-800 mb-2">
                        <button onClick={() => setLeaderboardTab('week')} className={`flex-1 py-1 ${leaderboardTab === 'week' ? 'text-yellow-500 font-bold' : 'text-slate-500'}`}>Week</button>
                        <button onClick={() => setLeaderboardTab('month')} className={`flex-1 py-1 ${leaderboardTab === 'month' ? 'text-yellow-500 font-bold' : 'text-slate-500'}`}>Month</button>
                        <button onClick={() => setLeaderboardTab('all')} className={`flex-1 py-1 ${leaderboardTab === 'all' ? 'text-yellow-500 font-bold' : 'text-slate-500'}`}>All Time</button>
                    </div>
                </div>
                <div className="absolute top-16 left-0 right-0 bottom-0 p-2 overflow-hidden">
                    <div className="scrolling-list" style={{ animationDuration: `${Math.max(20, listToRender.length * .75)}s` }}>
                            {[...getFilteredLeaderboard(), ...getFilteredLeaderboard()].map((score, i) => (
                            <div key={i} className="flex justify-between text-sm items-center mb-1 border-b border-slate-800/50 pb-1">
                                <span className="text-slate-400 flex gap-2"><span className="text-slate-600 font-mono w-4">#{i+1}</span> {score.player_name}</span>
                                <span className={`font-mono ${score.final_score > 0 ? "text-green-500" : "text-red-500"}`}>{score.final_score.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FORM */}
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
                    <button onClick={onStart} disabled={!player.name || !player.race || !player.class} className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-lg text-lg transition-all">PLAY</button>
                    {session && player.name && player.race && player.class && (<button onClick={onSave} className="bg-slate-700 text-white px-4 rounded-lg border border-slate-600 hover:bg-slate-600">Save</button>)}
                </div>
            </div>

            {/* HELP BUTTON - RESTYLED */}
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