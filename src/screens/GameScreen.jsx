import { useState } from 'react';
import { Map, RotateCcw, LogOut, Shield, ShoppingBag, Sword, FlaskConical, Landmark, Star } from 'lucide-react';
import StatsBar from '../components/StatsBar';
import InventoryGrid from '../components/InventoryGrid';
import MarketItem from '../components/MarketItem';
import { getIcon } from '../utils';
import { UPGRADES } from '../gameData';
import EventModal from '../components/EventModal';

export default function GameScreen({ 
    gamertag, player, day, maxDays, location, resources, health, maxHealth, debt, 
    currentPrices, log, eventMsg, flash, 
    activeEvent, // Unified Event State
    isRolling, rollTarget,
    playerItems, onPayDebt, onTravel, onRestart, onQuit, 
    onBuy, onSell, onBuyMax, onSellAll, onBuyUpgrade, getBuyPrice, getSellPrice,
    combatActions, hasTraded, 
    onRoll, // Generic Roll Handler (startRoll)
    onClose, // Generic Close Handler (closeEventModal)
    onWork, 
    userProfile, 
    debugGamertag
}) {
    const [activeTab, setActiveTab] = useState('market');

    // Determine if the current user is a debug user
    const isDebugUser = userProfile?.gamertag === debugGamertag;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-2 max-w-md mx-auto border-x border-slate-700 flex flex-col relative">
            
            {/* HEADER */}
            <header className="flex justify-between items-start mb-4 border-b border-slate-700 pb-2 relative">
                
                {/* LEFT: Player Info */}
                <div className="z-10 flex items-center gap-2"> {/* <-- MODIFIED: Added flex and gap */}
                    {userProfile?.c3_profile_image && ( // <-- ADDED AVATAR HERE
                        <img 
                            src={userProfile.c3_profile_image} 
                            alt="Player Avatar" 
                            className="w-8 h-8 rounded-full border border-yellow-500 object-cover" 
                        />
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-yellow-500 truncate max-w-[120px]">{gamertag}</h1>
                        <p className="text-xs text-slate-400 capitalize">{player.race?.name} {player.class?.name}</p>
                    </div>
                </div>

                {/* CENTER: Day Counter */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center">
                    <div className="text-[10px] text-white uppercase tracking-widest font-bold">Day</div>
                    <div key={day} className="text-3xl font-black text-white leading-none animate-in zoom-in fade-in duration-300">
                        {day}/{maxDays}
                    </div>
                </div>

                {/* RIGHT: Location & Actions */}
                <div className="flex flex-col items-end gap-1 z-10">
                    <div className="text-xs text-blue-400 inline-flex items-center gap-1 font-bold">
                        <Map size={14}/>
                        <span className="truncate max-w-[100px] text-right">{location.name}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                        <button onClick={onRestart} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-green-400 border border-slate-700"><RotateCcw size={14} /></button>
                        <button onClick={onQuit} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-700"><LogOut size={14} /></button>
                    </div>
                </div>
            </header>

            {/* EVENT MSG */}
            {eventMsg && (
                <div className={`mb-4 p-3 rounded text-center text-sm font-bold border ${
                    eventMsg.type === 'good' 
                    ? 'bg-green-900/50 border-green-500 text-green-200' 
                    : 'bg-red-900/50 border-red-500 text-red-200'
                }`}>
                    {eventMsg.text}
                </div>
            )}
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
                    day === maxDays 
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-yellow-900/20' // Final Day Style
                    : hasTraded 
                        ? 'bg-blue-600 hover:bg-blue-500' 
                        : 'bg-slate-700 hover:bg-slate-600'
                }`}
            >
                {day === maxDays ? (
                    // FINAL DAY STATE
                    <>
                        <Star  size={20} /> 
                        <span className="uppercase tracking-wider">Time to End Your Adventure</span>
                    </>
                ) : hasTraded ? (
                    // STANDARD TRAVEL
                    <><Map size={20}/> Travel to New Location</>
                ) : (
                    // STANDARD WORK
                    <><Map size={20}/> Work & Travel (50-200g)</>
                )}
            </button>


            {/* Travel Log - Only render if it's the debug user */}
            {isDebugUser && ( // <--- CONDITIONAL RENDERING HERE
                <div className="bg-black p-3 rounded-lg h-24 overflow-y-auto text-xs font-mono text-green-500 border border-slate-700 shadow-inner">
                    {log.map((entry, i) => <div key={i} className="mb-1 border-b border-gray-900 pb-1 last:border-0"> &gt; {entry}</div>)}
                </div>
            )}

            {/* SCREEN FLASH */}
            <div className={`fixed inset-0 pointer-events-none transition-opacity duration-300 ${flash === 'red' ? 'bg-red-500/30' : flash === 'green' ? 'bg-green-500/30' : flash === 'gold' ? 'bg-yellow-500/30' : 'opacity-0'}`}></div>

            {/* UNIFIED EVENT MODAL */}
            <EventModal 
                event={activeEvent} 
                isRolling={isRolling}
                rollTarget={rollTarget}
                onRoll={onRoll} 
                onClose={onClose}
                combatActions={{
                    onRollComplete: combatActions.onRollComplete,
                    onRun: combatActions.onRun,
                    bonus: combatActions.bonus
                }}
            />
        </div>
    );
}