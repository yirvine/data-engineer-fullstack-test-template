# Analytics Pipeline & Data Engineering Assignment

This project demonstrates an event-driven architecture where a React frontend emits events to PostHog, which routes them to a NestJS backend for processing. The system collects training data for AI models while keeping business logic decoupled from the application layer.

## Architecture Overview

The system has three main components:

1. **React App** (`apps/web`) - emits user interaction events to PostHog
2. **PostHog** - central event router that handles webhooks and workflow triggers
3. **NestJS API** (`apps/api`) - processes events and stores training data

Events flow like this: Browser -> PostHog -> Webhook -> NestJS -> training_data.jsonl

## Prerequisites

- Node.js 20.x (the project uses Vite 7 which requires this version)
- pnpm package manager
- PostHog account (free tier works fine)
- A tunnel service for local development (we use Pinggy)

## Setup Instructions

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure PostHog

Create `apps/web/.env.local`:

```
VITE_POSTHOG_KEY=your_posthog_project_key
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

### 3. Start the tunnel

In a separate terminal, expose your local API:

```bash
ssh -p 443 -R0:localhost:3000 qr@free.pinggy.io
```

This generates a public URL like `https://random-name.free.pinggy.link`. Note that the free tier expires after 60 minutes and generates a new URL each time you restart.

### 4. Run the applications

Terminal 1 - API server:
```bash
npx nx serve api
```

Terminal 2 - React app:
```bash
npx nx serve web
```

The API runs on `http://localhost:3000/api` and the web app on `http://localhost:4200`.

## PostHog Configuration

### Webhook for Training Data

1. Go to PostHog -> Data Pipeline -> Destinations
2. Create a new HTTP Webhook
3. URL: `https://your-tunnel-url.free.pinggy.link/api/webhooks`
4. Add event matcher: `event name equals generation_failed`
5. Enable the destination

This forwards all generation failure events to the NestJS backend, which sanitizes the data and appends it to `training_data.jsonl`.

### Marketing Workflow

For the 5th feature usage discount email:

1. Created a cohort called "power users" with condition: user has triggered `feature_used` event at least 5 times
2. Set up a workflow triggered by `feature_used` events
3. Workflow runs once per user and includes:
   - 2 minute wait period
   - Condition check: is user in "power users" cohort?
   - If yes: send discount email
   - If no: exit workflow

The workflow uses a custom email service (configured with my personal DNS) to deliver the discount code.

## Project Structure

```
apps/
├── web/                    # React frontend
│   ├── src/app/app.tsx    # main UI with event buttons
│   └── src/main.tsx       # PostHog provider setup
└── api/                    # NestJS backend
    └── src/app/
        ├── webhooks.controller.ts   # receives PostHog webhooks
        └── webhooks.service.ts      # processes events and writes data
```

## How It Works

### Frontend Events

The React app has two buttons:
- "Simulate Feature Usage" - fires a `feature_used` event
- "Simulate Generation Failure" - fires a `generation_failed` event with training data payload

Events go directly from the browser to PostHog's servers.

### Data Pipeline

When a `generation_failed` event occurs:
1. PostHog receives it from the browser
2. Webhook destination forwards it to NestJS API
3. Service extracts and sanitizes the `input_prompt` field
4. Data is appended to `training_data.jsonl` in JSON Lines format
5. File writes use async operations to avoid blocking

### Training Data Format

Each line in `training_data.jsonl` is a complete JSON object:

```json
{"timestamp":"2025-11-30T16:38:21.968Z","event":"generation_failed","failure_reason":"timeout","input_prompt":"generate a marketing email for new users","distinct_id":"019ad56c-5168-7457-bac6-82981da45fb3"}
```

This format makes it easy to stream and process for ML training pipelines.

## Technical Notes

- Disabled the `@nx/vitest` plugin in `nx.json` due to ES Module compatibility issues with Nx 22.1.2
- Used pnpm instead of npm since the workspace is configured as a pnpm monorepo
- PostHog webhook payload wraps event data in an outer object, so the service handles both direct and wrapped formats

## Testing

1. Open `http://localhost:4200`
2. Click "Simulate Generation Failure" a few times
3. Check that `training_data.jsonl` gets created with new entries
4. Click "Simulate Feature Usage" 5 times (in same session)
5. After 2 minutes, check for discount email delivery
