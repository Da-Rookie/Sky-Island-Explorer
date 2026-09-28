# Sky Island Explorer

A complete, quiet third-person exploration adventure in a hand-built floating archipelago. Built for the browser with React, TypeScript, Three.js, React Three Fiber, Rapier, Zustand and Vite.

## Play

- WASD / arrow keys: move. Shift: run. Space: jump.
- Drag mouse: orbit. Double-click world: lock mouse. Wheel: zoom.
- E: interact with an inscription, puzzle stone, lens or shrine.
- Esc: journal / pause. Touch controls are shown on touch devices.

Follow the inscriptions in the forest and observatory. Restore both shrines and bring twelve Sky Shards to the northern Heart Shrine. Two hidden places and fifteen shards are available for full completion. Progress saves on this browser; use the journal settings to reset or return to camp.

## Run

```sh
npm ci
npm run dev
npm test
npm run build
```

Deploy the Vite `dist` output. `vercel.json` includes production build settings. No environment variables or backend required.

## Project

- `src/World.tsx`: islands, trees, water, ruins, shrine, collectibles and puzzle props.
- `src/Player.tsx`: Rapier movement, animation, collision camera, interactions and discovery.
- `src/store.ts`: validated versioned saves and game state.
- `src/progression.ts`: puzzle and completion rules.
- `src/App.tsx`: game menus, HUD, journal and touch controls.
- `scripts/create-character.mjs`: reproducible original skinned GLB and animation generation.
- `tests/progression.test.ts`: puzzle and final unlock regression checks.
- `docs/PRD.md`: V1 requirement traceability.

All world geometry, character meshes, animations and synthesized audio are original procedural assets created for this project. Fonts are bundled locally; see `docs/ASSETS.md`.

## Performance

High enables dynamic shadows and a capped 1.6 device pixel ratio. Low disables shadows and uses DPR 1; it is selected by default on touch devices. Vegetation is instanced, the character is a local GLB, and physics and rendering are split into cached bundles. Hardware-specific 60 FPS desktop / 30–60 FPS mobile targets require measurement on the intended devices.

## Browser verification

Install a Chromium test browser with `npx playwright install chromium`, then run `npm run test:browser` and `npm run test:mobile`. See `docs/VALIDATION.md` for coverage, fixture usage, and current delivery limitations.
