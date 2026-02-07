import { User, X, Skull } from 'lucide-react';

export default function ProfileScreen({ profileData, onClose }) {
    if (!profileData) return null;
    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-4 max-w-md mx-auto border-x border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-yellow-500 flex items-center gap-2"><User size={24} className="text-yellow-500"/> PLAYER STATS</h1>
                <button onClick={onClose} className="p-2 bg-slate-800 rounded hover:bg-slate-700"><X size={20}/></button>
            </div>
            <div className="space-y-6">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Lifetime Service</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div><div className="text-2xl font-bold text-white">{profileData.stats.totalRuns}</div><div className="text-[10px] text-slate-400 uppercase">Runs</div></div>
                        <div><div className="text-2xl font-bold text-yellow-500">{(profileData.stats.totalGold / 1000000).toFixed(1)}M</div><div className="text-[10px] text-slate-400 uppercase">Profit</div></div>
                        <div><div className="text-2xl font-bold text-green-400">{profileData.stats.highestScore.toLocaleString()}</div><div className="text-[10px] text-slate-400 uppercase">Best</div></div>
                        <div><div className="text-2xl font-bold text-red-500">{profileData.stats.totalDeaths}</div><div className="text-[10px] text-slate-400 uppercase">Deaths</div></div>
                        <div className="col-span-2 bg-red-900/20 p-2 rounded border border-red-900/50 flex items-center justify-between px-4">
                            <div><div className="text-2xl font-bold text-red-500">{profileData.stats.dragonsKilled}</div><div className="text-[10px] text-red-300 uppercase tracking-widest">Dragon Heads</div></div>
                            <Skull size={32} className="text-red-800 opacity-50"/>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Recent Logs</h2>
                    <div className="bg-black/30 rounded-lg border border-slate-800 overflow-hidden">
                        {profileData.history.map((log, i) => (
                            <div key={i} className="flex justify-between items-center p-3 border-b border-slate-800/50 text-sm">
                                <div><div className={`font-bold ${log.score > 0 ? 'text-green-400' : 'text-red-400'}`}>{log.score.toLocaleString()}</div><div className="text-[10px] text-slate-500">{log.race} {log.class} • {log.status}</div></div>
                                <div className="text-right text-[10px] text-slate-600">{new Date(log.created_at).toLocaleDateString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}