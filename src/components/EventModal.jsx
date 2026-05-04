import { Swords, Target, Users } from 'lucide-react';
import ScrambleDie from './ScrambleDie';

export default function EventModal({ event, isRolling, rollTarget, onRoll, onClose, combatActions, c3_player, onCharityChoice }) {
    if (!event) return null;

    // Parse config if it's a string (Supabase sometimes returns JSONB as string)
    const config = typeof event.config === 'string' ? JSON.parse(event.config) : (event.config || {});
    
    // 1. DETERMINE SKIN
    const isCombat = event.type === 'combat';
    const isC3Event = event.type === 'c3_check' || config?.c3_encounter;
    const isCharityEvent = config?.charity_amount;
    
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

    // Helper: Get contextual button text based on event category
    const getCharityButtonText = (category) => {
        const buttonMap = {
            'charity': ['Show Compassion', 'Turn Away'],
            'mercy': ['Show Mercy', 'Show None'],
            'rescue': ['Save Them', 'Walk Away'],
            'heroism': ['Be A Hero', 'Ignore'],
            'kindness': ['Show Kindness', 'Ignore'],
            'compassion': ['Show Compassion', 'Turn Away'],
            'aid': ['Offer Aid', 'Ignore'],
            'courtesy': ['Help Them', 'Ignore'],
            'help': ['Help Them', 'Walk Away']
        };
        return buttonMap[category?.toLowerCase()] || ['Give Aid', 'Do Nothing'];
    };
    
    const charityButtonsText = getCharityButtonText(config?.category);

    // Helper: Get appropriate title based on event type and category
    const getEventTitle = () => {
        if (isCharityEvent) {
            const titleMap = {
                'charity': 'A Moral Choice',
                'mercy': 'Justice or Mercy?',
                'rescue': 'A Rescue Opportunity',
                'heroism': 'A Heroic Moment',
                'kindness': 'An Act of Kindness',
                'compassion': 'A Test of Compassion',
                'aid': 'Those in Need',
                'courtesy': 'A Courtesy',
                'help': 'Someone Needs Help'
            };
            return titleMap[config?.category?.toLowerCase()] || 'A Moral Choice';
        }
        if (isCombat) return 'Combat Encounter';
        if (isC3Event) return `${config?.stat ? config.stat.charAt(0).toUpperCase() + config.stat.slice(1) : 'Charisma'} - Ally Encounter`;
        if (event.type === 'check') return `${config?.stat ? config.stat.charAt(0).toUpperCase() + config.stat.slice(1) : 'Unknown'} Check`;
        return 'Encounter';
    };
    
    const eventTitle = getEventTitle();

    // Helper: Get contextual helper text based on event category
    const getCharityHelperText = (category) => {
        const textMap = {
            'charity': 'Will you show compassion to those in need?',
            'mercy': 'Will you show mercy or demand justice?',
            'rescue': 'Will you save them or walk away?',
            'heroism': 'Will you be a hero or ignore their plight?',
            'kindness': 'Will you show kindness in their time of need?',
            'compassion': 'Will you show compassion?',
            'aid': 'Will you offer aid or turn away?',
            'courtesy': 'Will you help them find their way?',
            'help': 'Will you help them or walk away?'
        };
        return textMap[category?.toLowerCase()] || 'Will you act with compassion or remain indifferent?';
    };
    
    const charityHelperText = getCharityHelperText(config?.category);

    // Helper: Get button text based on check type
    const getCheckActionText = (stat) => {
        if (!stat) return 'ATTEMPT';
        const statLower = stat.toLowerCase();
        const actionMap = {
            'wisdom': 'REASON',
            'charisma': 'PERSUADE',
            'stealth': 'SNEAK',
            'intelligence': 'ANALYZE',
            'dexterity': 'EVADE',
            'constitution': 'ENDURE',
            'combat': 'FIGHT!'
        };
        return actionMap[statLower] || 'ATTEMPT';
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
                    {eventTitle}
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

                {/* CHARITY CHOICE EVENTS: Contextual choice buttons (PRIORITY: Check FIRST) */}
                {isCharityEvent && !event.result && (
                    <div className="flex gap-3">
                        <button 
                            onClick={() => onCharityChoice('nothing')} 
                            disabled={isRolling} 
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded disabled:opacity-50 font-bold"
                        >
                            {charityButtonsText[1]}
                        </button>
                        <button 
                            onClick={() => onCharityChoice('give')} 
                            disabled={isRolling} 
                            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded disabled:opacity-50 font-bold"
                        >
                            {charityButtonsText[0]}
                        </button>
                    </div>
                )}

                {/* NON-CHARITY VILLAGER ENCOUNTERS: Help/Ignore buttons */}
                {event.type === 'encounter' && !isCharityEvent && !event.result && (
                    <div className="flex gap-3">
                        <button 
                            onClick={() => onRoll(event)} 
                            disabled={isRolling} 
                            className="flex-1 bg-green-700 hover:bg-green-600 text-white py-3 rounded disabled:opacity-50 font-bold"
                        >
                            Help
                        </button>
                        <button 
                            onClick={onClose} 
                            disabled={isRolling} 
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded disabled:opacity-50 font-bold"
                        >
                            Ignore
                        </button>
                    </div>
                )}

                {/* C3 CHECK & COMBAT & CHECK: Standard buttons (Skip if charity event) */}
                {!isCharityEvent && (isC3Event || isCombat || event.type === 'check') && !event.result && (
                    <div className="flex gap-3">
                        {isCombat && (
                            <button onClick={combatActions.onRun} disabled={isRolling} className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-3 rounded disabled:opacity-50 font-bold">
                                Run Away
                            </button>
                        )}

                        {isC3Event && (
                            <button onClick={onClose} disabled={isRolling} className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-3 rounded disabled:opacity-50 font-bold">
                                Decline
                            </button>
                        )}
                        
                        <button onClick={onRoll} disabled={isRolling} className={`flex-1 text-white font-bold py-3 rounded disabled:opacity-50 shadow-lg ${
                            isC3Event 
                                ? 'bg-purple-600 hover:bg-purple-500' 
                                : (isCombat ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-700 hover:bg-blue-600')
                        }`}>
                            {isRolling ? "ROLLING..." : (isC3Event ? "HELP" : getCheckActionText(config?.stat))}
                        </button>
                    </div>
                )}
                
                <div className="mt-2 text-[10px] text-slate-500">
                    {isCharityEvent ? charityHelperText : (event.type === 'encounter' ? "You can choose to help this person or ignore their plight..." : (isC3Event ? "You can choose to help with a risky roll or walk away safely..." : `DC ${config.difficulty} • Total to Beat: ${config.difficulty}`))}
                </div>
            </div>
        </div>
    );
}