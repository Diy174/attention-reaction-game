
# Reflex Rush — Attention and Reaction Time Game

Reflex Rush is a browser-based attention and reaction-time game built with React, TypeScript, and Vite.

## Features

- Seeded sequence of 30 scored trials
- 60% target and 40% non-target symbols
- Short practice round before the scored session
- Keyboard (SPACE) and button responses
- One response per trial
- One-second response window
- Correct responses, missed targets, false alarms, and correct withholding tracking
- Pause, resume, and restart controls
- Median reaction time and target accuracy summary
- Anonymous session results stored in browser localStorage
- Export saved results as JSON
- Automated tests with Vitest and React Testing Library
- GitHub Actions CI workflow

## Requirements

- Node.js 22 or compatible modern Node.js version
- npm

## Setup

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd ps10-attention-reaction-game
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

## Testing

```bash
npm run test -- --run
npm run build
```

## How to Play

1. Select Start Practice.
2. Press SPACE or click Respond when the target symbol 🎯 appears.
3. Do not respond when the non-target symbol 🔵 appears.
4. Complete the practice round to begin the scored session.
5. View your session summary and export saved results as JSON.

## Result Storage and Privacy

Session summaries are stored locally in the current browser using localStorage. Results are not sent to a remote server by this prototype. Exported JSON files may contain session timestamps.

## Limitations

This is an educational prototype, not a clinical or diagnostic assessment. Reaction times can vary with device performance, display latency, and input method.
