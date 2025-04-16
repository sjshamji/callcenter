"use client"

import { useState, useEffect } from 'react'
import { X, Check, AlertCircle, Droplet, Leaf, Sun, Tractor, AlertTriangle, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

// Define the shape of a call with needed fields
interface Call {
  id: string
  needs_fertilizer?: boolean
  needs_seed_cane?: boolean
  needs_harvesting?: boolean
  needs_ploughing?: boolean
  has_crop_issues?: boolean
  needs_pesticide?: boolean
  [key: string]: any
}

// Props for the modal component
interface ResolveIssueModalProps {
  call: Call
  isOpen: boolean
  onClose: () => void
  onResolve: () => void
}

// Issue names for display and database
const issueDisplayMap: { [key: string]: string } = {
  'needs_fertilizer': 'Fertilizer',
  'needs_seed_cane': 'Seed Cane',
  'needs_harvesting': 'Harvesting',
  'needs_ploughing': 'Ploughing',
  'has_crop_issues': 'Crop Issues',
  'needs_pesticide': 'Pesticide Application'
}

// Add icon map for issue types
const issueIconMap: { [key: string]: React.ReactNode } = {
  'needs_fertilizer': <Droplet className="h-4 w-4 text-blue-500" />,
  'needs_seed_cane': <Leaf className="h-4 w-4 text-green-500" />,
  'needs_harvesting': <Sun className="h-4 w-4 text-amber-500" />,
  'needs_ploughing': <Tractor className="h-4 w-4 text-orange-500" />,
  'has_crop_issues': <AlertTriangle className="h-4 w-4 text-red-500" />,
  'needs_pesticide': <Bug className="h-4 w-4 text-purple-500" />
}

export default function ResolveIssueModal({ call, isOpen, onClose, onResolve }: ResolveIssueModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [resolvedBy, setResolvedBy] = useState('')
  const [dateResolved, setDateResolved] = useState('')
  const [farmerConfirmation, setFarmerConfirmation] = useState(false)
  const [notes, setNotes] = useState('')
  const [selectedIssues, setSelectedIssues] = useState<string[]>([])
  
  // Get current date in YYYY-MM-DD format for the date input default
  useEffect(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    setDateResolved(`${year}-${month}-${day}`)
  }, [])
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Default select all unresolved issues
      const issueKeys = Object.keys(issueDisplayMap)
      const defaultSelected = issueKeys.filter(key => call[key])
      setSelectedIssues(defaultSelected)
      setError(null)
    }
  }, [isOpen, call])
  
  // Handle issue checkbox change
  const handleIssueToggle = (issue: string) => {
    setSelectedIssues(prev => {
      if (prev.includes(issue)) {
        return prev.filter(i => i !== issue)
      } else {
        return [...prev, issue]
      }
    })
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedIssues.length === 0) {
      setError('Please select at least one issue to resolve')
      return
    }
    
    if (!resolvedBy.trim()) {
      setError('Please enter your name')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Prepare the resolution data
      const resolutionData = {
        call_id: call.id,
        date_resolved: new Date(dateResolved).toISOString(),
        resolved_by: resolvedBy,
        issue_resolved: selectedIssues.map(issue => issueDisplayMap[issue]).join(', '),
        farmer_confirmation: farmerConfirmation,
        notes: notes.trim() || null
      }
      
      // Submit to API
      const response = await fetch('/api/resolutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resolutionData)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create resolution')
      }
      
      // Success!
      toast({
        title: 'Issue resolved',
        description: 'The issue has been marked as resolved successfully.',
        variant: 'default'
      })
      
      // Close modal and refresh data
      onResolve()
      onClose()
    } catch (err) {
      console.error('Error resolving issue:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      
      toast({
        title: 'Error',
        description: 'There was a problem resolving the issue. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // If modal is not open, don't render anything
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Resolve Issue</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded-md mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Issues to resolve - checkboxes */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Issues to Resolve:
                </label>
                <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">
                  {Object.entries(issueDisplayMap).map(([key, label]) => (
                    // Only show checkbox if the call has this issue
                    call[key] ? (
                      <label key={key} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedIssues.includes(key)}
                          onChange={() => handleIssueToggle(key)}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="flex items-center">
                          <span className="mr-2">{issueIconMap[key]}</span>
                          {label}
                        </span>
                      </label>
                    ) : null
                  ))}
                  
                  {/* Show message if no issues to resolve */}
                  {Object.keys(issueDisplayMap).filter(key => call[key]).length === 0 && (
                    <div className="text-center py-2 text-muted-foreground">
                      No issues to resolve
                    </div>
                  )}
                </div>
              </div>
              
              {/* Resolved by */}
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="resolvedBy">
                  Resolved by:
                </label>
                <Input
                  id="resolvedBy"
                  value={resolvedBy}
                  onChange={(e) => setResolvedBy(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              
              {/* Date resolved */}
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="dateResolved">
                  Date resolved:
                </label>
                <Input
                  id="dateResolved"
                  type="date"
                  value={dateResolved}
                  onChange={(e) => setDateResolved(e.target.value)}
                  required
                />
              </div>
              
              {/* Farmer confirmation */}
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={farmerConfirmation}
                    onChange={(e) => setFarmerConfirmation(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>Farmer has confirmed resolution</span>
                </label>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="notes">
                  Notes:
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about the resolution"
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md border-input"
                />
              </div>
              
              {/* Add a summary section before the submit button */}
              <div className="mt-4 border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Resolution Summary:</h3>
                
                <div className="bg-green-50 dark:bg-green-900/30 rounded-md p-3 text-sm text-green-800 dark:text-green-100">
                  <div className="mb-2 font-medium flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    The following changes will be made:
                  </div>
                  
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    {selectedIssues.length > 0 ? (
                      <>
                        <li>
                          Mark issue{selectedIssues.length > 1 ? 's' : ''} as resolved: {' '}
                          <span className="font-medium">
                            {selectedIssues.map(issue => issueDisplayMap[issue]).join(', ')}
                          </span>
                        </li>
                        <li>
                          Set resolution date: <span className="font-medium">{dateResolved || 'Today'}</span>
                        </li>
                        <li>
                          Set resolved by: <span className="font-medium">{resolvedBy || '[Your name]'}</span>
                        </li>
                        {farmerConfirmation && (
                          <li>
                            Farmer confirmation: <span className="font-medium">Yes</span>
                          </li>
                        )}
                        {notes && (
                          <li>
                            Additional notes will be added
                          </li>
                        )}
                        <li>
                          The call will be marked as <span className="font-medium">Resolved</span>
                        </li>
                      </>
                    ) : (
                      <li className="text-amber-800 dark:text-amber-200">
                        Please select at least one issue to resolve
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              
              {/* Submit button */}
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || selectedIssues.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Saving...' : 'Save Resolution'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 