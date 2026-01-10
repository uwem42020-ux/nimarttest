// app/components/ReviewModal.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Star, X, Send, Loader2, AlertCircle } from 'lucide-react'

interface ReviewModalProps {
  providerId: string
  providerName: string
  isOpen: boolean
  onClose: () => void
  onReviewSubmitted: () => void
}

export default function ReviewModal({ 
  providerId, 
  providerName, 
  isOpen, 
  onClose, 
  onReviewSubmitted 
}: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    
    if (!comment.trim()) {
      setError('Please write a review')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      
      if (!user) {
        throw new Error('Please login to submit a review')
      }
      
      // Check user type
      const userType = user.user_metadata?.user_type
      if (userType !== 'customer') {
        throw new Error('Only customers can submit reviews')
      }
      
      // Get customer name
      const customerName = user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous'
      
      // Submit review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          provider_id: providerId,
          customer_id: user.id,
          customer_name: customerName,
          rating: rating,
          comment: comment.trim(),
          service_type: 'General Service', // Could be dynamic if you have booking data
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (reviewError) {
        console.error('Review submission error:', reviewError)
        
        if (reviewError.code === '42501') {
          throw new Error('Permission denied. Please contact support.')
        } else if (reviewError.code === '23505') {
          throw new Error('You have already reviewed this provider.')
        } else {
          throw new Error('Failed to submit review. Please try again.')
        }
      }
      
      // Success!
      console.log('✅ Review submitted successfully')
      
      // Reset form
      setRating(0)
      setComment('')
      
      // Notify parent
      onReviewSubmitted()
      
      // Close modal after delay
      setTimeout(() => {
        onClose()
      }, 1500)
      
    } catch (err: any) {
      console.error('Review submission error:', err)
      setError(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Write a Review</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={submitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600">
            Share your experience with <span className="font-semibold">{providerName}</span>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Rating Stars */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you rate this provider? *
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none"
                  disabled={submitting}
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
            <div className="mt-2 text-center">
              <span className="text-lg font-semibold text-gray-900">
                {rating === 0 ? 'Select a rating' : `${rating}.0 ${rating === 1 ? 'star' : 'stars'}`}
              </span>
            </div>
          </div>
          
          {/* Review Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details of your experience with this provider. What did they do well? What could be improved?"
              className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              disabled={submitting}
              maxLength={1000}
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">
                Be honest and specific about your experience
              </span>
              <span className={`text-xs ${comment.length >= 900 ? 'text-red-500' : 'text-gray-500'}`}>
                {comment.length}/1000
              </span>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {/* Success Message (when submitted) */}
          {rating > 0 && comment.trim() && !error && !submitting && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                ✅ Ready to submit your {rating}-star review!
              </p>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0 || !comment.trim() || submitting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </form>
        
        {/* Tips */}
        <div className="p-6 border-t bg-gray-50 rounded-b-xl">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Review Tips</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Be specific about what you liked or didn't like</li>
            <li>• Mention if the service was on time and professional</li>
            <li>• Describe the quality of work</li>
            <li>• Keep it respectful and honest</li>
            <li>• Your review will help other customers make decisions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}