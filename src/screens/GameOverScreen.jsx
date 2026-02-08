import { Skull, Trophy, Coins } from 'lucide-react';

export default function GameOverScreen({ money, debt, isSaving, onRestart }) {
    const finalScore = money - debt;
    const isVictory = finalScore > 0;

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${isVictory ? 'bg-slate-900' : 'bg-black'}`}>
            
            {/* TITLE */}
            {isVictory ? (
                <>
                    <h1 className="text-5xl font-bold mb-2 text-yellow-500 flex items-center gap-3 animate-bounce">
                        <Trophy size={48}/> VICTORY
                    </h1>
                    <p className="text-slate-400 mb-8 italic">"You have paid your debts and earned your freedom."</p>
                </>
            ) : (
                <>
                    <h1 className="text-5xl font-bold mb-4 text-red-600 flex items-center gap-3">
                        <Skull size={48}/> GAME OVER
                    </h1>
                    <p className="text-slate-500 mb-8 italic">"The Vault is closed."</p>
                </>
            )}

            {/* SCORE CARD */}
            <div className={`p-8 rounded-xl border w-full max-w-sm shadow-2xl ${isVictory ? 'bg-slate-800 border-yellow-500/50' : 'bg-slate-900 border-red-900'}`}>
                <div className="text-sm text-slate-400 uppercase tracking-widest mb-2">Final Net Worth</div>
                <div className={`text-5xl font-bold font-mono mb-6 ${isVictory ? 'text-green-400' : 'text-red-500'}`}>
                    {finalScore.toLocaleString()} g
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-700/50 pt-4">
                    <div className="text-right border-r border-slate-700/50 pr-4">
                        <div className="text-slate-500">Gold Earned</div>
                        <div className="text-white font-bold">{money.toLocaleString()}</div>
                    </div>
                    <div className="text-left pl-4">
                        <div className="text-slate-500">Debt Paid</div>
                        <div className="text-red-400 font-bold">{debt.toLocaleString()}</div>
                    </div>
                </div>

                <div className="mt-6 text-xs">
                    {isSaving ? <span className="animate-pulse text-yellow-500">Saving to Leaderboard...</span> : <span className="text-slate-500">Score Recorded</span>}
                </div>
            </div>

            <button onClick={onRestart} className="mt-12 bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-full font-bold shadow-lg active:scale-95 transition-transform">
                Play Again
            </button>
        </div>
    );
}