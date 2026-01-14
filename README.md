# Color Rush Arena

A fast-paced reflex game where color matching and speed decide survival.

## Tech Stack
- **Frontend**: React + Vite
- **3D Engine**: Three.js / React Three Fiber
- **State Management**: Zustand
- **Styling**: CSS Modules / Vanilla CSS

## How to Run locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

## Gameplay
- **Objective**: Survive as long as possible by passing through matching colors.
- **Controls**:
  - **Click / Tap / Spacebar / Up Arrow**: JUMP
  - **Hold Click / Shift**: SLOW DOWN (hold to time your passage)
- **Mechanics**:
  - Obstacles rotate.
  - You must hit the segment of the obstacle that matches your player color.
  - **Wrong Color = Game Over**.

## Features
- Infinite procedural level generation.
- Dynamic speed increase.
- Neon visual style.
- High score tracking (Local Storage).
