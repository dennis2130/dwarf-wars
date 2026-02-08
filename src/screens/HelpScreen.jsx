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

                {/* LORE */}
                <section className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 italic text-slate-400 text-sm leading-relaxed text-center">
                    <p>
                        "The Realm is in chaos. Dragons burn the skies, goblins run the slums, and inflation is rampant."
                    </p>
                    <br/>
                    <p>
                        "You have <strong>31 Days</strong> to turn your measly pocket change into a fortune. 
                        Pay the <strong className="text-red-400">Obsidian Vault</strong> back, or face the consequences."
                    </p>
                </section>

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
                        <li><strong>Travel:</strong> If you traded today, you move to a new city.</li>
                        <li><strong>Work:</strong> If you haven't traded, you stay in town, heal slightly, and earn 50-200g.</li>
                        <li><strong>MAX Button:</strong> Buys as many items as you can afford and carry.</li>
                        <li><strong>ALL Button:</strong> Sells your entire stock of an item instantly.</li>
                        <li><strong>Buy/Sell:</strong> Tap to trade one item, or hold down to trade quickly.</li>
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

                {/* RACES */}
                <section>
                    <h2 className="text-blue-400 font-bold uppercase tracking-widest border-b border-slate-700 mb-4">Races</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {RACES.map(r => (
                            <div key={r.id} className="bg-slate-800/50 p-3 rounded border border-slate-700 border-l-4 border-l-blue-500 shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-slate-200">{r.name}</span>
                                    <span className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded border border-blue-800">{r.bonus}</span>
                                </div>
                                <div className="text-xs text-slate-500 italic">"{r.desc}"</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CLASSES */}
                <section>
                    <h2 className="text-green-400 font-bold uppercase tracking-widest border-b border-slate-700 mb-4 mt-8">Classes</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {CLASSES.map(c => (
                            <div key={c.id} className="bg-slate-800/50 p-3 rounded border border-slate-700 border-l-4 border-l-green-500 shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-slate-200">{c.name}</span>
                                    <div className="text-right">
                                        <div className="text-[10px] text-green-400 font-mono">Start: {c.startingMoney}g</div>
                                        <div className="text-[10px] text-red-400 font-mono">Debt: {c.startingDebt}g</div>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 italic">"{c.desc}"</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}