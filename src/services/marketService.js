import { BASE_PRICES } from '../gameData';

export const getBuyPrice = (basePrice, buyModOrRace = 0) => {
    // Support both old (playerRace object) and new (numeric buyMod) signatures for backwards compatibility
    const buyMod = typeof buyModOrRace === 'object' ? (buyModOrRace?.stats?.buyMod || 0) : buyModOrRace;
    return Math.ceil(basePrice * (1.0 - buyMod));
};

export const getSellPrice = (basePrice, sellModOrRace = 0) => {
    // Support both old (playerRace object) and new (numeric sellMod) signatures for backwards compatibility
    const sellMod = typeof sellModOrRace === 'object' ? (sellModOrRace?.stats?.sellMod || 0) : sellModOrRace;
    return Math.floor(basePrice * 0.80 * (1.0 + sellMod));
};

export const recalcPrices = (location, randomEventMod = 1.0) => {
    let newPrices = { ...BASE_PRICES };
    
    for (const item in newPrices) {
        const volatility = Math.random() * 2.0 + 0.25;
        const locMod = location.prices[item] || 1.0;
        newPrices[item] = Math.floor(BASE_PRICES[item] * volatility * locMod * randomEventMod);
    }
    
    return newPrices;
};

// Inventory transaction calculations (pure functions)
export const calculateBuyItem = (item, cost, resources, maxInventory) => {
    const totalItems = Object.values(resources.inventory).reduce((a, b) => a + b.count, 0);
    
    if (totalItems >= maxInventory || resources.money < cost) {
        return { newResources: null, canBuy: false };
    }
    
    const currentInv = resources.inventory;
    const currentItemData = currentInv[item];
    const totalValue = (currentItemData.count * currentItemData.avg) + cost;
    
    const newResources = {
        money: resources.money - cost,
        inventory: {
            ...currentInv,
            [item]: {
                count: currentItemData.count + 1,
                avg: totalValue / (currentItemData.count + 1)
            }
        }
    };
    
    return { newResources, canBuy: true };
};

export const calculateBuyMax = (item, cost, resources, maxInventory) => {
    const totalItems = Object.values(resources.inventory).reduce((a, b) => a + b.count, 0);
    const spaceLeft = maxInventory - totalItems;
    const canAfford = Math.floor(resources.money / cost);
    const amountToBuy = Math.min(spaceLeft, canAfford);
    
    if (amountToBuy <= 0) {
        return { newResources: null, amountBought: 0 };
    }
    
    const currentItemData = resources.inventory[item];
    const totalCost = amountToBuy * cost;
    const totalValue = (currentItemData.count * currentItemData.avg) + totalCost;
    
    const newResources = {
        money: resources.money - totalCost,
        inventory: {
            ...resources.inventory,
            [item]: {
                count: currentItemData.count + amountToBuy,
                avg: totalValue / (currentItemData.count + amountToBuy)
            }
        }
    };
    
    return { newResources, amountBought: amountToBuy };
};

export const calculateSellItem = (item, value, resources) => {
    const currentCount = resources.inventory[item].count;
    
    if (currentCount <= 0) {
        return { newResources: null, canSell: false };
    }
    
    const newResources = {
        money: resources.money + value,
        inventory: {
            ...resources.inventory,
            [item]: { ...resources.inventory[item], count: resources.inventory[item].count - 1 }
        }
    };
    
    return { newResources, canSell: true };
};

export const calculateSellAll = (item, value, resources) => {
    const count = resources.inventory[item].count;
    
    if (count <= 0) {
        return { newResources: null, canSell: false };
    }
    
    const newResources = {
        money: resources.money + (value * count),
        inventory: {
            ...resources.inventory,
            [item]: { count: 0, avg: 0 }
        }
    };
    
    return { newResources, canSell: true };
};
