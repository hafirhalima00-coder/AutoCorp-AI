import { NextResponse } from 'next/server'
import { MetricsEngine } from '@/lib/metrics/metrics-engine'

export async function GET() {
  const metrics = MetricsEngine.getMetrics()
  return NextResponse.json(metrics)
}

export async function POST() {
  MetricsEngine.recordSnapshot()
  return NextResponse.json({ success: true })
}
