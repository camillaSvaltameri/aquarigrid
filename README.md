**Final Project for CMPM120**

# Aquarigrid

**Aquarigrid** is a browser based underwater grid game made with Phaser. The player controls a fish on a 3x3 board, collects chests, avoids hazards, upgrades their stats, and unlocks new fish over time.

The goal of each level is to survive long enough to collect the key. Any chests collected during the level open after the key is found.

## Gameplay Overview

Aquarigrid is played on a small 3x3 grid. Each move shifts the board and introduces new tiles, so every move matters.

Players can encounter:

* **Worms** that restore health
* **Chests** that give rewards after completing a level
* **Keys** that complete the level
* **Hazards** such as seaweed, waste, cans, lures, and spikes
* **Spikes** that can switch between safe and dangerous states

If the player’s health reaches zero, they can either retry the level or spend gems to continue.

## Controls

| Key   | Action                                   |
| ----- | ---------------------------------------- |
| W     | Move up                                  |
| A     | Move left                                |
| S     | Move down                                |
| D     | Move right                               |
| Enter | Close menus / continue                   |
| U     | Open fish unlock menu while in the menu  |
| S     | Open shop while in the menu              |
| T     | Return to title screen while in the menu |
| C     | Continue after failure                   |
| R     | Retry after failure                      |
| Y / N | Confirm or cancel fish purchases         |

The game also supports mouse interaction for buttons, menus, shop purchases, and scrolling.

## Main Features

* 3x3 grid-based movement
* Turn-based board shifting
* Random tile spawning
* Health, damage, healing, and shield mechanics
* Chest reward system
* Gold, gems, and key currencies
* Medkit and rock items
* Fish unlock system
* Fish piece progression
* Gem-purchasable fish
* Fish requirement chains
* Upgrade shop
* Local browser save system
* Reset progress option
* Title screen, tutorial, and credits screens
* Background music and sound effects

## Currencies and Items

### Gold

Gold is mainly used for health upgrades in the shop.

### Gems

Gems are used for special purchases, including:

* Buying certain fish
* Buying medkits
* Buying rocks
* Continuing after failure

### Keys

Keys are earned by completing levels and can be spent in the shop to buy fish pieces.

### Medkits

Medkits restore health during a level. They cannot heal beyond the player’s maximum health.

### Rocks

Rocks create a temporary shield that blocks the next damage the player would take. The shield disappears after the next move.

## Chest Rewards

Chests are collected during a level, but they only open after the player collects the key.

Possible chest rewards include:

* Gold
* Gems
* Medkits
* Rocks
* Fish pieces

Approximate reward chances:

| Reward      | Chance |
| ----------- | -----: |
| Gold        |    45% |
| Fish Pieces |    30% |
| Medkit      |    10% |
| Rock        |    10% |
| Gems        |     5% |

Collecting all 5 chests in a level also gives a bonus gem reward.

## Fish Unlocks

The game includes many unlockable fish.

Fish can be unlocked in different ways:

* Collecting enough fish pieces from chests
* Buying certain fish with gems
* Unlocking prerequisite fish first

Once a fish is unlocked, it can be selected from the fish unlock menu. Fish selection is cosmetic and does not change gameplay stats.

## Shop System

The shop allows players to spend currencies on upgrades and items.

Available shop options include:

* Max Health upgrades
* Starting Health upgrades
* Medkits
* Rocks
* Fish pieces using keys

Max Health increases the highest amount of health the player can have.

Starting Health increases how much health the player begins each level with. Starting Health always stays at least 5 points below Max Health.

Upgrades become more expensive as they get stronger.

## Save System

Aquarigrid saves progress locally in the browser using `localStorage`.

Saved progress includes:

* Current level
* Gold
* Gems
* Keys
* Medkits
* Rocks
* Selected fish
* Unlocked fish
* Fish piece progress
* Max Health
* Starting Health

Progress is saved automatically after permanent changes, such as purchases, upgrades, fish unlocks, level completion, and returning to the title screen.

This is local browser saving. Progress will be lost if the player clears browser data, uses a different browser, or plays on another device.

The title screen includes a reset progress option.

## Audio

The game uses background music and sound effects. Audio is loaded separately from the main visual assets to help reduce startup issues.

Audio includes:

* Title screen music
* Gameplay music
* Button sounds
* Chest sounds
* Key sounds
* Unlock sounds
* Item sounds
* Hazard sounds


## Asset Credits

This project uses royalty free visual and audio assets.

Credits included in the game:

* Visual Assets: Pixel Gnome
* Visual Assets: Kenney Assets
* Audio Assets: Pixabay
* Background Music: Stream Cafe
* Ocean Background: Magnific wallpaper

## Project Status

The main gameplay loop is complete.

Current implemented systems include:

* Title screen
* Tutorial screen
* Credits screen
* Core grid gameplay
* Chest rewards
* Shop upgrades
* Fish unlocks
* Item usage
* Audio
* Local saving
* Reset progress

Future improvements may include additional polish, better level balancing, more visual effects, expanded tutorial presentation, and extra details.
