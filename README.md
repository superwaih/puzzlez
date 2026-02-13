# Puzzlez

A sliding puzzle game built with Next.js. Rearrange scrambled image tiles by sliding them into the empty slot to reconstruct the original picture. Earn in-game currency for each solve and withdraw your balance through a mock banking flow.

## Features

- **Sliding puzzle** — click or drag tiles adjacent to the empty slot to move them
- **Three difficulty levels** — Easy (3×3), Medium (4×5), Hard (5×6), persisted in localStorage
- **Timer** — tracks solve time with pause/resume support; board is hidden while paused
- **Balance system** — start with ₦500, earn ₦500 per solve, withdraw when balance reaches ₦10,000
- **Withdrawal flow** — select a bank, enter an account number, and pass a math verification challenge
- **Responsive layout** — two-column desktop view with image preview, single-column on smaller screens

## Tech Stack

- **Framework** — [Next.js](https://nextjs.org) 14 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS 3
- **Runtime** — React 18
- **Linting** — ESLint with eslint-config-next

## Getting Started

```bash
pnpm install
pnpm dev
```

Opens at [http://localhost:3440](http://localhost:3440).

## Build & Production

```bash
pnpm build
pnpm start
```

## Deploy

Deploy on [Vercel](https://vercel.com/new) — zero config for Next.js projects.

## Project Structure

```
app/
  page.tsx        — main puzzle game
  games/page.tsx  — alternate puzzle variant
  layout.tsx      — root layout
  globals.css     — Tailwind directives + base styles
public/           — puzzle images
```
