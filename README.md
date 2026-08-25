# Scoundrel Solo PWA

A small offline-capable solo Scoundrel implementation designed for iPhone/Safari.

## GitHub Pages setup

1. Create a new GitHub repository, for example `scoundrel`.
2. Upload every file in this folder to the root of the repository.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. Open the GitHub Pages address GitHub provides.
7. On iPhone Safari, tap **Share → Add to Home Screen**.

The app uses a service worker, so after it loads successfully once it can work offline.

## Implemented rules

- 20 starting HP.
- Standard Scoundrel deck: all spades/clubs; hearts/diamonds 2–10 only.
- Rooms contain 4 cards; resolve 3 and carry 1 forward.
- Monsters deal their value as damage when fought barehanded.
- Weapons subtract their value from monster damage, minimum 0.
- After a weapon kills a monster, it may only be used on a lower-value monster next.
- Equipping a new weapon resets the restriction.
- Only the first potion resolved in a room heals; later potions in that room are discarded.
- Fleeing moves the current room to the bottom of the deck; you cannot flee two rooms in a row.

## Illustrated card update
This build gives every dungeon card a role-based illustration. Monster silhouettes grow more threatening as value increases, Diamond weapons scale from light to relic-class arms, and Heart potions grow in size/potency. The original rank, suit, and numeric value remain visible for fast play.

## Card artwork build
This version uses the supplied Scoundrel Poker Deck artwork for the playable cards. The source images were optimized to WebP for faster phone loading and offline caching; gameplay values and rules are unchanged.
