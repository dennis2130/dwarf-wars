import { useLongPress } from '../hooks/useLongPress';

export default function MarketItem({ item, buyPrice, sellPrice, myAvg, haveStock, onBuy, onSell, onBuyMax, onSellAll, icon }) {
    
    // Profit Calculation for Sell Price Color
    let sellColor = "text-slate-500";
    if (haveStock) {
        if (sellPrice > myAvg) sellColor = "text-green-400"; 
        else if (sellPrice < myAvg) sellColor = "text-red-400"; 
    }

    const buyEvents = useLongPress(onBuy);
    const sellEvents = useLongPress(onSell);

    return (
        <div className="flex items-center justify-between px-4 py-1 border-b border-slate-700/50 h-16 last:border-0 bg-slate-900/50">
            
            {/* LEFT: Name & Stats */}
            <div className="flex flex-col justify-center mr-3 min-w-[90px]">
                {/* Name & Avg Cost */}
                <div className="font-bold text-slate-100 text-sm truncate flex items-center gap-2 mb-1">
                    {icon} 
                    <span className="capitalize">{item}</span>
                    {/* NEW: Avg Cost Text Only */}
                    {haveStock && (
                        <span className="text-[10px] font-normal text-blue-400 ml-1 opacity-80">
                            avg {Math.floor(myAvg)}
                        </span>
                    )}
                </div>
                
                {/* Prices: Single Line for Compactness */}
                <div className="text-[11px] font-mono leading-none flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500 uppercase tracking-tighter text-[9px]">Buy</span>
                        <span className="text-white font-bold">{buyPrice}</span>
                    </div>
                    <div className="w-px h-2 bg-slate-700"></div> {/* Divider */}
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500 uppercase tracking-tighter text-[9px]">Sell</span>
                        <span className={`font-bold ${sellColor}`}>{sellPrice}</span>
                    </div>
                </div>
            </div>

            {/* RIGHT: Button Clusters */}
            <div className="flex flex-1 justify-end gap-2 items-center">
                
                {/* BUY GROUP */}
                <div className="flex shadow-sm">
                    <button 
                        onClick={onBuyMax}
                        className="bg-green-600 hover:bg-green-500 text-white h-9 w-10 flex items-center justify-center rounded-l text-[10px] font-bold active:scale-95 transition-all shadow-lg border-r border-green-700"
                    >
                        MAX
                    </button>
                    <button 
                        {...buyEvents}
                        className="bg-slate-800 hover:bg-slate-700 text-green-500 border border-slate-600 border-l-0 h-9 w-10 flex items-center justify-center rounded-r text-[10px] font-bold uppercase active:scale-95 transition-all"
                    >
                        BUY
                    </button>
                </div>

                {/* SELL GROUP */}
                <div className="flex shadow-sm">
                    <button 
                        {...sellEvents}
                        className="bg-slate-800 hover:bg-slate-700 text-red-500 border border-slate-600 border-r-0 h-9 w-10 flex items-center justify-center rounded-l text-[10px] font-bold uppercase active:scale-95 transition-all"
                    >
                        SELL
                    </button>
                    <button 
                        onClick={onSellAll}
                        className="bg-red-600 hover:bg-red-500 text-white h-9 w-10 flex items-center justify-center rounded-r text-[10px] font-bold active:scale-95 transition-all shadow-lg border-l border-red-700"
                    >
                        ALL
                    </button>
                </div>
            </div>
        </div>
    );
}