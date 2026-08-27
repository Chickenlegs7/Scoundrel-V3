# Dungeon Arcade

This build preserves Scoundrel and adds **Delver**, an original single-player dungeon roguelite.

## Games
- **Scoundrel** — existing card-art solo game with stats and bare-handed combat choice.
- **Delver** — choose Warrior, Rogue, Ranger, or Mage and descend through The Ashen Crypt.

## Delver v1
- Branching room choices: Combat, Treasure, Camp, Mystery
- 2 AP turn combat
- Four distinct classes with passives and active abilities
- Random upgrade choices that create a different build each run
- Seven-floor dungeon ending with the Ashen Warden boss
- Persistent clears/losses
- Dungeon registry built into the code so additional dungeons can be added later
- Placeholder future dungeons are visible but intentionally locked

## Deploy
Upload the CONTENTS of this folder to the root of the existing GitHub Pages repository, replacing the old files. GitHub Pages will redeploy automatically.

Because the app structure changed, after deployment fully close the Home Screen app and reopen it. If the old Scoundrel screen persists, open the GitHub Pages URL in Safari once and refresh, then reopen the Home Screen app.


## V2.1 update note
This package is flattened for direct GitHub Pages upload. Delver shows “V2.1” on its menu. The service worker uses network-first loading for HTML/JS/CSS so future GitHub updates are less likely to be hidden by an old iPhone PWA cache.


## Delver V2.2
Long-term meta progression now supports 20+ ranks per track, stronger permanent gains, and a persistent Chronicle/story framework for future dungeons.
