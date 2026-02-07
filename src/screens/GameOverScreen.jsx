import { Skull } from 'lucide-react';

export default function GameOverScreen({ money, debt, isSaving, onRestart }) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-5xl font-bold mb-4 text-red-600 flex items-center gap-2"><Skull size={48}/> GAME OVER</h1>
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 w-full max-w-sm">
                <div className="text-2xl mb-2">Final Score</div>
                <div className={`text-4xl font-bold mb-4 ${money - debt >= 0 ? 'text-green-400' : 'text-red-400'}`}>{money - debt}</div>
                {isSaving ? <p className="animate-pulse text-yellow-500">Saving Score...</p> : <p className="text-green-500">Score Saved!</p>}
            </div>
            <button onClick={onRestart} className="mt-8 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold">Play Again</button>
        </div>
    );
}