"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface Call {
  id: string
  timestamp?: string
  created_at?: string
  transcript: string
  summary: string
  categories: string[] | string
  sentiment: number
  needs_fertilizer?: boolean
  needs_seed_cane?: boolean
  needs_harvesting?: boolean
  needs_ploughing?: boolean
  has_crop_issues?: boolean
  needs_pesticide?: boolean
  resolved?: boolean
  follow_up_required?: boolean
  priority?: number
}

export default function History() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const response = await fetch('/api/calls')
        if (!response.ok) throw new Error('Failed to fetch calls')
        const data = await response.json()
        setCalls(data)
      } catch (error) {
        console.error('Error fetching calls:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCalls()
  }, [])

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

  // Helper function to format date
  const formatDate = (timestamp?: string) => {
    if (!timestamp) return 'No date';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Call History</h1>
      
      {loading ? (
        <div className="text-center">
          <p className="text-muted-foreground">Loading call history...</p>
        </div>
      ) : calls.length === 0 ? (
        <div className="text-center">
          <p className="text-muted-foreground">No calls recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {calls.map((call) => (
            <Card key={call.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <time className="text-sm text-muted-foreground">
                    {formatDate(call.timestamp || call.created_at)}
                  </time>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground mr-2">Sentiment:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      call.sentiment > 0.2 ? 'bg-green-500/20 text-green-400' :
                      call.sentiment < -0.2 ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {call.sentiment > 0.2 ? 'Positive' :
                       call.sentiment < -0.2 ? 'Negative' : 'Neutral'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Transcript:</h3>
                    <p className="text-sm text-muted-foreground">{call.transcript}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Summary:</h3>
                    <p className="text-sm text-muted-foreground">{call.summary}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Categories:</h3>
                    <div className="flex flex-wrap gap-2">
                      {ensureCategoriesArray(call.categories).map((category, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary-foreground"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Farmer Needs:</h3>
                    <div className="flex flex-wrap gap-2">
                      {call.needs_fertilizer && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                          Fertilizer
                        </span>
                      )}
                      {call.needs_seed_cane && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                          Seed Cane
                        </span>
                      )}
                      {call.needs_harvesting && (
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400">
                          Harvesting
                        </span>
                      )}
                      {call.needs_ploughing && (
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400">
                          Ploughing
                        </span>
                      )}
                      {call.has_crop_issues && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                          Crop Issues
                        </span>
                      )}
                      {call.needs_pesticide && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">
                          Pesticide
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 