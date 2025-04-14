import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CropHealthVisualizationProps {
  messages: Array<{
    categories?: string[];
    needs_fertilizer?: boolean;
    needs_seed_cane?: boolean;
    needs_harvesting?: boolean;
    needs_ploughing?: boolean;
    has_crop_issues?: boolean;
    needs_pesticide?: boolean;
  }>;
}

const CropHealthVisualization: React.FC<CropHealthVisualizationProps> = ({ messages }) => {
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [activeIssues, setActiveIssues] = useState<string[]>([]);
  
  // Calculate health status based on messages
  useEffect(() => {
    if (messages.length === 0) {
      setHealthStatus('healthy');
      setActiveIssues([]);
      return;
    }
    
    // Track all issues identified across all messages (not just the latest)
    // This ensures the health status doesn't improve unless issues are explicitly resolved
    const allIssues = new Set<string>();
    
    // Process all messages to accumulate issues
    messages.forEach(message => {
      if (message.needs_fertilizer) allIssues.add('fertilizer');
      if (message.needs_seed_cane) allIssues.add('seed_cane');
      if (message.needs_harvesting) allIssues.add('harvesting');
      if (message.needs_ploughing) allIssues.add('ploughing');
      if (message.has_crop_issues) allIssues.add('crop_issues');
      if (message.needs_pesticide) allIssues.add('pesticide');
    });
    
    // Convert to array
    const currentIssues = Array.from(allIssues);
    setActiveIssues(currentIssues);
    
    // Determine health status: healthy (0 issues), warning (1 issue), critical (2+ issues)
    if (currentIssues.length === 0) {
      setHealthStatus('healthy');
    } else if (currentIssues.length === 1) {
      setHealthStatus('warning');
    } else {
      setHealthStatus('critical');
    }
  }, [messages]);
  
  // Get color based on health status
  const getHealthColor = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'rgb(34, 197, 94)'; // green-500
      case 'warning':
        return 'rgb(234, 179, 8)'; // yellow-500/amber
      case 'critical':
        return 'rgb(239, 68, 68)'; // red-500
      default:
        return 'rgb(34, 197, 94)';
    }
  };
  
  // Get plant animation based on health status
  const getPlantAnimation = () => {
    switch (healthStatus) {
      case 'healthy':
        return {
          scale: [1, 1.05, 1],
          rotate: [0, 1, 0],
        };
      case 'warning':
        return {
          scale: [1, 0.95, 1],
          rotate: [0, -2, 0],
        };
      case 'critical':
        return {
          scale: [1, 0.9, 1],
          rotate: [0, -5, 0],
        };
      default:
        return {
          scale: [1, 1.05, 1],
          rotate: [0, 1, 0],
        };
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-2 text-emerald-800 dark:text-emerald-300">Crop Health Status</h3>
      
      <div className="relative w-32 h-32 mb-4">
        {/* Soil */}
        <div className="absolute bottom-0 w-full h-8 bg-amber-800 dark:bg-amber-900 rounded-t-lg"></div>
        
        {/* Plant */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={getPlantAnimation()}
          transition={{ 
            repeat: Infinity, 
            duration: 3,
            ease: "easeInOut" 
          }}
        >
          {/* Stem */}
          <div className="w-2 h-24 bg-emerald-700 dark:bg-emerald-600 mx-auto"></div>
          
          {/* Leaves */}
          <div className="relative">
            {/* Left leaf */}
            <motion.div 
              className="absolute -left-4 top-0 w-8 h-12 bg-emerald-500 dark:bg-emerald-400 rounded-full"
              style={{ 
                transformOrigin: 'right center',
                backgroundColor: getHealthColor()
              }}
              animate={{ 
                rotate: healthStatus === 'healthy' ? [0, 5, 0] : 
                        healthStatus === 'warning' ? [0, -10, 0] : 
                        [0, -20, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
                ease: "easeInOut" 
              }}
            ></motion.div>
            
            {/* Right leaf */}
            <motion.div 
              className="absolute -right-4 top-0 w-8 h-12 bg-emerald-500 dark:bg-emerald-400 rounded-full"
              style={{ 
                transformOrigin: 'left center',
                backgroundColor: getHealthColor()
              }}
              animate={{ 
                rotate: healthStatus === 'healthy' ? [0, -5, 0] : 
                        healthStatus === 'warning' ? [0, 10, 0] : 
                        [0, 20, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
                ease: "easeInOut" 
              }}
            ></motion.div>
          </div>
        </motion.div>
      </div>
      
      {/* Health indicator */}
      <div className="flex items-center justify-center mb-2">
        <div 
          className="w-4 h-4 rounded-full mr-2"
          style={{ backgroundColor: getHealthColor() }}
        ></div>
        <span className="text-sm font-medium capitalize">
          {healthStatus === 'healthy' ? 'Good' : 
           healthStatus === 'warning' ? 'One Issue' : 
           'Multiple Issues'}
        </span>
      </div>
      
      {/* Active issues */}
      {activeIssues.length > 0 && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active Issues:</p>
          <div className="flex flex-wrap justify-center gap-1">
            {activeIssues.map((issue, index) => (
              <span 
                key={index}
                className="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700"
              >
                {issue.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Create a standalone Crop Health Gauge for use in other components
export const CropHealthGauge: React.FC<{issues: string[]}> = ({ issues }) => {
  // Determine health status: healthy (0 issues), warning (1 issue), critical (2+ issues)
  const healthStatus = issues.length === 0 ? 'healthy' :
                      issues.length === 1 ? 'warning' : 'critical';
  
  // Get color based on health status
  const getHealthColor = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'rgb(34, 197, 94)'; // green-500
      case 'warning':
        return 'rgb(234, 179, 8)'; // yellow-500/amber
      case 'critical':
        return 'rgb(239, 68, 68)'; // red-500
      default:
        return 'rgb(34, 197, 94)';
    }
  };
  
  return (
    <div className="flex items-center">
      <div 
        className="w-3 h-3 rounded-full mr-2"
        style={{ backgroundColor: getHealthColor() }}
      ></div>
      <span className="text-xs font-medium">
        {healthStatus === 'healthy' ? 'Good' : 
         healthStatus === 'warning' ? 'One Issue' : 
         'Multiple Issues'}
      </span>
    </div>
  );
};

export default CropHealthVisualization; 