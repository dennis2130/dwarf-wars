# Dwarf Wars

Dwarf Wars is a fantasy-themed trading and survival game built with React, Vite, Tailwind CSS, and Supabase. You play as a hero navigating a dangerous world, trading goods, upgrading your equipment, and trying to pay off your debt before time runs out!



## Features

- **Character Creation:** Choose your name, race (Human, Dwarf, Elf, Orc), and class (Merchant, Rogue, Warrior), each with unique bonuses and starting stats.
- **Trading System:** Buy and sell a variety of items (rations, ale, potions, tools, scrolls, gems) at fluctuating prices across different locations.
- **Dynamic Locations:** Travel between unique locations (Royal City, Goblin Slums, Elven Forest, Iron Forge, Orc Badlands), each with their own price modifiers and risk levels.
- **Random Events:** Encounter random events including dragon attacks, encounters with city watch, goblin pickpockets, merchant blessings, found treasure, market crashes, and price surges that affect your health, gold, or prices.
- **Inventory & Upgrades:** Manage your inventory space and purchase upgrades (Pack Mule, Wagon, weapons, and consumables) to increase carrying capacity, boost combat skills, or heal. New items and upgrades are available for purchase as you progress.
- **Combat System:** Engage in dice-roll based combat encounters using the ScrambleDie mechanic. Purchase weapons (Dagger, Steel Sword, Mithril Axe) to increase your combat bonus and defeat enemies. Critical Successes (Nat 20s) deliver devastating blows with flavor text, while Critical Failures (Nat 1s) result in dramatic negative outcomes such as burnt inventory, maiming, or dragon fire.
- **Consumables:** Use special items like the Elixir of Life to restore health during your adventure.
- **Health & Survival:** Monitor your health and combat ability. If your health drops to zero, it's game over! Beware the **Bleed** mechanic: when your health drops below 25%, you take damage every time you travel.
- **Debt Interest:** Your debt compounds at 5% interest daily, so paying it off quickly is crucial to maximizing your final score.
- **Taxation Mechanic:** If your net worth exceeds 1 million gold, the City Watch will pursue you, triggering guard encounters.
- **Debt System:** Start with a debt based on your class. Pay it off before the end of 31 days to maximize your score.
- **Profanity Filtering:** Character names are validated against a profanity filter to keep the leaderboard clean.
- **Smart Max Button:** Intelligently buy or sell the maximum amount of an item based on your gold, inventory space, and stock availability.
- **Game Session Logging:** All game sessions are logged to the database, including player stats, upgrades acquired, and cause of death for analytics and balance improvements.
- **Dynamic Leaderboard:** High scores are saved and displayed with multiple time-period filters: Daily (past 24 hours), Weekly (past 7 days), Monthly (past 30 days), and All Time rankings using Supabase backend.
- **Google Authentication:** Log in with Google to save and load characters and scores.
- **User Profile Page:** View your lifetime statistics including total runs, lifetime profit, personal best score, deaths, dragons killed, and recent game history.
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
  - **Buy Button:** Purchase one item per click or hold to buy repeatedly.
  - **Sell Button:** Sell one item per click or hold to sell repeatedly.
  - **MAX Button:** Intelligently buys or sells the maximum amount based on your available gold, inventory space, or current stock.
- **Armory & Stables Tab:** Purchase upgrades (inventory, weapons, consumables).
- **Travel Button:** Move to a new location and trigger events.
- **Combat Encounters:** Roll a D20 die with your combat bonus and attempt to defeat enemies. The ScrambleDie animates the outcome.
- **Pay Debt:** Click on the "Pay" link next to your debt to pay it off.
- **Leaderboard Filters:** On the start screen, view the global leaderboard filtered by time period:
  - **Today:** Top scores from the past 24 hours
  - **Week:** Top scores from the past 7 days
  - **Month:** Top scores from the past 30 days
  - **All Time:** Top scores since the game launched
- **Save Character:** (If logged in) Save your hero for future runs.
- **My Profile:** (If logged in) View your lifetime statistics, personal achievements, and recent game history.
- **Exit/Restart:** Use the in-game option to exit your current run and start over.
- **Help/Guide:** Click the Help button to view the in-game guide explaining races, classes, controls, and advanced mechanics like Bleed and Guard encounters.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **Backend:** Supabase (for authentication, saved characters, and high scores)
- **Icons:** lucide-react
- **Profanity Filtering:** leo-profanity
- **Dice Rolling:** Custom ScrambleDie component for combat rolls

## Project Structure

The project is organized with a clear separation of concerns:

- **`src/App.jsx`** - Main application entry point and state management
- **`src/gameData.js`** - Game configuration: races, classes, locations, upgrades, events, and item definitions
- **`src/screens/`** - Main screen components for different game states:
  - `StartScreen.jsx` - Character creation and hero selection
  - `GameScreen.jsx` - Main gameplay screen with trading and adventure mechanics
  - `ProfileScreen.jsx` - User profile and lifetime statistics
  - `GameOverScreen.jsx` - Game over and score display
  - `HelpScreen.jsx` - In-game help and game guide displaying races, classes, and mechanicsexplanations
- **`src/components/`** - Reusable React components:
  - `StatsBar.jsx` - Displays player health, gold, inventory, and active effects
  - `InventoryGrid.jsx` - Visual inventory management and item display
  - `MarketItem.jsx` - Individual market item in the trading interface
  - `ScrambleDie.jsx` - Animated dice roll component for combat encounters
- **`src/hooks/`** - Custom React hooks:
  - `useLongPress.js` - Handles long-press interactions for continuous buy/sell actions with global event listeners to properly detect finger/mouse lift anywhere on screen
- **`src/utils.jsx`** - Utility functions for icon mapping and other helpers
- **`src/supabaseClient.js`** - Supabase client configuration and initialization
- **`scripts/simulate.js`** - Automated game simulation script for balance testing
- **`scripts/analyze_logs.js`** - Log analysis utility for game statistics

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

## License

MIT
