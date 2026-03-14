import { useMemo, useState } from 'react';
import { User, X, Skull } from 'lucide-react';

const BREAKDOWN_TABS = [
    { id: 'race', label: 'Race' },
    { id: 'class', label: 'Class' },
    { id: 'combined', label: 'Combinations' }
];

const formatPct = (value) => `${value.toFixed(1)}%`;

const toDisplayScore = (value) => Number(value || 0).toLocaleString();

const buildBreakdownRows = (logs, mode) => {
    const grouped = {};

    logs.forEach((log) => {
        const status = String(log.status || '');
        const isResetRun = status.includes('Quit (Restart)') || status.includes('Reset');
        if (isResetRun) return;

        const race = log.race || 'Unknown';
        const charClass = log.class || 'Unknown';
        const key = mode === 'race' ? race : mode === 'class' ? charClass : `${race} / ${charClass}`;
        if (!grouped[key]) {
            grouped[key] = {
                key,
                runs: 0,
                wins: 0,
                deaths: 0,
                bankruptcies: 0,
                scoreTotal: 0,
                bestScore: Number.NEGATIVE_INFINITY,
                worstScore: Number.POSITIVE_INFINITY
            };
        }

        const entry = grouped[key];
        const score = Number(log.score || 0);
        const isDead = status === 'Dead';
        const isBankrupt = status === 'Bankrupt';
        const isQuit = status.includes('Quit');

        entry.runs += 1;
        entry.scoreTotal += score;
        entry.bestScore = Math.max(entry.bestScore, score);
        entry.worstScore = Math.min(entry.worstScore, score);

        if (isDead) entry.deaths += 1;
        else if (isBankrupt) entry.bankruptcies += 1;
        else if (!isQuit) entry.wins += 1;
    });

    return Object.values(grouped)
        .map((entry) => {
            const avgScore = entry.runs > 0 ? Math.floor(entry.scoreTotal / entry.runs) : 0;
            return {
                ...entry,
                avgScore,
                winRate: entry.runs > 0 ? (entry.wins / entry.runs) * 100 : 0,
                bankruptRate: entry.runs > 0 ? (entry.bankruptcies / entry.runs) * 100 : 0,
                bestScore: Number.isFinite(entry.bestScore) ? entry.bestScore : 0,
                worstScore: Number.isFinite(entry.worstScore) ? entry.worstScore : 0
            };
        })
        .sort((a, b) => b.avgScore - a.avgScore || b.runs - a.runs);
};

export default function ProfileScreen({ profileData, onClose, userProfile }) {
    if (!profileData) return null;

    const [breakdownTab, setBreakdownTab] = useState('race');
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const isVercel = hostname.includes('vercel.app');
    const showHistorySourceBanner = isLocal || isVercel;
    const fullHistory = profileData.fullHistory || profileData.history || [];
    const adjustedRunCount = fullHistory.length > 0
        ? fullHistory.filter((log) => {
            const status = String(log.status || '');
            return !status.includes('Quit (Restart)') && !status.includes('Reset');
        }).length
        : (profileData.stats.totalRuns || 0);

    const breakdown = useMemo(() => ({
        race: buildBreakdownRows(fullHistory, 'race'),
        class: buildBreakdownRows(fullHistory, 'class'),
        combined: buildBreakdownRows(fullHistory, 'combined')
    }), [fullHistory]);

    const activeRows = breakdown[breakdownTab] || [];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-4 max-w-md mx-auto border-x border-slate-700">
            
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    {userProfile?.c3_profile_image && (
                        <img 
                            src={userProfile.c3_profile_image} 
                            alt="Player Avatar" 
                            className="w-10 h-10 rounded-full border border-yellow-500 object-cover" 
                        />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
                            <User size={24} className="text-yellow-500"/> 
                            {userProfile?.gamertag || "COMMANDER"}
                        </h1>
                        {/* REMOVED: No more button to change gamertag */}
                        {/* <button onClick={onEditTag} className="text-[10px] text-blue-400 flex items-center gap-1 hover:text-blue-300 mt-1">
                            <Edit2 size={10}/> Change Gamer Tag
                        </button> */}
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-800 rounded hover:bg-slate-700"><X size={20}/></button>  
            </div>                 
            
            <div className="space-y-6">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Lifetime Service</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div><div className="text-2xl font-bold text-white">{adjustedRunCount}</div><div className="text-[10px] text-slate-400 uppercase">Runs</div></div>
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
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Personal Build Breakdown</h2>
                    {showHistorySourceBanner && profileData.historySource === 'high_scores' && (
                        <div className="mb-2 text-[10px] text-amber-400 uppercase tracking-wider">
                            Using score history fallback (game logs unavailable)
                        </div>
                    )}
                    <div className="bg-black/30 rounded-lg border border-slate-800 overflow-hidden">
                        <div className="flex text-xs border-b border-slate-800 bg-slate-900/80">
                            {BREAKDOWN_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setBreakdownTab(tab.id)}
                                    className={`flex-1 py-2 ${breakdownTab === tab.id ? 'text-yellow-500 font-bold' : 'text-slate-500'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                            <div className="grid grid-cols-[1.8fr_0.5fr_1.5fr_1fr] gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800 bg-slate-900/60">
                                <span>Build</span>
                                <span className="text-right">Runs</span>
                                <span className="text-right">Avg</span>
                                <span className="text-right">Win</span>
                            </div>

                            {activeRows.length === 0 && (
                                <div className="p-4 text-xs text-slate-500 text-center">No runs recorded yet for this breakdown.</div>
                            )}

                            {activeRows.map((row) => (
                                <div key={row.key} className="px-3 py-2 border-b border-slate-800/50">
                                    <div className="grid grid-cols-[1.8fr_0.5fr_1.5fr_1fr] gap-2 items-center text-sm">
                                        <span className="text-slate-200 font-bold truncate">{row.key}</span>
                                        <span className="text-right text-slate-400 font-mono">{row.runs}</span>
                                        <span className={`text-right font-mono ${row.avgScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>{toDisplayScore(row.avgScore)}</span>
                                        <span className="text-right text-green-400 font-mono">{formatPct(row.winRate)}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                        <span>Best: {toDisplayScore(row.bestScore)}</span>
                                        <span>Worst: {toDisplayScore(row.worstScore)}</span>
                                        <span>Bankrupt: {formatPct(row.bankruptRate)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Recent Logs</h2>
                    <div className="bg-black/30 rounded-lg border border-slate-800 overflow-hidden">
                        {profileData.history.length === 0 && (
                            <div className="p-4 text-xs text-slate-500 text-center">
                                No recent runs found for this profile.
                            </div>
                        )}
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