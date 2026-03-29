# Dwarf Wars

Dwarf Wars is a fantasy-themed trading and survival game built with React, Vite, Tailwind CSS, and Supabase. You play as a hero navigating a dangerous world, trading goods, upgrading your equipment, and trying to pay off your debt before time runs out!



## Recent Update

### v1.1.7 - 2026-03-29

**Major Updates:**
- **Character Sheet Modal:** Click your player name to open a comprehensive Character Sheet displaying all active modifiers from your race, class, equipment, and elixirs in one place. Shows modifier breakdown with consistent color-coding by source.
- **Buy/Sell Mod Fixes:** Fixed inverted percentage sign display (now correctly shows +5% as +5% instead of -5%). Character Sheet now displays base price → adjusted price to clearly show the economic benefit of your modifiers.
- **Market Price Accuracy:** Market prices now correctly apply all Buy/Sell Mods from race, class, and equipped elixirs combined, giving you accurate pricing for actual trading costs.
- **Alchemist Shop Overhaul:** New dedicated Alchemist tab in the marketplace featuring elixir items with targeted stat bonuses (Combat, Inventory, Intelligence, Wisdom, Charisma, Dexterity, Stealth, Constitution, Health, Defense, plus Buy/Sell Mod effects).
- **Thematic Icon System:** Alchemist items now display thematic icons—beakers for liquid potions and sparkles for dust/powder items—making it easy to visually distinguish item types at a glance.
- **Wizard Class Discount:** Wizards now receive a 3% discount on all Alchemist shop items. Discount is displayed in the Character Sheet legend and Help screen for easy reference.
- **Enhanced Mod Display:** Buy/Sell Mod cards now show real gem prices from the current market with explicit base → adjusted calculation, revealing the exact gold benefit of your modifiers.
- **C3 Encounter Fixes:** Fixed encounter text display (no more '+-' prefixes) and fixed encounter name placeholders to show actual player names instead of raw c3_player_name values.
- **Full Stat Infrastructure:** All races and classes now carry bonuses for all seven roll stats — `combat`, `wisdom`, `intelligence`, `charisma`, `dexterity`, `constitution`, and `stealth`.

**New Elixir Items (Alchemist Shop):**
- **Dragonscale Draught:** +5 Combat, +2 Defense - 150,000g (Liquid - Beaker)
- **Philosopher's Stone Dust:** +4 Intelligence, +2 Wisdom, +1 Charisma - 140,000g (Powder - Sparkles)
- **Merchant's Windfall:** +5% Buy Discount, +3% Sell Bonus - 180,000g (Powder - Sparkles)
- **Void-touched Dust:** +4 Stealth, +2 Dexterity, +1 Intelligence - 140,000g (Powder - Sparkles)
- **Vitality Nectar:** +5 Health, +3 Constitution - 130,000g (Liquid - Beaker)
- **Feline's Grace Oil:** +4 Dexterity, +2 Charisma, +1 Wisdom - 140,000g (Liquid - Beaker)
- **Siren's Pearl Powder:** +4 Charisma, +2 Wisdom, +1 Intelligence - 140,000g (Powder - Sparkles)


### v1.1.6 - 2026-03-12

- **Character Creation:** Select your race (Human, Dwarf, Elf, Orc, Kobold, Halfling) and class (Merchant, Rogue, Warrior, Bard, Monk, Wizard), each with unique bonuses and starting stats.
- **Trading System:** Buy and sell a variety of items (rations, ale, potions, tools, scrolls, gems) at fluctuating prices across different locations with accurate pricing that factors in all your buying/selling modifiers.
- **Trading Modifiers:** Build and customize your economic bonuses through race, class, and equipped elixir combinations. Buy Mod and Sell Mod effects stack, letting you create builds optimized for buying cheap or selling expensive.
- **Character Sheet:** Click your player name to view a comprehensive Character Sheet showing all active modifiers from race, class, equipment, and elixirs. Buy/Sell Mod cards show real gem prices with explicit base → adjusted calculations to demonstrate your modifier impact.
- **Elixir System:** Purchase targeted stat potions from the Alchemist shop with effects ranging from combat bonuses to economic modifiers. Elixirs stack multiplicatively for synergistic builds. Wizards enjoy a 3% discount on all Alchemist items.
- **Dynamic Locations:** Travel between unique locations (Royal City, Goblin Slums, Elven Forest, Iron Forge, Orc Badlands), each with their own price modifiers and risk levels.
- **Random Events:** Encounter random events including dragon attacks, encounters with city watch, goblin pickpockets, merchant blessings, found treasure, market crashes, and price surges that affect your health, gold, or prices.
- **Expanded Event Pool:** Channel 3 checks and new monster encounters add more high-variance narrative events with explicit fail, success, crit fail, and crit success outcomes.
- **Inventory & Upgrades:** Manage your inventory space and purchase upgrades including Pack Mule/Merchant Wagon (inventory expansion), Leather Jerkin/Chain Mail/Plate Armor (damage reduction), and class/race-specific weapons to increase carrying capacity, boost combat skills, or reduce damage taken. Consumables like the Elixir of Life and Jonah's Glass of Milk restore health and provide stat bonuses.
- **Smart Trade Validation:** The system intelligently tracks actual trades, only counting successful transactions toward your daily trading count. Failed purchases due to insufficient funds or inventory space don't incorrectly mark the day as "traded."
- **Combat System:** Engage in dice-roll based combat encounters using the ScrambleDie mechanic. Purchase weapons (Dagger, Steel Sword, Mithril Axe) to increase your combat bonus and defeat enemies. Critical Successes (Nat 20s) deliver devastating blows with flavor text, while Critical Failures (Nat 1s) result in dramatic negative outcomes such as burnt inventory, maiming, or dragon fire.
- **Consumables:** Use special items like the Elixir of Life and Jonah's Glass of Milk to restore health and gain stat bonuses during your adventure.
- **Health & Survival:** Monitor your health and combat ability. If your health drops to zero, it's game over! Beware the **Bleed** mechanic: when your health drops below 25%, you take damage every time you travel.
- **Debt Interest:** Your debt compounds at 5% interest daily, so paying it off quickly is crucial to maximizing your final score.
- **Taxation Mechanic:** If your net worth exceeds 1 million gold, the City Watch will pursue you, triggering guard encounters.
- **Debt System:** Start with a debt based on your class. Pay it off before the end of 31 days to maximize your score.
- **Gamer Tags:** Set and customize your public gamer tag (3-15 characters, profanity filtered) to appear on leaderboards if you log in with Google.
- **Profanity Filtering:** Gamer tags are validated against a profanity filter to keep the leaderboard clean.
- **Smart Max Button:** Intelligently buy or sell the maximum amount of an item based on your gold, inventory space, and stock availability.
- **Game Session Logging:** All game sessions are logged to the database, including player stats, upgrades acquired, and cause of death for analytics and balance improvements.
- **Dynamic Leaderboard:** High scores are saved and displayed with multiple time-period filters: Daily (past 24 hours), Weekly (past 7 days), Monthly (past 30 days), and All Time rankings using Supabase backend.
- **Google Authentication:** Log in with Google to save and load characters and scores.
- **Channel 3 Integration:** Seamlessly play via Channel 3's in-game browser with automatic account linking. Profiles are automatically created and linked using Channel 3 user data, with profile migration support for existing Gamer Tags.
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
- **Jonah's Glass of Milk:** +2 to Combat Roll, +20 Inventory, 200000 gold

### Alchemist Shop (Elixirs)
Elixir potions provide targeted stat bonuses and can be stacked to create synergistic builds. Each elixir is a permanent upgrade for your current run.

**Liquid Elixirs (Beaker Icon):**
- **Dragonscale Draught:** +5 Combat, +2 Defense - 150,000 gold
- **Vitality Nectar:** +5 Health, +3 Constitution - 130,000 gold
- **Feline's Grace Oil:** +4 Dexterity, +2 Charisma, +1 Wisdom - 140,000 gold

**Dust & Powder Elixirs (Sparkles Icon):**
- **Philosopher's Stone Dust:** +4 Intelligence, +2 Wisdom, +1 Charisma - 140,000 gold
- **Void-touched Dust:** +4 Stealth, +2 Dexterity, +1 Intelligence - 140,000 gold
- **Siren's Pearl Powder:** +4 Charisma, +2 Wisdom, +1 Intelligence - 140,000 gold
- **Merchant's Windfall:** +5% Buy Discount, +3% Sell Bonus - 180,000 gold

**Wizard Class Benefit:**
Wizards receive a 3% discount on all Alchemist shop items, making powerful elixir builds more accessible to spellcasters.

## Random Events System

The travel mechanic triggers random events that affect gameplay:

### Combat Events
- **Dragon Attack** - High damage encounter with massive loot on victory; Critical Successes cause double loot
- **Guard Encounter** - Triggered when net worth exceeds 1 million gold; difficulty scales with wealth
- **Goblin Mugger (Spin)** - Pickpocket event that steals 10% of current gold

### Skill Check Events
- Ability checks that test your character's chosen stat (combat, wisdom, etc.)
- Roll a D20 and add your bonus vs a difficulty check (DC)
- Critical Successes (Nat 20) and Critical Failures (Nat 1) with dramatic outcomes
- Channel 3 check events now use more consistent narrative voice and clearer success, fail, crit success, and crit fail result text

### Monster Encounters
- A new set of D&D-inspired encounters expands the event database with monsters such as goblins, trolls, basilisks, vampires, hydras, liches, necromancers, and beholders
- Each monster encounter is configured with explicit fail, success, crit fail, and crit success branches for easier balancing and clearer tuning
- Rewards and penalties use the same normalized event-effect structure as the rest of the database-backed event system

### Unified Event Modal
- **Single Component for All Checks**: EventModal handles both combat and skill check events with dynamic theming
  - Combat events display with red styling and a sword icon
  - Skill checks display with blue styling and a target icon
- **Sophisticated Roll System**: Uses cryptographic randomization for fair D20 rolls with real-time dice animation
- **Outcome-Based Effects**: Dynamic text and game state changes based on success/failure with visual feedback
- **Racial & Class Bonuses**: Combat and check bonuses factored in automatically (e.g., Kobolds get +5 vs Dragons, Halflings get +5 vs Guards)
- **Transparent Modifier Breakdown**: Every modal — combat, skill check, and C3 encounter — displays the full list of bonuses that contributed to the roll, so players always know where their bonus came from
- **Explicit Roll Math**: The result line shows the complete calculation: *Rolled X + Bonus Y = Z*, making successes and failures easy to reason about
- **All-Stat Check Support**: The roll engine resolves modifiers for all seven character stats (`combat`, `wisdom`, `intelligence`, `charisma`, `dexterity`, `constitution`, `stealth`), enabling events that challenge any attribute

### Positive Events
- **Cleric's Blessing (Johann)** - Restores 25 health to the player
- **Found Coin Purse** - Grants 2000 gold

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

1. **Create Your Hero:** Select a race and class. Each choice affects your stats:
	- **Races (6 total):**
	  - Human: Inventory +20, Health +10, Combat +1 (Versatile)
	  - Dwarf: Health +40, Sell items for 10% more (Greedy Negotiator)
	  - Elf: Buy items for 15% less, Inventory +5, Health -10 (Charismatic)
	  - Orc: Inventory +40, Health +20, Combat +2, but pay 10% more and sell for 10% less (Intimidating) *(Recently rebalanced for improved viability)*
	  - Kobold: Inventory +30, Health -20, Combat +5 vs Dragons (Dragon Servant)
	  - Halfling: Inventory +5, Health -15, Combat +5 vs Guards, Buy/Sell +5% (Slippery)
	- **Classes (6 total):**
	  - Merchant: 1500 Gold, 10000 Debt (Born to trade) 
	  - Rogue: 900 Gold, 3000 Debt (Hidden in Shadows)
	  - Warrior: 1000 Gold, 5000 Debt (Fighter)
	  - Bard: 600 Gold, 2000 Debt (Charismatic)
	  - Monk: 0 Gold, 0 Debt (Self-sufficient)
	  - Wizard: 1000 Gold, 8000 Debt (Arcane Power) — *Special: 3% discount on Alchemist shop items*
	- **Trading Statistics:** Each class now carries buy/sell modifiers that affect market pricing:
	  - **Buy Mod:** Affects the price you pay when purchasing items (positive = discount, negative = premium)
	  - **Sell Mod:** Affects the price you receive when selling items (positive = bonus, negative = penalty)
	  - These modifiers can be further enhanced by race bonuses and equipped elixirs like Merchant's Windfall
	- **Full Stat Infrastructure:** Every race and class now carries values for all seven roll stats — `combat`, `wisdom`, `intelligence`, `charisma`, `dexterity`, `constitution`, and `stealth`. Currently all new stats are `0` (no gameplay effect), but the system is ready for per-build bonuses to any check type in a future balance pass.

2. **Trade & Survive:**
	- Buy low, sell high! Prices change with each location and event.
	- Manage your inventory and gold carefully.
	- **Strategic Trading:** Each day, you must choose between:
	  - **Staying Put (Work):** Make no trades, earn 50-200g from odd jobs, heal slightly, and use events to your advantage. Useful when you're low on health or scouting market conditions.
	  - **Active Trading:** Buy and sell items, then you're forced to travel to a new location. More risk, more reward potential.
	- Remember: **Debt interest (5%) compounds daily**, regardless of your action, so paying off your starting debt early maximizes your final score.
	- Use the "Pay" link next to your debt to pay it off whenever possible.
	- Travel to new locations to find better prices and opportunities, but be aware of location-specific risks.

3. **Upgrade:**
	- Buy upgrades to increase inventory or defense.
	- Upgrades are permanent for your current run.

4. **Game End & Winning:**
	- The game runs for exactly **31 days**. On day 31, you cannot work or travel further—the game immediately ends.
	- The game also ends instantly if your **health drops to zero** (from combat, bleed damage, or events).
	- **Victory Condition:** You must pay off your **entire debt** to achieve victory. If you have debt remaining on day 31 (or when you die), you lose regardless of how much gold you've accumulated.
	- Your **final score = Gold Remaining - Outstanding Debt**. Only positive scores (debt fully paid) count as victories.
	- **Strategic Note:** Since debt compounds at 5% daily for 31 days, paying it off early is heavily rewarded. For example, starting with 5000 debt, you must pay more each day as interest accumulates.
	- Different end-game scenarios unlock based on your final state (victory with no debt, death with paid debt, bankruptcy, etc.), each with unique flavor narratives.
	- All game sessions are logged to the database for analytics, and victories are saved to the global leaderboard if you're logged in.


## Controls

- **Character Sheet:** Click your player name in the top-left header to open your Character Sheet, which displays:
  - All active modifiers from your race, class, equipment, and equipped elixirs
  - Buy/Sell Mod cards showing real gem prices from the current market with explicit calculations
  - Color-coded modifier sources (purple=Race, blue=Class, orange=Equipment, green=Elixir)
  - Equipment list and active consumable effects
  - Special class abilities (e.g., Wizard's 3% Alchemist discount)
- **Market Tab:** Buy and sell items. Long-press the buy/sell buttons to continuously purchase or sell items.
  - **Market Prices:** Now correctly apply all Buy/Sell Mods from your race, class, and equipped elixirs for accurate trading costs
  - **Buy Button:** Purchase one item per click. Long-press for continuous buying.
  - **Sell Button:** Sell one item per click. Long-press for continuous selling.
  - **MAX Button:** Buy the maximum amount based on your available gold and inventory space.
  - **ALL Button:** Sell all items of a type instantly.
  - **Profit Color Coding:** Sell prices turn green if selling above your average cost, red if below.
  - **Improved UX:** Long-press interactions now have optimized delays for smoother, more responsive button feedback.
- **Armory Tab:** Purchase permanent upgrades (inventory, weapons, defense, consumables).
- **Alchemist Tab:** Purchase elixir potions with targeted stat bonuses. Elixirs are permanent for your current run and stack with each other.
  - **Liquid Elixirs:** Display beaker icons (differently colored for quick visual identification)
  - **Dust/Powder Elixirs:** Display sparkles icons for easy visual distinction
  - **Wizard Discount:** Wizards pay 3% less on all Alchemist items
  - **Multi-Stat Bonuses:** Most elixirs provide 2-3 different stat boosts, enabling synergistic builds
- **Work & Travel Mechanics:** The primary action button adapts based on your trading activity:
  - **Work Mode (No Trades Today):** If you haven't bought or sold items during the current day, clicking "Work & Travel" keeps you in the current location. You earn 50-200 gold from odd jobs and may encounter random events. This is useful for healing up or making quick gold.
  - **Travel Mode (After Trading):** Once you've made any buy or sell transaction, the button changes to "Travel to New Location." You'll move to a random new city, earn no wages, and encounter random events. Debt interest (5%) is applied immediately on each action (whether Work or Travel), and the day counter increments.
  - **Final Day:** On day 31, the button becomes "Time to End Your Adventure" in golden yellow, triggering the game-over sequence immediately.
- **Combat & Skill Checks:** When triggered, a unified modal appears for combat encounters, skill checks, and Channel 3 events.
  - Roll a D20 die using cryptographic randomization with your character's bonus applied.
  - A modifier breakdown panel lists every bonus contributing to your roll (race, class, upgrades, situational bonuses).
  - The result line shows the full equation: *Rolled X + Bonus Y = Z*.
  - For combat: Combat stats + racial bonuses (Kobolds +5 vs Dragons, Halflings +5 vs Guards).
  - For skill checks: The relevant stat (wisdom, charisma, stealth, etc.) is used automatically based on the event configuration.
  - Success/Failure determined by comparing roll total against difficulty check (DC).
  - Critical Successes (Nat 20) and Critical Failures (Nat 1) with dramatic outcomes and special effects.
  - For combat only: "Run Away" button to flee with a 10 HP penalty. The ScrambleDie animates the outcome.
- **Bleed Mechanic:** When your health drops below 25% of maximum, you take 5 damage each time you Work or Travel. This stacking penalty can quickly lead to death, so healing becomes critical at low health.
- **Pay Debt:** Click on the "Pay" link next to your debt to pay it off.
- **Leaderboard Filters:** On the start screen, view the global leaderboard filtered by time period:
  - **Today:** Top scores from the past 24 hours
  - **Week:** Top scores from the past 7 days
  - **Month:** Top scores from the past 30 days
  - **All Time:** Top scores since the game launched
- **My Profile:** (If logged in) View your lifetime statistics including:
  - **Total Runs:** Number of completed attempts (excludes restarts and reset sessions)
  - **Lifetime Profit:** Total gold earned across all games minus total debt paid
  - **Personal Best:** Your highest single-game score
  - **Deaths:** Total number of times you've lost a game
  - **Dragon Heads:** Total dragons defeated across all runs
  - **Personal Build Breakdown:** Tabbed performance breakdown showing how your runs have gone split by Race, Class, and Race/Class Combination. Each row shows:
    - Run count, average score, and win rate
    - Sub-row with best score, worst score, and bankrupt rate
    - Reset and restart runs are excluded so stats reflect genuine play
  - **Recent Game History:** Last 10-15 games with scores, race/class, and outcomes (displayed below the build breakdown)
- **Exit/Restart:** Use the in-game option to exit your current run and start over.
- **Help/Guide:** Click the Help button to view the in-game guide explaining races, classes, controls, advanced mechanics like Bleed and Guard encounters, and special class abilities (e.g., Wizard's Alchemist discount).

## Tech Stack

- **Frontend Framework:** React 19 with Hooks (useState, useEffect)
- **Build Tool:** Vite 7.2.4 with React plugin
- **Styling:** Tailwind CSS 3.4.17 with PostCSS and Autoprefixer
- **Backend & Database:** Supabase (PostgreSQL) for authentication, saved characters, leaderboards, game logs, and player profiles
- **Authentication:** Supabase Google OAuth integration + Channel 3 In-Game Browser API support with automatic profile linking
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
  - `StartScreen.jsx` - Race/class selection, dynamic leaderboard with time filters, and login interface
  - `GameScreen.jsx` - Main gameplay loop with market/inventory tabs, travel mechanics, combat encounters, and event handling
  - `ProfileScreen.jsx` - User profile with lifetime statistics, personal build breakdown (Race/Class/Combinations tabs with win rate and avg score), game history, and gamer tag management
  - `GameOverScreen.jsx` - End-of-game summary with score calculation and database logging
  - `HelpScreen.jsx` - In-game guide explaining races, classes, controls, survival mechanics, and strategies
  - `GamerTagModal.jsx` - Modal for setting/editing player gamer tags with profanity validation
- **`src/components/`** - Reusable React components:
  - `StatsBar.jsx` - Displays player health, gold, inventory capacity, active location, day counter, and combat stats
  - `InventoryGrid.jsx` - Visual inventory management with item icons, count displays, and dynamic full-inventory warning
  - `ModifiersModal.jsx` - Character Sheet modal displaying all active modifiers from race, class, equipment, and elixirs with color-coded sources. Shows Buy/Sell Mod gem price impact and special class abilities.
  - `MarketItem.jsx` - Tradeable item display with MAX/ALL buttons for bulk transactions, profit color coding (green for profit, red for loss), and compact layout. Single-click buy/sell is active; long-press hold-to-repeat is currently disabled.
  - `EventModal.jsx` - Unified event handler for combat, skill checks, and C3 events with animated D20 dice rolls, outcome-based effects, and dynamic theming (red for combat, blue for checks). Displays a full modifier breakdown for every event type and shows explicit roll math (Rolled X + Bonus Y = Z)
  - `ScrambleDie.jsx` - Animated D20 dice roll component with combat result visualization
- **`src/hooks/`** - Custom React hooks:
  - `useLongPress.js` - Handles long-press interactions for continuous buy/sell actions with global event listeners to properly detect finger/mouse lift anywhere on screen
- **`src/utils.jsx`** - Icon mapping function (`getIcon()`) for all tradeable items, equipment, and elixirs with thematic icons:
  - Equipment: weapons, armor, and tools with appropriate icons
  - Consumables: beakers for liquid elixirs (Dragonscale Draught, Vitality Nectar, Feline's Grace Oil)
  - Dust/Powder elixirs: sparkles icons for Philosopher's Stone, Void-touched Dust, Siren's Pearl, Merchant's Windfall
  - Marketplace items: gems, potions, rations, etc.
- **`src/supabaseClient.js`** - Supabase client initialization with environment variables
- **`src/tools/`** - Development tools:
  - `event_manager.jsx` - Event management interface for creating, editing, and testing game events with form-based configuration and JSON preview
- **`scripts/simulate.js`** - Automated game simulator running thousands of games to analyze race/class balance, item values, and strategy effectiveness
- **`scripts/analyze_logs.js`** - Comprehensive game log analyzer that processes database records to generate three performance analysis tables:
  - **Race Balance:** Runs, average score, and death rate breakdown by race for meta analysis
  - **Class Balance:** Performance metrics by class to identify over/underperforming classes
  - **Race/Class Combos (Top 15):** Ranked combinations with detailed statistics for build viability analysis
  - **Quit Filtering:** Automatically excludes Quit (Menu) and Quit (Restart) games for accurate completion-based statistics
  - **Secure Access:** Uses SERVICE_ROLE_KEY to bypass RLS policies for complete data visibility
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

## Channel 3 Integration

Dwarf Wars provides seamless integration with Channel 3's in-game browser platform, including automatic account linking and profile management:

- **Automatic Authentication:** When accessed via Channel 3 (hostname includes `channel3.gg`), the game automatically fetches user data from the Channel 3 API endpoint `/api/me` and initiates the authentication flow.
- **Smart Profile Linking:** On first login via Channel 3:
  1. The app checks if a profile exists using the Channel 3 user ID
  2. If not found, it searches for a profile by Gamer Tag to support legacy accounts and enable seamless migration
  3. If a match is found, the profile is linked to the Channel 3 ID for future logins
  4. If no profile exists, a new one is created and automatically linked
- **Profile Image Support:** Channel 3 user profile images are automatically retrieved and stored for display in user profiles and leaderboards.
- **Anonymous Session Support:** Channel 3 users are given anonymous Supabase sessions to enable game session logging, leaderboard functionality, and cross-platform statistics tracking.
- **Post-Game Stats Submission:** Game session data is automatically submitted to Channel 3's analytics endpoint (`/api/postgamestats`) after each game concludes, enabling Channel 3-side statistics tracking and integrations.
- **Profile Ownership:** When accessed from Channel 3, the Gamer Tag modal is suppressed to respect Channel 3's own profile management.

To deploy to Channel 3, ensure the application hostname resolves correctly and the `/api/me` and `/api/postgamestats` endpoints are available in your Channel 3 environment. Set the required Vite environment variables: `VITE_C3_BOSS_ID`, `VITE_C3_CHEAT_CODE`, and `VITE_C3_GAME_ID`.

## Development Tools

### Event Manager (Development Only)

The Event Manager is a powerful development tool for creating, editing, and testing game events. It's accessible only in development mode and appears as a 🔧 button on the start screen.

**Features:**
- **Event List:** Browse all events in the database with filtering by type and active status
- **Create New Events:** Build new events from scratch with a guided form interface
- **Event Configuration Form:** Define event properties including:
  - Slug, type, and description text
  - Risk weighting for random event pool selection
  - Requirements (net worth, debt status, day constraints)
  - Outcome configurations for success/failure/crit scenarios
  - Effect definitions (gold, health, items, inventory changes, and max inventory adjustments)
- **JSON Editor:** View and edit raw event JSON with real-time validation
- **Supabase Integration:** All events persist to the database and are immediately available in-game
- **Live Testing:** Create events and test them immediately in the next game session

### Event Viewer

The Event Viewer is a read-only audit tool for inspecting the live Supabase event catalog.

**Features:**
- Search by slug or event text
- Filter by event type, activation state, and constraint patterns such as c3, debt-gated, or day-gated events
- Sort by slug, type, activation status, or difficulty
- Review formatted outcomes and constraints without digging through raw JSON

**Access:** 
- Run `npm run dev` to start in development mode
- Click "🔧 Event Manager" button on the start screen
- Tool is hidden in production builds

## Simulator

You can run a simulation of 1,000+ games to analyze balance and strategies:

```sh
node scripts/simulate.js
```

The simulator will output statistics on win rates, score distribution, and balance for races and classes. You can modify the script to test different strategies or item values.

## License

MIT
