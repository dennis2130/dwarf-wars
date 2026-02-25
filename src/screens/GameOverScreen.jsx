import React from 'react';
import { Skull, Trophy, Lock, Ban, HeartCrack, Gavel, ArrowLeft } from 'lucide-react'; // <-- ADD ArrowLeft here

export default function GameOverScreen({ money, debt, health, race, isSaving, onRestart, isChannel3 }) { // <-- ADD isChannel3 prop
    // Logic: Victory only happens if Debt is 0. 
    // Even if you are rich, if you didn't pay the debt, you lose.
    const isDead = health <= 0;
    const hasDebt = debt > 0;
    const canCoverDebt = money >= debt;
    
    // Calculate Final Score (Net Worth)
    const finalScore = money - debt;

    // Determine the Game Over Scenario
    let scenario = {
        title: "",
        color: "",
        borderColor: "", // Added for Tailwind classes
        bg: "",          // Added for Tailwind classes
        icon: null,
        description: "",
        quote: ""
    };

    if (hasDebt) {
        // --- DEFEAT SCENARIOS (Debt > 0) ---
        scenario.color = "text-red-600";
        scenario.borderColor = "border-red-900";
        scenario.bg = "bg-black"; // Example background
        
        if (!isDead && canCoverDebt) {
            // Scenario 1: Alive, Wealthy, but didn't pay
            scenario.title = "ASSETS SEIZED";
            scenario.icon = <Gavel size={64} />;
            scenario.description = "The Obsidian Vault found you. You had the gold to pay, but greed stayed your hand.";
            scenario.quote = "\"They took your life, then they took your gold. A waste of both.\"";
        } else if (!isDead && !canCoverDebt) {
            // Scenario 2: Alive, Poor, in debt
            scenario.title = "IMPRISONED";
            scenario.icon = <Lock size={64} />;
            scenario.description = "You failed to pay. The Vault has dragged you to the deep mines.";
            scenario.quote = "\"You will work off your debt, one swing of the pickaxe at a time.\"";
        } else if (isDead && canCoverDebt) {
            // Scenario 3: Dead, Wealthy, in debt
            scenario.title = "POSTHUMOUS COLLECTION";
            scenario.icon = <Skull size={64} />;
            scenario.description = "You died rich, but in debt. The Vault looted your corpse to settle the account.";
            scenario.quote = "\"Death is no escape from compound interest.\"";
        } else {
            // Scenario 4: Dead, Poor, in debt
            scenario.title = "TOTAL LOSS";
            scenario.icon = <HeartCrack size={64} />;
            scenario.description = "You died penniless. The Obsidian Vault writes you off as a bad investment.";
            scenario.quote = "\"No blood left to squeeze from this turnip.\"";
        }
    } else {
        // --- VICTORY SCENARIOS (Debt == 0) ---
        scenario.color = "text-yellow-500";
        scenario.borderColor = "border-yellow-500/50";
        scenario.bg = "bg-slate-900"; // Example background

        if (isDead) {
            // Edge Case: Paid off debt, but died (e.g. from bleed or last fight)
            scenario.title = "MARTYR'S VICTORY";
            scenario.icon = <Skull size={64} className="text-yellow-500" />;
            scenario.description = `You fell in battle, but you died a free ${race}.`;
            scenario.quote = "\"Your debts are paid. Your clan sings songs of your honor.\"";
        } else {
            // Standard Win
            scenario.title = "VICTORY";
            scenario.icon = <Trophy size={64} />;
            scenario.description = "You navigated the dangers of the world and purchased your freedom.";
            scenario.quote = "\"The Vault is satisfied. The gold you make now is finally yours.\"";
        }
    }

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-1000 ${scenario.bg}`}>
            
            {/* SCENARIO HEADER */}
            <div className={`mb-6 ${scenario.color} animate-bounce`}>
                {scenario.icon}
            </div>

            <h1 className={`text-4xl md:text-6xl font-black mb-4 uppercase tracking-tighter ${scenario.color}`}>
                {scenario.title}
            </h1>
            
            <p className="text-slate-300 text-lg md:text-xl font-semibold mb-2 max-w-xl">
                {scenario.description}
            </p>
            <p className="text-slate-500 mb-10 italic font-serif">
                {scenario.quote}
            </p>

            {/* SCORE CARD */}
            <div className={`p-8 rounded-xl border w-full max-w-sm shadow-2xl bg-slate-800 ${scenario.borderColor}`}>
                <div className="text-sm text-slate-400 uppercase tracking-widest mb-2">Final Net Worth</div>
                <div className={`text-3xl md:text-5xl font-bold font-mono mb-6 whitespace-nowrap ${finalScore > 0 ? 'text-green-400' : 'text-red-500'}`}>
                    {finalScore.toLocaleString()} g
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-700/50 pt-4">
                    <div className="text-right border-r border-slate-700/50 pr-4">
                        <div className="text-slate-500">Gold Earned</div>
                        <div className="text-white font-bold">{money.toLocaleString()}</div>
                    </div>
                    <div className="text-left pl-4">
                        <div className="text-slate-500">Debt Remaining</div>
                        <div className={`${hasDebt ? 'text-red-500' : 'text-green-500'} font-bold`}>
                            {debt.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-xs h-6">
                    {isSaving ? (
                        <span className="flex items-center justify-center gap-2 animate-pulse text-yellow-500">
                            Saving to Vault...
                        </span>
                    ) : (
                        <span className="text-slate-500">Record Sealed</span>
                    )}
                </div>
            </div>

            {/* Restart Button */}
            <button 
                onClick={onRestart} 
                className={`mt-12 px-10 py-4 rounded-full font-bold shadow-lg active:scale-95 transition-all hover:-translate-y-1 
                ${hasDebt 
                    ? 'bg-red-700 hover:bg-red-600 text-white shadow-red-900/50' 
                    : 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-yellow-900/50'}`}
            >
                Start New Life
            </button>

            {/* NEW: Return to C3 Button */}
            {isChannel3 && ( // <-- Only show on Channel 3
                <div className="mt-4">
                    <a 
                        href="https://channel3.gg/dwarf-wars/stats" // <-- Link to the specific stats page
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-sm font-semibold"
                    >
                        <ArrowLeft size={16}/> Return to C3
                    </a>
                </div>
            )}
        </div>
    );
}