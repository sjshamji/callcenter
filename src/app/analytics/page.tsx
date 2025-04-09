"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FARMING_CATEGORIES } from '@/lib/constants'

interface Call {
  id: string
  timestamp?: string
  created_at?: string
  categories: string[] | string
  sentiment: number
  needs_fertilizer?: boolean
  needs_seed_cane?: boolean
  needs_harvesting?: boolean
  needs_ploughing?: boolean
  has_crop_issues?: boolean
  needs_pesticide?: boolean
}

interface CategoryCount {
  name: string
  count: number
}

interface NeedCount {
  name: string
  count: number
}

export default function Analytics() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryStats, setCategoryStats] = useState<CategoryCount[]>([])
  const [needsStats, setNeedsStats] = useState<NeedCount[]>([])
  const [averageSentiment, setAverageSentiment] = useState(0)

  // Helper function to ensure categories is always an array
  const ensureCategoriesArray = (categories: string[] | string | null): string[] => {
    if (!categories) return [];
    if (Array.isArray(categories)) return categories;
    if (typeof categories === 'string') {
      try {
        // Try to parse it as JSON
        return JSON.parse(categories);
      } catch (e) {
        // If it's not valid JSON, treat it as a single category
        return [categories];
      }
    }
    return [];
  }

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const response = await fetch('/api/calls')
        if (!response.ok) throw new Error('Failed to fetch calls')
        const data = await response.json()
        setCalls(data)
        
        // Calculate category statistics
        const categoryCount = FARMING_CATEGORIES.map(category => ({
          name: category,
          count: data.filter((call: Call) => 
            ensureCategoriesArray(call.categories).includes(category)
          ).length
        }))
        setCategoryStats(categoryCount)
        
        // Calculate needs statistics
        const needsCount = [
          { name: 'Fertilizer', count: data.filter((call: Call) => call.needs_fertilizer).length },
          { name: 'Seed Cane', count: data.filter((call: Call) => call.needs_seed_cane).length },
          { name: 'Harvesting', count: data.filter((call: Call) => call.needs_harvesting).length },
          { name: 'Ploughing', count: data.filter((call: Call) => call.needs_ploughing).length },
          { name: 'Crop Issues', count: data.filter((call: Call) => call.has_crop_issues).length },
          { name: 'Pesticide', count: data.filter((call: Call) => call.needs_pesticide).length },
        ]
        setNeedsStats(needsCount)
        
        // Calculate average sentiment
        const totalSentiment = data.reduce((acc: number, call: Call) => acc + call.sentiment, 0)
        setAverageSentiment(data.length > 0 ? totalSentiment / data.length : 0)
      } catch (error) {
        console.error('Error fetching calls:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCalls()
  }, [])

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Analytics</h1>
      
      {loading ? (
        <div className="text-center">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <h3 className="text-sm font-medium mb-1">Total Calls</h3>
                  <p className="text-2xl font-bold">{calls.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <h3 className="text-sm font-medium mb-1">Average Sentiment</h3>
                  <p className="text-2xl font-bold">
                    {averageSentiment > 0 ? '+' : ''}{averageSentiment.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <h3 className="text-sm font-medium mb-1">Most Common Category</h3>
                  <p className="text-2xl font-bold">
                    {categoryStats.sort((a, b) => b.count - a.count)[0]?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Categories Distribution</h2>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Farmer Needs Distribution</h2>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={needsStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--primary)" barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 