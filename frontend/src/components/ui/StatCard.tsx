import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
}

export function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="glass-dark border-gray-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 bg-gray-800 rounded-lg`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div className={`text-2xl font-bold text-white`}>
            {value}
          </div>
        </div>
        <p className="text-gray-400 text-sm">{label}</p>
      </div>
    </Card>
  )
}
