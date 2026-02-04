# Dwarf Wars

Dwarf Wars is a fantasy-themed trading and survival game built with React, Vite, Tailwind CSS, and Supabase. You play as a hero navigating a dangerous world, trading goods, upgrading your equipment, and trying to pay off your debt before time runs out!



## Features

- **Character Creation:** Choose your name, race (Human, Dwarf, Elf, Orc), and class (Merchant, Rogue, Warrior), each with unique bonuses and starting stats.
- **Trading System:** Buy and sell a variety of items (rations, ale, potions, tools, scrolls, gems) at fluctuating prices across different locations.
- **Dynamic Locations:** Travel between unique locations (Royal City, Goblin Slums, Elven Forest, Iron Forge, Orc Badlands), each with their own price modifiers and risk levels.
- **Random Events:** Encounter random events like dragon attacks, theft, blessings, and market crashes that affect your health, gold, or prices.
- **Inventory & Upgrades:** Manage your inventory space and purchase upgrades (Pack Mule, Wagon, weapons, and consumables) to increase carrying capacity, boost combat skills, or heal. New items and upgrades are available for purchase as you progress.
- **Combat System:** Engage in dice-roll based combat encounters using the ScrambleDie mechanic. Purchase weapons (Dagger, Steel Sword, Mithril Axe) to increase your combat bonus and defeat enemies.
- **Consumables:** Use special items like the Elixir of Life to restore health during your adventure.
- **Health & Survival:** Monitor your health and combat ability. If your health drops to zero, it's game over!
- **Debt System:** Start with a debt based on your class. Pay it off before the end of 31 days to maximize your score.
- **Profanity Filtering:** Character names are validated against a profanity filter to keep the leaderboard clean.
- **Leaderboard:** High scores are saved and displayed using Supabase backend.
- **Google Authentication:** Log in with Google to save and load characters and scores.
- **Exit & Restart:** You can now exit the game at any time and restart a new session without reloading the page.
- **Simulator:** Run automated simulations of thousands of games using the included script to analyze balance and strategies.


## New Items

- **Rations:** Basic food, always in demand.
- **Ale:** Popular drink, prices vary by location.
- **Potions:** Useful for healing, prices fluctuate.
- **Tools:** Essential for adventurers, prices depend on location.
- **Scrolls:** Rare and valuable, high profit potential.
- **Gems:** The jackpot item, rare and expensive.

## Gameplay Overview

1. **Create Your Hero:** Enter a name (validated for profanity), select a race and class. Each choice affects your stats:
	- **Races:**
	  - Human: +20 Inventory Slots
	  - Dwarf: +40 Health, Sell items for 10% more
	  - Elf: Buy items for 10% less
	  - Orc: +40 Inventory, +20 Health, +2 Combat bonus (but pay 10% more and sell for 10% less)
	- **Classes:**
	  - Merchant: 1000 Gold, 5000 Debt
	  - Rogue: 300 Gold, 1000 Debt
	  - Warrior: 600 Gold, 3000 Debt

2. **Trade & Survive:**
	- Buy low, sell high! Prices change with each location and event.
	- Manage your inventory and gold.
	- Pay off your debt to avoid penalties.
	- Travel to new locations, but beware of risks and random events.

3. **Upgrade:**
	- Buy upgrades to increase inventory or defense.
	- Upgrades are permanent for your current run.

4. **Game End:**
	- The game ends after 31 days or if your health drops to zero.
	- Your final score is Gold minus Debt. High scores are saved if logged in.


## Controls

- **Market Tab:** Buy and sell items. Hold down the buy/sell buttons to continuously purchase or sell items.
- **Armory & Stables Tab:** Purchase upgrades (inventory, weapons, consumables).
- **Travel Button:** Move to a new location and trigger events.
- **Combat Encounters:** Roll a D20 die with your combat bonus and attempt to defeat enemies. The ScrambleDie animates the outcome.
- **Pay Debt:** Click on the "Pay" link next to your debt to pay it off.
- **Save Character:** (If logged in) Save your hero for future runs.
- **Exit/Restart:** Use the in-game option to exit your current run and start over.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS
## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **Backend:** Supabase (for authentication, saved characters, and high scores)
- **Icons:** lucide-react
- **Profanity Filtering:** leo-profanity
- **Dice Rolling:** Custom ScrambleDie component for combat rolls

## Setup & Installation

1. **Clone the repository:**
	```sh
	git clone <repo-url>
	cd dwarf-wars
	```
2. **Install dependencies:**
	```sh
	npm install
	```
3. **Configure Supabase:**
	- Create a `.env` file with your Supabase project credentials:
	  ```env
	  VITE_SUPABASE_URL=your_supabase_url
	  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
	  ```
4. **Run the development server:**
	```sh
	npm run dev
	```
5. **Open in browser:**
	- Visit [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal)


## Simulator

You can run a simulation of 1,000+ games to analyze balance and strategies:

```sh
node scripts/simulate.js
```

The simulator will output statistics on win rates, score distribution, and balance for races and classes. You can modify the script to test different strategies or item values.

- `src/App.jsx` - Main game logic and UI
- `src/gameData.js` - Game data: races, classes, locations, upgrades, events, and item definitions
- `scripts/simulate.js` - Automated game simulation and balance analysis
- `src/supabaseClient.js` - Supabase client setup
- `public/` - Static assets
- `index.html` - App entry point

## License

MIT
