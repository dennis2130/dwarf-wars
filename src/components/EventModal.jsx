import { Swords, Target, Users } from 'lucide-react';
import ScrambleDie from './ScrambleDie';

export default function EventModal({ event, isRolling, rollTarget, onRoll, onClose, combatActions, c3_player }) {
    if (!event) return null;

    // 1. DETERMINE SKIN
    const isCombat = event.type === 'combat';
    const isC3Event = event.type === 'c3_check' || event.config?.c3_encounter;
    
    const theme = {
        color: isC3Event ? 'purple' : (isCombat ? 'red' : 'blue'),
        icon: isC3Event ? <Users size={80} className="text-purple-500 animate-pulse" strokeWidth={1.5} /> : (isCombat ? <Swords size={80} className="text-red-500 animate-pulse" strokeWidth={1.5} /> : <Target size={80} className="text-blue-500 animate-pulse" strokeWidth={1.5} />),
        borderColor: isC3Event ? 'border-purple-500' : (isCombat ? 'border-red-500' : 'border-blue-500'),
        
        // Helper for Result Colors
        isSuccess: (outcome) => outcome.includes('success') || outcome === 'win'
    };

    // 2. HELPER: Capitalize first letter of string
    const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    // 3. HELPER: Personalize event text with C3 player name or fallback
    const personalizeText = (text) => {
        const displayName = c3_player && c3_player.gamertag
            ? capitalizeFirstLetter(c3_player.gamertag)
            : 'Adventurer';
        return text.replace('{c3_player_name}', displayName)
                   .replace('{player_name}', displayName);
    };

    // 2. RENDER RESULT STATE
    if (event.result) {
        const success = theme.isSuccess(event.result.outcome);
        const rollBonus = Number.isFinite(event.result.bonus)
            ? event.result.bonus
            : (Number.isFinite(event.result.total) && Number.isFinite(event.result.roll)
                ? event.result.total - event.result.roll
                : 0);

        return (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                <div className={`rounded-xl p-6 w-full max-w-sm text-center shadow-2xl border-2 animate-in zoom-in duration-200 bg-slate-900 ${isC3Event ? 'border-purple-500' : (success ? 'border-green-500' : 'border-red-500')}`}>
                    
                    {/* C3 PLAYER BADGE */}
                    {isC3Event && c3_player && (
                        <div className="mb-4 p-3 rounded-lg bg-purple-900/50 border border-purple-500/50">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Users size={16} className="text-purple-400" />
                                <span className="text-xs font-bold text-purple-300">ALLY ENCOUNTER</span>
                            </div>
                            <div className="text-sm font-bold text-purple-200">{capitalizeFirstLetter(c3_player.gamertag)}</div>
                            {c3_player.highest_score && <div className="text-xs text-purple-400">Best Score: {c3_player.highest_score.toLocaleString()}</div>}
                        </div>
                    )}
                    
                    {/* TITLE */}
                    <div className={`text-4xl font-black mb-2 uppercase ${isC3Event ? 'text-purple-300' : (success ? 'text-green-400' : 'text-red-500')}`}>
                        {event.result.outcome.replace('_', ' ')}
                    </div>
                    
                    {/* ROLL DETAILS */}
                    <div className="text-xs text-slate-500 font-mono mb-6">
                        Rolled {event.result.roll} + Bonus {rollBonus} = {event.result.total}
                    </div>

                    <div className="space-y-4 mb-8">
                        {/* FLAVOR TEXT */}
                        <p className="text-white text-lg italic">"{personalizeText(event.result.text)}"</p>
                        
                        {/* RESULT BADGE (UPDATED STYLE) */}
                        {event.result.effectText && (
                            <div className={`p-3 rounded-lg border-2 text-sm font-bold bg-slate-900 ${
                                isC3Event 
                                ? 'border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                : (success 
                                    ? 'border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                                    : 'border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]')
                            }`}>
                                {event.result.effectText}
                            </div>
                        )}
                    </div>

                    <button onClick={onClose} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl shadow-lg border border-slate-600">
                        CONTINUE JOURNEY
                    </button>
                </div>
            </div>
        );
    }

    // 3. RENDER PRE-ROLL STATE
    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className={`rounded-xl p-6 w-full max-w-sm text-center shadow-2xl border-2 animate-in zoom-in duration-200 bg-slate-900 ${theme.borderColor}`}>
                
                <h2 className={`text-xl font-bold mb-4 text-white uppercase tracking-widest`}>
                    {isC3Event ? `${event.config?.stat ? event.config.stat.charAt(0).toUpperCase() + event.config.stat.slice(1) : 'Charisma'} - Ally Encounter` : `${event.config.stat} CHECK`}
                </h2>

                {/* C3 PLAYER BADGE */}
                {isC3Event && c3_player && (
                    <div className="mb-4 p-3 rounded-lg bg-purple-900/50 border border-purple-500/50">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Users size={16} className="text-purple-400" />
                            <span className="text-xs font-bold text-purple-300">ADVENTURER</span>
                        </div>
                        <div className="text-sm font-bold text-purple-200">{capitalizeFirstLetter(c3_player.gamertag)}</div>
                        {c3_player.total_runs && <div className="text-xs text-purple-400">Runs: {c3_player.total_runs}</div>}
                    </div>
                )}

                <p className="text-slate-300 mb-8 text-lg leading-relaxed">"{personalizeText(event.text)}"</p>
                
                <div className="h-32 flex items-center justify-center mb-6">
                    {isRolling && rollTarget ? (
                        <ScrambleDie target={rollTarget} onComplete={combatActions.onRollComplete} />
                    ) : (
                        theme.icon
                    )}
                </div>

                {/* BONUS BREAKDOWN */}
                {combatActions.bonusBreakdown?.breakdown && combatActions.bonusBreakdown.breakdown.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-slate-800 border border-slate-700">
                        <div className="text-xs font-bold text-slate-300 mb-2">BONUS BREAKDOWN</div>
                        <div className="space-y-1">
                            {combatActions.bonusBreakdown.breakdown.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-slate-400">
                                    <span>{item.label}</span>
                                    <span className="text-slate-200 font-bold">{item.value > 0 ? '+' : ''}{item.value}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-xs pt-1 border-t border-slate-600 mt-1">
                                <span className="text-slate-300 font-bold">Total Bonus</span>
                                <span className="text-blue-400 font-bold">{combatActions.bonusBreakdown.total > 0 ? '+' : ''}{combatActions.bonusBreakdown.total}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    {isCombat && (
                        <button onClick={combatActions.onRun} disabled={isRolling} className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-3 rounded disabled:opacity-50 font-bold">
                            Run Away
                        </button>
                    )}

                    {isC3Event && (
                        <button onClick={combatActions.onWalkAway} disabled={isRolling} className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-3 rounded disabled:opacity-50 font-bold">
                            Walk Away
                        </button>
                    )}
                    
                    <button onClick={onRoll} disabled={isRolling} className={`flex-1 text-white font-bold py-3 rounded disabled:opacity-50 shadow-lg ${isC3Event ? 'bg-purple-600 hover:bg-purple-500' : (isCombat ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-500 w-full')}`}>
                        {isRolling ? "ROLLING..." : (isC3Event ? "HELP ALLY" : (isCombat ? "FIGHT!" : "ROLL D20"))}
                    </button>
                </div>
                
                <div className="mt-2 text-[10px] text-slate-500">
                    {isC3Event ? "You can choose to help with a risky roll or walk away safely..." : `DC ${event.config.difficulty} • Total to Beat: ${event.config.difficulty}`}
                </div>
            </div>
        </div>
    );
}