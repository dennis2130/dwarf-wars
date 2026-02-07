import { Shield, Skull, ShoppingBag, X } from 'lucide-react';
import { RACES, CLASSES } from '../gameData';

export default function HelpScreen({ onClose }) {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-4 max-w-md mx-auto border-x border-slate-700 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield size={24} className="text-yellow-500"/> GAME GUIDE</h1>
                <button onClick={onClose} className="p-2 bg-slate-800 rounded hover:bg-slate-700"><X size={20}/></button>
            </div>

            <div className="space-y-8 pb-8">
                {/* INTRO */}
                <section>
                    <h2 className="text-yellow-500 font-bold uppercase tracking-widest border-b border-slate-700 mb-2">The Goal</h2>
                    <p className="text-sm text-slate-400">
                        You have <strong>31 Days</strong> to amass a fortune. Travel between cities, buy low, and sell high. 
                        Beware the Loan Shark: he charges <strong>5% compound interest</strong> every day.
                    </p>
                </section>

                {/* CONTROLS */}
                <section>
                    <h2 className="text-blue-400 font-bold uppercase tracking-widest border-b border-slate-700 mb-2">Controls</h2>
                    <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
                        <li><strong>Travel:</strong> Moves you to a new city and advances the day.</li>
                        <li><strong>MAX Button:</strong> Smartly decides to Buy Max (if you have none) or Sell All (if profitable).</li>
                        <li><strong>Upgrades:</strong> Check the "Upgrades" tab to buy Mules (Inventory) or Weapons (Combat).</li>
                    </ul>
                </section>

                {/* COMBAT */}
                <section>
                    <h2 className="text-red-400 font-bold uppercase tracking-widest border-b border-slate-700 mb-2 flex items-center gap-2"><Skull size={16}/> Combat & Survival</h2>
                    <ul className="text-sm text-slate-400 space-y-2">
                        <li><strong className="text-white">Bleed:</strong> If HP drops below 25%, you take damage every time you travel.</li>
                        <li><strong className="text-white">Guards:</strong> If your Net Worth is greater than 1 Million, the City Watch will try to tax you.</li>
                        <li><strong className="text-white">Dragons:</strong> High damage, high loot. Requires weapons to defeat.</li>
                    </ul>
                </section>

                {/* STATS */}
                <section>
                    <h2 className="text-green-400 font-bold uppercase tracking-widest border-b border-slate-700 mb-2">Races & Classes</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {RACES.map(r => (
                            <div key={r.id} className="bg-slate-800 p-2 rounded">
                                <div className="font-bold text-white">{r.name}</div>
                                <div className="text-xs text-green-400">{r.bonus}</div>
                                <div className="text-[10px] text-slate-500 italic">{r.desc}</div>
                            </div>
                        ))}
                        {CLASSES.map(c => (
                            <div key={c.id} className="bg-slate-800 p-2 rounded">
                                <div className="font-bold text-white">{c.name}</div>
                                <div className="text-xs text-green-400">Start: {c.startingMoney}g</div>
                                <div className="text-[10px] text-slate-500 italic">{c.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}