"use client"

import { useState, useEffect } from "react"
import { useUser, useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Star, Check, AlertCircle } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Review } from "@/lib/db"

export function ReviewsSection({ productId }: { productId: string }) {
  const { user, isSignedIn } = useUser()
  const { getToken } = useAuth()
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Fetch reviews from API
  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/products/${productId}/reviews`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }
      
      const data = await response.json()
      setReviews(data.reviews || [])
      
      // Check if user has already reviewed this product
      if (isSignedIn && user) {
        const existingReview = data.reviews.find((review: Review) => review.userId === user.id)
        if (existingReview) {
          setUserReview(existingReview)
          setRating(existingReview.rating)
          setComment(existingReview.comment)
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast({
        title: "Error",
        description: "Could not load reviews. Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchReviews()
  }, [productId, isSignedIn, user?.id])
  
  const handleSubmitReview = async () => {
    if (!isSignedIn || !user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to leave a review",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Check if user is signed in
      if (!isSignedIn || !user) {
        toast({
          title: "Authentication Error",
          description: "You must be signed in to submit a review.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      console.log("Submitting review:", { productId, rating, comment })
      
      let responseData;
      try {
        // Make the fetch request
        console.log("Making fetch request to submit review...");
        const response = await fetch(`/api/products/${productId}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rating,
            comment,
            userName: user.fullName || user.firstName || 'Anonymous',
            userId: user.id // Include the user ID in the request
          })
        });
        
        console.log("Response received - status:", response.status);
        console.log("Response headers:", Object.fromEntries([...response.headers.entries()]));
        
        // Parse the response
        try {
          // Try to parse the JSON response, but handle the case when it's empty
          const contentType = response.headers.get("content-type");
          console.log("Response content type:", contentType);
          
          if (contentType && contentType.includes("application/json")) {
            console.log("Parsing JSON response...");
            responseData = await response.json();
            console.log("Parsed JSON response:", responseData);
          } else {
            // If not JSON, get text
            console.log("Response is not JSON, getting text...");
            const text = await response.text();
            console.log("Response text:", text || "[empty response]");
            responseData = { error: text || "Unknown error (empty response)" };
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          responseData = { error: "Could not parse error response" };
        }
        
        // Check if the request was successful
        if (!response.ok) {
          console.error("Review submission error:", responseData);
          const errorMessage = responseData?.error || responseData?.details || `Server error: ${response.status}`;
          console.error("Error message:", errorMessage);
          throw new Error(errorMessage);
        }
        
        console.log("Review submission successful:", responseData);
      } catch (fetchError) {
        console.error("Error during review submission:", fetchError);
        throw fetchError;
      }
      
      toast({
        title: userReview ? "Review updated" : "Review submitted",
        description: userReview ? "Your review has been updated successfully" : "Your review has been submitted successfully"
      })
      
      // Close the dialog
      setDialogOpen(false)
      
      // Refresh the reviews list
      fetchReviews()
      
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Customer Reviews</h3>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              {userReview ? "Edit Your Review" : "Write a Review"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{userReview ? "Edit Your Review" : "Write a Review"}</DialogTitle>
            </DialogHeader>
            
            {!isSignedIn ? (
              <div className="flex flex-col items-center text-center py-4">
                <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
                <p className="mb-4">Please sign in to leave a review</p>
                <Button className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => window.location.href = "/sign-in"}>
                  Sign In
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating">Your Rating</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star 
                            className={cn(
                              "h-6 w-6",
                              star <= rating ? "fill-amber-500 text-amber-500" : "text-gray-300"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="comment">Your Review</Label>
                    <Textarea
                      id="comment"
                      placeholder="Write your review here..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button 
                    onClick={handleSubmitReview} 
                    disabled={isSubmitting || !comment}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isSubmitting ? "Submitting..." : (userReview ? "Update Review" : "Submit Review")}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{review.userName}</h4>
                    {review.verified && (
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-1" /> Verified Purchase
                      </p>
                    )}
                  </div>
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={cn(
                          "h-4 w-4",
                          star <= review.rating ? "fill-current" : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm mb-2">{review.comment}</p>
                <p className="text-xs text-muted-foreground">
                  Posted on {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 border rounded-lg">
          <h4 className="font-medium mb-2">No Reviews Yet</h4>
          <p className="text-muted-foreground mb-4">Be the first to review this product</p>
        </div>
      )}
    </div>
  )
}

export function ProductRating({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchRatingData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/products/${productId}/reviews`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch reviews')
        }
        
        const data = await response.json()
        setReviews(data.reviews || [])
        setAverageRating(data.averageRating || 0)
      } catch (error) {
        console.error('Error fetching review ratings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRatingData()
  }, [productId])
  
  if (isLoading) {
    return null // Don't show anything while loading
  }
  
  return (
    <div className="flex items-center">
      <div className="flex text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={cn(
              "h-4 w-4",
              star <= Math.round(averageRating) ? "fill-current" : "text-gray-300"
            )}
          />
        ))}
      </div>
      <span className="ml-2 text-xs text-muted-foreground">
        {reviews.length > 0 
          ? `(${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'})`
          : '(No reviews yet)'
        }
      </span>
    </div>
  )
} 