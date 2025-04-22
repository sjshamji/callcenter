"use client"

import { useState, useMemo } from 'react'
import { format, subDays, differenceInDays, addDays, isSameDay } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react'

type TimeRange = 'week' | 'month' | '3months' | 'year'

interface Call {
  id: string
  timestamp?: string
  created_at?: string
  sentiment: number
}

// Props for the SentimentTrendChart component
interface SentimentTrendChartProps {
  calls: Call[]
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-md">
        <p className="text-sm font-medium">{format(new Date(label), 'MMM d, yyyy')}</p>
        <p className="text-sm">
          <span className="font-medium">Sentiment: </span>
          <span className={`${payload[0].value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {payload[0].value > 0 ? '+' : ''}{payload[0].value.toFixed(2)}
          </span>
        </p>
        <p className="text-sm">
          <span className="font-medium">Calls: </span>
          {payload[1].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function SentimentTrendChart({ calls }: SentimentTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  
  // Get date range based on selected time range
  const getDateRange = () => {
    const today = new Date()
    
    switch (timeRange) {
      case 'week':
        return subDays(today, 7)
      case 'month':
        return subDays(today, 30)
      case '3months':
        return subDays(today, 90)
      case 'year':
        return subDays(today, 365)
      default:
        return subDays(today, 30)
    }
  }
  
  // Generate chart data
  const chartData = useMemo(() => {
    if (!calls.length) return []
    
    const startDate = getDateRange()
    const endDate = new Date()
    const daysDiff = differenceInDays(endDate, startDate)
    
    // Create array of all dates in range
    const dateArray = Array.from({ length: daysDiff + 1 }, (_, i) => {
      return addDays(startDate, i)
    })
    
    // Group calls by date
    const callsByDate = dateArray.map(date => {
      const daysCalls = calls.filter(call => {
        const callDate = new Date(call.timestamp || call.created_at || 0)
        return isSameDay(callDate, date)
      })
      
      const avgSentiment = daysCalls.length
        ? daysCalls.reduce((sum, call) => sum + call.sentiment, 0) / daysCalls.length
        : null
      
      return {
        date: date.toISOString(),
        sentiment: avgSentiment !== null ? Number(avgSentiment.toFixed(2)) : null,
        calls: daysCalls.length,
      }
    })
    
    // For dates with no data, interpolate sentiment if possible
    let lastKnownSentiment = 0
    let gapCount = 0
    
    return callsByDate.map((day, i) => {
      if (day.sentiment !== null) {
        lastKnownSentiment = day.sentiment
        gapCount = 0
        return day
      }
      
      // For empty days, either use last known value or null
      return {
        ...day,
        sentiment: gapCount < 5 ? lastKnownSentiment : null,
      }
    })
  }, [calls, timeRange])
  
  // Calculate trend
  const calculateTrend = () => {
    if (chartData.length < 2) return 0
    
    const validData = chartData.filter(d => d.sentiment !== null)
    if (validData.length < 2) return 0
    
    const firstPoint = validData[0].sentiment || 0
    const lastPoint = validData[validData.length - 1].sentiment || 0
    
    return lastPoint - firstPoint
  }
  
  const trend = calculateTrend()
  const trendIcon = trend > 0.05 
    ? <TrendingUp className="h-5 w-5 text-green-500" /> 
    : trend < -0.05 
      ? <TrendingDown className="h-5 w-5 text-red-500" />
      : <ArrowRight className="h-5 w-5 text-yellow-500" />
  
  // Calculate average sentiment
  const averageSentiment = useMemo(() => {
    const validData = chartData.filter(d => d.sentiment !== null)
    if (!validData.length) return 0
    
    const sum = validData.reduce((acc, d) => acc + (d.sentiment || 0), 0)
    return sum / validData.length
  }, [chartData])
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Sentiment Trend Analysis</CardTitle>
          <div className="flex gap-1">
            <Button 
              variant={timeRange === 'week' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('week')}
              className="text-xs h-7"
            >
              Week
            </Button>
            <Button 
              variant={timeRange === 'month' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('month')}
              className="text-xs h-7"
            >
              Month
            </Button>
            <Button 
              variant={timeRange === '3months' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('3months')}
              className="text-xs h-7"
            >
              3 Months
            </Button>
            <Button 
              variant={timeRange === 'year' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('year')}
              className="text-xs h-7"
            >
              Year
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">Trend:</span>
              <div className="flex items-center ml-2">
                {trendIcon}
                <span className={`ml-1 font-medium ${
                  trend > 0.05 ? 'text-green-600' : 
                  trend < -0.05 ? 'text-red-600' : 
                  'text-yellow-600'
                }`}>
                  {trend > 0 ? '+' : ''}{trend.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">Average: </span>
            <span className={`font-medium ${
              averageSentiment > 0.2 ? 'text-green-600' : 
              averageSentiment < -0.2 ? 'text-red-600' : 
              'text-yellow-600'
            }`}>
              {averageSentiment > 0 ? '+' : ''}{averageSentiment.toFixed(2)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="sentimentFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(tick) => format(new Date(tick), timeRange === 'week' ? 'EEE' : 'MMM d')}
                tick={{ fontSize: 12 }}
                minTickGap={20}
              />
              <YAxis 
                domain={[-1, 1]} 
                tickFormatter={(tick) => tick.toFixed(1)}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="sentiment" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                connectNulls
              />
              <Area 
                type="monotone" 
                dataKey="calls" 
                fill="rgba(59, 130, 246, 0.1)" 
                stroke="none" 
                yAxisId={1}
              />
              <YAxis 
                yAxisId={1} 
                orientation="right" 
                domain={[0, 'auto']}
                allowDecimals={false}
                width={25}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 