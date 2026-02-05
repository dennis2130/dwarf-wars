import { Coins, Skull, Heart } from 'lucide-react';

export default function StatsBar({ money, debt, health, maxHealth, onPayDebt }) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        {/* GOLD */}
        <div className="bg-slate-800 p-2 rounded shadow flex flex-col items-center">
            <span className="text-xs text-slate-400 flex items-center gap-1"><Coins size={12}/> GOLD</span>
            <span className="text-green-400 font-bold">{money}</span>
        </div>

        {/* DEBT */}
        <div className="bg-slate-800 p-2 rounded shadow flex flex-col items-center">
            <span className="text-xs text-slate-400 flex items-center gap-1"><Skull size={12}/> DEBT</span>
            <div className="text-red-400 font-bold">
                {debt} {debt > 0 && <span onClick={onPayDebt} className="text-[10px] underline text-blue-400 cursor-pointer ml-1">Pay</span>}
            </div>
        </div>

        {/* HEALTH */}
        <div className="bg-slate-800 p-2 rounded shadow flex flex-col items-center justify-between w-full">
            <span className="text-xs text-slate-400 flex items-center gap-1"><Heart size={12}/> HP</span>
            <span className={`${health < 30 ? 'text-red-500 animate-pulse' : 'text-blue-400'} font-bold`}>{health}/{maxHealth}</span>
            
            <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1 overflow-hidden border border-slate-700">
                <div 
                    className={`${health < 30 ? 'bg-red-500' : 'bg-blue-500'} h-full transition-all duration-500`} 
                    style={{ width: `${Math.max(0, (health / maxHealth) * 100)}%` }}
                ></div>
            </div>
        </div>
    </div>
  );
}