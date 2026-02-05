import { getIcon } from '../utils';

export default function InventoryGrid({ inventory, maxInventory }) {
  const currentCount = Object.values(inventory).reduce((a, b) => a + b.count, 0);

  return (
    <div className="mb-2 flex-grow">
        <div className="flex justify-between items-end mb-1">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inventory</h2>
            <span className="text-[10px] text-slate-400">
                {currentCount} / {maxInventory}
            </span>
        </div>
        
        <div className="grid grid-cols-4 gap-1 text-center min-h-[3rem]">
            {Object.entries(inventory).filter(([_, data]) => data.count > 0).length === 0 ? (
                <div className="col-span-4 flex items-center justify-center text-[10px] text-slate-600 italic border border-slate-800 rounded bg-slate-900/50">
                    Empty Pockets
                </div>
            ) : (
                Object.entries(inventory)
                    .filter(([_, data]) => data.count > 0)
                    .map(([key, data]) => (
                        <div key={key} className="p-1 rounded border border-slate-700 flex flex-col items-center justify-center bg-slate-800 animate-in zoom-in duration-200">
                            <div className="text-slate-400 mb-0.5">
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