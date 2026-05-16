A collection of tools for Wargame: Red Dragon. Vibe coded with Claude.
## Data Extractor
Two Python programs living under scripts.

The first is `scripts/extract.py`. It takes `everything.ndfbin` from the game (decompress it first using other tools). This generates a `master.json` file (the most up-to-date copy lives under `data/master.json`). Created by means of an LLM-powered reverse engineering of the desktop armory tool.

The second is `scripts/enrich.py`. This takes as input `master.json` and other files living under `data/`. It cleans up game data (trailing spaces in weapon names, special characters in unit names, merging weapons) and adds new data (custom tags, patching in values which can't be extracted from game data, creating spreadsheet lists). Outputs to `public/`, which the other tools then use.
## Armory
Have you ever wondered:
- Whether Formoza can fire their grenade launcher at the same time as their MG?
- Why an AMX-40 doesn't fire its autocannon at the same time as the main gun when the Keiler can?
- At what speed a Rooikat travels through a forest?
- How fast is an Akula's ATGM missile compared to an Mi-28's?
- What a Patriot's accuracy is at Hardened compared to Veteran?
- How high an F-15C's air optics are compared to a Tomcat?
- Why Spetsnaz VMF don't get spotted when firing while other sniper teams do?
- What units have both a grenade launcher and autocannon?

This tool can answer all those questions. I wanted to make something that:
1. Showed *all* the hidden stats an average player may want to see
2. Did not show all the hidden values an average player *wouldn't* want to see
3. Had up-to-date data
4. Looked good and was convenient to navigate
5. Didn't require installing anything
6. Didn't require me to constantly host a back end to keep it running

This accomplishes all that. In fact, it shows several values the armory tool did not (true ASM AP,  ship sailing and CIWS, autoloader on AMX-13s and Nana Shikis, absence of turrets on tanks such as the Strv 103 series and presence of turrets on helicopters such as the Mi-24 VP).

The only stat that I was not able to add was turning radius on planes, due to its absence in the armory and their quantity being too numerous to add manually.

Works on mobile.
## Deck Builder
Ever wanted to send decks to your friends? Ever wanted to build a deck from your phone? Ever wanted to see hidden stats while picking your units?

You can easily share or bookmark decks by copy-pasting the URL in your browser.

Same as the armory essentially, but lets you build out your own deck.
## AP Damage
Shows the AP damage spread for both KE and HEAT. Allows you to pick a max range and engagement distance for KE. Focuses specifically on number of shots to kill. Allows you to pin up to two values to see which gun against which armor would kill in fewer shots.
## Spreadsheets
Allows you to compare lists of units side-by-side by category. Ever wondered:
- What the fastest aiming SPAAGs are?
- How high is the DPS difference between a Tunguska and a Gepard?
- What the longest range helo SAM is?
- Which superheavy has the highest rate of fire?
- What the highest AP autocannon is?

See all that in the corresponding spreadsheets. Features filtering (including curated presets, i.e. superheavies under tanks) and links to all tools in the armory.
## Community Decks
Curated list of community decks by yours truly, as well as other wargamers. Feel free to submit your own decks if you would like them featured here.