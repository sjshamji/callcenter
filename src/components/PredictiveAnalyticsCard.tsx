"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LabelList,
  Cell
} from 'recharts'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Calendar,
  Droplet,
  Leaf,
  Sun,
  Tractor,
  AlertTriangle,
  Layers
} from 'lucide-react'

interface Call {
  id: string
  timestamp?: string
  created_at?: string
  needs_fertilizer?: boolean
  needs_seed_cane?: boolean
  needs_harvesting?: boolean
  needs_ploughing?: boolean
  has_crop_issues?: boolean
  needs_pesticide?: boolean
}

interface PredictiveAnalyticsCardProps {
  calls: Call[]
}

// Need keys and display names
const needsMap = {
  'needs_fertilizer': { name: 'Fertilizer', color: '#3b82f6', icon: <Droplet className="h-4 w-4" /> },
  'needs_seed_cane': { name: 'Seed Cane', color: '#10b981', icon: <Leaf className="h-4 w-4" /> },
  'needs_harvesting': { name: 'Harvesting', color: '#f59e0b', icon: <Sun className="h-4 w-4" /> },
  'needs_ploughing': { name: 'Ploughing', color: '#8b5cf6', icon: <Tractor className="h-4 w-4" /> },
  'has_crop_issues': { name: 'Crop Issues', color: '#ef4444', icon: <AlertTriangle className="h-4 w-4" /> },
  'needs_pesticide': { name: 'Pesticide', color: '#ec4899', icon: <Layers className="h-4 w-4" /> }
}

// Time periods for forecast
type ForecastPeriod = 'week' | 'month' | 'quarter'

export default function PredictiveAnalyticsCard({ calls }: PredictiveAnalyticsCardProps) {
  const [forecastPeriod, setForecastPeriod] = useState<ForecastPeriod>('month')
  
  // Calculate historical frequencies of each need
  const historicalData = useMemo(() => {
    if (!calls.length) return []
    
    const needCounts: Record<string, number> = {}
    const needKeys = Object.keys(needsMap)
    
    // Initialize counts
    needKeys.forEach(key => {
      needCounts[key] = 0
    })
    
    // Count occurrences
    calls.forEach(call => {
      needKeys.forEach(key => {
        if (call[key as keyof Call]) {
          needCounts[key]++
        }
      })
    })
    
    // Calculate rates
    const totalCalls = calls.length
    return needKeys.map(key => ({
      need: key,
      name: needsMap[key as keyof typeof needsMap].name,
      rate: totalCalls ? needCounts[key] / totalCalls : 0,
      count: needCounts[key],
      color: needsMap[key as keyof typeof needsMap].color,
      icon: needsMap[key as keyof typeof needsMap].icon
    }))
  }, [calls])
  
  // Generate seasonal adjustments based on time of year
  const getSeasonalAdjustment = () => {
    const now = new Date()
    const month = now.getMonth() // 0-11
    
    // Simple seasonal model - just an example
    // In a real app, this would be trained on historical data
    return {
      needs_fertilizer: month >= 2 && month <= 4 ? 1.2 : month >= 9 && month <= 11 ? 1.15 : 1,
      needs_seed_cane: month >= 1 && month <= 3 ? 1.3 : month >= 8 && month <= 10 ? 1.1 : 0.9,
      needs_harvesting: month >= 4 && month <= 7 ? 1.4 : 0.7,
      needs_ploughing: month >= 7 && month <= 9 ? 1.3 : month >= 2 && month <= 4 ? 1.2 : 0.9,
      has_crop_issues: month >= 5 && month <= 8 ? 1.25 : 0.95,
      needs_pesticide: month >= 4 && month <= 9 ? 1.35 : 0.8
    }
  }
  
  // Generate predictions based on historical data
  const predictions = useMemo(() => {
    if (!historicalData.length) return []
    
    const seasonalAdjustments = getSeasonalAdjustment()
    const callsPerPeriod = {
      week: 4, // Assume 4 calls per week on average
      month: 18, // Assume 18 calls per month on average
      quarter: 55 // Assume 55 calls per quarter on average
    }
    
    // Expected calls in the forecast period
    const expectedCalls = callsPerPeriod[forecastPeriod]
    
    // Calculate predictions for each need
    return historicalData.map(item => {
      const needKey = item.need as keyof typeof seasonalAdjustments
      const seasonalFactor = seasonalAdjustments[needKey]
      
      // Base prediction is historical rate adjusted for seasonality
      const basePrediction = item.rate * seasonalFactor
      
      // Predicted count is the base prediction times expected calls
      const predictedCount = Math.round(basePrediction * expectedCalls)
      
      // Calculate confidence (just an example)
      const confidence = item.count > 10 ? 'High' : item.count > 5 ? 'Medium' : 'Low'
      
      // Calculate growth compared to historical rate
      const growthFactor = seasonalFactor - 1
      
      return {
        ...item,
        prediction: basePrediction,
        predictedCount,
        confidence,
        seasonalFactor,
        growthFactor
      }
    }).sort((a, b) => b.predictedCount - a.predictedCount)
  }, [historicalData, forecastPeriod])
  
  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded shadow-md text-sm">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: data.color }}>{data.icon}</span>
            <span className="font-medium">{data.name}</span>
          </div>
          <div>Predicted: <span className="font-medium">{data.predictedCount} calls</span></div>
          <div>
            <span>Growth:</span>
            <span className={`ml-1 font-medium ${data.growthFactor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(data.growthFactor >= 0 ? '+' : '')}{Math.round(data.growthFactor * 100)}%
            </span>
          </div>
          <div>Confidence: <span className="font-medium">{data.confidence}</span></div>
        </div>
      )
    }
    return null
  }
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-5 w-5 text-primary mr-1" />
            <CardTitle className="text-xl">Predictive Needs Analysis</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">Forecast:</span>
            <div className="flex gap-1">
              <Button 
                variant={forecastPeriod === 'week' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setForecastPeriod('week')}
                className="text-xs h-7"
              >
                Week
              </Button>
              <Button 
                variant={forecastPeriod === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setForecastPeriod('month')}
                className="text-xs h-7"
              >
                Month
              </Button>
              <Button 
                variant={forecastPeriod === 'quarter' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setForecastPeriod('quarter')}
                className="text-xs h-7"
              >
                Quarter
              </Button>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Predicted farmer needs over the next {forecastPeriod === 'week' ? 'week' : forecastPeriod === 'month' ? 'month' : '3 months'} based on historical patterns
        </p>
      </CardHeader>
      <CardContent>
        {!calls.length ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No call data available for prediction
          </div>
        ) : (
          <>
            {/* Prediction chart */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={predictions}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    domain={[0, 'dataMax + 2']} 
                    allowDecimals={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="predictedCount" radius={[0, 4, 4, 0]}>
                    {predictions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList 
                      dataKey="predictedCount" 
                      position="right" 
                      formatter={(value: number) => `${value}`}
                      style={{ fill: '#666', fontSize: 12, fontWeight: 500 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Key metrics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {predictions.slice(0, 3).map(item => (
                <div 
                  key={item.need}
                  className="bg-white dark:bg-gray-800 rounded-lg border p-3 flex items-start"
                >
                  <div 
                    className="rounded-full p-2 mr-3 flex-shrink-0" 
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">{item.predictedCount}</span>
                      <span className="text-xs text-muted-foreground">predicted calls</span>
                    </div>
                    <div className="flex items-center mt-1 text-xs">
                      {item.growthFactor >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={item.growthFactor >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(Math.round(item.growthFactor * 100))}% {item.growthFactor >= 0 ? 'increase' : 'decrease'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground flex items-center justify-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Seasonal factors included in forecast</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 