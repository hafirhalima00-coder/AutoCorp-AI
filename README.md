# AutoCorp AI

**An autonomous company simulator where multiple AI agents cooperate to run an entire business under human supervision.**

Built with Next.js 15, TypeScript, Tailwind CSS, SQLite, React Flow, and Recharts.

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────┐
│                   AutoCorp AI                        │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │                 UI Layer                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │Dashboard │ │ Workflow │ │ Communication │  │   │
│  │  │ (Rechart)│ │(ReactFlow)│ │  (ReactFlow)  │  │   │
│  │  └──────────┘ └──────────┘ └──────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │Approvals │ │Analytics │ │  Event Log   │  │   │
│  │  └──────────┘ └──────────┘ └──────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│                          │                           │
│  ┌──────────────────────────────────────────────┐   │
│  │              API Layer (Next.js)              │   │
│  │  /api/agents  /api/metrics  /api/approvals   │   │
│  │  /api/events  /api/workflow                   │   │
│  └──────────────────────────────────────────────┘   │
│                          │                           │
│  ┌──────────────────────────────────────────────┐   │
│  │            Agent Service Layer                │   │
│  │  ┌──────┐ ┌────────┐ ┌───────────┐ ┌──────┐  │   │
│  │  │Sales │ │Finance │ │ Inventory │ │Ship. │  │   │
│  │  └──────┘ └────────┘ └───────────┘ └──────┘  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐       │   │
│  │  │Marketing│ │ Support │ │Executive │       │   │
│  │  └─────────┘ └─────────┘ └──────────┘       │   │
│  └──────────────────────────────────────────────┘   │
│                          │                           │
│  ┌──────────────────────────────────────────────┐   │
│  │              Data Layer (SQLite)              │   │
│  │  Agents | Orders | Events | Approvals        │   │
│  │  Products | Customers | Metrics              │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### AI Employees

| Agent | Name | Role | Description |
|-------|------|------|-------------|
| Sales | Alex Sales | `sales` | Qualifies orders, processes quotes, follows up leads |
| Finance | Fiona Finance | `finance` | Approves payments, processes refunds, generates reports |
| Inventory | Ivan Inventory | `inventory` | Checks stock, reserves items, alerts restock needs |
| Shipping | Sarah Shipping | `shipping` | Prepares shipments, calculates costs, updates tracking |
| Marketing | Maya Marketing | `marketing` | Creates campaigns, analyzes markets, segments customers |
| Support | Sam Support | `support` | Notifies customers, handles complaints, processes returns |
| Executive | Eve Executive | `executive` | Reviews metrics, approves requests, strategic planning |

### Business Workflow

```
Customer Order → Sales Qualification → Inventory Check → Payment Approval → Shipping → Customer Notification → Support Follow-up
```

### Approval Rules

High-risk actions require CEO approval:

- Refunds over **$500**
- Product deletion
- Bulk customer export
- Discounts over **40%**
- Large payments over **$5,000**
- High-severity complaint resolutions

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** SQLite (better-sqlite3)
- **Workflow:** React Flow
- **Charts:** Recharts
- **Icons:** Lucide React
- **State:** React hooks + REST API
- **Testing:** Vitest
- **Container:** Docker
- **CI:** GitHub Actions

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone <repo-url>
cd autocorp-ai
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

### Testing

```bash
npm test
```

### Docker

```bash
docker-compose up --build
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── agents/          # Agent CRUD + execution
│   │   │   ├── [id]/        # Single agent operations
│   │   │   ├── messages/    # Agent communication
│   │   │   └── sync/        # Sync all agents
│   │   ├── metrics/         # Business metrics
│   │   ├── approvals/       # Approval requests
│   │   ├── events/          # Event log
│   │   └── workflow/        # Business workflow
│   ├── page.tsx             # Executive Dashboard
│   ├── agents/page.tsx      # AI Employees page
│   ├── workflow/page.tsx    # Workflow page
│   ├── communication/page.tsx # Agent Communication
│   ├── approvals/page.tsx   # Approval Center
│   ├── analytics/page.tsx   # Analytics
│   └── events/page.tsx      # Event Log
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── dashboard/           # Dashboard components
│   ├── agents/              # Agent cards + grid
│   ├── workflow/            # React Flow workflow
│   ├── communication/       # Agent graph
│   ├── approvals/           # Approval center
│   ├── analytics/           # Analytics charts
│   └── layout/              # Sidebar, header, theme
├── lib/
│   ├── agents/              # Agent implementations
│   │   ├── base-agent.ts    # Abstract base class
│   │   ├── sales-agent.ts
│   │   ├── finance-agent.ts
│   │   ├── inventory-agent.ts
│   │   ├── shipping-agent.ts
│   │   ├── marketing-agent.ts
│   │   ├── support-agent.ts
│   │   ├── executive-agent.ts
│   │   └── index.ts         # Agent registry
│   ├── workflows/           # Business workflow engine
│   ├── metrics/             # Metrics engine
│   ├── db.ts                # Database setup + seed
│   └── utils.ts             # Utility functions
└── types/
    └── index.ts             # TypeScript interfaces
```

---

## API Reference

### `GET /api/agents`
Returns all agent states.

### `POST /api/agents/[id]`
Execute a task on a specific agent. Body: `{ task: string, context?: object }`

### `GET /api/agents/messages`
Returns recent agent-to-agent messages.

### `POST /api/agents/sync`
Triggers all agents to execute a default task.

### `GET /api/metrics`
Returns business health metrics and trends.

### `GET /api/approvals`
Returns all approval requests.

### `POST /api/approvals`
Resolve an approval. Body: `{ id: string, approve: boolean }`

### `GET /api/events`
Returns event log. Query: `?search=&result=success|failure|pending`

### `GET /api/workflow`
Returns workflow steps. Query: `?orderId=xxx` or `?orders=true`

### `POST /api/workflow`
Process an order through the full workflow. Body: `{ orderId: string }`

---

## Deployment

### Vercel

```bash
npm i -g vercel
vercel
```

Note: SQLite requires Node.js runtime on Vercel (not edge). Use `serverExternalPackages: ['better-sqlite3']` in `next.config.ts`.

### Docker

```bash
docker build -t autocorp-ai .
docker run -p 3000:3000 autocorp-ai
```

---

## License

MIT
