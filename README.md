# New Words Extension

This repository contains:

- the latest Chrome extension source in [`public/extension`](./public/extension)
- a shareable online demo built with Vite + React
- the project history reconstructed from your local milestone snapshots

## Online Demo

After GitHub Pages is enabled for this repository, the demo will be available at:

`https://sunnywang666.github.io/new-words-extension/`

The demo lets people:

- select a word and open the tooltip
- fetch definitions from the Free Dictionary API
- save words into the vocabulary book
- preview the popup UI
- test import/export behavior

## Local Development

Prerequisite: Node.js 20+

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Load As A Chrome Extension

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select the [`public/extension`](./public/extension) folder

## Deploy To GitHub Pages

This repo includes a GitHub Actions workflow that builds and deploys the Vite app to GitHub Pages on every push to `main`.
