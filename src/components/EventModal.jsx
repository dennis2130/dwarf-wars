import { Swords, Target } from 'lucide-react';
import ScrambleDie from './ScrambleDie';

export default function EventModal({ event, isRolling, rollTarget, onRoll, onClose, combatActions }) {
    if (!event) return null;

    // 1. DETERMINE SKIN
    const isCombat = event.type === 'combat';
    
    const theme = {
        color: isCombat ? 'red' : 'blue',
        icon: isCombat ? <Swords size={80} className="text-red-500 animate-pulse" strokeWidth={1.5} /> : <Target size={80} className="text-blue-500 animate-pulse" strokeWidth={1.5} />,
        borderColor: isCombat ? 'border-red-500' : 'border-blue-500',
        
        // Helper for Result Colors
        isSuccess: (outcome) => outcome.includes('success') || outcome === 'win'
    };

    // 2. RENDER RESULT STATE
    if (event.result) {
        const success = theme.isSuccess(event.result.outcome);

        return (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                <div className={`rounded-xl p-6 w-full max-w-sm text-center shadow-2xl border-2 animate-in zoom-in duration-200 bg-slate-900 ${success ? 'border-green-500' : 'border-red-500'}`}>
                    
                    {/* TITLE */}
                    <div className={`text-4xl font-black mb-2 uppercase ${success ? 'text-green-400' : 'text-red-500'}`}>
                        {event.result.outcome.replace('_', ' ')}
                    </div>
                    
                    {/* ROLL DETAILS */}
                    <div className="text-xs text-slate-500 font-mono mb-6">
                        Rolled {event.result.roll} + Bonus = {event.result.total}
                    </div>

                    <div className="space-y-4 mb-8">
                        {/* FLAVOR TEXT */}
                        <p className="text-white text-lg italic">"{event.result.text}"</p>
                        
                        {/* RESULT BADGE (UPDATED STYLE) */}
                        {event.result.effectText && (
                            <div className={`p-3 rounded-lg border-2 text-sm font-bold bg-slate-900 ${
                                success 
                                ? 'border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                                : 'border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
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
                    {event.config.stat} CHECK
                </h2>

                <p className="text-slate-300 mb-8 text-lg leading-relaxed">"{event.text}"</p>
                
                <div className="h-32 flex items-center justify-center mb-6">
                    {isRolling && rollTarget ? (
                        <ScrambleDie target={rollTarget} onComplete={combatActions.onRollComplete} />
                    ) : (
                        theme.icon
                    )}
                </div>

                <div className="flex gap-3">
                    {isCombat && (
                        <button onClick={combatActions.onRun} disabled={isRolling} className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-3 rounded disabled:opacity-50 font-bold">
                            Run Away
                        </button>
                    )}
                    
                    <button onClick={onRoll} disabled={isRolling} className={`flex-1 text-white font-bold py-3 rounded disabled:opacity-50 shadow-lg ${isCombat ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-500 w-full'}`}>
                        {isRolling ? "ROLLING..." : (isCombat ? "FIGHT!" : "ROLL D20")}
                    </button>
                </div>
                
                <div className="mt-2 text-[10px] text-slate-500">
                    DC {event.config.difficulty} • Bonus +{combatActions.bonus}
                </div>
            </div>
        </div>
    );
}