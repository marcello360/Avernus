# Avernus Hex Crawler

A small web app designed to help DMs running the Alexandrian Remix of the Descent into Avernus campaign by providing an interactive hex crawling tool for tracking travel and encounters.

Alexandrian Remix:
https://thealexandrian.net/wordpress/44214/roleplaying-games/remixing-avernus

Avernian Hexcrawl:
https://thealexandrian.net/wordpress/46140/roleplaying-games/remixing-avernus-part-7-exploring-avernus

## Features

- **Hex Selection**: Choose from a list of hexes representing the Avernus map
- **Terrain Information**: View terrain descriptions, navigation DCs, and travel speed modifiers
- **Weather System**: Toggle between typical and clear weather conditions, with an option to roll 1d6 within the app 
- **Visibility System**: Dynamically displays visible landmarks based on weather conditions
- **Watch Management**: Track active, rest, and travel watches with associated condition rolls
- **Random Encounters**: Roll for random encounters from a consolidated list of Alexandrian encounter tables
- **Encounter Management**: View detailed encounter information and roll for creature allegiances
- **Environmental Conditions**: Roll for and track oppressive environmental conditions
- **Special Locations**: View information about keyed locations within each hex
- **Location Visibility**: Hide/show locations in hexes with the ability to persist these settings
- **River Styx Tracking**: Toggle for following the River Styx, enabling special encounter types
- **Persistent State**: Automatically saves session state locally
- **Dark Mode Support**: Toggle between light and dark themes
- **Mobile-Responsive Design**: Works on desktop and mobile devices
- **Toast Notifications**: Real-time feedback for dice rolls and system actions

## Usage Guide

### Basic Navigation

1. Select a hex from the dropdown menu to view its terrain information
2. The quick reference bar at the top displays:
   - Forage DC: Difficulty for foraging checks
   - Navigation DC: Difficulty for navigation checks
   - Road/Trail Speed: Movement modifier when following roads or trails
   - Trackless Speed: Movement modifier when going off-road

### Weather Management

- Use the "Weather" dropdown to select between "Typical" and "Clear" weather
- Click "Roll for Weather" to randomly determine weather conditions (1d6 chance for clear)
- Weather affects visibility range and which features can be seen from the current hex

### Watch System

1. Select a watch type (Rest or Travel/Exploration)
2. Click "Roll for Watch" to determine if an oppressive condition or encounter occurs
3. If a condition triggers (1d6 chance), the app automatically rolls to determine which specific condition applies
4. Toggle "Maintain Condition" to track ongoing conditions until they expire. This toggles automatically, but users can toggle persistent conditions off in specific circumstances (like sheltered watches or new hexes)

### Special Features

- **Restricted Hexes**: Plains of Fire hexes (D5, E5, F5) automatically force typical weather
- **Feature Visibility**: Mountains, volcanoes, and special landmarks (like C4, Pillar of Skulls) in nearby hexes are displayed based on weather conditions
- **Location Cards**: Important locations within each hex are displayed as collapsible cards with hide/show functionality
- **Encounter System**: 
  - View detailed encounter information including creature reactions and distances
  - Roll for creature allegiance (determine if creatures are aligned with warlords or other factions)
  - Encounters persist between sessions
  - Different encounter types (normal, environmental, Styx, designed, warlord) with color coding
- **Toast Notifications**: Pop-up feedback for dice rolls and system events

## Technical Implementation

The application is built using vanilla JavaScript with a modular approach:

- **main.js**: Core application logic and state management
- **ui.js**: UI rendering and interaction handling
- **supabase.js**: Database connectivity and data fetching
- **hexmath.js**: Hex grid calculations and neighbor determination

State persistence is handled through localStorage, allowing users to close and reopen the app while maintaining:
- Selected hex and weather conditions
- Active environmental effects and conditions
- Encounter history and details
- Location visibility preferences
- UI preferences (dark/light mode)
- River Styx following status
  
## License

This tool is intended for personal use. The content related to Dungeons & Dragons and Baldur's Gate: Descent into Avernus is property of Wizards of the Coast. Direct links and images to 3rd party sources (barring thealexandrian.net) have been scrubbed and must be referenced manually. 
