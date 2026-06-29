'use client'

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import type { WorkflowStep, Order } from '@/types'

const stepIcons: Record<string, string> = {
  new_order: '📦',
  qualification: '🎯',
  inventory_check: '📋',
  payment_approval: '💳',
  shipping: '🚚',
  notification: '📧',
  support_followup: '🤝',
}

const stepColors: Record<string, string> = {
  pending: '#6b7280',
  active: '#3b82f6',
  completed: '#22c55e',
  failed: '#ef4444',
}

const initialNodes: Node[] = [
  { id: 'new_order', type: 'input', position: { x: 250, y: 0 }, data: { label: 'Customer Order', status: 'pending' }, sourcePosition: Position.Bottom },
  { id: 'qualification', position: { x: 250, y: 120 }, data: { label: 'Sales Qualification', status: 'pending' }, sourcePosition: Position.Bottom, targetPosition: Position.Top },
  { id: 'inventory_check', position: { x: 250, y: 240 }, data: { label: 'Inventory Check', status: 'pending' }, sourcePosition: Position.Bottom, targetPosition: Position.Top },
  { id: 'payment_approval', position: { x: 250, y: 360 }, data: { label: 'Payment Approval', status: 'pending' }, sourcePosition: Position.Bottom, targetPosition: Position.Top },
  { id: 'shipping', position: { x: 250, y: 480 }, data: { label: 'Shipping', status: 'pending' }, sourcePosition: Position.Bottom, targetPosition: Position.Top },
  { id: 'notification', position: { x: 250, y: 600 }, data: { label: 'Customer Notification', status: 'pending' }, sourcePosition: Position.Bottom, targetPosition: Position.Top },
  { id: 'support_followup', type: 'output', position: { x: 250, y: 720 }, data: { label: 'Support Follow-up', status: 'pending' }, targetPosition: Position.Top },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'new_order', target: 'qualification', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e2-3', source: 'qualification', target: 'inventory_check', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e3-4', source: 'inventory_check', target: 'payment_approval', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e4-5', source: 'payment_approval', target: 'shipping', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e5-6', source: 'shipping', target: 'notification', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e6-7', source: 'notification', target: 'support_followup', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
]

export function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<string>('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/workflow?orders=true')
      const data = await res.json()
      setOrders(data.orders ?? [])
      if (data.orders?.length > 0 && !selectedOrder) {
        setSelectedOrder(data.orders[0].id)
      }
    } catch { /* ignore */ }
  }

  const updateWorkflowStatus = useCallback(async (orderId?: string) => {
    try {
      const url = orderId ? `/api/workflow?orderId=${orderId}` : '/api/workflow'
      const res = await fetch(url)
      const data = await res.json()
      const steps: WorkflowStep[] = data.steps ?? []

      setNodes((nds) =>
        nds.map((node) => {
          const step = steps.find((s) => s.id === node.id)
          if (step) {
            return {
              ...node,
              data: { ...node.data, label: `${stepIcons[node.id] ?? ''} ${step.label}`, status: step.status },
              style: {
                ...node.style,
                borderColor: stepColors[step.status],
                borderWidth: 2,
                opacity: step.status === 'pending' ? 0.5 : 1,
              },
            }
          }
          return node
        })
      )
    } catch { /* ignore */ }
  }, [setNodes])

  useEffect(() => {
    updateWorkflowStatus(selectedOrder || undefined)
    const interval = setInterval(() => updateWorkflowStatus(selectedOrder || undefined), 5000)
    return () => clearInterval(interval)
  }, [selectedOrder, updateWorkflowStatus])

  const handleProcessOrder = async () => {
    if (!selectedOrder) return
    setProcessing(true)
    try {
      await fetch(`/api/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder }),
      })
      await updateWorkflowStatus(selectedOrder)
      fetchOrders()
    } catch { /* ignore */ }
    setProcessing(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardContent className="p-0">
          <div className="h-[600px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Order Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Select Order</label>
              <Select value={selectedOrder} onValueChange={(v) => v && setSelectedOrder(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.id} - ${order.total.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleProcessOrder}
              disabled={processing || !selectedOrder}
            >
              <Play className="mr-2 h-4 w-4" />
              {processing ? 'Processing...' : 'Run Workflow'}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stepColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize text-muted-foreground">{status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
