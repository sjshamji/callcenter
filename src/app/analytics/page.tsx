"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  TooltipProps,
  AreaChart,
  Area
} from 'recharts'
import { 
  ArrowDownRight, 
  ArrowRight, 
  ArrowUpRight, 
  Loader2, 
  Phone, 
  Users, 
  CalendarRange, 
  Clock, 
  Share2,
  BarChart2,
  Zap,
  Droplet,
  Leaf, 
  Sun, 
  Tractor,
  AlertTriangle,
  Bug,
  MapPin,
  User
} from 'lucide-react'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import SentimentTrendChart from '@/components/SentimentTrendChart'
import NeedsCorrelationMatrix from '@/components/NeedsCorrelationMatrix'
import PredictiveAnalyticsCard from '@/components/PredictiveAnalyticsCard'
import dynamic from 'next/dynamic'

// Import the utils you need
import { NEED_TYPES, NEED_COLORS, NEEDS_MAP as ORIGINAL_NEEDS_MAP } from '@/lib/constants'

// Define a reverse map for need labels to field names
const NEEDS_MAP: { [key: string]: string } = {}

// Initialize the reverse mapping
Object.entries(ORIGINAL_NEEDS_MAP).forEach(([field, label]) => {
  NEEDS_MAP[label] = field
})

// Types
interface Farmer {
  "Farmer ID": string
  "Farmer Name": string
  "Farm Size (Acres)": number
  "Location": string
  "GPS Coordinates": string
  "Preferred Language": string
  "Age": number
  "Gender": string
  [key: string]: any // For any other properties
}

// Define the Call interface
interface Call {
  id: string
  timestamp: string
  farmer_id: string
  duration: number
  need_type: string
  sentiment: number
  transcription: string
  resolved: boolean
  needs_fertilizer?: boolean
  needs_seed_cane?: boolean
  needs_harvesting?: boolean
  needs_ploughing?: boolean
  has_crop_issues?: boolean
  needs_pesticide?: boolean
  created_at: string
}

// Define the DetailedCall interface that extends Call
interface DetailedCall extends Call {
  farmer?: {
    id: string
  name: string
    phone: string
    land_size: number
    created_at: string
  }
}

interface Stats {
  totalCalls: number
  totalFarmers: number
  avgCallsPerDay: number
  avgCallDuration: number
  positiveCallsPercentage: number
  resolvedCallsPercentage: number
}

// Fetch helper with error handling
const fetchData = async (url: string) => {
  try {
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error)
    return []
  }
}

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return `${date.getDate()}/${date.getMonth() + 1}`
}

// Helper function to format time
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Add icon map for issue types
const issueIconMap: { [key: string]: React.ReactNode } = {
  'needs_fertilizer': <Droplet className="h-5 w-5 text-blue-500" />,
  'needs_seed_cane': <Leaf className="h-5 w-5 text-green-500" />,
  'needs_harvesting': <Sun className="h-5 w-5 text-amber-500" />,
  'needs_ploughing': <Tractor className="h-5 w-5 text-orange-500" />,
  'has_crop_issues': <AlertTriangle className="h-5 w-5 text-red-500" />,
  'needs_pesticide': <Bug className="h-5 w-5 text-purple-500" />
}

// Create dynamic component for Leaflet to avoid SSR issues
const MapComponent = dynamic(
  () => import('../../components/FarmerMapComponent'), 
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading map...</span>
      </div>
    )
  }
);

export default function AnalyticsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [stats, setStats] = useState<Stats>({
    totalCalls: 0,
    totalFarmers: 0,
    avgCallsPerDay: 0,
    avgCallDuration: 0,
    positiveCallsPercentage: 0,
    resolvedCallsPercentage: 0
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [selectedNeedType, setSelectedNeedType] = useState<string | null>(null)
  const [filteredCalls, setFilteredCalls] = useState<DetailedCall[]>([])
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)
  const [issueFilteredCalls, setIssueFilteredCalls] = useState<DetailedCall[]>([])
  const [farmersWithLocation, setFarmersWithLocation] = useState<Array<any>>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      
      try {
        // Fetch calls and farmers data
        console.log('Fetching data from API...');
        const [callsData, farmersData] = await Promise.all([
          fetchData('/api/calls'),
          fetchData('/api/farmers?list_all=true')
        ]);
        
        console.log('API Responses:');
        console.log('Calls data:', callsData?.length || 0, 'records');
        console.log('Farmers data:', farmersData);
        
        // Set state with fetched data
        setCalls(callsData || []);
        
        // Extract the farmers array from the response
        const farmersArray = farmersData?.farmers || [];
        console.log('Extracted farmers array:', farmersArray?.length || 0, 'records');
        setFarmers(farmersArray);
        
        // Calculate statistics with fallbacks
        if (callsData?.length > 0) {
          const totalCalls = callsData.length;
          const totalFarmers = farmersArray.length || 0;
          
          // Calculate average calls per day
          const earliestCall = new Date(Math.min(...callsData.map((call: Call) => new Date(call.created_at).getTime())))
          const daysDifference = Math.max(1, Math.ceil((Date.now() - earliestCall.getTime()) / (1000 * 60 * 60 * 24)))
          const avgCallsPerDay = totalCalls / daysDifference
          
          // Calculate average call duration (with fallback for null/undefined durations)
          const avgCallDuration = callsData.reduce((acc: number, call: Call) => acc + (call.duration || 0), 0) / totalCalls
          
          // Calculate positive calls percentage
          const positiveCalls = callsData.filter((call: Call) => call.sentiment > 0).length
          const positiveCallsPercentage = (positiveCalls / totalCalls) * 100
          
          // Calculate resolved calls percentage
          const resolvedCalls = callsData.filter((call: Call) => call.resolved).length
          const resolvedCallsPercentage = (resolvedCalls / totalCalls) * 100
          
          setStats({
            totalCalls,
            totalFarmers,
            avgCallsPerDay,
            avgCallDuration,
            positiveCallsPercentage,
            resolvedCallsPercentage
          })
          
          console.log('Statistics calculated:', {
            totalCalls,
            totalFarmers,
            avgCallsPerDay,
            avgCallDuration,
            positiveCallsPercentage,
            resolvedCallsPercentage
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, []);

  // Combine calls with farmer data for detailed view
  const detailedCalls = useMemo(() => {
    console.log('Generating detailed calls, farmers data available:', farmers?.length || 0);
    
    return calls.map(call => {
      // Look up farmer by ID correctly with direct field access and improved logging
      let farmer = null;
      
      // Access call field safely, check both possible field locations
      const farmerId = call.farmer_id || (call as any)["Farmer ID"];
      
      if (farmerId) {
        console.log(`Looking for farmer with ID: ${farmerId} for call ID: ${call.id}`);
        
        // Try all possible field names
        farmer = farmers.find(f => {
          const matches = (
            ((f as any)["Farmer ID"] === farmerId) || 
            (f.id === farmerId) || 
            ((f as any).farmer_id === farmerId)
          );
          if (matches) {
            console.log(`Found farmer match: ${(f as any)["Farmer Name"] || f.name || 'Unknown'}`);
            return true;
          }
          return false;
        });
      }
      
      // Create a standardized farmer object for use in the UI
      const farmerData = farmer ? {
        id: (farmer as any)["Farmer ID"] || farmer.id || '',
        name: (farmer as any)["Farmer Name"] || farmer.name || 'Unknown',
        phone: farmer.phone || '',
        land_size: (farmer as any)["Farm Size (Acres)"] || (farmer as any).land_size || 0,
        created_at: farmer.created_at || ''
      } : undefined;
      
      if (farmer) {
        console.log('Mapped farmer:', farmerData?.name, 'for call:', call.id);
      } else {
        console.log('No farmer found for call ID:', call.id, 'Farmer ID:', call.farmer_id || (call as any)["Farmer ID"] || 'None');
      }
      
      return { ...call, farmer: farmerData };
    });
  }, [calls, farmers]);
  
  // Create data for call trend chart
  const callTrendData = useMemo(() => {
    if (!calls.length) return []
    
    // Group calls by day
    const callsByDay: Record<string, Call[]> = {}
    calls.forEach(call => {
      const date = formatDate(call.created_at)
      if (!callsByDay[date]) {
        callsByDay[date] = []
      }
      callsByDay[date].push(call)
    })
    
    // Convert to chart data format
    return Object.entries(callsByDay).map(([date, dayCalls]) => {
      const resolved = dayCalls.filter(call => call.resolved).length
      const unresolved = dayCalls.length - resolved
      
      return {
        date,
        total: dayCalls.length,
        resolved,
        unresolved
      }
    }).sort((a, b) => {
      const [aDay, aMonth] = a.date.split('/').map(Number)
      const [bDay, bMonth] = b.date.split('/').map(Number)
      
      if (aMonth !== bMonth) return aMonth - bMonth
      return aDay - bDay
    })
  }, [calls])
  
  // Function to handle need type selection
  const handleNeedTypeClick = (needType: string) => {
    if (selectedNeedType === needType) {
      // If clicking the same need type, clear the selection
      setSelectedNeedType(null)
      setFilteredCalls([])
    } else {
      // Set the selected need type and filter calls
      setSelectedNeedType(needType)
      
      // Find the corresponding field name for the need type
      const fieldName = NEEDS_MAP[needType]
      
      if (fieldName) {
        // Filter calls based on the need type
        const filtered = detailedCalls.filter(call => {
          const key = fieldName as keyof Call
          return call[key]
        })
        setFilteredCalls(filtered)
      }
    }
  }
  
  // Create data for need types chart (with click handler)
  const needTypesData = useMemo(() => {
    if (!calls.length) return []
    
    // Count calls by need type
    const needCounts: Record<string, number> = {}
    
    calls.forEach(call => {
      // Check each need type boolean field
      Object.entries(ORIGINAL_NEEDS_MAP).forEach(([field, label]) => {
        if (call[field as keyof Call]) {
          needCounts[label] = (needCounts[label] || 0) + 1
        }
      })
    })
    
    // Convert to chart data format
    return Object.entries(needCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [calls])
  
  // Calculate sentiment distribution
  const sentimentData = useMemo(() => {
    if (!calls.length) return []
    
    // Define sentiment ranges
    const ranges = [
      { name: 'Very Negative', min: -1, max: -0.6, color: '#ef4444' },
      { name: 'Negative', min: -0.6, max: -0.2, color: '#f97316' },
      { name: 'Neutral', min: -0.2, max: 0.2, color: '#a3a3a3' },
      { name: 'Positive', min: 0.2, max: 0.6, color: '#22c55e' },
      { name: 'Very Positive', min: 0.6, max: 1, color: '#10b981' }
    ]
    
    // Count calls by sentiment range
    const data = ranges.map(range => {
      const count = calls.filter(
        call => call.sentiment >= range.min && call.sentiment <= range.max
      ).length
      
      return {
        ...range,
        value: count
      }
    })
    
    return data
  }, [calls])
  
  // Add this within useEffect after setting farmers data
  useEffect(() => {
    // Create mock location data for farmers
    if (farmers.length > 0) {
      const farmersWithCoords = farmers.map((farmer, index) => {
        // Central Kenya coordinates with slight variation
        const baseLatitude = 0.0236;
        const baseLongitude = 37.9062;
        
        // Randomize locations a bit for visualization
        const latitude = baseLatitude + (Math.random() - 0.5) * 1.5;
        const longitude = baseLongitude + (Math.random() - 0.5) * 1.5;
        
        return {
          ...farmer,
          latitude,
          longitude,
          // Assign a region based on position
          region: index % 3 === 0 ? 'Northern' : index % 3 === 1 ? 'Central' : 'Southern'
        };
      });
      
      setFarmersWithLocation(farmersWithCoords);
    }
  }, [farmers]);

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track and analyze call center performance and farmer interactions</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 md:mt-0">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {loading ? (
        <div className="h-[50vh] flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="mt-4 text-lg text-muted-foreground">Loading analytics data...</p>
        </div>
      ) : (
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between space-y-0">
                    <div className="text-2xl font-bold">{stats.totalCalls}</div>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(stats.avgCallsPerDay * 10) / 10} calls/day avg
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Farmers Served</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between space-y-0">
                    <div className="text-2xl font-bold">{stats.totalFarmers}</div>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(stats.totalCalls / stats.totalFarmers * 10) / 10} calls per farmer
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Call Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between space-y-0">
                    <div className="text-2xl font-bold">{formatTime(stats.avgCallDuration)}</div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Minutes:Seconds</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resolution Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between space-y-0">
                    <div className="text-2xl font-bold">{Math.round(stats.resolvedCallsPercentage)}%</div>
                    <div className={`flex items-center text-sm ${stats.resolvedCallsPercentage >= 70 ? 'text-green-500' : 'text-amber-500'}`}>
                      {stats.resolvedCallsPercentage >= 70 ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowRight className="mr-1 h-4 w-4" />}
                    </div>
                </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {calls.filter(c => c.resolved).length} resolved issues
                  </p>
              </CardContent>
            </Card>
            </div>
            
            {/* Issue Categories with Icons */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Farmer Issue Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(ORIGINAL_NEEDS_MAP).map(([field, label]) => {
                    const count = calls.filter(call => call[field as keyof Call]).length;
                    const isSelected = selectedIssue === field;
                    
                    // Map fields to specific colors for the shading
                    const colorMap: Record<string, string> = {
                      'needs_fertilizer': 'bg-emerald-50',
                      'needs_seed_cane': 'bg-amber-50',
                      'needs_harvesting': 'bg-blue-50',
                      'needs_ploughing': 'bg-indigo-50',
                      'has_crop_issues': 'bg-red-50',
                      'needs_pesticide': 'bg-purple-50',
                    };
                    
                    const bgColor = colorMap[field] || 'bg-gray-50';
                    
                    return (
                      <div 
                        key={field}
                        className={`${bgColor} rounded-lg shadow-sm p-4 border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-transparent hover:border-gray-200'
                        }`}
                        onClick={() => {
                          if (selectedIssue === field) {
                            setSelectedIssue(null);
                            setIssueFilteredCalls([]);
                          } else {
                            setSelectedIssue(field);
                            const filtered = detailedCalls.filter(call => call[field as keyof Call]);
                            setIssueFilteredCalls(filtered);
                          }
                        }}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                            {issueIconMap[field]}
                          </div>
                          <h3 className="font-medium mb-1">{label}</h3>
                          <span className="text-2xl font-bold">{count}</span>
                          <span className="text-xs text-muted-foreground">issues</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Show details when an issue is selected */}
                {selectedIssue && issueFilteredCalls.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">
                      Farmers with {selectedIssue && ORIGINAL_NEEDS_MAP[selectedIssue as keyof typeof ORIGINAL_NEEDS_MAP]} Issues
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {issueFilteredCalls.map(call => {
                        // Create a one-line summary of the call transcript
                        const summaryText = call.transcription
                          ? call.transcription.length > 60 
                            ? call.transcription.substring(0, 60) + '...' 
                            : call.transcription
                          : 'No transcript available';
                          
                        return (
                          <div key={call.id} className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                            <div className="bg-gray-50 p-3 border-b border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm">{call.farmer?.name || 'Unknown Farmer'}</h4>
                                    {call.farmer?.id && (
                                      <span className="text-xs text-muted-foreground">ID: {call.farmer.id}</span>
                                    )}
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  call.resolved 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {call.resolved ? 'Resolved' : 'Pending'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="p-3">
                              <div className="text-sm font-medium mb-2">Summary:</div>
                              <p className="text-sm text-gray-600 italic mb-3">{summaryText}</p>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                {Object.entries(ORIGINAL_NEEDS_MAP).map(([field, label]) => {
                                  const fieldKey = field as keyof Call;
                                  return call[fieldKey] === true && (
                                    <Badge key={field} variant="outline" className="text-xs bg-gray-50">
                                      {label}
                                    </Badge>
                                  );
                                })}
                              </div>
                              
                              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <div className="text-xs text-muted-foreground flex items-center">
                                  <CalendarRange className="h-3 w-3 mr-1" />
                                  {new Date(call.created_at).toLocaleDateString()}
                                </div>
                                <div className={`text-xs font-bold ${
                                  call.sentiment < -0.2 
                                    ? 'text-red-700' 
                                    : call.sentiment > 0.2
                                    ? 'text-green-700'
                                    : 'text-gray-600'
                                }`}>
                                  Sentiment: {call.sentiment.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {selectedIssue && issueFilteredCalls.length === 0 && (
                  <div className="mt-6 text-center py-4 bg-gray-50 rounded-md">
                    <p className="text-muted-foreground">No farmers with this issue found</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Call Trend Chart */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl">Call Volume Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {callTrendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={callTrendData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" />
                          <YAxis allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="total" 
                            name="Total Calls"
                            stroke="#8884d8"
                            fill="#8884d8" 
                            fillOpacity={0.2}
                            activeDot={{ r: 6 }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="resolved" 
                            name="Resolved" 
                            stroke="#10b981" 
                            fill="#10b981"
                            fillOpacity={0.1}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="unresolved" 
                            name="Unresolved" 
                            stroke="#f97316" 
                            fill="#f97316"
                            fillOpacity={0.1} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No call data available
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          
              {/* Sentiment Distribution Chart */}
            <Card className="shadow-md">
                <CardHeader>
                <CardTitle className="text-xl">Sentiment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="h-[300px]">
                    {sentimentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                            innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                            paddingAngle={1}
                        dataKey="value"
                            nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend 
                            layout="horizontal" 
                            verticalAlign="bottom" 
                            align="center" 
                            iconType="circle"
                          />
                    </PieChart>
                  </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No sentiment data available
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
            </div>
            
            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 gap-6">
              {/* Need Types Chart */}
            <Card className="shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">Farmer Needs Distribution</CardTitle>
                    {selectedNeedType && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedNeedType(null)
                          setFilteredCalls([])
                        }}
                      >
                        Clear Selection
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {needTypesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={needTypesData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                          onClick={(data) => {
                            if (data && data.activePayload && data.activePayload.length > 0) {
                              const { name } = data.activePayload[0].payload;
                              handleNeedTypeClick(name);
                            }
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" />
                          <YAxis 
                            type="category" 
                          dataKey="name" 
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                            dataKey="value" 
                            name="Calls"
                            radius={[0, 4, 4, 0]}
                          >
                            {needTypesData.map((entry, index) => {
                              const needName = entry.name;
                              const color = (NEED_COLORS as Record<string, string>)[needName] || '#8884d8';
                              const isSelected = selectedNeedType === needName;
                              return (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={isSelected ? '#1e293b' : color}
                                  style={{ filter: isSelected ? 'brightness(120%)' : 'none' }}
                                />
                              )
                            })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No need type data available
                      </div>
                    )}
                  </div>
                  
                  {/* Show table when a need type is selected */}
                  {selectedNeedType && filteredCalls.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Conversations about {selectedNeedType}</h3>
                      <div className="overflow-x-auto rounded-md border">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Farmer
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Score
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sentiment
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Conversation
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCalls.map((call) => (
                              <tr key={call.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {call.farmer?.name || 'Unknown Farmer'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`${
                                    call.sentiment < 0 
                                      ? 'font-bold text-red-800' 
                                      : call.sentiment > 0
                                      ? 'text-green-700'
                                      : 'text-gray-600'
                                  }`}>
                                    {call.sentiment.toFixed(2)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    call.sentiment > 0.2 ? 'bg-green-100 text-green-800' :
                                    call.sentiment < -0.2 ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {call.sentiment > 0.2 ? 'Positive' :
                                     call.sentiment < -0.2 ? 'Negative' :
                                     'Neutral'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(call.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge variant={call.resolved ? 'default' : 'outline'}>
                                    {call.resolved ? 'Resolved' : 'Open'}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                                  <p className="truncate">{call.transcription}</p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {selectedNeedType && filteredCalls.length === 0 && (
                    <div className="mt-6 text-center py-4 bg-gray-50 rounded-md">
                      <p className="text-muted-foreground">No detailed data available for {selectedNeedType}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
            
            {/* Interactive Farmer Location Map */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Farmer Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] rounded-lg overflow-hidden border border-gray-200">
                  <MapComponent farmersData={farmersWithLocation} onSelectFarmer={setSelectedFarmer} />
                </div>
                
                <div className="flex items-center justify-center mt-3 gap-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                    <span className="text-xs">Northern ({farmersWithLocation.filter(f => f.region === 'Northern').length})</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                    <span className="text-xs">Central ({farmersWithLocation.filter(f => f.region === 'Central').length})</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                    <span className="text-xs">Southern ({farmersWithLocation.filter(f => f.region === 'Southern').length})</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            {/* Advanced Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sentiment Trend Analysis */}
              <SentimentTrendChart calls={calls} />
              
              {/* Predictive Analytics */}
              <PredictiveAnalyticsCard calls={calls} />
            </div>
            
            {/* Needs Correlation Matrix */}
            <NeedsCorrelationMatrix calls={calls} />
            
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center">
                  <Share2 className="h-5 w-5 text-primary mr-2" />
                  <CardTitle className="text-xl">AI Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-700 p-2 rounded-full">
                        <BarChart2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Trend Detection</h3>
                        <p className="text-sm text-muted-foreground">
                          {needTypesData.length > 0 && 
                            `There's a significant increase in ${needTypesData[0].name} needs, showing a ${Math.round(needTypesData[0].value / stats.totalCalls * 100)}% occurrence rate. Consider proactive outreach to farmers about this issue.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 text-amber-700 p-2 rounded-full">
                        <CalendarRange className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Seasonal Pattern</h3>
                        <p className="text-sm text-muted-foreground">
                          Call volume shows a {callTrendData.length > 3 ? 'rising' : 'consistent'} pattern 
                          in recent days. Prepare for continued {callTrendData.length > 3 ? 'growth' : 'demand'} 
                          in farmer support requests.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 text-green-700 p-2 rounded-full">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Optimization Opportunity</h3>
                        <p className="text-sm text-muted-foreground">
                          {stats.resolvedCallsPercentage < 70 
                            ? `Current resolution rate of ${Math.round(stats.resolvedCallsPercentage)}% is below target. Focus on improving follow-up procedures to increase resolutions.`
                            : `Strong resolution rate of ${Math.round(stats.resolvedCallsPercentage)}%. Continue the effective support strategy.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
} 