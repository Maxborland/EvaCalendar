<div align="center">

# EvaCalendar

**ADHD-friendly weekly planner for tasks, expenses, and family management.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://docker.com/)

</div>

---

## Overview

EvaCalendar is a personal weekly planner designed with ADHD users in mind. It emphasizes visual clarity, minimal friction, and structured routines over traditional to-do list approaches.

## Features

- 📅 **Weekly View** — Plan by week, not by endless lists
- ✅ **Tasks** — Create, schedule, and track tasks with visual feedback
- 💰 **Expense Tracking** — Budget categories, spending statistics
- 👨‍👩‍👧 **Family Mode** — Children profiles, shared tasks, family dashboard
- 🔔 **Notifications** — Push notifications and reminders (PWA)
- 📊 **Statistics** — Weekly/monthly summaries and trends
- 📝 **Notes** — Quick capture for ideas and thoughts
- 📱 **PWA** — Install on mobile, works offline

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS + Vite |
| Backend | Express.js + Knex.js + SQLite |
| Testing | Vitest (unit) + Playwright (E2E) |
| Deployment | Docker Compose + PM2 |

## Quick Start

```bash
# Docker (recommended)
docker-compose up --build

# Manual
cd back && npm install && npm run migrate:latest && npm start
cd front && npm install && npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

## Architecture

```
back/                  # Express API
├── controllers/       # HTTP handlers
├── services/          # Business logic
├── middleware/         # Auth, error handling
├── migrations/        # Knex.js DB migrations
└── tests/             # Jest test suite

front/                 # React SPA (PWA)
├── src/pages/         # Route pages
├── src/components/    # Reusable UI components
├── src/context/       # Auth, navigation context
└── src/services/      # API client layer
```

## License

MIT License — see [LICENSE](LICENSE) for details.
