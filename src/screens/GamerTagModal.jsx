import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { validateName } from '../gameData'; // Reuse your filter!
import { X } from 'lucide-react';

export default function GamerTagModal({ session, onComplete, onCancel, currentTag }) {
    
    const [tag, setTag] = useState(currentTag || ''); // Pre-fill if editing
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        setError(null);
        
        // 1. Validation
        if (tag.length < 3) return setError("Too short.");
        if (tag.length > 15) return setError("Too long.");
        const profanityCheck = validateName(tag);
        if (profanityCheck) return setError(profanityCheck);
        
        if (tag === currentTag) {
            onComplete(tag);
            return;
        }

        setLoading(true);

        // 2. Check if Taken
        const { data: existing, error: searchError } = await supabase
            .from('profiles')
            .select('gamertag')
            .eq('gamertag', tag)
            .maybeSingle(); // <--- CHANGE THIS from .single()

        if (existing) {
            setLoading(false);
            return setError("Gamer Tag already taken!");
        }

        // 3. Save to Profile
        // We use upsert to handle both insert (new) and update (existing but empty)
        const { error: dbError } = await supabase
            .from('profiles')
            .upsert({ 
                id: session.user.id, 
                email: session.user.email,
                gamertag: tag 
            });

        setLoading(false);

        if (dbError) {
            setError(dbError.message);
        } else {
            onComplete(tag);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-yellow-500 rounded-lg p-6 w-full max-w-sm text-center">
                {/* CANCEL BUTTON (Only show if editing, not first time setup) */}
                {onCancel && (
                    <button onClick={onCancel} className="absolute top-2 right-2 text-slate-500 hover:text-white">
                        <X size={20} />
                    </button>
                )}
                <h2 className="text-xl text-yellow-500 font-bold mb-2">Welcome, Commander</h2>
                <p className="text-slate-400 text-sm mb-6">Choose a unique Gamer Tag for the leaderboards.</p>
                
                <input 
                    type="text" 
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-black border border-slate-600 rounded p-3 text-center text-white font-bold mb-4 focus:border-yellow-500 outline-none"
                    placeholder="Gamer Tag"
                />
                
                {error && <div className="text-red-500 text-xs mb-4">{error}</div>}

                <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded disabled:opacity-50"
                >
                    {loading ? "Checking..." : "Confirm Identity"}
                </button>
            </div>
        </div>
    );
}