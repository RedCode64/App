# GRIDRUNNER ▓▒░

A cyberpunk habit tracker for iOS and Android. Every habit is a **contract**, every
category a **district of the city**, and your discipline levels up a persistent
net-runner character with implants, gear and a ghost that runs missions while
you sleep.

Built with **Expo (React Native + TypeScript, strict mode)**, **Firebase Auth +
Firestore**, **Zustand**, **Reanimated** and **react-native-svg**.

## Features

- **XP & leveling** with a full-screen glitch level-up celebration
- **Skill tree** — neural implant upgrade paths (XP, combo, streak-shield and
  idle-mission branches) rendered as a branching SVG node graph
- **Streaks** with escalating XP bonuses, streak shields, and a full-screen
  corruption/glitch effect when a chain breaks
- **Daily challenge missions** that refresh deterministically at midnight
- **Combo multiplier** for chaining completions inside a time window
- **Achievements** styled as neural implant registrations
- **Prestige / rebirth** at level 50 with a permanent stacking XP bonus
- **Character system** — layered SVG avatar, cosmetic loot (outfits, headgear,
  cyberware, accessories) unlocked by levels, streaks, achievements, prestige
  and craftable fragments; equipped state synced per-user to Firestore
- **Ghost Protocol** — deterministic client-computed idle missions while you're
  away; rewards scale with your equipped gear tier
  (STREET ×1 → CHROME ×1.25 → NETRUNNER ×1.5 → GHOST ×2)
- **Leaderboard** of mocked global net runners with your live rank
- **Fixer transmissions** — daily local push notifications
- Offline-tolerant: AsyncStorage cache + pending-write queue flushed on reconnect
- Global error boundary, skeleton loaders, retry affordances, inline validation

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Firebase** — open `firebase.config.ts` and replace every
   `REPLACE_WITH_YOUR_*` placeholder with your Firebase project's web config
   (Firebase console → Project settings → Your apps). Enable **Email/Password**
   authentication and create a **Firestore** database in the console.

   Suggested security rules:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
         match /habits/{habitId} {
           allow read, write: if request.auth != null && request.auth.uid == uid;
         }
       }
     }
   }
   ```

3. **Run the app**

   ```bash
   npx expo start
   ```

   Scan the QR code with Expo Go (iOS/Android) or press `i` / `a` for a simulator.

4. **Run the tests**

   ```bash
   npx jest
   ```

   Unit tests cover the XP curve, streak evaluation, combo chains, prestige,
   gear-tier multipliers, idle-mission math and daily challenges; integration
   tests drive the real store/service code against in-memory Firebase mocks.

5. **Type-check**

   ```bash
   npm run typecheck
   ```

## Project layout

```
App.tsx                     app root: providers, overlays, session lifecycle
firebase.config.ts          Firebase init (placeholders to replace)
src/
  components/               reusable UI (glitch text, avatar rig, cards, …)
  data/                     cosmetics, achievements, skill tree, mock leaderboard
  navigation/               React Navigation stacks + bottom tabs
  screens/                  auth, home, contracts, character, implants, net, …
  services/                 auth, firestore sync, cache/queue, sound, notifications
  store/                    Zustand store (profile, habits, combo, overlays)
  theme/                    colors, district palette, tier colors
  types/                    shared TypeScript models
  utils/                    pure gamification logic (fully unit-tested)
__mocks__/                  in-memory firebase + AsyncStorage for Jest
__tests__/                  unit + integration suites
```
