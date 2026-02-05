import { UtensilsCrossed, FlaskConical, Gem, ShoppingBag, Shield, Sword, Scroll, Hammer } from 'lucide-react';

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
        default: return <ShoppingBag size={16} />;
    }
};