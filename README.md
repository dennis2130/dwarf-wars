# Dwarf Wars

Dwarf Wars is a fantasy-themed trading and survival game built with React, Vite, Tailwind CSS, and Supabase. You play as a hero navigating a dangerous world, trading goods, upgrading your equipment, and trying to pay off your debt before time runs out!

## Features

- **Character Creation:** Choose your name, race (Human, Dwarf, Elf, Orc), and class (Merchant, Rogue, Warrior), each with unique bonuses and starting stats.
- **Trading System:** Buy and sell rations, potions, and gems at fluctuating prices across different locations.
- **Dynamic Locations:** Travel between unique locations (Royal City, Goblin Slums, Elven Forest, Iron Forge, Orc Badlands), each with their own price modifiers and risk levels.
- **Random Events:** Encounter random events like dragon attacks, theft, blessings, and market crashes that affect your health, gold, or prices.
- **Inventory & Upgrades:** Manage your inventory space and purchase upgrades (Pack Mule, Wagon, Shield, Mithril Mail) to increase carrying capacity or reduce damage from events.
- **Health & Survival:** Monitor your health and defense. If your health drops to zero, it's game over!
- **Debt System:** Start with a debt based on your class. Pay it off before the end of 31 days to maximize your score.
- **Leaderboard:** High scores are saved and displayed using Supabase backend.
- **Google Authentication:** Log in with Google to save and load characters and scores.

## Gameplay Overview

1. **Create Your Hero:** Enter a name, select a race and class. Each choice affects your stats:
	- **Races:**
	  - Human: +5 Inventory Slots
	  - Dwarf: +20 Health
	  - Elf: 5% Discount on Prices
	  - Orc: +10 Inventory, +10 Health, Start with Club (Damage Reduction)
	- **Classes:**
	  - Merchant: 500 Gold, 5000 Debt
	  - Rogue: 100 Gold, 2500 Debt
	  - Warrior: 100 Gold, 5000 Debt

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

- **Market Tab:** Buy and sell items.
- **Armory & Stables Tab:** Purchase upgrades.
- **Travel Button:** Move to a new location and trigger events.
- **Pay Debt:** Click on the "Pay" link next to your debt to pay it off.
- **Save Character:** (If logged in) Save your hero for future runs.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **Backend:** Supabase (for authentication, saved characters, and high scores)
- **Icons:** lucide-react

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

## Project Structure

- `src/App.jsx` - Main game logic and UI
- `src/gameData.js` - Game data: races, classes, locations, upgrades, events
- `src/supabaseClient.js` - Supabase client setup
- `public/` - Static assets
- `index.html` - App entry point

## License

MIT
