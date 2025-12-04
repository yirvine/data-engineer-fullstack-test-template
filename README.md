# Maket Data Engineering Assignment (PART 1)

This project demonstrates an event-driven architecture where a React frontend emits events to PostHog, which routes them to a NestJS backend for processing. The system collects training data for AI models while keeping business logic decoupled from the application layer.

## Architecture Overview

```
Browser → PostHog → Webhook → NestJS → training_data.jsonl
```

| Component | Role |
|-----------|------|
| **React App** (`apps/web`) | Emits enriched telemetry events to PostHog |
| **PostHog** | Central event router; owns business logic for triggers |
| **NestJS API** (`apps/api`) | Processes webhooks and stores training data |

The NestJS backend follows standard patterns: `WebhooksController` handles the HTTP endpoint, `WebhooksService` contains business logic (sanitization, file I/O), wired together in `AppModule`.

---

## How to Run

### Prerequisites

- Node.js 20.x
- pnpm (workspace is configured for pnpm)
- PostHog account (free tier works)
- Tunnel service for local development (Pinggy recommended)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure PostHog

Create `apps/web/.env.local`:

```env
VITE_POSTHOG_KEY=your_posthog_project_key
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

### 3. Start the tunnel

In a separate terminal, expose your local API:

```bash
ssh -p 443 -R0:localhost:3000 qr@free.pinggy.io
```

This generates a public URL like `https://random-name.free.pinggy.link`. (note that the free tier expires after 60 mins)

### 4. Run the applications

**Terminal 1: API server:**

```bash
npx nx serve api
```

**Terminal 2: React app:**

```bash
npx nx serve web
```

The API runs on `http://localhost:3000/api` and the web app on `http://localhost:4200`.

Open `http://localhost:4200` in your browser to access the Event Simulator UI, where you can trigger `feature_used` and `generation_failed` events.

---

## PostHog Configuration

### Webhook for Training Data

1. Go to **Data Pipeline → Destinations**
2. Create a new **HTTP Webhook**
3. URL: `https://your-tunnel-url.free.pinggy.link/api/webhooks`
4. Add event matcher: `event name equals generation_failed`
5. Enable the destination

This forwards all `generation_failed` events to the NestJS backend, which sanitizes the data and appends it to `training_data.jsonl`.

### Marketing Workflow (The "5th Usage" Trigger)

Instead of using backend polling or delayed cohorts, this system uses a telemetry pattern for real-time responsiveness.

1. **Trigger**: Workflow is triggered by the `feature_used` event
2. **Logic**: Filter checks if `event.properties.total_usage_count` equals `5`
3. **Action**: Dispatches email via configured destination (Mailgun/SendGrid)

This avoids the 2–5 minute latency associated with server-side Cohort calculation.

---

## How It Works

### Frontend Events

The React app has two buttons:

- **"Simulate Feature Usage"** - Increments local state and fires `feature_used` with `{ total_usage_count: n }`
- **"Simulate Generation Failure"** - Fires `generation_failed` with training data payload (`input_prompt`, `failure_reason`)

### Data Pipeline

When a `generation_failed` event occurs:

1. PostHog receives it from the browser
2. Webhook destination forwards it to NestJS API
3. Service extracts and sanitizes the `input_prompt` field
4. Data is appended to `training_data.jsonl` using non-blocking I/O

### Training Data Format

Each line in `training_data.jsonl` is a complete JSON object:

```json
{"timestamp":"2025-11-30T16:38:21.968Z","event":"generation_failed","failure_reason":"timeout","input_prompt":"generate a marketing email for new users","distinct_id":"user_uuid"}
```

---

## Testing

1. Open `http://localhost:4200` (optionally enter email when prompted)
2. Click **"Simulate Generation Failure"** and verify `training_data.jsonl` is created in workspace root
3. Click **"Simulate Feature Usage"** 5 times, triggering marketing workflow (see video demo)

---

## Architectural Decisions

### Why not use cohorts for the 5th usage trigger?

I initially attempted to use a standard PostHog Cohort (feature_used ≥ 5). However, this approach presented two architectural blockers:

1 - Asynchronous Latency: Behavioral cohort membership is not calculated in real-time. This introduced a race condition where the workflow would trigger before the system recognized the user had qualified, resulting in unreliable execution.

2 - Workflow Constraints: The Workflow engine restricts the use of expensive historical queries (like dynamic cohorts) inside real-time Conditional Branches to prevent ingestion bottlenecks.

Instead, the frontend tracks the count locally and sends it with each event:

```typescript
posthog.capture('feature_used', { total_usage_count: newCount });
```

PostHog filters on this property directly, so the trigger fires instantly when count equals 5.

### Separation of Concerns

| Component | Responsibility |
|-----------|----------------|
| **Frontend** | Reports accurate telemetry state (`total_usage_count`) |
| **PostHog** | Owns business logic (decides when count == 5 triggers action) |
| **Backend** | Processes data, never called directly by frontend |

The React app does **not** know why the count matters. It only reports state. If marketing changes the threshold from "5" to "10", we update PostHog only (not React code).
