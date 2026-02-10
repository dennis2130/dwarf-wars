import { useState } from 'react';
import { Map, RotateCcw, LogOut, Shield, ShoppingBag, Sword, FlaskConical, Swords, Target } from 'lucide-react';
import StatsBar from '../components/StatsBar';
import InventoryGrid from '../components/InventoryGrid';
import MarketItem from '../components/MarketItem';
import ScrambleDie from '../components/ScrambleDie';
import { getIcon } from '../utils';
import { UPGRADES } from '../gameData';

export default function GameScreen({ 
    gamertag, player, day, maxDays, location, resources, health, maxHealth, debt, 
    currentPrices, log, eventMsg, flash, combatEvent, checkEvent, 
    isRolling, rollTarget,
    playerItems, onPayDebt, onTravel, onRestart, onQuit, 
    onBuy, onSell, onBuyMax, onSellAll, onBuyUpgrade, getBuyPrice, getSellPrice,
    combatActions, hasTraded,
    onCheckRoll, onCheckComplete, onCloseCheck, onCloseCombat 
}) {
    const [activeTab, setActiveTab] = useState('market');

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-2 max-w-md mx-auto border-x border-slate-700 flex flex-col relative">
            
            {/* HEADER */}
            <header className="flex justify-between items-start mb-4 border-b border-slate-700 pb-2 relative">
                
                {/* LEFT: Player Info */}
                <div className="z-10">
                    <h1 className="text-xl font-bold text-yellow-500 truncate max-w-[120px]">{gamertag}</h1>
                    <p className="text-xs text-slate-400 capitalize">{player.race?.name} {player.class?.name}</p>
                </div>

                {/* CENTER: Day Counter */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center">
                    <div className="text-[10px] text-white uppercase tracking-widest font-bold">Day</div>
                    {/* key={day} forces the animation to re-run every time day changes */}
                    <div key={day} className="text-2xl font-black text-white leading-none animate-in zoom-in fade-in duration-300">
                        {day}/{maxDays}
                    </div>
                </div>

                {/* RIGHT: Location & Actions */}
                <div className="flex flex-col items-end gap-1 z-10">
                    <div className="text-s text-blue-400 inline-flex items-center gap-1 font-bold">
                        <Map size={14}/>
                        <span className="truncate max-w-[115px] text-right">{location.name}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                        <button onClick={onRestart} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-green-400 border border-slate-700"><RotateCcw size={14} /></button>
                        <button onClick={onQuit} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-700"><LogOut size={14} /></button>
                    </div>
                </div>
            </header>

            {/* EVENT MSG */}
            {eventMsg && <div className={`mb-4 p-3 rounded text-center text-sm font-bold border ${eventMsg.type === 'damage' || eventMsg.type === 'theft' || eventMsg.type === 'bad' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-green-900/50 border-green-500 text-green-200'}`}>{eventMsg.text}</div>}

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
                            const buyPrice = getBuyPrice(currentPrices[item]);
                            const sellPrice = getSellPrice(currentPrices[item]);
                            
                            return (
                                <MarketItem 
                                    key={item} 
                                    item={item} 
                                    icon={getIcon(item)} 
                                    buyPrice={buyPrice}
                                    sellPrice={sellPrice}
                                    myAvg={resources.inventory[item]?.avg || 0} 
                                    haveStock={resources.inventory[item]?.count > 0} 
                                    onBuy={() => onBuy(item)} 
                                    onSell={() => onSell(item)} 
                                    onBuyMax={() => onBuyMax(item)} 
                                    onSellAll={() => onSellAll(item)}
                                />
                            );
                        })}
                    </div>
                    <InventoryGrid inventory={resources.inventory} maxInventory={playerItems.reduce((acc, i) => i.type === 'inventory' ? acc + i.value : acc, 50 + player.race.stats.inventory)} />
                </>
            ) : (
                <div className="mb-4 flex-grow space-y-2">
                    {UPGRADES.filter(u => {
                            if (u.ban) {
                                if (Array.isArray(u.ban.race)) {
                                    if (u.ban.race.includes(player.race.id)) return false;
                                } else if (u.ban.race === player.race.id) {
                                    return false;
                                }
                                if (Array.isArray(u.ban.class)) {
                                    if (u.ban.class.includes(player.class.id)) return false;
                                } else if (u.ban.class === player.class.id) {
                                    return false;
                                }
                            }
                        if (u.req) {
                            if (u.req.class && u.req.class !== player.class.id) return false;
                            if (u.req.race && u.req.race !== player.race.id) return false;
                        }
                        return true; 
                    }).map((u) => {
                        const owned = playerItems.find(i => i.id === u.id);
                        return (
                            <div key={u.id} className={`flex justify-between items-center p-3 rounded border ${owned ? 'bg-slate-800/50 border-slate-700 opacity-50' : 'bg-slate-800 border-slate-600'}`}>
                                <div className="flex items-center gap-3">
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
                onClick={onTravel} 
                className={`w-full text-white font-bold py-4 rounded-lg shadow-lg mb-4 flex items-center justify-center gap-2 ${
                    hasTraded ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'
                }`}
            >
                {hasTraded ? (
                    <><Map size={20}/> Travel to New Location</>
                ) : (
                    <><Map size={20}/> Work & Travel (50-200g)</>
                )}
            </button>


            <div className="bg-black p-3 rounded-lg h-24 overflow-y-auto text-xs font-mono text-green-500 border border-slate-700 shadow-inner">
                {log.map((entry, i) => <div key={i} className="mb-1 border-b border-gray-900 pb-1 last:border-0"> &gt; {entry}</div>)}
            </div>

            {/* SCREEN FLASH */}
            <div className={`fixed inset-0 pointer-events-none transition-opacity duration-300 ${flash === 'red' ? 'bg-red-500/30' : flash === 'green' ? 'bg-green-500/30' : flash === 'gold' ? 'bg-yellow-500/30' : 'opacity-0'}`}></div>

            {/* SKILL CHECK MODAL */}
            {checkEvent && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    <div className={`rounded-xl p-6 w-full max-w-sm text-center shadow-2xl border-2 animate-in zoom-in duration-200 ${checkEvent.result ? (checkEvent.result.outcome.includes('success') ? 'bg-slate-900 border-green-500' : 'bg-slate-900 border-red-500') : 'bg-slate-900 border-blue-500'}`}>
                        
                        <h2 className="text-xl font-bold mb-4 text-white uppercase tracking-widest">
                            {checkEvent.config.stat} CHECK
                        </h2>

                        {!checkEvent.result ? (
                            <>
                                <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                                    "{checkEvent.text}"
                                </p>
                                
                                <div className="h-32 flex items-center justify-center mb-6">
                                    {isRolling && rollTarget ? (
                                        <ScrambleDie target={rollTarget} onComplete={onCheckComplete} />
                                    ) : (
                                        <Target size={80} className="text-blue-500 animate-pulse" strokeWidth={1.5} />
                                    )}
                                </div>

                                <button 
                                    onClick={onCheckRoll} 
                                    disabled={isRolling}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50"
                                >
                                    {isRolling ? "ROLLING..." : `ROLL D20 (DC ${checkEvent.config.difficulty})`}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className={`text-4xl font-black mb-2 ${checkEvent.result.outcome.includes('success') ? 'text-green-400' : 'text-red-500'}`}>
                                    {checkEvent.result.outcome.replace('_', ' ').toUpperCase()}
                                </div>
                                
                                <div className="text-xs text-slate-500 font-mono mb-6">
                                    Rolled {checkEvent.result.roll} + Bonus = {checkEvent.result.total}
                                </div>

                                <p className="text-white text-lg mb-8 italic">
                                    "{checkEvent.result.text}"
                                </p>

                                <button 
                                    onClick={onCloseCheck}
                                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl"
                                >
                                    CONTINUE JOURNEY
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* COMBAT MODAL */}
            {combatEvent && (
                <div className="fixed inset-0 z-40 bg-black/90 flex items-center justify-center p-4">
                    <div className={`rounded-xl p-6 w-full max-w-sm text-center shadow-2xl border-2 animate-in zoom-in duration-200 ${combatEvent.result ? (combatEvent.result.outcome.includes('success') || combatEvent.result.outcome === 'win' ? 'bg-slate-900 border-green-500' : 'bg-slate-900 border-red-500') : 'bg-slate-900 border-red-500'}`}>
                        
                        <h2 className="text-2xl text-white font-bold mb-2 uppercase tracking-widest">
                            {combatEvent.name} ATTACK!
                        </h2>

                        {!combatEvent.result ? (
                            <>
                                <p className="text-slate-300 mb-6">{combatEvent.text}</p>
                                
                                <div className="h-32 flex items-center justify-center mb-4">
                                    {isRolling && rollTarget ? (
                                        <ScrambleDie target={rollTarget} onComplete={combatActions.onRollComplete} />
                                    ) : (
                                        <Swords size={80} className="text-red-500 animate-pulse" strokeWidth={1.5} />
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={combatActions.onRun} disabled={isRolling} className="flex-1 bg-slate-700 hover:bg-slate-600 border border-slate-500 text-slate-200 py-3 rounded disabled:opacity-50 font-bold">
                                        {combatEvent.goldLoss > 0 ? "Surrender" : "Run Away"}
                                    </button>
                                    <button onClick={combatActions.onFight} disabled={isRolling} className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded flex flex-col items-center justify-center disabled:opacity-50 shadow-lg shadow-red-900/50">
                                        {isRolling ? (
                                            <span>ROLLING...</span>
                                        ) : (
                                            <>
                                                <span>FIGHT!</span>
                                                <span className="text-[10px] font-normal opacity-80">
                                                    Roll D20 + {combatActions.bonus} vs DC {combatEvent.difficulty}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={`text-4xl font-black mb-2 uppercase ${combatEvent.result.outcome.includes('success') || combatEvent.result.outcome === 'win' ? 'text-green-400' : 'text-red-500'}`}>
                                    {combatEvent.result.title}
                                </div>
                                
                                <div className="text-xs text-slate-500 font-mono mb-6">
                                    Rolled {combatEvent.result.roll} + Bonus = {combatEvent.result.total}
                                </div>

                                <div className="space-y-4 mb-8">
                                    <p className="text-white text-lg italic">
                                        "{combatEvent.result.text}"
                                    </p>
                                    
                                    {combatEvent.result.loot && (
                                        <div className="bg-green-900/30 p-3 rounded border border-green-800 text-green-300 text-sm font-bold animate-pulse">
                                            {combatEvent.result.loot}
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={onCloseCombat}
                                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl shadow-lg"
                                >
                                    CONTINUE JOURNEY
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}