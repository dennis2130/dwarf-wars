import { X } from 'lucide-react';

export default function ModifiersModal({ isOpen, onClose, playerRace, playerClass, playerItems, defense, currentLocation, currentPrices }) {
    if (!isOpen || !playerRace || !playerClass) return null;

    // Get equipment (weapons)
    const weapons = playerItems.filter(item => item.type === 'combat');
    
    // Get armor (defense)
    const armor = playerItems.filter(item => item.type === 'defense');
    
    // Get inventory items (mule, wagon, etc.)
    const inventoryItems = playerItems.filter(item => item.type === 'inventory');
    
    // Get elixirs
    const elixirs = playerItems.filter(item => item.type === 'elixir');

    // Weapon total
    const weaponBonus = weapons.reduce((sum, w) => sum + (w.value || 0), 0);

    // Armor total
    const armorBonus = armor.reduce((sum, a) => sum + (a.value || 0), 0);

    // Inventory items total
    const inventoryBonus = inventoryItems.reduce((sum, i) => sum + (i.value || 0), 0);

    // Elixir bonuses
    const elixirCombat = elixirs.reduce((sum, e) => {
        return sum + (typeof e.value === 'object' && e.value.combat ? e.value.combat : 0);
    }, 0);
    const elixirInventory = elixirs.reduce((sum, e) => {
        return sum + (typeof e.value === 'object' && e.value.inventory ? e.value.inventory : 0);
    }, 0);

    // Attribute list with modifiers
    const attributes = [
        { name: 'Combat', race: playerRace.stats.combat || 0, class: playerClass.stats.combat || 0, equipment: weaponBonus, elixir: elixirCombat },
        { name: 'Inventory', race: playerRace.stats.inventory || 0, class: playerClass.stats.inventory || 0, equipment: inventoryBonus, elixir: elixirInventory },
        { name: 'Health', race: playerRace.stats.health || 0, class: playerClass.stats.health || 0, equipment: 0, elixir: 0 },
        { name: 'Defense', race: playerRace.id === 'orc' ? 5 : 0, class: 0, equipment: armorBonus, elixir: 0 },
        { name: 'Wisdom', race: playerRace.stats.wisdom || 0, class: playerClass.stats.wisdom || 0, equipment: 0, elixir: 0 },
        { name: 'Intelligence', race: playerRace.stats.intelligence || 0, class: playerClass.stats.intelligence || 0, equipment: 0, elixir: 0 },
        { name: 'Charisma', race: playerRace.stats.charisma || 0, class: playerClass.stats.charisma || 0, equipment: 0, elixir: 0 },
        { name: 'Dexterity', race: playerRace.stats.dexterity || 0, class: playerClass.stats.dexterity || 0, equipment: 0, elixir: 0 },
        { name: 'Constitution', race: playerRace.stats.constitution || 0, class: playerClass.stats.constitution || 0, equipment: 0, elixir: 0 },
        { name: 'Stealth', race: playerRace.stats.stealth || 0, class: playerClass.stats.stealth || 0, equipment: 0, elixir: 0 },
        { name: 'Buy Mod', race: playerRace.stats.buyMod || 0, class: playerClass.stats.buyMod || 0, equipment: 0, elixir: 0, isPercent: true },
        { name: 'Sell Mod', race: playerRace.stats.sellMod || 0, class: playerClass.stats.sellMod || 0, equipment: 0, elixir: 0, isPercent: true },
    ];

    // Filter to only show attributes with at least one non-zero modifier
    const activeAttributes = attributes.filter(attr => 
        attr.race !== 0 || attr.class !== 0 || attr.equipment !== 0 || attr.elixir !== 0
    );

    const formatValue = (value, isPercent = false) => {
        // Handle NaN and non-finite values
        if (!Number.isFinite(value) || value === 0) return '';
        if (isPercent) return `${value > 0 ? '-' : '+'}${Math.round(Math.abs(value) * 100)}%`;
        return `${value > 0 ? '+' : ''}${Math.round(value)}`;
    };

    const getValueColor = (value, isPercent = false) => {
        if (!Number.isFinite(value) || value === 0) return 'text-slate-500';
        if (isPercent) {
            return value > 0 ? 'text-green-300' : 'text-red-300'; // inverted for buy/sell
        }
        return value > 0 ? 'text-green-300' : 'text-red-300';
    };

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header with Top Accent */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 p-4 sticky top-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-100">Build Summary</h2>
                            <p className="text-xs text-slate-400 mt-1">{playerRace.name} {playerClass.name}</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 rounded mt-3"></div>
                </div>

                {/* Card Layout - All Views */}
                <div className="p-3 space-y-1.5">
                    {activeAttributes.map((attr, idx) => {
                        const total = attr.race + attr.class + attr.equipment + attr.elixir;
                        
                        // Helper to assign consistent colors by category
                        const getCategoryColor = (category) => {
                            switch(category) {
                                case 'race': return 'text-purple-300';
                                case 'class': return 'text-blue-300';
                                case 'equipment': return 'text-orange-300';
                                case 'elixir': return 'text-emerald-300';
                                default: return 'text-slate-300';
                            }
                        };
                        
                        // Build modifiers list with category info for consistent coloring
                        const modifiers = [];
                        if (attr.race !== 0) modifiers.push({ text: `Race: ${formatValue(attr.race, attr.isPercent)}`, category: 'race' });
                        if (attr.class !== 0) modifiers.push({ text: `Class: ${formatValue(attr.class, attr.isPercent)}`, category: 'class' });
                        if (attr.equipment !== 0) modifiers.push({ text: `Equip: ${formatValue(attr.equipment, attr.isPercent)}`, category: 'equipment' });
                        if (attr.elixir !== 0) modifiers.push({ text: `Alchm: ${formatValue(attr.elixir, attr.isPercent)}`, category: 'elixir' });
                        
                        // Special handling for Buy Mod / Sell Mod - show gem prices
                        const isBuyOrSellMod = attr.name === 'Buy Mod' || attr.name === 'Sell Mod';
                        let gemPriceData = null;
                        
                        if (isBuyOrSellMod && currentPrices?.gems) {
                            const gemsBasePrice = currentPrices.gems;
                            
                            if (attr.name === 'Buy Mod') {
                                // total is already in decimal form (e.g., 0.15 for +15% discount, -0.05 for -5% penalty)
                                // Buy price = basePrice * (1.0 - buyMod)
                                const buyPrice = Math.ceil(gemsBasePrice * (1.0 - total));
                                const difference = buyPrice - gemsBasePrice;
                                gemPriceData = {
                                    marketPrice: gemsBasePrice,
                                    adjustedPrice: buyPrice,
                                    difference: difference,
                                    isFavorable: difference < 0 // For buying, lower is better
                                };
                            } else if (attr.name === 'Sell Mod') {
                                // Sell price = basePrice * 0.80 * (1.0 + sellMod)
                                // total is already in decimal form
                                const sellPrice = Math.floor(gemsBasePrice * 0.80 * (1.0 + total));
                                const difference = sellPrice - gemsBasePrice;
                                gemPriceData = {
                                    marketPrice: gemsBasePrice,
                                    adjustedPrice: sellPrice,
                                    difference: difference,
                                    isFavorable: difference > 0 // For selling, higher is better
                                };
                            }
                        }
                        
                        return (
                            <div key={idx} className="bg-slate-800 rounded p-2 border border-slate-700">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-slate-300">{attr.name}</span>
                                    <span className={`font-bold ${getValueColor(total, attr.isPercent)}`}>
                                        {formatValue(total, attr.isPercent)}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400">
                                    {gemPriceData ? (
                                        <div className="space-y-0.5">
                                            <div className="text-slate-500">
                                                Gem Price: {gemPriceData.marketPrice} → {gemPriceData.adjustedPrice}
                                            </div>
                                            <div className={gemPriceData.isFavorable ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                                                ({gemPriceData.difference > 0 ? '+' : ''}{gemPriceData.difference})
                                            </div>
                                        </div>
                                    ) : (
                                        modifiers.map((mod, i) => (
                                            <span key={i}>
                                                {i > 0 && ', '}
                                                <span className={getCategoryColor(mod.category)}>
                                                    {mod.text}
                                                </span>
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="px-3 pb-3 pt-2 border-t border-slate-700">
                    <div className="text-xs text-slate-400 space-y-0.5">
                        <p><span className="text-purple-400 font-bold">Race:</span> {playerRace.name} - {playerRace.bonus}</p>
                        <p><span className="text-blue-400 font-bold">Class:</span> {playerClass.name}</p>
                        {weapons.length > 0 && (
                            <p><span className="text-orange-400 font-bold">Weapons:</span> {weapons.map(w => w.name).join(', ')}</p>
                        )}
                        {armor.length > 0 && (
                            <p><span className="text-cyan-400 font-bold">Armor:</span> {armor.map(a => a.name).join(', ')}</p>
                        )}
                        {inventoryItems.length > 0 && (
                            <p><span className="text-blue-400 font-bold">Inventory:</span> {inventoryItems.map(i => i.name).join(', ')}</p>
                        )}
                        {elixirs.length > 0 && (
                            <p><span className="text-emerald-400 font-bold">Elixirs:</span> {elixirs.map(e => e.name).join(', ')}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
