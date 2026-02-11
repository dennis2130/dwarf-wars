import { getIcon } from '../utils';

export default function InventoryGrid({ inventory, maxInventory }) {
  const currentCount = Object.values(inventory).reduce((a, b) => a + b.count, 0);
  
  // Strict check: Are we exactly at the limit?
  const isFull = currentCount >= maxInventory;

  return (
    <div className="mb-2 flex-grow">
        {/* HEADER */}
        <div className="flex justify-between items-end mb-2 px-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Inventory</h2>
            
            {/* LARGE COUNTER */}
            <div className={`text-2xl font-black font-mono leading-none ${
                isFull ? 'text-yellow-500' : 'text-slate-400'
            }`}>
                {currentCount}<span className="text-sm text-slate-600 font-bold">/{maxInventory}</span>
            </div>
        </div>

        {/* FULL WARNING BANNER */}
        {isFull && (
            <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide border rounded p-1 animate-in fade-in bg-yellow-900/20 border-yellow-600/50 text-yellow-500">
                Inventory Full
            </div>
        )}
        
        {/* GRID */}
        <div className="grid grid-cols-4 gap-1 text-center min-h-[3rem]">
            {Object.entries(inventory).filter(([_, data]) => data.count > 0).length === 0 ? (
                <div className="col-span-4 flex items-center justify-center text-[10px] text-slate-600 italic border border-slate-800 rounded bg-slate-900/50 h-16">
                    Empty Pockets
                </div>
            ) : (
                Object.entries(inventory)
                    .filter(([_, data]) => data.count > 0)
                    .map(([key, data]) => (
                        <div key={key} className="p-1 rounded border border-slate-700 flex flex-col items-center justify-center bg-slate-800 animate-in zoom-in duration-200 relative">
                            <div className="text-slate-400 mb-0.5 scale-90">
                                {getIcon(key)}
                            </div>
                            <div className="text-white font-bold text-sm leading-none">
                                {data.count}
                            </div>
                        </div>
                ))
            )}
        </div>
    </div>
  );
}