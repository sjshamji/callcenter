"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts'
import { FARMING_CATEGORIES } from '@/lib/constants'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Tractor, 
  Leaf, 
  Droplet, 
  Sun, 
  BarChart3, 
  AlertTriangle,
  Layers,
  MapPin,
  Calendar,
  Clock,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

// Dynamically import the map component with no SSR to avoid window issues
const FarmMap = dynamic(() => import('@/components/FarmMap'), { ssr: false })

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
  "Farmer ID"?: string 
  "Farmer Name"?: string
  summary?: string
}

interface CategoryCount {
  name: string
  count: number
}

interface NeedCount {
  name: string
  count: number
  color: string
  icon: string
}

interface SentimentData {
  name: string
  value: number
  color: string
}

interface Farmer {
  "Farmer ID": string
  "Farmer Name"?: string
  "Location"?: string
  "GPS Coordinates"?: string
  "Farm Size (Acres)"?: number
}

// Update DetailedCall interface to avoid redundancy with Call interface
// since we already added the fields to the Call interface
interface DetailedCall extends Call {
  priority?: number
  resolved?: boolean
}

const COLORS = {
  positive: '#10b981',
  neutral: '#f59e0b',
  negative: '#ef4444',
  fertilizer: '#3b82f6',
  seedCane: '#10b981',
  harvesting: '#f59e0b',  
  ploughing: '#8b5cf6',
  cropIssues: '#ef4444',
  pesticide: '#ec4899',
  primary: '#06b6d4',
  secondary: '#8b5cf6',
  accent: '#f97316'
};

export default function Analytics() {
  const [calls, setCalls] = useState<Call[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryStats, setCategoryStats] = useState<CategoryCount[]>([])
  const [needsStats, setNeedsStats] = useState<NeedCount[]>([])
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([])
  const [averageSentiment, setAverageSentiment] = useState(0)
  const [totalCalls, setTotalCalls] = useState(0)
  const [recentCallsWithIssues, setRecentCallsWithIssues] = useState(0)
  
  // Add new state for selected need and filtered calls
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null)
  const [filteredCalls, setFilteredCalls] = useState<DetailedCall[]>([])
  const [showTable, setShowTable] = useState(false)
  
  // Add sorting state
  const [sortField, setSortField] = useState<string>('timestamp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

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

  // Helper function to get sentiment icon
  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.2) return <TrendingUp className="w-6 h-6 text-green-500" />;
    if (sentiment < -0.2) return <TrendingDown className="w-6 h-6 text-red-500" />;
    return <Minus className="w-6 h-6 text-yellow-500" />;
  }

  // Helper function to get need icon
  const getNeedIcon = (needType: string) => {
    switch (needType) {
      case 'Fertilizer':
        return <Droplet className="w-5 h-5" />;
      case 'Seed Cane':
        return <Leaf className="w-5 h-5" />;
      case 'Harvesting':
        return <Sun className="w-5 h-5" />;
      case 'Ploughing':
        return <Tractor className="w-5 h-5" />;
      case 'Crop Issues':
        return <AlertTriangle className="w-5 h-5" />;
      case 'Pesticide':
        return <Layers className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  }

  // Function to handle when a need type is clicked
  const handleNeedClick = (needType: string, needKey: string) => {
    if (selectedNeed === needType) {
      // If already selected, toggle off
      setSelectedNeed(null)
      setFilteredCalls([])
      setShowTable(false)
    } else {
      // Set the selected need type
      setSelectedNeed(needType)
      
      // Filter calls for the selected need
      const filtered = calls
        .filter((call: Call) => call[needKey as keyof Call] === true)
        .map((call: Call) => {
          // Find matching farmer for this call
          const farmer = farmers.find(f => f["Farmer ID"] === call["Farmer ID"])
          
          return {
            ...call,
            "Farmer Name": farmer?.["Farmer Name"] || "Unknown"
          }
        })
        .sort((a, b) => {
          // Sort by date (newest first)
          const dateA = new Date(a.timestamp || a.created_at || 0)
          const dateB = new Date(b.timestamp || b.created_at || 0)
          return dateB.getTime() - dateA.getTime()
        })
      
      setFilteredCalls(filtered)
      setShowTable(true)
      // Reset sort to default
      setSortField('timestamp')
      setSortDirection('desc')
    }
  }

  // Add function to sort data
  const handleSort = (field: string) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, set default direction
      setSortField(field)
      setSortDirection(field === 'sentiment' ? 'desc' : 'asc')
    }

    // Sort the data
    const sorted = [...filteredCalls].sort((a, b) => {
      if (field === 'timestamp' || field === 'created_at') {
        const dateA = new Date(a.timestamp || a.created_at || 0)
        const dateB = new Date(b.timestamp || b.created_at || 0)
        return sortDirection === 'asc' 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime()
      }
      
      if (field === 'sentiment') {
        return sortDirection === 'asc' 
          ? a.sentiment - b.sentiment 
          : b.sentiment - a.sentiment
      }
      
      // Default string comparison for other fields
      const valA = String(a[field as keyof DetailedCall] || '')
      const valB = String(b[field as keyof DetailedCall] || '')
      return sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA)
    })
    
    setFilteredCalls(sorted)
  }
  
  // Function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch (e) {
      return 'Invalid date'
    }
  }
  
  // Function to format time
  const formatTime = (dateString?: string) => {
    if (!dateString) return ''
    try {
      return format(new Date(dateString), 'h:mm a')
    } catch (e) {
      return ''
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch calls data
        const callsResponse = await fetch('/api/calls')
        if (!callsResponse.ok) throw new Error('Failed to fetch calls')
        const callsData = await callsResponse.json()
        setCalls(callsData)
        setTotalCalls(callsData.length)
        
        // Fetch farmers data for map
        const farmersResponse = await fetch('/api/farmers?list_all=true')
        if (!farmersResponse.ok) throw new Error('Failed to fetch farmers')
        const farmersData = await farmersResponse.json()
        setFarmers(farmersData.farmers || [])
        
        // Calculate issues in recent calls (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentIssues = callsData.filter((call: Call) => {
          const callDate = new Date(call.timestamp || call.created_at || Date.now());
          return (
            callDate >= oneWeekAgo && 
            (call.has_crop_issues || call.sentiment < -0.2)
          );
        }).length;
        
        setRecentCallsWithIssues(recentIssues);
        
        // Calculate category statistics
        const categoryCount = FARMING_CATEGORIES.map(category => ({
          name: category,
          count: callsData.filter((call: Call) => 
            ensureCategoriesArray(call.categories).includes(category)
          ).length
        })).sort((a, b) => b.count - a.count);
        
        setCategoryStats(categoryCount);
        
        // Calculate needs statistics
        const needsCount = [
          { 
            name: 'Fertilizer', 
            count: callsData.filter((call: Call) => call.needs_fertilizer).length,
            color: COLORS.fertilizer,
            icon: 'Droplet'
          },
          { 
            name: 'Seed Cane', 
            count: callsData.filter((call: Call) => call.needs_seed_cane).length,
            color: COLORS.seedCane,
            icon: 'Leaf'
          },
          { 
            name: 'Harvesting', 
            count: callsData.filter((call: Call) => call.needs_harvesting).length,
            color: COLORS.harvesting,
            icon: 'Sun'
          },
          { 
            name: 'Ploughing', 
            count: callsData.filter((call: Call) => call.needs_ploughing).length,
            color: COLORS.ploughing,
            icon: 'Tractor'
          },
          { 
            name: 'Crop Issues', 
            count: callsData.filter((call: Call) => call.has_crop_issues).length,
            color: COLORS.cropIssues,
            icon: 'AlertTriangle'
          },
          { 
            name: 'Pesticide', 
            count: callsData.filter((call: Call) => call.needs_pesticide).length,
            color: COLORS.pesticide,
            icon: 'Layers'
          },
        ].filter(need => need.count > 0);
        
        setNeedsStats(needsCount);
        
        // Calculate sentiment distribution
        const positive = callsData.filter((call: Call) => call.sentiment > 0.2).length;
        const negative = callsData.filter((call: Call) => call.sentiment < -0.2).length;
        const neutral = callsData.length - positive - negative;
        
        setSentimentData([
          { name: 'Positive', value: positive, color: COLORS.positive },
          { name: 'Neutral', value: neutral, color: COLORS.neutral },
          { name: 'Negative', value: negative, color: COLORS.negative }
        ]);
        
        // Calculate average sentiment
        const totalSentiment = callsData.reduce((acc: number, call: Call) => acc + call.sentiment, 0);
        setAverageSentiment(callsData.length > 0 ? totalSentiment / callsData.length : 0);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded shadow-lg p-3">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-sm">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  // Close table when clicking outside
  const handleCloseTable = () => {
    setSelectedNeed(null)
    setFilteredCalls([])
    setShowTable(false)
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Farming Analytics Dashboard</h1>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="ml-3 text-muted-foreground">Loading analytics...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Overview stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Calls</p>
                    <p className="text-3xl font-bold">{totalCalls}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Average Sentiment</p>
                    <div className="flex items-center">
                      <p className="text-3xl font-bold mr-2">
                        {averageSentiment > 0 ? '+' : ''}{averageSentiment.toFixed(2)}
                      </p>
                      {getSentimentIcon(averageSentiment)}
                    </div>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    averageSentiment > 0.2 ? 'bg-green-100 text-green-600' :
                    averageSentiment < -0.2 ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {getSentimentIcon(averageSentiment)}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Recent Issues</p>
                    <p className="text-3xl font-bold">{recentCallsWithIssues}</p>
                    <p className="text-xs text-muted-foreground mt-1">In the last 7 days</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main dashboard content - Note: Removed Categories Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment distribution */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Sentiment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Farmer needs */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Farmer Needs</CardTitle>
              </CardHeader>
              <CardContent>
                {needsStats.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No needs data available</p>
                  </div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={needsStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                        <XAxis 
                          dataKey="name" 
                          angle={-30} 
                          textAnchor="end" 
                          height={70} 
                          tick={{fontSize: 12}}
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="count" 
                          barSize={40} 
                          radius={[4, 4, 0, 0]}
                        >
                          {needsStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Farmer Needs Overview - Updated to be clickable */}
            <Card className="shadow-md lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Farmer Needs Overview</CardTitle>
                <p className="text-sm text-muted-foreground">Click on a need type to see related conversations</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Fertilizer', key: 'needs_fertilizer', color: COLORS.fertilizer, icon: <Droplet className="h-6 w-6" /> },
                    { label: 'Seed Cane', key: 'needs_seed_cane', color: COLORS.seedCane, icon: <Leaf className="h-6 w-6" /> },
                    { label: 'Harvesting', key: 'needs_harvesting', color: COLORS.harvesting, icon: <Sun className="h-6 w-6" /> },
                    { label: 'Ploughing', key: 'needs_ploughing', color: COLORS.ploughing, icon: <Tractor className="h-6 w-6" /> },
                    { label: 'Crop Issues', key: 'has_crop_issues', color: COLORS.cropIssues, icon: <AlertTriangle className="h-6 w-6" /> },
                    { label: 'Pesticide', key: 'needs_pesticide', color: COLORS.pesticide, icon: <Layers className="h-6 w-6" /> },
                  ].map((need) => {
                    const count = calls.filter((call: any) => call[need.key]).length
                    const isSelected = selectedNeed === need.label
                    
                    return (
                      <div 
                        key={need.key}
                        onClick={() => count > 0 && handleNeedClick(need.label, need.key)}
                        className={`rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all ${
                          count > 0 ? 'cursor-pointer hover:shadow-md' : 'opacity-60 cursor-not-allowed'
                        } ${isSelected ? 'ring-2 ring-offset-2 shadow-lg' : ''}`}
                        style={{ 
                          backgroundColor: `${need.color}20`,
                          borderColor: isSelected ? need.color : 'transparent',
                          ...(isSelected && { ringColor: need.color })
                        }}
                      >
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                            isSelected ? 'bg-opacity-70' : 'bg-opacity-40'
                          }`}
                          style={{ backgroundColor: `${need.color}40`, color: need.color }}
                        >
                          {need.icon}
                        </div>
                        <div className="font-medium text-sm">{need.label}</div>
                        <div className="text-2xl font-bold mt-1">
                          {count}
                        </div>
                        {isSelected && (
                          <ChevronDown className="w-4 h-4 mt-1" style={{ color: need.color }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Call Details Table - New component */}
            {showTable && filteredCalls.length > 0 && (
              <Card className="shadow-md lg:col-span-2 animate-in fade-in duration-300">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {selectedNeed} Conversations ({filteredCalls.length})
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Recent conversations where farmers needed {selectedNeed?.toLowerCase()}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCloseTable}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            className="cursor-pointer hover:text-primary" 
                            onClick={() => handleSort('timestamp')}
                          >
                            Date {sortField === 'timestamp' && (
                              sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                            )}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:text-primary"
                            onClick={() => handleSort('Farmer Name')}
                          >
                            Farmer {sortField === 'Farmer Name' && (
                              sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                            )}
                          </TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead className="hidden md:table-cell">Summary</TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:text-primary"
                            onClick={() => handleSort('sentiment')}
                          >
                            Sentiment {sortField === 'sentiment' && (
                              sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                            )}
                          </TableHead>
                          <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCalls.map((call) => (
                          <TableRow key={call.id}>
                            <TableCell>
                              <div className="font-medium">{formatDate(call.timestamp || call.created_at)}</div>
                              <div className="text-xs text-muted-foreground flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(call.timestamp || call.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>{call["Farmer Name"] || 'Unknown'}</TableCell>
                            <TableCell>{call["Farmer ID"] || 'N/A'}</TableCell>
                            <TableCell className="hidden md:table-cell max-w-[300px] truncate">
                              {call.summary || 'No summary available'}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                                call.sentiment > 0.2 ? 'bg-green-100 text-green-700' :
                                call.sentiment < -0.2 ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {call.sentiment > 0.2 ? 'Positive' :
                                 call.sentiment < -0.2 ? 'Negative' : 'Neutral'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-bold ${
                                call.sentiment < -0.2 ? 'text-red-800' :
                                call.sentiment > 0.2 ? 'text-green-800' :
                                'text-amber-700'
                              }`}>
                                {call.sentiment > 0 ? '+' : ''}{call.sentiment.toFixed(2)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Farm Locations Map */}
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-600" />
                    Farm Locations Map
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full rounded-md overflow-hidden">
                  {!loading && <FarmMap farmers={farmers} />}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
} 