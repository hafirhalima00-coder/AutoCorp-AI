import { AnalyticsCharts } from '@/components/analytics/analytics-charts'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Executive dashboards for revenue, orders, agent performance, and key metrics
        </p>
      </div>
      <AnalyticsCharts />
    </div>
  )
}
