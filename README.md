# Avernus Hex Crawler

A small web app designed to help DMs running the Avernian Hexcrawl from the Alexandrian Remix of the Descent into Avernus campaign. It you to quickly generate encounters, track locations, and manage environmental conditions based on hex grid movement.

Alexandrian Remix:
https://thealexandrian.net/wordpress/44214/roleplaying-games/remixing-avernus

Avernian Hexcrawl:
https://thealexandrian.net/wordpress/46140/roleplaying-games/remixing-avernus-part-7-exploring-avernus

## How to Use

### Basic Navigation

1. **Select a Hex**: Choose a hex from the dropdown menu at the top of the page.
2. **Set Weather**: Choose between "Typical" or "Clear" weather (or click "Roll for Weather" to randomly determine).
3. **Select Watch Type**: Choose between "Travel" (also selected for scouting actions) or "Rest" (skips Tracks or Lair encounters).
4. **Roll for Watch**: Click this button to generate appropriate encounters, conditions, and location for your current hex.

### Special Features

- **Dark Mode**: Toggle the moon/sun icon in the top-right corner to switch between light and dark mode.
- **Following Landmarks**: 
  - Check "Following Styx" when traveling along the River Styx (automatically reveals Styx locations)
  - Check "Following Pit of Shummrath" when traveling this route (automatically reveals Shummrath locations)
  - Note: You cannot follow both simultaneously
- **Exploration Mode**: When checked, encounters are twice as likely and locations are twice as likely to appear.
- **Maintain Condition**: When checked, the active Oppressive Condition will remain until a Watch Roll deactivates it.
- **Reveal All Locations**: Shows all points of interest in the current hex.

### Understanding the Results

- **Hex Reference**: Shows foraging DC, navigation DC, and movement speed modifiers for your selected Hex.
- **Visibility Card**: Shows visible landmarks for the selected hex based on the weather.
- **Terrain Cards**: Shows active terrain details. 
- **Location Cards**: Displays points of interest within a hex with descriptions.
- **Encounter Cards**: Shows details of random or scripted encounters including:
  - Encounter type and quantity
  - Distance from party
  - Reaction (hostile, neutral, friendly)
  - Source reference
  - Allegiance (can be rolled separately)

### Tips for Use

- Visibility distances double in Clear Weather
- Some hexes (like D5, E5, F5) restrict weather options
- Your settings and revealed locations persist between sessions
- Click on card headers to expand/collapse their detailed content
- Hide locations to add them back to the encounter rolls using the "Hide Location" button
  
## License

This tool is intended for personal use. The content related to Dungeons & Dragons and Baldur's Gate: Descent into Avernus is property of Wizards of the Coast. Direct links and images to 3rd party sources (barring thealexandrian.net) have been scrubbed and must be referenced manually. 
