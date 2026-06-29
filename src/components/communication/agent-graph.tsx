'use client'

import { useEffect, useState, useCallback } from 'react'
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
  Handle,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { AgentMessage } from '@/types'

const agentPositions: Record<string, { x: number; y: number }> = {
  'sales-agent': { x: 50, y: 150 },
  'finance-agent': { x: 250, y: 250 },
  'inventory-agent': { x: 250, y: 50 },
  'shipping-agent': { x: 450, y: 150 },
  'marketing-agent': { x: 50, y: 350 },
  'support-agent': { x: 450, y: 350 },
  'executive-agent': { x: 250, y: 450 },
}

const agentColors: Record<string, string> = {
  'sales-agent': 'from-blue-500 to-cyan-500',
  'finance-agent': 'from-emerald-500 to-teal-500',
  'inventory-agent': 'from-amber-500 to-orange-500',
  'shipping-agent': 'from-purple-500 to-violet-500',
  'marketing-agent': 'from-pink-500 to-rose-500',
  'support-agent': 'from-indigo-500 to-blue-500',
  'executive-agent': 'from-red-500 to-rose-500',
}

function AgentNode({ data }: { data: { label: string; agentId: string } }) {
  return (
    <div className={cn(
      'rounded-xl border-2 bg-card px-4 py-3 shadow-lg',
      'bg-gradient-to-br from-card to-muted'
    )}>
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className={cn(
            'bg-gradient-to-br text-white text-xs font-bold',
            agentColors[data.agentId] ?? 'bg-primary'
          )}>
            {data.label.split(' ').map(w => w[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold leading-tight">{data.label}</p>
          <p className="text-[10px] text-muted-foreground capitalize">{data.agentId.replace('-agent', '')}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  )
}

const nodeTypes = { agentNode: AgentNode }

export function AgentCommunicationGraph() {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    const agentIds = Object.keys(agentPositions)
    const initialNodes: Node[] = agentIds.map((id) => ({
      id,
      type: 'agentNode',
      position: agentPositions[id],
      data: {
        label: id === 'sales-agent' ? 'Alex Sales' :
               id === 'finance-agent' ? 'Fiona Finance' :
               id === 'inventory-agent' ? 'Ivan Inventory' :
               id === 'shipping-agent' ? 'Sarah Shipping' :
               id === 'marketing-agent' ? 'Maya Marketing' :
               id === 'support-agent' ? 'Sam Support' :
               'Eve Executive',
        agentId: id,
      },
    }))
    setNodes(initialNodes)
  }, [setNodes])

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/messages')
      const data = await res.json()
      setMessages(data.messages ?? [])

      const edgeList: Edge[] = (data.messages ?? []).map((msg: AgentMessage) => ({
        id: msg.id,
        source: msg.from,
        target: msg.to,
        animated: true,
        label: msg.type,
        style: {
          stroke: msg.type === 'approval' ? '#22c55e' :
                 msg.type === 'escalation' ? '#ef4444' :
                 msg.type === 'rejection' ? '#ef4444' :
                 '#3b82f6',
          strokeWidth: 1.5,
        },
        markerEnd: { type: MarkerType.ArrowClosed },
      }))
      setEdges(edgeList)
    } catch { /* ignore */ }
  }, [setEdges])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  return (
    <Card>
      <CardContent className="p-0">
        <div className="h-[600px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
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
  )
}
