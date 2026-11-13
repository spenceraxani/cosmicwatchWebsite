# CosmicWatch: The Desktop Muon Detector (v3X)

CosmicWatch is a pocket-sized cosmic-ray muon detector that can be built from about $100 in parts, developed and run by the Department of Physics and Astronomy at the University of Delaware.

## Looking Inside the v3X

The v3X is a self-contained apparatus that uses a plastic scintillator to turn each passing particle into a flash of light, which a silicon photomultiplier (SiPM) collects. The custom printed circuit board is designed to process the signal and record the event, with onboard data storage, an OLED display, environmental sensors, and USB connectivity.

## Downloads

All supplementary materials, including the firmware, the GUI and the Python script that records data to your computer, can be found in the GitHub repository.

[GitHub Repository](https://github.com/spenceraxani/CosmicWatch-Desktop-Muon-Detector-v3X)

## Website development

Use Node.js 24 and pnpm 12.16.1. The pnpm version is pinned in `package.json` and used by GitHub Actions.

```sh
npm install --global pnpm@12.16.1
pnpm install --frozen-lockfile
pnpm dev
```

Before pushing:

```sh
pnpm format:check
pnpm build
pnpm test:smoke
```

The production build is written to `dist/`.
