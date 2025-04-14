"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CropHealthGauge } from '@/components/CropHealthVisualization'

// Constants
const FARM_WIDTH = 15
const FARM_HEIGHT = 10

// Farm structures and elements for rendering
const TILE_SIZE = 32

// Farmer color changed to dark blue
const FARMER_COLOR = '#1E3A8A' // Dark blue color

// Game objects and their states
interface FarmData {
  farmerId: string
  farmerName: string
  farmSize: number
  needsFertilizer: boolean
  needsSeedCane: boolean
  needsHarvesting: boolean
  needsPloughing: boolean
  hasCropIssues: boolean
  needsPesticide: boolean
}

// Add this near the top of the file, after imports
interface FarmerDetailsProps {
  loading: boolean;
  farmer: {
    farmerId: string;
    farmerName: string;
    farmSize: number;
    needsFertilizer: boolean;
    needsSeedCane: boolean;
    needsHarvesting: boolean;
    needsPloughing: boolean;
    hasCropIssues: boolean;
    needsPesticide: boolean;
  };
  farmerDetails: any;
  latestCall: any;
}

const MemoizedFarmerDetails = React.memo(function FarmerDetails({ 
  loading, 
  farmer, 
  farmerDetails, 
  latestCall
}: FarmerDetailsProps) {
  const [showFarmDetails, setShowFarmDetails] = useState(false);
  
  // This ensures farmer info doesn't refresh when farm activities change
  const farmerRef = useRef(farmer);
  
  // Log renders for debugging
  useEffect(() => {
    console.log("FarmerDetails component rendered");
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-800 border-opacity-50"></div>
      </div>
    );
  }
  
  return (
    <div className="text-center w-full max-w-4xl">
      <div className="bg-gradient-to-r from-amber-200 to-emerald-200 p-6 rounded-lg shadow-md mb-4">
        <button 
          onClick={() => setShowFarmDetails(prev => !prev)} 
          className="w-full flex justify-between items-center text-left"
        >
          <h2 className="text-2xl font-bold text-emerald-800 border-b-2 border-emerald-400 pb-2 mb-4 w-full">{farmerRef.current.farmerName}'s Farm</h2>
          <span className="text-emerald-800 text-xl">{showFarmDetails ? '▲' : '▼'}</span>
        </button>
        
        {showFarmDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Farmer details card */}
            <div className="bg-white/70 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-amber-800 mb-2 flex items-center">
                <span className="mr-2">👨‍🌾</span> 
                Farmer Details
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium text-amber-700">Farm ID:</div>
                <div className="font-mono bg-amber-50 px-2 py-1 rounded">{farmerRef.current.farmerId}</div>
                
                <div className="font-medium text-amber-700">Farm Size:</div>
                <div className="font-mono bg-amber-50 px-2 py-1 rounded">{farmerRef.current.farmSize} acres</div>
                
                {farmerDetails && (
                  <>
                    <div className="font-medium text-amber-700">Location:</div>
                    <div className="font-mono bg-amber-50 px-2 py-1 rounded">{farmerDetails.Location || 'Unknown'}</div>
                    
                    {farmerDetails.Gender && (
                      <>
                        <div className="font-medium text-amber-700">Gender:</div>
                        <div className="font-mono bg-amber-50 px-2 py-1 rounded">{farmerDetails.Gender}</div>
                      </>
                    )}
                    
                    {farmerDetails.Age && (
                      <>
                        <div className="font-medium text-amber-700">Age:</div>
                        <div className="font-mono bg-amber-50 px-2 py-1 rounded">{farmerDetails.Age}</div>
                      </>
                    )}
                    
                    {farmerDetails["Preferred Language"] && (
                      <>
                        <div className="font-medium text-amber-700">Language:</div>
                        <div className="font-mono bg-amber-50 px-2 py-1 rounded">{farmerDetails["Preferred Language"]}</div>
                      </>
                    )}
                  </>
                )}
              </div>
              
              {/* Crop Health Gauge */}
              <div className="mt-4 pt-3 border-t border-amber-200">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-amber-800">Crop Health:</p>
                  <CropHealthGauge 
                    issues={[
                      ...(farmerRef.current.needsFertilizer ? ['fertilizer'] : []),
                      ...(farmerRef.current.needsSeedCane ? ['seed_cane'] : []),
                      ...(farmerRef.current.needsHarvesting ? ['harvesting'] : []),
                      ...(farmerRef.current.needsPloughing ? ['ploughing'] : []),
                      ...(farmerRef.current.hasCropIssues ? ['crop_issues'] : []),
                      ...(farmerRef.current.needsPesticide ? ['pesticide'] : [])
                    ]} 
                  />
                </div>
              </div>
            </div>
            
            {/* Latest call summary */}
            {latestCall ? (
              <div className="bg-white/70 rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-emerald-800 mb-2 flex items-center">
                  <span className="mr-2">📞</span>
                  Latest Call Report
                </h3>
                <div className="flex items-center text-xs text-emerald-700 italic mb-2 bg-emerald-50 px-2 py-1 rounded">
                  <span className="mr-1">📅</span>
                  {new Date(latestCall.timestamp || latestCall.created_at).toLocaleDateString()} at 
                  {' ' + new Date(latestCall.timestamp || latestCall.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="bg-emerald-50 p-3 rounded mb-3 text-sm">
                  <p>{latestCall.summary}</p>
                </div>
                
                {/* Farm needs based on call analysis */}
                <div className="mt-3">
                  <h4 className="font-semibold text-sm text-emerald-800 border-b border-emerald-200 pb-1 mb-2">Farm Needs:</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {latestCall.needs_fertilizer && 
                      <div className="flex items-center text-amber-800 text-xs bg-amber-50 px-2 py-1 rounded">
                        <span className="mr-1">💧</span> Needs fertilizer
                      </div>
                    }
                    {latestCall.needs_seed_cane && 
                      <div className="flex items-center text-amber-800 text-xs bg-amber-50 px-2 py-1 rounded">
                        <span className="mr-1">🌱</span> Needs seed cane
                      </div>
                    }
                    {latestCall.needs_harvesting && 
                      <div className="flex items-center text-amber-800 text-xs bg-amber-50 px-2 py-1 rounded">
                        <span className="mr-1">🌾</span> Ready for harvesting
                      </div>
                    }
                    {latestCall.needs_ploughing && 
                      <div className="flex items-center text-amber-800 text-xs bg-amber-50 px-2 py-1 rounded">
                        <span className="mr-1">🚜</span> Field needs ploughing
                      </div>
                    }
                    {latestCall.has_crop_issues && 
                      <div className="flex items-center text-amber-800 text-xs bg-amber-50 px-2 py-1 rounded">
                        <span className="mr-1">🔍</span> Has crop health issues
                      </div>
                    }
                    {latestCall.needs_pesticide && 
                      <div className="flex items-center text-amber-800 text-xs bg-amber-50 px-2 py-1 rounded">
                        <span className="mr-1">🌿</span> Needs pesticide application
                      </div>
                    }
                  </div>
                  
                  {!latestCall.needs_fertilizer && !latestCall.needs_seed_cane && 
                   !latestCall.needs_harvesting && !latestCall.needs_ploughing && 
                   !latestCall.has_crop_issues && !latestCall.needs_pesticide && 
                   <div className="flex items-center justify-center text-green-700 text-sm font-semibold mt-2 bg-green-50 p-2 rounded">
                     <span className="mr-2">✅</span> Farm is in good condition!
                   </div>
                  }
                  
                  {/* Crop Health Gauge based on latest call */}
                  <div className="mt-3 pt-2 border-t border-emerald-200 flex justify-between items-center">
                    <h4 className="font-semibold text-sm">Crop Health Status:</h4>
                    <CropHealthGauge 
                      issues={[
                        ...(latestCall.needs_fertilizer ? ['fertilizer'] : []),
                        ...(latestCall.needs_seed_cane ? ['seed_cane'] : []),
                        ...(latestCall.needs_harvesting ? ['harvesting'] : []),
                        ...(latestCall.needs_ploughing ? ['ploughing'] : []),
                        ...(latestCall.has_crop_issues ? ['crop_issues'] : []),
                        ...(latestCall.needs_pesticide ? ['pesticide'] : [])
                      ]} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/70 rounded-lg p-4 shadow-sm flex flex-col items-center justify-center text-gray-500">
                <div className="text-4xl mb-2">📞</div>
                <p className="text-center">No recent calls found for this farmer.</p>
                <p className="text-xs text-center mt-2">Call data will appear here after the first call.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function that prevents re-renders when only boolean farm states change
  // This is crucial to prevent the info box from refreshing when activities are clicked
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.farmer.farmerId === nextProps.farmer.farmerId &&
    prevProps.farmer.farmerName === nextProps.farmer.farmerName &&
    prevProps.farmer.farmSize === nextProps.farmer.farmSize &&
    // Ignore boolean state changes in farmers (needs* properties)
    prevProps.farmerDetails === nextProps.farmerDetails &&
    prevProps.latestCall === nextProps.latestCall
  );
});

export default function MyFarmGame() {
  // Game state
  const [loading, setLoading] = useState(false)
  const [farmer, setFarmer] = useState<FarmData>({
    farmerId: 'KF001',
    farmerName: 'John Mwangi',
    farmSize: 2.5,
    needsFertilizer: true,
    needsSeedCane: true,
    needsHarvesting: true,
    needsPloughing: true,
    hasCropIssues: true,
    needsPesticide: true
  })
  
  // Farmer details from call history
  const [farmerDetails, setFarmerDetails] = useState<any>(null)
  const [latestCall, setLatestCall] = useState<any>(null)
  
  // Farmer position
  const [position, setPosition] = useState({ x: 5, y: 5 })
  const [direction, setDirection] = useState('down')
  const [moving, setMoving] = useState(false)
  const [activity, setActivity] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [showHarvestAnimation, setShowHarvestAnimation] = useState(false)
  const [happy, setHappy] = useState(false)
  
  // Water hazard state
  const [inWater, setInWater] = useState(false)
  const [drowning, setDrowning] = useState(false)
  const [dead, setDead] = useState(false)
  const [reviving, setReviving] = useState(false)
  const waterTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Game canvas
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Refs to current state values for event handlers
  const positionRef = useRef(position);
  const activityRef = useRef(activity);
  const selectedActionRef = useRef(selectedAction);
  const deadRef = useRef(dead);
  const inWaterRef = useRef(inWater);
  
  // Update refs when state changes
  useEffect(() => {
    positionRef.current = position;
  }, [position]);
  
  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);
  
  useEffect(() => {
    selectedActionRef.current = selectedAction;
  }, [selectedAction]);
  
  useEffect(() => {
    deadRef.current = dead;
  }, [dead]);
  
  useEffect(() => {
    inWaterRef.current = inWater;
  }, [inWater]);
  
  // Define water area boundaries
  const waterArea = {
    left: 0.72, // 72% from left edge
    top: 0.4,   // 40% from top edge
    width: 0.12, // 12% of total width
    height: 0.25 // 25% of total height
  }
  
  // Check if farmer is in water
  const checkWaterCollision = (x: number, y: number) => {
    const farmerX = x / FARM_WIDTH
    const farmerY = y / FARM_HEIGHT
    
    return (
      farmerX >= waterArea.left &&
      farmerX < waterArea.left + waterArea.width &&
      farmerY >= waterArea.top &&
      farmerY < waterArea.top + waterArea.height
    )
  }
  
  // Setup game
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    console.log("Setting up game keyboard handlers and event listeners...");
    
    // Fetch farmer data if available
    const fetchFarmerData = async () => {
      setLoading(true)
      try {
        // First try to get the latest farmer ID from the latest call or localStorage
        let currentFarmerId;
        
        // Try to fetch all calls to find most recent call with farmer ID
        const allCallsResponse = await fetch('/api/calls')
        if (allCallsResponse.ok) {
          const allCallsData = await allCallsResponse.json()
          
          // Sort calls by date (most recent first)
          const sortedCalls = [...allCallsData].sort((a, b) => {
            const dateA = new Date(a.timestamp || a.created_at || 0)
            const dateB = new Date(b.timestamp || b.created_at || 0)
            return dateB.getTime() - dateA.getTime()
          })
          
          // Find the most recent call with a farmer ID
          const recentCallWithFarmer = sortedCalls.find(call => call["Farmer ID"])
          
          if (recentCallWithFarmer) {
            currentFarmerId = recentCallWithFarmer["Farmer ID"]
            setLatestCall(recentCallWithFarmer)
            console.log('📞 Found recent call with farmer:', currentFarmerId)
          }
        }
        
        // If no recent call found, fall back to localStorage
        if (!currentFarmerId) {
          currentFarmerId = localStorage.getItem('currentFarmerId')
          console.log('⚠️ No recent call found, using localStorage:', currentFarmerId)
        }
        
        if (!currentFarmerId) {
          console.log('❌ No farmer ID found in calls or localStorage')
          setLoading(false)
          return
        }
        
        // Store for next time
        localStorage.setItem('currentFarmerId', currentFarmerId)
        
        // Fetch farmer details
        const response = await fetch(`/api/farmers?id=${currentFarmerId}`)
        if (!response.ok) {
          console.error('Failed to fetch farmer data')
          setLoading(false)
          return
        }
        
        const data = await response.json()
        if (data.farmer) {
          setFarmerDetails(data.farmer)
          
          // If we already have the latest call, use it
          let recentCall = latestCall
          
          // If not, fetch call history for this farmer
          if (!recentCall) {
            const callResponse = await fetch(`/api/history?farmer_id=${currentFarmerId}&limit=1`)
            if (callResponse.ok) {
              const callData = await callResponse.json()
              recentCall = callData.calls?.[0] || {}
              setLatestCall(recentCall)
            }
          }
          
          // Set farmer game data based on most recent call
          setFarmer({
            farmerId: data.farmer["Farmer ID"],
            farmerName: data.farmer["Farmer Name"] || "Unknown Farmer",
            farmSize: parseFloat(data.farmer["Farm Size (Acres)"]) || 1.0,
            needsFertilizer: recentCall?.needs_fertilizer || false,
            needsSeedCane: recentCall?.needs_seed_cane || false,
            needsHarvesting: recentCall?.needs_harvesting || false, 
            needsPloughing: recentCall?.needs_ploughing || false,
            hasCropIssues: recentCall?.has_crop_issues || false,
            needsPesticide: recentCall?.needs_pesticide || false
          })
        }
      } catch (error) {
        console.error('Error fetching farmer data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchFarmerData()
    
    // P key handler for performing actions
    const handlePKeyPress = (e: KeyboardEvent) => {
      if ((e.key === 'p' || e.key === 'P') && !e.repeat) {
        console.log("P key pressed - Action triggered");
        // Prevent default behavior to avoid page scrolling/vertigo
        e.preventDefault();
        
        console.log("Current state:", {
          selectedAction,
          dead,
          activity,
          farmerNeeds: {
            needsPloughing: farmer.needsPloughing,
            needsSeedCane: farmer.needsSeedCane,
            needsFertilizer: farmer.needsFertilizer,
            needsPesticide: farmer.needsPesticide,
            needsHarvesting: farmer.needsHarvesting
          }
        });
        
        if (selectedAction && !dead && !activity) {
          performSelectedAction();
        }
      }
    };
    
    // Handle keyboard input for farmer movement
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("Key pressed:", e.key, "selectedAction:", selectedAction);
      if (activity) return // Don't move while doing an activity
      
      // Prevent default behavior for arrow keys to avoid page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      
      // Skip handling P key as it's already handled by handlePKeyPress
      if (e.key === 'p' || e.key === 'P') return;
      
      setMoving(true)
      let newX = positionRef.current.x
      let newY = positionRef.current.y
      
      switch (e.key) {
        case 'ArrowUp':
          setDirection('up')
          newY = Math.max(positionRef.current.y - 1, 0)
          break
        case 'ArrowDown':
          setDirection('down')
          newY = Math.min(positionRef.current.y + 1, FARM_HEIGHT - 1)
          break
        case 'ArrowLeft':
          setDirection('left')
          newX = Math.max(positionRef.current.x - 1, 0)
          break
        case 'ArrowRight':
          setDirection('right')
          newX = Math.min(positionRef.current.x + 1, FARM_WIDTH - 1)
          break
      }
      
      // Check for water collision
      const willBeInWater = checkWaterCollision(newX, newY)
      
      // If moving from water to land and was dead, trigger revival
      if (deadRef.current && inWaterRef.current && !willBeInWater) {
        triggerRevival()
      }
      
      // Update position
      setPosition({ x: newX, y: newY })
      
      // Update water state
      setInWater(willBeInWater)
    }
    
    const handleKeyUp = () => {
      setMoving(false)
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('keydown', handlePKeyPress)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('keydown', handlePKeyPress)
      if (waterTimerRef.current) {
        clearTimeout(waterTimerRef.current)
      }
      console.log("Cleaned up all game keyboard handlers.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction, dead, activity, farmer.needsPloughing, farmer.needsSeedCane, farmer.needsFertilizer, farmer.needsPesticide, farmer.needsHarvesting]) // Add back the dependency array for the P key to work
  
  // Handle water effects
  useEffect(() => {
    // Clear any existing timers
    if (waterTimerRef.current) {
      clearTimeout(waterTimerRef.current)
      waterTimerRef.current = null
    }
    
    if (inWater && !moving && !reviving) {
      // Start drowning after 2 seconds in water
      setDrowning(true)
      
      waterTimerRef.current = setTimeout(() => {
        setDead(true)
      }, 2000)
    } else {
      // Reset drowning state if moving or not in water
      setDrowning(false)
    }
    
    // Clean up timer on unmount
    return () => {
      if (waterTimerRef.current) {
        clearTimeout(waterTimerRef.current)
      }
    }
  }, [inWater, moving, reviving])
  
  // Trigger revival animation when moved out of water after drowning
  const triggerRevival = () => {
    setReviving(true)
    
    // First transition: turn from dead red to alive but still eating sugarcane
    setTimeout(() => {
      setDead(false)
      
      // Keep the revival animation going longer (3 seconds)
      setTimeout(() => {
        setReviving(false)
        // Ensure we're completely out of water state
        setInWater(false)
      }, 3000) // Extended from 1000ms to 3000ms
    }, 1000)
  }
  
  // Handle touch controls for mobile - update for water hazard
  const handleTouchMove = (direction: string) => {
    if (activityRef.current) return // Don't move while doing an activity
    
    setMoving(true)
    setDirection(direction)
    
    let newX = positionRef.current.x
    let newY = positionRef.current.y
    
    switch (direction) {
      case 'up':
        newY = Math.max(positionRef.current.y - 1, 0)
        break
      case 'down':
        newY = Math.min(positionRef.current.y + 1, FARM_HEIGHT - 1)
        break
      case 'left':
        newX = Math.max(positionRef.current.x - 1, 0)
        break
      case 'right':
        newX = Math.min(positionRef.current.x + 1, FARM_WIDTH - 1)
        break
    }
    
    // Check for water collision
    const willBeInWater = checkWaterCollision(newX, newY)
    
    // If moving from water to land and was dead, trigger revival
    if (deadRef.current && inWaterRef.current && !willBeInWater) {
      triggerRevival()
    }
    
    // Update position
    setPosition({ x: newX, y: newY })
    
    // Update water state
    setInWater(willBeInWater)
    
    // Reset moving state after a short delay
    setTimeout(() => setMoving(false), 200)
  }
  
  // Function to handle the touch action button
  const handleTouchAction = () => {
    if (selectedAction && !dead) {
      console.log("Touch action initiated for:", selectedAction);
      performSelectedAction();
    }
  }
  
  // Perform the selected action
  const performSelectedAction = () => {
    // Get the current selectedAction value directly from state
    const currentAction = selectedAction;
    
    console.log("🎮 PERFORMING ACTION:", currentAction);
    console.log("==================================");
    console.log("Current game state:");
    console.log("- Selected Action:", currentAction);
    console.log("- Dead:", dead);
    console.log("- Activity:", activity);
    console.log("- Farming needs:", Object.entries(farmer)
      .filter(([key, value]) => typeof value === 'boolean' && value)
      .map(([key]) => key)
    );
    console.log("==================================");
    
    if (!currentAction) {
      console.log("❌ No action selected, aborting");
      return;
    }
    
    // Animate action
    setActivity(currentAction)
    
    // Complete the action after a delay
    setTimeout(() => {
      // Update the farm state based on the activity
      setFarmer(prev => {
        const updatedFarmer = { ...prev }
        
        console.log(`Completing action: ${currentAction}`);
        
        switch (currentAction) {
          case 'plough':
            console.log("Setting needsPloughing to false");
            updatedFarmer.needsPloughing = false
            break
          case 'plant':
            console.log("Setting needsSeedCane to false");
            updatedFarmer.needsSeedCane = false
            break
          case 'fertilize':
            console.log("Setting needsFertilizer to false");
            updatedFarmer.needsFertilizer = false
            break
          case 'pesticide':
            console.log("Setting needsPesticide and hasCropIssues to false");
            updatedFarmer.needsPesticide = false
            updatedFarmer.hasCropIssues = false
            break
          case 'harvest':
            console.log("Setting needsHarvesting to false and triggering animation");
            updatedFarmer.needsHarvesting = false
            setShowHarvestAnimation(true)
            // Reset harvest animation after it completes
            setTimeout(() => setShowHarvestAnimation(false), 3000)
            break
        }
        
        // Check if all tasks are completed to make the farmer happy
        const stillNeeded = [
          updatedFarmer.needsPloughing,
          updatedFarmer.needsSeedCane,
          updatedFarmer.needsFertilizer,
          updatedFarmer.needsPesticide,
          updatedFarmer.needsHarvesting
        ].filter(Boolean).length
        
        if (stillNeeded === 0) {
          console.log("All tasks completed, making farmer happy!");
          setHappy(true)
        }
        
        return updatedFarmer
      })
      
      // Clear activity state to end animation
      setActivity(null)
    }, 2000)
  }
  
  // Update the action steps with shorter, more concise descriptions
  const getActionSteps = () => {
    return [
      { 
        id: 'plough', 
        name: 'Ploughing', 
        needed: farmer.needsPloughing, 
        icon: '🚜', 
        description: 'Break up soil to improve aeration and prepare for planting.'
      },
      { 
        id: 'plant', 
        name: 'Seed Cane', 
        needed: farmer.needsSeedCane, 
        icon: '🌿', 
        description: 'Place sugarcane cuttings with viable buds into prepared soil.'
      },
      { 
        id: 'fertilize', 
        name: 'Fertilizer', 
        needed: farmer.needsFertilizer, 
        icon: '🌱', 
        description: 'Add NPK nutrients to enhance soil fertility and sugar content.'
      },
      { 
        id: 'pesticide', 
        name: 'Pesticide', 
        needed: farmer.needsPesticide || farmer.hasCropIssues, 
        icon: '💦', 
        description: 'Treat crop to control pests, diseases and weeds.'
      },
      { 
        id: 'harvest', 
        name: 'Harvesting', 
        needed: farmer.needsHarvesting, 
        icon: '🌾', 
        description: 'Cut mature cane at base when sugar content is highest.'
      },
    ]
  }
  
  // Original farm progress function with modification to return content type directly
  const getFarmProgress = () => {
    if (farmer.needsPloughing) {
      return { bg: '#8bac0f', content: null }; // Default grass
    } else if (farmer.needsSeedCane) {
      return { bg: '#7a6339', content: 'ploughed' }; // Ploughed soil
    } else if (farmer.needsFertilizer) {
      return { bg: '#7a6339', content: 'seeds' }; // Soil with seeds
    } else if (farmer.needsPesticide || farmer.hasCropIssues) {
      return { bg: '#7a6339', content: 'growing' }; // Growing crops
    } else if (farmer.needsHarvesting) {
      return { bg: '#7a6339', content: 'mature' }; // Mature crops
    } else {
      return { bg: '#7a6339', content: 'harvested' }; // Harvested field
    }
  }
  
  const farmProgress = getFarmProgress();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-emerald-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-emerald-800">My Farm</h1>
          <Link href="/">
            <Button variant="outline">Back to Call Center</Button>
          </Link>
        </div>
        
        {/* Farmer details and loading state */}
        <div className="flex flex-col items-center mb-6">
          <MemoizedFarmerDetails
            loading={loading}
            farmer={farmer}
            farmerDetails={farmerDetails}
            latestCall={latestCall}
          />
        </div>
        
        {/* Main game area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity selection panel */}
          <div className="lg:col-span-1 bg-amber-100 rounded-lg p-4 shadow-lg">
            <h2 className="text-xl font-bold text-emerald-800 mb-2">Farm Activities</h2>
            <p className="text-sm mb-4">Select an activity to perform on your farm.</p>
            
            <div className="space-y-2">
              {getActionSteps().map((activity) => (
                <div 
                  key={activity.id}
                  className={`p-2 rounded cursor-pointer transition-colors relative min-h-[80px] ${
                    selectedAction === activity.id 
                      ? 'bg-amber-600 text-white' 
                      : activity.needed
                        ? 'bg-amber-200 hover:bg-amber-300 border-2 border-amber-400'
                        : 'bg-amber-100 hover:bg-amber-200'
                  }`}
                  onClick={() => selectedAction !== activity.id ? setSelectedAction(activity.id) : setSelectedAction(null)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <span className="text-lg mr-1">{activity.icon}</span>
                      <span className="font-medium">{activity.name}</span>
                    </div>
                    {activity.needed && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-500 text-white rounded-full">Needed</span>
                    )}
                  </div>
                  <p className="text-xs leading-tight">
                    {selectedAction === activity.id 
                      ? `Walk around the field and press P to ${activity.id}.` 
                      : activity.description}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Reminder about correct farming sequence */}
            <div className="mt-6 p-3 bg-amber-50 rounded-md border border-amber-200">
              <h3 className="text-sm font-semibold text-amber-800 mb-1">Farming Sequence:</h3>
              <ol className="text-xs text-amber-700 list-decimal ml-4 space-y-1">
                <li className={farmer.needsPloughing ? "font-semibold" : ""}>Ploughing</li>
                <li className={farmer.needsSeedCane ? "font-semibold" : ""}>Seed Cane</li>
                <li className={farmer.needsFertilizer ? "font-semibold" : ""}>Fertilizer</li>
                <li className={farmer.needsPesticide ? "font-semibold" : ""}>Pesticide</li>
                <li className={farmer.needsHarvesting ? "font-semibold" : ""}>Harvesting</li>
              </ol>
            </div>
          </div>
          
          {/* Main game area */}
          <div className="lg:col-span-2">
            <div className="relative bg-amber-100 rounded-lg overflow-hidden shadow-lg border-4 border-amber-800">
              {/* Pixel art farm renderer */}
              <div className="relative aspect-video bg-[#8bac0f] overflow-hidden">
                {/* Render the farm grid with tiles - using CSS instead of JS loop for better performance */}
                <div className="absolute inset-0">
                  {/* Sugarcane field base - changes based on progress, render all visualizations always */}
                  <div 
                    className={`absolute left-[13.33%] top-[10%] right-[20%] bottom-[20%] ${
                      farmProgress.bg === '#8bac0f' 
                        ? 'bg-[#638b25] border border-[#4a7510]/20' 
                        : 'bg-[#7a6339] border border-[#5d4a29]/20'
                    }`}
                  >
                    {/* Ploughed visualization - always present with conditional display */}
                    <div className="absolute inset-0 overflow-hidden"
                      style={{ 
                        display: farmProgress.content === 'ploughed' ? 'block' : 'none' 
                      }}>
                      <div className="w-full h-full" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, #5d4a29, #5d4a29 2px, transparent 2px, transparent 20px)',
                        backgroundSize: '100% 100%'
                      }}></div>
                    </div>
                    
                    {/* Seeds visualization - always present with conditional display */}
                    <div className="absolute inset-0 overflow-hidden"
                      style={{ 
                        display: farmProgress.content === 'seeds' ? 'block' : 'none' 
                      }}>
                      <div className="w-full h-full" style={{
                        backgroundImage: 'radial-gradient(circle, #f5d142 2px, transparent 2px)',
                        backgroundSize: '20px 20px'
                      }}></div>
                    </div>
                    
                    {/* Growing plants visualization - always present with conditional display */}
                    <div className="absolute inset-0 overflow-hidden"
                      style={{ 
                        display: farmProgress.content === 'growing' ? 'block' : 'none' 
                      }}>
                      <div className="w-full h-full" style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 16px, #47a847 16px, #47a847 18px)',
                        backgroundSize: '100% 100%'
                      }}></div>
                    </div>
                    
                    {/* Mature plants visualization - always present with conditional display */}
                    <div className="absolute inset-0 overflow-hidden"
                      style={{ 
                        display: farmProgress.content === 'mature' ? 'block' : 'none' 
                      }}>
                      <div className="w-full h-full flex flex-wrap">
                        {Array.from({ length: 70 }).map((_, i) => (
                          <div key={i} className="w-[14.28%] h-[14.28%] flex items-center justify-center">
                            <div className="h-[80%] w-[3px] bg-[#47a847]"></div>
                          </div>
                        ))}
                        {Array.from({ length: 70 }).map((_, i) => (
                          <div key={i + 100} className="w-[14.28%] h-[14.28%] flex items-center justify-center absolute inset-0">
                            <div className="h-[2px] w-[10px] bg-[#6ab04c] -mt-[80%] rounded-full"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Harvested field visualization - always present with conditional display */}
                    <div className="absolute inset-0 overflow-hidden"
                      style={{ 
                        display: farmProgress.content === 'harvested' ? 'block' : 'none' 
                      }}>
                      <div className="w-full h-full" style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 16px, #47a847 16px, #47a847 18px)',
                        backgroundSize: '100% 20%',
                        backgroundPosition: 'bottom'
                      }}></div>
                    </div>
                  </div>
                  
                  {/* Farm decorations - pure CSS */}
                  <div className="absolute left-[3%] top-[20%] w-[10%] h-[15%] bg-[#8B4513]">
                    {/* Simple hut */}
                    <div className="absolute inset-0 bg-[#a05a2c]"></div>
                    <div className="absolute top-[-30%] left-[-10%] right-[-10%] h-[50%] bg-[#654321] transform rotate-[-5deg]"></div>
                  </div>
                  
                  {/* Water pond - updated with exact dimensions for collision detection */}
                  <div 
                    className="absolute rounded-full bg-[#4fa4d1]"
                    style={{
                      left: `${waterArea.left * 100}%`,
                      top: `${waterArea.top * 100}%`,
                      width: `${waterArea.width * 100}%`,
                      height: `${waterArea.height * 100}%`,
                    }}
                  >
                    <div className="absolute inset-[15%] rounded-full bg-[#3d8eb9]"></div>
                  </div>
                  
                  {/* Tree 1 */}
                  <div className="absolute left-[5%] top-[60%] w-[5%] h-[7%]">
                    <div className="absolute left-[40%] right-[40%] top-[50%] bottom-0 bg-[#8B4513]"></div>
                    <div className="absolute inset-0 top-[20%] rounded-full bg-[#2e7d32]"></div>
                  </div>
                  
                  {/* Tree 2 */}
                  <div className="absolute right-[12%] top-[18%] w-[6%] h-[8%]">
                    <div className="absolute left-[40%] right-[40%] top-[50%] bottom-0 bg-[#8B4513]"></div>
                    <div className="absolute inset-0 top-[20%] rounded-full bg-[#388e3c]"></div>
                  </div>
                  
                  {/* Simple fencing */}
                  <div className="absolute left-[12%] top-[8%] right-[18%] h-[2%] bg-[#a05a2c]"></div>
                  <div className="absolute left-[12%] top-[8%] bottom-[18%] w-[1%] bg-[#a05a2c]"></div>
                  <div className="absolute right-[18%] top-[8%] bottom-[18%] w-[1%] bg-[#a05a2c]"></div>
                  <div className="absolute left-[12%] bottom-[18%] right-[18%] h-[1%] bg-[#a05a2c]"></div>
                  
                  {/* Visual indicator for currently selected action */}
                  {selectedAction && (
                    <div className="absolute left-[13.33%] top-[10%] right-[20%] bottom-[20%] animate-pulse">
                      {selectedAction === 'plough' && (
                        <div className="absolute inset-0 bg-amber-800/10 border-2 border-dashed border-amber-800/30"></div>
                      )}
                      {selectedAction === 'plant' && (
                        <div className="absolute inset-0 bg-green-600/10 border-2 border-dashed border-green-600/30"></div>
                      )}
                      {selectedAction === 'fertilize' && (
                        <div className="absolute inset-0 bg-amber-500/10 border-2 border-dashed border-amber-500/30"></div>
                      )}
                      {selectedAction === 'pesticide' && (
                        <div className="absolute inset-0 bg-red-500/10 border-2 border-dashed border-red-500/30"></div>
                      )}
                      {selectedAction === 'harvest' && (
                        <div className="absolute inset-0 bg-yellow-500/10 border-2 border-dashed border-yellow-500/30"></div>
                      )}
                    </div>
                  )}
                  
                  {/* Harvest Animation */}
                  {showHarvestAnimation && (
                    <motion.div 
                      className="absolute top-[20%] left-[-10%] w-[8%] h-[10%]"
                      animate={{
                        left: ['0%', '90%'],
                      }}
                      transition={{
                        duration: 3,
                        ease: "linear",
                      }}
                    >
                      {/* Tractor */}
                      <div className="absolute inset-0">
                        <div className="absolute left-0 right-[30%] top-0 bottom-[30%] bg-[#d95126]"></div>
                        <div className="absolute left-[70%] right-0 top-0 bottom-[30%] bg-[#8B4513]"></div>
                        <div className="absolute left-[20%] right-[20%] top-[70%] bottom-0 bg-[#333]"></div>
                        <div className="absolute left-[70%] right-[10%] top-[70%] bottom-0 bg-[#333]"></div>
                        <div className="absolute right-[-50%] top-[30%] w-[50%] h-[40%] bg-[#ffd54f]"></div>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {/* Farmer character - improved styling with blue color instead of black */}
                <motion.div 
                  className={`absolute w-[5%] h-[10%] rounded-md motion-div-farmer after:content-[""] after:absolute after:rounded-full ${
                    direction === 'up' ? 'after:w-[60%] after:h-[30%] after:top-[-20%] after:left-[20%] after:rounded-t-full' :
                    direction === 'down' ? 'after:w-[60%] after:h-[30%] after:bottom-[-20%] after:left-[20%] after:rounded-b-full' :
                    direction === 'left' ? 'after:w-[30%] after:h-[60%] after:top-[20%] after:left-[-20%] after:rounded-l-full' :
                    'after:w-[30%] after:h-[60%] after:top-[20%] after:right-[-20%] after:rounded-r-full'
                  }`}
                  style={{
                    left: `${(position.x / FARM_WIDTH) * 100}%`,
                    top: `${(position.y / FARM_HEIGHT) * 100}%`,
                    ["--farmer-color" as any]: reviving ? FARMER_COLOR : (inWater ? (dead ? "#ef4444" : "#f87171") : FARMER_COLOR),
                    backgroundColor: reviving ? FARMER_COLOR : undefined,
                  }}
                  animate={{
                    scale: moving ? [1, 1.1, 1] : 1,
                    opacity: dead ? 0.7 : 1,
                    // Pulse red when in water but not dead yet
                    backgroundColor: inWater && !dead && !reviving ? ["#f87171", "#ef4444", "#f87171"] : reviving ? FARMER_COLOR : undefined,
                  }}
                  transition={{
                    repeat: (moving || (inWater && !dead && !reviving)) ? Infinity : 0,
                    duration: inWater && !dead && !reviving ? 0.3 : 0.5,
                  }}
                >
                  {/* Face representation */}
                  <div className="absolute top-[15%] left-[25%] right-[25%] bottom-[50%] flex justify-center items-center">
                    {/* Eyes - show X for eyes when dead */}
                    {dead ? (
                      <>
                        <div className="w-[40%] aspect-square relative">
                          <div className="absolute bg-white h-[2px] w-full top-1/2 left-0 rotate-45"></div>
                          <div className="absolute bg-white h-[2px] w-full top-1/2 left-0 -rotate-45"></div>
                        </div>
                        <div className="w-[40%] aspect-square relative ml-[20%]">
                          <div className="absolute bg-white h-[2px] w-full top-1/2 left-0 rotate-45"></div>
                          <div className="absolute bg-white h-[2px] w-full top-1/2 left-0 -rotate-45"></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-[40%] aspect-square bg-white rounded-full"></div>
                        <div className="w-[40%] aspect-square bg-white rounded-full ml-[20%]"></div>
                      </>
                    )}
                    
                    {/* Smile when all tasks completed */}
                    {happy && !dead && (
                      <div className="absolute bottom-[-40%] left-[20%] right-[20%] h-[20%] border-b-2 border-white rounded-b-full"></div>
                    )}
                    
                    {/* Frown when drowning */}
                    {drowning && !dead && (
                      <div className="absolute top-[100%] left-[20%] right-[20%] h-[20%] border-t-2 border-white rounded-t-full"></div>
                    )}
                  </div>
                </motion.div>
                
                {/* Revival animation - eating sugarcane */}
                {reviving && (
                  <motion.div 
                    className="absolute text-2xl"
                    style={{
                      left: `${(position.x / FARM_WIDTH) * 100}%`,
                      top: `${(position.y / FARM_HEIGHT) * 100 - 5}%`,
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: [0, 1, 0], y: [10, -10, -30] }}
                    transition={{ 
                      duration: 1,
                      repeat: 3, // Repeat the animation 3 times to match the longer revival time
                      repeatType: "loop"
                    }}
                  >
                    🌿 *crunch*
                  </motion.div>
                )}
                
                {/* Activity animation */}
                {activity && (
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: 4, duration: 0.5 }}
                  >
                    <div className="text-4xl font-bold text-white drop-shadow-lg">
                      {activity === 'fertilize' && '🌱'}
                      {activity === 'plant' && '🌿'}
                      {activity === 'harvest' && '🌾'}
                      {activity === 'plough' && '🚜'}
                      {activity === 'pesticide' && '💦'}
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Controls instructions */}
              <div className="p-4 bg-amber-800/80 text-white">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  <div>
                    <strong>Controls:</strong> Arrow keys to move
                  </div>
                  <div>
                    <strong>Action:</strong> P to perform selected activity
                  </div>
                </div>
                
                {/* More visible keyboard instructions */}
                <div className="mt-3 bg-amber-900/40 p-3 rounded-lg border border-amber-500/30 flex justify-center">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="flex justify-center gap-1 mb-1">
                        <div className="w-8 h-8 bg-amber-700 rounded flex items-center justify-center shadow-inner">
                          ↑
                        </div>
                      </div>
                      <div className="flex justify-center gap-1">
                        <div className="w-8 h-8 bg-amber-700 rounded flex items-center justify-center shadow-inner">
                          ←
                        </div>
                        <div className="w-8 h-8 bg-amber-700 rounded flex items-center justify-center shadow-inner">
                          ↓
                        </div>
                        <div className="w-8 h-8 bg-amber-700 rounded flex items-center justify-center shadow-inner">
                          →
                        </div>
                      </div>
                      <div className="text-xs mt-1">Move</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-10 h-10 bg-emerald-700 rounded flex items-center justify-center font-bold shadow-inner">
                        P
                      </div>
                      <div className="text-xs mt-1">Action</div>
                    </div>
                  </div>
                </div>
                
                {/* Touch controls for mobile */}
                <div className="mt-4 flex justify-center sm:hidden">
                  <div className="grid grid-cols-3 grid-rows-3 gap-2">
                    <div></div>
                    <button 
                      className="bg-white/20 p-3 rounded-lg active:bg-white/40 transition-colors"
                      onClick={() => handleTouchMove('up')}
                    >
                      ↑
                    </button>
                    <div></div>
                    
                    <button 
                      className="bg-white/20 p-3 rounded-lg active:bg-white/40 transition-colors"
                      onClick={() => handleTouchMove('left')}
                    >
                      ←
                    </button>
                    <button 
                      className="bg-white/20 p-3 rounded-lg active:bg-white/40 transition-colors"
                      onClick={() => handleTouchAction()}
                      disabled={!selectedAction || dead}
                    >
                      ●
                    </button>
                    <button 
                      className="bg-white/20 p-3 rounded-lg active:bg-white/40 transition-colors"
                      onClick={() => handleTouchMove('right')}
                    >
                      →
                    </button>
                    
                    <div></div>
                    <button 
                      className="bg-white/20 p-3 rounded-lg active:bg-white/40 transition-colors"
                      onClick={() => handleTouchMove('down')}
                    >
                      ↓
                    </button>
                    <div></div>
                  </div>
                </div>
              </div>
              
              {/* Status message when dead */}
              {dead && (
                <div className="p-2 bg-red-800/90 text-white text-center font-bold">
                  Move to dry land to recover with emergency sugarcane!
                </div>
              )}
              
              {/* Progress indicator */}
              {Object.values(farmer).filter(value => typeof value === 'boolean' && value).length > 0 && (
                <div className="p-2 bg-emerald-700/80 text-white text-sm text-center">
                  Farm tasks completed: {5 - Object.values(farmer).filter(value => typeof value === 'boolean' && value).length}/5
                </div>
              )}
              
              {/* Success message when all tasks completed */}
              {Object.values(farmer).filter(value => typeof value === 'boolean' && value).length === 0 && (
                <div className="p-4 bg-emerald-600 text-white text-center font-bold">
                  Congratulations! You've completed all your farm tasks! 🎉
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 