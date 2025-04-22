"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InfoIcon } from 'lucide-react'

// Simple custom tooltip component to avoid dependency issues
const InfoTooltip = ({ content }: { content: string }) => {
  const [isVisible, setIsVisible] = useState(false)
  
  return (
    <div className="relative inline-block">
      <span 
        className="cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <InfoIcon className="h-4 w-4 text-muted-foreground" />
      </span>
      
      {isVisible && (
        <div className="absolute z-50 w-64 p-2 mt-2 text-sm bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 -translate-x-1/2 left-1/2">
          {content}
        </div>
      )}
    </div>
  )
}

interface Call {
  id: string
  needs_fertilizer?: boolean
  needs_seed_cane?: boolean
  needs_harvesting?: boolean
  needs_ploughing?: boolean
  has_crop_issues?: boolean
  needs_pesticide?: boolean
}

interface NeedsCorrelationMatrixProps {
  calls: Call[]
}

// A map of need keys to display names
const needsMap = {
  'needs_fertilizer': 'Fertilizer',
  'needs_seed_cane': 'Seed Cane',
  'needs_harvesting': 'Harvesting',
  'needs_ploughing': 'Ploughing',
  'has_crop_issues': 'Crop Issues',
  'needs_pesticide': 'Pesticide'
}

// Need keys for iteration
const needKeys = Object.keys(needsMap) as Array<keyof typeof needsMap>

// Calculate Pearson correlation coefficient
const calculateCorrelation = (arrayX: number[], arrayY: number[]): number => {
  // Ensure arrays have the same length
  if (arrayX.length !== arrayY.length) {
    throw new Error('Arrays must have the same length')
  }
  
  const n = arrayX.length
  
  // Calculate means
  const meanX = arrayX.reduce((sum, val) => sum + val, 0) / n
  const meanY = arrayY.reduce((sum, val) => sum + val, 0) / n
  
  // Calculate covariance and variances
  let covariance = 0
  let varianceX = 0
  let varianceY = 0
  
  for (let i = 0; i < n; i++) {
    const xDiff = arrayX[i] - meanX
    const yDiff = arrayY[i] - meanY
    covariance += xDiff * yDiff
    varianceX += xDiff * xDiff
    varianceY += yDiff * yDiff
  }
  
  // Handle zero variance (no variation in data)
  if (varianceX === 0 || varianceY === 0) {
    return 0
  }
  
  // Calculate correlation
  return covariance / (Math.sqrt(varianceX) * Math.sqrt(varianceY))
}

// Get color based on correlation value
const getColorForCorrelation = (correlation: number): string => {
  if (correlation >= 0.7) return 'bg-green-600 text-white'
  if (correlation >= 0.5) return 'bg-green-400 text-white'
  if (correlation >= 0.3) return 'bg-green-300 text-green-900'
  if (correlation >= 0.1) return 'bg-green-200 text-green-900'
  if (correlation >= -0.1) return 'bg-gray-100 text-gray-700'
  if (correlation >= -0.3) return 'bg-red-200 text-red-900'
  if (correlation >= -0.5) return 'bg-red-300 text-red-900'
  if (correlation >= -0.7) return 'bg-red-400 text-white'
  return 'bg-red-600 text-white'
}

// Interpret correlation value
const interpretCorrelation = (correlation: number): string => {
  const absCorrelation = Math.abs(correlation)
  
  if (absCorrelation >= 0.9) return 'Very strong'
  if (absCorrelation >= 0.7) return 'Strong'
  if (absCorrelation >= 0.5) return 'Moderate'
  if (absCorrelation >= 0.3) return 'Weak'
  if (absCorrelation >= 0.1) return 'Very weak'
  return 'No correlation'
}

export default function NeedsCorrelationMatrix({ calls }: NeedsCorrelationMatrixProps) {
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null)
  
  // Calculate correlation matrix
  const correlationMatrix = useMemo(() => {
    const matrix: { [key: string]: { [key: string]: number } } = {}
    
    // Initialize matrix with zeros
    needKeys.forEach(keyA => {
      matrix[keyA] = {}
      needKeys.forEach(keyB => {
        matrix[keyA][keyB] = 0
      })
    })
    
    // Skip calculation if no calls
    if (!calls.length) return matrix
    
    // Calculate correlations
    needKeys.forEach(keyA => {
      needKeys.forEach(keyB => {
        // Self correlation is always 1
        if (keyA === keyB) {
          matrix[keyA][keyB] = 1
          return
        }
        
        // Convert boolean values to 0/1 for correlation calculation
        const arrayA = calls.map(call => call[keyA] ? 1 : 0)
        const arrayB = calls.map(call => call[keyB] ? 1 : 0)
        
        try {
          const correlation = calculateCorrelation(arrayA, arrayB)
          matrix[keyA][keyB] = correlation
        } catch (error) {
          console.error(`Error calculating correlation for ${keyA} and ${keyB}:`, error)
          matrix[keyA][keyB] = 0
        }
      })
    })
    
    return matrix
  }, [calls])
  
  // Find the top correlations (positive and negative)
  const topCorrelations = useMemo(() => {
    const pairs: Array<{
      needA: string
      needB: string
      correlation: number
    }> = []
    
    // Extract all pairs and their correlations
    needKeys.forEach((keyA, i) => {
      needKeys.forEach((keyB, j) => {
        // Only consider each pair once and exclude self-correlations
        if (j > i) {
          pairs.push({
            needA: keyA,
            needB: keyB,
            correlation: correlationMatrix[keyA][keyB]
          })
        }
      })
    })
    
    // Sort by absolute correlation value (highest first)
    return pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
  }, [correlationMatrix])
  
  // Selected pair details
  const selectedPairDetails = useMemo(() => {
    if (!selectedPair) return null
    
    const [needA, needB] = selectedPair
    const correlation = correlationMatrix[needA][needB]
    
    return {
      needA: needsMap[needA as keyof typeof needsMap],
      needB: needsMap[needB as keyof typeof needsMap],
      correlation,
      interpretation: interpretCorrelation(correlation),
      isPositive: correlation > 0,
      strength: Math.abs(correlation),
      implication: correlation > 0.3 
        ? `Farmers who need ${needsMap[needA as keyof typeof needsMap]} are likely to also need ${needsMap[needB as keyof typeof needsMap]}.`
        : correlation < -0.3
        ? `Farmers who need ${needsMap[needA as keyof typeof needsMap]} are less likely to need ${needsMap[needB as keyof typeof needsMap]}.`
        : `There is no strong relationship between ${needsMap[needA as keyof typeof needsMap]} and ${needsMap[needB as keyof typeof needsMap]} needs.`
    }
  }, [selectedPair, correlationMatrix])
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Needs Correlation Analysis</CardTitle>
            <InfoTooltip content="This matrix shows how different farmer needs relate to each other. Positive correlations (green) indicate needs that often occur together, while negative correlations (red) suggest needs that rarely occur together." />
          </div>
          {selectedPair && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedPair(null)}
              className="h-7 px-2"
            >
              Back to Matrix
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {selectedPair && selectedPairDetails ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
            <h3 className="text-lg font-medium mb-3">
              Relationship: {selectedPairDetails.needA} & {selectedPairDetails.needB}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">Correlation Coefficient</div>
                <div className={`text-2xl font-bold ${
                  selectedPairDetails.correlation > 0.1 ? 'text-green-600' :
                  selectedPairDetails.correlation < -0.1 ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {selectedPairDetails.correlation.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">Strength</div>
                <div className="text-2xl font-bold">
                  {selectedPairDetails.interpretation}
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm mb-4">
              <div className="text-sm text-muted-foreground mb-1">Practical Implication</div>
              <div className="text-gray-800 dark:text-gray-200">
                {selectedPairDetails.implication}
              </div>
            </div>
            
            <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  selectedPairDetails.correlation > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.abs(selectedPairDetails.correlation) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-1.0</span>
              <span>0</span>
              <span>+1.0</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2 bg-gray-50">Need</th>
                    {needKeys.map(key => (
                      <th key={key} className="p-2 text-center bg-gray-50">
                        {needsMap[key].slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {needKeys.map(keyA => (
                    <tr key={keyA}>
                      <td className="p-2 font-medium bg-gray-50">
                        {needsMap[keyA]}
                      </td>
                      {needKeys.map(keyB => {
                        const correlation = correlationMatrix[keyA][keyB]
                        return (
                          <td 
                            key={`${keyA}-${keyB}`}
                            className={`p-2 text-center cursor-pointer hover:opacity-90 ${
                              keyA === keyB ? 'bg-gray-300 text-gray-700' : getColorForCorrelation(correlation)
                            }`}
                            onClick={() => {
                              if (keyA !== keyB) {
                                setSelectedPair([keyA, keyB])
                              }
                            }}
                          >
                            {correlation.toFixed(2)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Top correlations section */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Strongest Relationships</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topCorrelations.slice(0, 4).map(({ needA, needB, correlation }) => (
                  <div 
                    key={`${needA}-${needB}`}
                    className="bg-white dark:bg-gray-800 border rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedPair([needA, needB])}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        {needsMap[needA as keyof typeof needsMap]} & {needsMap[needB as keyof typeof needsMap]}
                      </div>
                      <div className={`text-sm font-medium ${
                        correlation > 0.1 ? 'text-green-600' :
                        correlation < -0.1 ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {correlation.toFixed(2)}
                      </div>
                    </div>
                    <div className="h-1 w-full bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full ${correlation > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.abs(correlation) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 