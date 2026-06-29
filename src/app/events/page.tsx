import { EventLogView } from '@/components/events/event-log'

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Event Log</h1>
        <p className="text-muted-foreground mt-1">
          Every agent action recorded — timestamp, decision, confidence, duration, cost
        </p>
      </div>
      <EventLogView />
    </div>
  )
}
