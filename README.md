# Dwarf Wars

Dwarf Wars is a fantasy-themed trading and survival game built with React, Vite, Tailwind CSS, and Supabase. You play as a hero navigating a dangerous world, trading goods, upgrading your equipment, and trying to pay off your debt before time runs out!



## Features

- **Character Creation:** Choose your name, race (Human, Dwarf, Elf, Orc), and class (Merchant, Rogue, Warrior), each with unique bonuses and starting stats.
- **Trading System:** Buy and sell a variety of items (rations, ale, potions, tools, scrolls, gems) at fluctuating prices across different locations.
- **Dynamic Locations:** Travel between unique locations (Royal City, Goblin Slums, Elven Forest, Iron Forge, Orc Badlands), each with their own price modifiers and risk levels.
- **Random Events:** Encounter random events including dragon attacks, encounters with city watch, goblin pickpockets, merchant blessings, found treasure, market crashes, and price surges that affect your health, gold, or prices.
- **Inventory & Upgrades:** Manage your inventory space and purchase upgrades including Pack Mule/Merchant Wagon (inventory expansion), Leather Jerkin/Chain Mail/Plate Armor (damage reduction), and class/race-specific weapons to increase carrying capacity, boost combat skills, or reduce damage taken. Consumables like the Elixir of Life restore 75% of your health.
- **Combat System:** Engage in dice-roll based combat encounters using the ScrambleDie mechanic. Purchase weapons (Dagger, Steel Sword, Mithril Axe) to increase your combat bonus and defeat enemies. Critical Successes (Nat 20s) deliver devastating blows with flavor text, while Critical Failures (Nat 1s) result in dramatic negative outcomes such as burnt inventory, maiming, or dragon fire.
- **Consumables:** Use special items like the Elixir of Life to restore health during your adventure.
- **Health & Survival:** Monitor your health and combat ability. If your health drops to zero, it's game over! Beware the **Bleed** mechanic: when your health drops below 25%, you take damage every time you travel.
- **Debt Interest:** Your debt compounds at 5% interest daily, so paying it off quickly is crucial to maximizing your final score.
- **Taxation Mechanic:** If your net worth exceeds 1 million gold, the City Watch will pursue you, triggering guard encounters.
- **Debt System:** Start with a debt based on your class. Pay it off before the end of 31 days to maximize your score.
- **Gamer Tags:** Set and customize your public gamer tag (3-15 characters, profanity filtered) to appear on leaderboards if you log in with Google.
- **Profanity Filtering:** Character names and gamer tags are validated against a profanity filter to keep the leaderboard clean.
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

## Upgrades System

Players can purchase permanent upgrades during gameplay to enhance inventory, defense, or combat abilities. Upgrades are distributed across three categories:

### Inventory Upgrades
- **Pack Mule:** +20 inventory slots for 1000 gold
- **Merchant Wagon:** +50 inventory slots for 3000 gold

### Defense Upgrades
- **Leather Jerkin:** -5 damage taken, 800 gold
- **Chain Mail:** -10 damage taken, 2000 gold
- **Plate Armor:** -20 damage taken (Warriors only), 5000 gold
- **Shadow Cloak:** -15 damage taken (Rogues only), 3500 gold

### Combat Upgrades (Weapons)
**Universal:**
- Iron Dagger: +2 combat (2000 gold)
- Steel Sword: +5 combat (2000 gold)
- Battle Axe: +8 combat (8000 gold)
- Mithril Axe: +10 combat (Warriors only, 10000 gold)

**Class-Specific:**
- Crossbow (Rogue): +5 combat, 3000 gold
- Great Sword (Warrior): +7 combat, 3000 gold
- Scrolls (Wizard): Frost Fingers (+2), Acid Arrow (+3), Fireball (+7)
- Master Lute (Bard): +6 combat, 4500 gold
- Staff (Monk): +6 combat, 4500 gold
- Whip (Merchant): +5 combat, 3000 gold

**Race-Specific:**
- Orcish Axe (Orc): +6 combat, 6000 gold
- Halfling Sling (Halfling): +4 combat, 1500 gold
- Kobold Spear (Kobold): +4 combat, 1500 gold

### Consumables
- **Elixir of Life:** Heals 75% of max health, 10000 gold

## Random Events System

The travel mechanic triggers random events that affect gameplay:

### Combat Events
- **Dragon Attack** - High damage encounter with massive loot on victory; Critical Successes cause double loot
- **Guard Encounter** - Triggered when net worth exceeds 1 million gold; difficulty scales with wealth
- **Goblin Mugger (Spin)** - Pickpocket event that steals 10% of current gold

### Positive Events
- **Cleric's Blessing (Johann)** - Restores 25 health to the player
- **Found Coin Purse** - Grants 200 gold

### Economy Events
- **Market Crash** - Prices drop to 50% for the day
- **Price Riot** - Prices surge to 200% for the day

### Flavor Events (Atmospheric)
- Heavy Rainstorm
- Bard Troupe Sings Your Exploits
- Ancient Dwarven Ruins
- Wolf Howl in Distance
- Broken Cart Wheel Repair

## Gameplay Overview

1. **Create Your Hero:** Enter a name (validated for profanity), select a race and class. Each choice affects your stats:
	- **Races (6 total):**
	  - Human: Inventory +20, Health +10, Combat +1 (Versatile)
	  - Dwarf: Health +40, Sell items for 10% more (Greedy Negotiator)
	  - Elf: Buy items for 15% less, Inventory +5, Health -10 (Charismatic)
	  - Orc: Inventory +40, Health +20, Combat +2, but pay 10% more and sell for 10% less (Intimidating)
	  - Kobold: Inventory +30, Health -20, Combat +5 vs Dragons (Dragon Servant)
	  - Halfling: Inventory +5, Health -15, Combat +5 vs Guards, Buy/Sell +5% (Slippery)
	- **Classes (6 total):**
	  - Merchant: 1000 Gold, 10000 Debt (Born to trade)
	  - Rogue: 300 Gold, 3000 Debt (Hidden in Shadows)
	  - Warrior: 600 Gold, 6000 Debt (Fighter)
	  - Bard: 600 Gold, 2000 Debt (Charismatic)
	  - Monk: 0 Gold, 0 Debt (Self-sufficient)
	  - Wizard: 1000 Gold, 6000 Debt (Arcane Power)

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

- **Frontend Framework:** React 19 with Hooks (useState, useEffect)
- **Build Tool:** Vite 7.2.4 with React plugin
- **Styling:** Tailwind CSS 3.4.17 with PostCSS and Autoprefixer
- **Backend & Database:** Supabase (PostgreSQL) for authentication, saved characters, leaderboards, game logs, and player profiles
- **Authentication:** Supabase Google OAuth integration
- **UI Icons:** lucide-react 0.563.0 (SVG-based icon library)
- **Profanity Filtering:** leo-profanity 1.9.0 (for name and gamer tag validation)
- **HTTP Client:** @supabase/supabase-js 2.94.1 for Supabase SDK
- **Environment Variables:** dotenv 17.2.3
- **Linting:** ESLint 9.39.1 with React Hooks and React Refresh plugins
- **Type Checking:** TypeScript types for React and React DOM

## Project Structure

The project is organized with a clear separation of concerns:

- **`src/App.jsx`** - Main application entry point and state management
- **`src/gameData.js`** - Game configuration: races, classes, locations, upgrades, events, and item definitions
- **`src/screens/`** - Main screen components for different game states:
  - `StartScreen.jsx` - Character creation, race/class selection, saved character loading, and dynamic leaderboard with time filters
  - `GameScreen.jsx` - Main gameplay loop with market/inventory tabs, travel mechanics, combat encounters, and event handling
  - `ProfileScreen.jsx` - User profile with lifetime statistics, game history, and gamer tag management
  - `GameOverScreen.jsx` - End-of-game summary with score calculation and database logging
  - `HelpScreen.jsx` - In-game guide explaining races, classes, controls, survival mechanics, and strategies
  - `GamerTagModal.jsx` - Modal for setting/editing player gamer tags with profanity validation
- **`src/components/`** - Reusable React components:
  - `StatsBar.jsx` - Displays player health, gold, inventory capacity, active location, day counter, and combat stats
  - `InventoryGrid.jsx` - Visual inventory management with item counts and price tracking
  - `MarketItem.jsx` - Individual tradeable item with buy/sell buttons and long-press support
  - `ScrambleDie.jsx` - Animated D20 dice roll component with combat result visualization
- **`src/hooks/`** - Custom React hooks:
  - `useLongPress.js` - Handles long-press interactions for continuous buy/sell actions with global event listeners to properly detect finger/mouse lift anywhere on screen
- **`src/utils.jsx`** - Icon mapping function (`getIcon()`) for all tradeable items and equipment
- **`src/supabaseClient.js`** - Supabase client initialization with environment variables
- **`scripts/simulate.js`** - Automated game simulator running thousands of games to analyze race/class balance, item values, and strategy effectiveness
- **`scripts/analyze_logs.js`** - Game log analyzer that processes database records to calculate statistics and identify balance issues
- **`scripts/check_upgrades.js`** - Upgrade availability validator that tests class/race requirements and bans for all upgrades

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
