import { useState } from 'react';
import { Map, RotateCcw, LogOut, Shield, ShoppingBag, Hammer, Sword, FlaskConical  } from 'lucide-react';
import StatsBar from '../components/StatsBar';
import InventoryGrid from '../components/InventoryGrid';
import MarketItem from '../components/MarketItem';
import ScrambleDie from '../components/ScrambleDie';
import { getIcon } from '../utils';
import { UPGRADES } from '../gameData';

export default function GameScreen({ 
    player, day, maxDays, location, resources, health, maxHealth, debt, 
    currentPrices, priceMod, log, eventMsg, flash, combatEvent, isRolling, rollTarget,
    playerItems, onPayDebt, onTravel, onRestart, onQuit, 
    onBuy, onSell, onSmartMax, onBuyUpgrade, 
    combatActions, hasTraded, onWork
}) {
    const [activeTab, setActiveTab] = useState('market');

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-2 max-w-md mx-auto border-x border-slate-700 flex flex-col relative">
            {/* HEADER */}
            <header className="flex justify-between items-start mb-4 border-b border-slate-700 pb-2">
                <div><h1 className="text-xl font-bold text-yellow-500">{player.name}</h1><p className="text-xs text-slate-400 capitalize">{player.race?.name} {player.class?.name}</p></div>
                <div className="flex flex-col items-end gap-1">
                    <div className="text-right text-sm"><span className="text-white font-bold mr-2">Day {day}/{maxDays}</span><span className="text-xs text-blue-400 inline-flex items-center gap-1"><Map size={12}/>{location.name}</span></div>
                    <div className="flex gap-2 mt-1">
                        <button onClick={onRestart} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-green-400"><RotateCcw size={16} /></button>
                        <button onClick={onQuit} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-red-400"><LogOut size={16} /></button>
                    </div>
                </div>
            </header>

            {/* EVENT MSG */}
            {eventMsg && <div className={`mb-4 p-3 rounded text-center text-sm font-bold border ${eventMsg.type === 'damage' || eventMsg.type === 'theft' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-green-900/50 border-green-500 text-green-200'}`}>{eventMsg.text}</div>}

            <StatsBar money={resources.money} debt={debt} health={health} maxHealth={maxHealth} onPayDebt={onPayDebt} />

            {/* TABS */}
            <div className="flex border-b border-slate-700 mb-2">
                <button onClick={() => setActiveTab('market')} className={`flex-1 pb-2 text-xs font-bold ${activeTab === 'market' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500'}`}>MARKETPLACE</button>
                <button onClick={() => setActiveTab('equipment')} className={`flex-1 pb-2 text-xs font-bold ${activeTab === 'equipment' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500'}`}>UPGRADES</button>
            </div>

            {activeTab === 'market' ? (
                <>
                    <div className="mb-4 bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                        {Object.keys(currentPrices).map((item) => {
                            const buyMult = 1.0 - (player.race?.stats.buyMod || 0);
                            const displayPrice = Math.ceil(currentPrices[item] * buyMult);
                            return (
                                <MarketItem key={item} item={item} icon={getIcon(item)} price={displayPrice} myAvg={resources.inventory[item]?.avg || 0} haveStock={resources.inventory[item]?.count > 0} 
                                    onBuy={() => onBuy(item)} onSell={() => onSell(item)} onSmartMax={() => onSmartMax(item)} 
                                />
                            );
                        })}
                    </div>
                    <InventoryGrid inventory={resources.inventory} maxInventory={playerItems.reduce((acc, i) => i.type === 'inventory' ? acc + i.value : acc, 50 + player.race.stats.inventory)} />
                </>
            ) : (
                <div className="mb-4 flex-grow space-y-2">
                    {UPGRADES.filter(u => {
                        // 1. CHECK BANS (If you match a ban, hide it)
                            if (u.ban) {
                                // Check Race Ban
                                if (Array.isArray(u.ban.race)) {
                                    if (u.ban.race.includes(player.race.id)) return false;
                                } else if (u.ban.race === player.race.id) {
                                    return false;
                                }

                                // Check Class Ban
                                if (Array.isArray(u.ban.class)) {
                                    if (u.ban.class.includes(player.class.id)) return false;
                                } else if (u.ban.class === player.class.id) {
                                    return false;
                                }
                            }

                        // 2. CHECK REQS (If req exists, you MUST match it)
                        if (u.req) {
                            if (u.req.class && u.req.class !== player.class.id) return false;
                            if (u.req.race && u.req.race !== player.race.id) return false;
                        }
                        
                        return true; // If no bans hit and reqs met (or empty), show it
                    }).map((u) => {
                        const owned = playerItems.find(i => i.id === u.id);
                        return (
                            <div key={u.id} className={`flex justify-between items-center p-3 rounded border ${owned ? 'bg-slate-800/50 border-slate-700 opacity-50' : 'bg-slate-800 border-slate-600'}`}>
                                <div className="flex items-center gap-3">
                                        {/* Dynamic Icon based on Type */}
                                    {u.type === 'combat' && <Sword size={20} className="text-red-400"/>}
                                    {u.type === 'defense' && <Shield size={20} className="text-blue-400"/>}
                                    {u.type === 'inventory' && <ShoppingBag size={20} className="text-yellow-400"/>}
                                    {u.type === 'heal' && <FlaskConical size={20} className="text-green-400"/>}
                                    <div><div className="font-bold text-sm text-slate-200">{u.name}</div><div className="text-[10px] text-slate-400">{u.desc}</div></div>
                                </div>
                                {owned ? <span className="text-xs text-green-500 font-bold">OWNED</span> : <button onClick={() => onBuyUpgrade(u)} className="bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-bold">{u.cost} g</button>}
                            </div>
                        )
                    })}
                </div>
            )}

            
            <button 
                onClick={onTravel} // This now calls handleEndTurn
                className={`w-full text-white font-bold py-4 rounded-lg shadow-lg mb-4 flex items-center justify-center gap-2 ${
                    hasTraded ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'
                }`}
            >
                {hasTraded ? (
                    <><Map size={20}/> Travel to New Location</>
                ) : (
                    <><Hammer size={20}/> Work & Travel ({50}-{200}g)</>
                )}
            </button>


            <div className="bg-black p-3 rounded-lg h-24 overflow-y-auto text-xs font-mono text-green-500 border border-slate-700 shadow-inner">
                {log.map((entry, i) => <div key={i} className="mb-1 border-b border-gray-900 pb-1 last:border-0"> &gt; {entry}</div>)}
            </div>

            {/* SCREEN FLASH */}
            <div className={`fixed inset-0 pointer-events-none transition-opacity duration-300 ${flash === 'red' ? 'bg-red-500/30' : flash === 'green' ? 'bg-green-500/30' : flash === 'gold' ? 'bg-yellow-500/30' : 'opacity-0'}`}></div>

            {/* COMBAT MODAL */}
            {combatEvent && (
                <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-red-500 rounded-lg p-6 w-full max-w-sm text-center shadow-2xl animate-in zoom-in duration-200">
                        <h2 className="text-2xl text-red-500 font-bold mb-2 uppercase">{combatEvent.name} ATTACK!</h2>
                        <p className="text-slate-300 mb-6">{combatEvent.text}</p>
                        <div className="h-40 flex items-center justify-center bg-slate-800 rounded-lg mb-4 relative overflow-hidden border border-slate-700">
                            {isRolling && rollTarget ? <ScrambleDie target={rollTarget} onComplete={combatActions.onRollComplete} /> : 
                            <div className="relative w-32 h-32 flex items-center justify-center opacity-50"><div className="text-6xl text-slate-500">⬢</div><div className="absolute text-xl font-bold text-slate-400">D20</div></div>}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={combatActions.onRun} disabled={isRolling} className="flex-1 bg-slate-700 hover:bg-slate-600 border border-slate-500 text-slate-200 py-3 rounded disabled:opacity-50">{combatEvent.goldLoss > 0 ? "Surrender Gold" : "Run Away"}</button>
                            <button onClick={combatActions.onFight} disabled={isRolling} className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded flex flex-col items-center justify-center disabled:opacity-50">
                                {isRolling ? (
                                <span>ROLLING...</span>
                            ) : (
                                <>
                                    <span>FIGHT!</span>
                                    <span className="text-[10px] font-normal opacity-75">
                                        Roll D20 + {combatActions.bonus} vs DC {combatEvent.difficulty}
                                    </span>
                                </>
                            )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
