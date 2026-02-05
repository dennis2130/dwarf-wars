import { useLongPress } from '../hooks/useLongPress';

export default function MarketItem({ item, price, myAvg, haveStock, onBuy, onSell, onSmartMax, icon }) {
    let priceColor = "text-yellow-500";
    if (haveStock) {
        if (price > myAvg) priceColor = "text-green-400"; 
        if (price < myAvg) priceColor = "text-red-400";   
    }

    const buyEvents = useLongPress(onBuy);
    const sellEvents = useLongPress(onSell);

    return (
        <div className="flex justify-between items-center p-2 border-b border-slate-700 last:border-0 h-14">
            <div className="w-1/3 min-w-0">
                <div className="font-bold text-slate-300 flex items-center gap-2 capitalize truncate">
                    {icon} <span className="truncate">{item}</span>
                </div>
                {haveStock && (
                    <div className="text-[10px] text-slate-500">
                        Avg: {Math.floor(myAvg)}g
                    </div>
                )}
            </div>
            
            <div className={`w-1/4 text-center font-mono text-sm ${priceColor}`}>
                {price} g
            </div>
            
            <div className="flex-1 flex justify-end gap-1">
                <button {...buyEvents} className="bg-green-700 hover:bg-green-600 px-3 py-2 rounded text-xs font-bold active:scale-95 transition-transform select-none text-white">
                    Buy
                </button>
                <button {...sellEvents} className="bg-red-700 hover:bg-red-600 px-3 py-2 rounded text-xs font-bold active:scale-95 transition-transform select-none text-white">
                    Sell
                </button>
                
                <button 
                    onClick={onSmartMax} 
                    className="bg-blue-600 hover:bg-blue-500 px-2 py-2 rounded text-xs font-bold border border-blue-500 active:scale-95 transition-transform text-white" 
                    title="Smart Max"
                >
                    MAX
                </button>
            </div>
        </div>
    );
}