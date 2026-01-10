// components/ReviewsList.tsx - FIXED VERSION
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Star, User, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string
  customer_name: string
  created_at: string
}

interface ReviewsListProps {
  providerId: string
}

export default function ReviewsList({ providerId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [totalReviews, setTotalReviews] = useState(0)
  const [averageRating, setAverageRating] = useState(0)

  useEffect(() => {
    if (providerId) {
      loadReviews()
    }
  }, [providerId])

  const loadReviews = async () => {
    try {
      setLoading(true)
      
      // Load reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })

      if (reviewsError) throw reviewsError

      // Calculate average rating
      const total = reviewsData?.length || 0
      const sum = reviewsData?.reduce((acc, review) => acc + (review.rating || 0), 0) || 0
      const avg = total > 0 ? sum / total : 0

      // FIX: Ensure reviews is always an array
      setReviews(reviewsData || [])
      setTotalReviews(total)
      setAverageRating(avg)
      
    } catch (error) {
      console.error('Error loading reviews:', error)
      // Set default empty array on error
      setReviews([])
      setTotalReviews(0)
      setAverageRating(0)
    } finally {
      setLoading(false)
    }
  }

  // FIX: Add safe check before slice
  const displayedReviews = showAll ? reviews : (reviews?.slice(0, 3) || [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-50 animate-pulse p-4 rounded-lg">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (totalReviews === 0) {
    return (
      <div className="text-center py-8">
        <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
        <p className="text-gray-600">Be the first to review this provider!</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div>
      {/* Rating Summary */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(averageRating) 
                      ? 'text-yellow-500 fill-yellow-500' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{totalReviews}</div>
            <div className="text-gray-600">Total Reviews</div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {displayedReviews.map((review) => (
          <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-3">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{review.customer_name || 'Anonymous'}</h4>
                  <div className="flex items-center mt-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(review.rating) 
                              ? 'text-yellow-500 fill-yellow-500' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 ml-2">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-600">{review.comment}</p>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {reviews.length > 3 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center text-primary hover:text-green-700 font-medium"
          >
            {showAll ? (
              <>
                Show Less
                <ChevronUp className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Show All Reviews
                <ChevronDown className="h-4 w-4 ml-1" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}