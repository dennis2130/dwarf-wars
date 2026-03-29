import { UtensilsCrossed, FlaskConical, Gem, ShoppingBag, Shield, Sword, Scroll, Hammer, Sparkles } from 'lucide-react';

export const getIcon = (item) => {
    switch(item) {
        case 'rations': return <UtensilsCrossed size={16} />;
        case 'ale': return <FlaskConical size={16} className="text-yellow-600"/>; // Custom color for Ale
        case 'potions': return <FlaskConical size={16} className="text-red-400"/>;
        case 'gems': return <Gem size={16} className="text-purple-400"/>;
        case 'tools': return <Hammer size={16} />;
        case 'scrolls': return <Scroll size={16} />;
        case 'dagger':
        case 'sword':
        case 'axe': return <Sword size={16} />;
        case 'shield':
        case 'armor': return <Shield size={16} />;
        // Elixir items - Liquids
        case 'elixir': return <FlaskConical size={16} className="text-green-500"/>;
        case 'dragonscale': return <FlaskConical size={16} className="text-orange-500"/>;
        case 'vitality_nectar': return <FlaskConical size={16} className="text-green-500"/>;
        case 'feline_grace': return <FlaskConical size={16} className="text-purple-500"/>;
        case 'jonah': return <FlaskConical size={16} className="text-white"/>;
        // Elixir items - Dusts and Powders
        case 'philosopher_stone': return <Sparkles size={16} className="text-blue-400"/>;
        case 'void_dust': return <Sparkles size={16} className="text-slate-500"/>;
        case 'siren_pearl': return <Sparkles size={16} className="text-pink-400"/>;
        case 'merchant_windfall': return <Sparkles size={16} className="text-yellow-500"/>;
        default: return <ShoppingBag size={16} />;
    }
};