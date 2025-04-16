"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Filter, 
  CalendarRange,
  Droplet, 
  Leaf, 
  Sun, 
  Tractor, 
  Layers,
  BellRing,
  Flag,
  ArchiveX
} from 'lucide-react'
import ResolveIssueModal from '@/components/ResolveIssueModal'

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

interface SummaryStats {
  total: number
  resolved: number
  unresolved: number
  followUp: number
  needsFertilizer: number
  needsSeedCane: number
  needsHarvesting: number
  needsPloughing: number
  hasCropIssues: number
  needsPesticide: number
  highPriority: number
}

export default function History() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SummaryStats>({
    total: 0,
    resolved: 0,
    unresolved: 0,
    followUp: 0,
    needsFertilizer: 0,
    needsSeedCane: 0,
    needsHarvesting: 0,
    needsPloughing: 0,
    hasCropIssues: 0,
    needsPesticide: 0,
    highPriority: 0
  })
  const [showResolved, setShowResolved] = useState<boolean | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)

  const refreshData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/calls')
      if (!response.ok) throw new Error('Failed to fetch calls')
      const data = await response.json()
      
      // Sort by date (most recent first)
      const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.timestamp || a.created_at || 0);
        const dateB = new Date(b.timestamp || b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setCalls(sortedData)
      
      // Calculate summary statistics
      const summaryStats: SummaryStats = {
        total: data.length,
        resolved: data.filter((c: Call) => c.resolved).length,
        unresolved: data.filter((c: Call) => !c.resolved).length,
        followUp: data.filter((c: Call) => c.follow_up_required).length,
        needsFertilizer: data.filter((c: Call) => c.needs_fertilizer).length,
        needsSeedCane: data.filter((c: Call) => c.needs_seed_cane).length,
        needsHarvesting: data.filter((c: Call) => c.needs_harvesting).length,
        needsPloughing: data.filter((c: Call) => c.needs_ploughing).length,
        hasCropIssues: data.filter((c: Call) => c.has_crop_issues).length,
        needsPesticide: data.filter((c: Call) => c.needs_pesticide).length,
        highPriority: data.filter((c: Call) => c.priority && c.priority >= 3).length
      }
      
      setStats(summaryStats)
    } catch (error) {
      console.error('Error fetching calls:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleResolveClick = (call: Call) => {
    setSelectedCall(call)
    setIsModalOpen(true)
  }

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
  
  // Filter calls based on resolved status
  const filteredCalls = showResolved === null 
    ? calls 
    : calls.filter(call => call.resolved === showResolved);

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Call History</h1>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="ml-3 text-muted-foreground">Loading call history...</p>
        </div>
      ) : calls.length === 0 ? (
        <div className="text-center">
          <p className="text-muted-foreground">No calls recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950 dark:to-indigo-950 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <CalendarRange className="w-5 h-5 mr-2 text-blue-500" /> 
                  Call Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
                    <p className="text-xs text-muted-foreground">Resolved</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-500">{stats.unresolved}</p>
                    <p className="text-xs text-muted-foreground">Open</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BellRing className="w-5 h-5 mr-2 text-amber-500" />
                  Action Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-amber-500">{stats.followUp}</p>
                    <p className="text-xs text-muted-foreground">Follow-up</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-500">{stats.highPriority}</p>
                    <p className="text-xs text-muted-foreground">High Priority</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-500">{stats.hasCropIssues}</p>
                    <p className="text-xs text-muted-foreground">Crop Issues</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Tractor className="w-5 h-5 mr-2 text-emerald-500" />
                  Resource Needs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center">
                    <Droplet className="h-4 w-4 text-blue-500 mb-1" />
                    <p className="text-lg font-bold">{stats.needsFertilizer}</p>
                    <p className="text-xs text-muted-foreground">Fertilizer</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Leaf className="h-4 w-4 text-green-500 mb-1" />
                    <p className="text-lg font-bold">{stats.needsSeedCane}</p>
                    <p className="text-xs text-muted-foreground">Seed Cane</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Sun className="h-4 w-4 text-amber-500 mb-1" />
                    <p className="text-lg font-bold">{stats.needsHarvesting + stats.needsPloughing}</p>
                    <p className="text-xs text-muted-foreground">Services</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Filter controls */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Call Records ({filteredCalls.length})</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowResolved(null)}
                className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                  showResolved === null ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <Filter className="h-4 w-4 mr-1" />
                All
              </button>
              <button 
                onClick={() => setShowResolved(true)}
                className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                  showResolved === true ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-800'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Resolved
              </button>
              <button 
                onClick={() => setShowResolved(false)}
                className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                  showResolved === false ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-800'
                }`}
              >
                <Clock className="h-4 w-4 mr-1" />
                Open
              </button>
            </div>
          </div>
          
          {/* Call list */}
          <div className="space-y-4">
            {filteredCalls.map((call) => {
              // Determine if any needs are present
              const hasNeeds = call.needs_fertilizer || 
                call.needs_seed_cane || 
                call.needs_harvesting || 
                call.needs_ploughing || 
                call.has_crop_issues || 
                call.needs_pesticide;
              
              return (
                <Card key={call.id} className={`
                  shadow-md overflow-hidden
                  ${call.resolved ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-amber-500'}
                  ${call.priority && call.priority >= 3 ? 'border-t-4 border-t-red-500' : ''}
                  ${call.follow_up_required ? 'border-r-4 border-r-purple-500' : ''}
                `}>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                      <div className="flex items-center">
                        <time className="text-sm text-muted-foreground">
                          {formatDate(call.timestamp || call.created_at)}
                        </time>
                        {call.resolved && (
                          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolved
                          </span>
                        )}
                        {!call.resolved && (
                          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Open
                          </span>
                        )}
                        {call.follow_up_required && (
                          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 flex items-center">
                            <BellRing className="h-3 w-3 mr-1" />
                            Follow-up
                          </span>
                        )}
                        {call.priority && call.priority >= 3 && (
                          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 flex items-center">
                            <Flag className="h-3 w-3 mr-1" />
                            High Priority
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        {/* Add Close Issue button for unresolved calls with needs */}
                        {!call.resolved && hasNeeds && (
                          <button
                            onClick={() => handleResolveClick(call)}
                            className="mr-3 px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 flex items-center hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                          >
                            <ArchiveX className="h-3 w-3 mr-1" />
                            Close Issue
                          </button>
                        )}
                        <span className="text-xs text-muted-foreground mr-2">Sentiment:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          call.sentiment > 0.2 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                          call.sentiment < -0.2 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                        }`}>
                          {call.sentiment > 0.2 ? 'Positive' :
                           call.sentiment < -0.2 ? 'Negative' : 'Neutral'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Call content */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Summary:</h3>
                        <p className="text-sm text-muted-foreground">{call.summary}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Transcript:</h3>
                          <p className="text-sm text-muted-foreground">{call.transcript}</p>
                        </div>
                        
                        <div className="space-y-4">
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

                          {hasNeeds && (
                            <div>
                              <h3 className="text-sm font-medium mb-2 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                                Farmer Needs:
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {call.needs_fertilizer && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 flex items-center">
                                    <Droplet className="h-3 w-3 mr-1" />
                                    Fertilizer
                                  </span>
                                )}
                                {call.needs_seed_cane && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 flex items-center">
                                    <Leaf className="h-3 w-3 mr-1" />
                                    Seed Cane
                                  </span>
                                )}
                                {call.needs_harvesting && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 flex items-center">
                                    <Sun className="h-3 w-3 mr-1" />
                                    Harvesting
                                  </span>
                                )}
                                {call.needs_ploughing && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 flex items-center">
                                    <Tractor className="h-3 w-3 mr-1" />
                                    Ploughing
                                  </span>
                                )}
                                {call.has_crop_issues && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 flex items-center">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Crop Issues
                                  </span>
                                )}
                                {call.needs_pesticide && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 flex items-center">
                                    <Layers className="h-3 w-3 mr-1" />
                                    Pesticide
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Resolution Modal */}
      {selectedCall && (
        <ResolveIssueModal
          call={selectedCall}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedCall(null)
          }}
          onResolve={refreshData}
        />
      )}
    </div>
  )
} 