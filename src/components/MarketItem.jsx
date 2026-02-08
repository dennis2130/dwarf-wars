import { useLongPress } from '../hooks/useLongPress';

export default function MarketItem({ item, buyPrice, sellPrice, myAvg, haveStock, onBuy, onSell, onBuyMax, onSellAll, icon }) {
    
    // Profit Calculation for Sell Price Color
    let sellColor = "text-slate-400";
    if (haveStock) {
        if (sellPrice > myAvg) sellColor = "text-green-400"; // Profit
        else if (sellPrice < myAvg) sellColor = "text-red-400"; // Loss
    }

    const buyEvents = useLongPress(onBuy);
    const sellEvents = useLongPress(onSell);

    return (
        <div className="flex items-center justify-between py-2 border-b border-slate-700/50 h-18">
            
            {/* LEFT: Name & Stats */}
            <div className="flex flex-col w-28 shrink-0 mr-2">
                {/* Name */}
                <div className="font-bold text-slate-100 text-sm truncate flex items-center gap-2 mb-1">
                    {icon} <span>{item}</span>
                </div>
                
                {/* Prices Stacked - Increased Visibility */}
                <div className="flex flex-col text-xs font-mono leading-tight gap-1">
                    <div className="flex justify-between w-full items-center">
                        <span className="text-slate-500 text-[10px] uppercase">Buy</span>
                        <span className="text-white font-bold text-sm">{buyPrice}</span>
                    </div>
                    <div className="flex justify-between w-full items-center">
                        <span className="text-slate-500 text-[10px] uppercase">Sell</span>
                        <span className={`font-bold text-sm ${sellColor}`}>{sellPrice}</span>
                    </div>
                </div>
            </div>

            {/* RIGHT: Button Clusters */}
            <div className="flex flex-1 justify-end gap-3">
                
                {/* BUY GROUP */}
                <div className="flex shadow-sm">
                    <button 
                        onClick={onBuyMax}
                        className="bg-green-600 hover:bg-green-500 text-white px-3 rounded-l text-xs font-bold active:scale-95 transition-all shadow-green-900/20 shadow-lg border-y border-l border-green-500"
                        title="Buy Max"
                    >
                        MAX
                    </button>
                    <button 
                        {...buyEvents}
                        className="bg-slate-800 hover:bg-slate-700 text-green-500 border border-green-700/50 px-3 py-2 rounded-r text-[10px] font-bold uppercase active:scale-95 transition-all"
                        title="Buy One"
                    >
                        Buy
                    </button>
                </div>

                {/* SELL GROUP */}
                <div className="flex shadow-sm">
                    <button 
                        {...sellEvents}
                        className="bg-slate-800 hover:bg-slate-700 text-red-500 border border-red-900/50 px-3 py-2 rounded-l text-[10px] font-bold uppercase active:scale-95 transition-all"
                        title="Sell One"
                    >
                        Sell
                    </button>
                    <button 
                        onClick={onSellAll}
                        className="bg-red-600 hover:bg-red-500 text-white px-3 rounded-r text-xs font-bold active:scale-95 transition-all shadow-red-900/20 shadow-lg border-y border-r border-red-500"
                        title="Sell All"
                    >
                        ALL
                    </button>
                </div>
            </div>
        </div>
    );
}