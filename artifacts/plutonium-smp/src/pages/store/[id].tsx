import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetStoreItem, useGetProductReviews, useCreateProductReview } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Check, DollarSign, Star, ChevronLeft, ChevronRight, Package, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

function StarRating({ value, onChange, size = "md" }: { value: number; onChange?: (v: number) => void; size?: "sm" | "md" }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${sz} transition-colors ${
            star <= (hovered || value) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
          } ${onChange ? "cursor-pointer" : ""}`}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(star)}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="p-5 bg-background rounded-xl border border-border">
      <div className="flex items-start gap-3">
        <Avatar className="w-9 h-9 border border-border">
          <AvatarFallback className="text-sm bg-primary/10 text-primary">
            {review.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-semibold text-sm">{review.username}</span>
            <span className="text-xs text-muted-foreground">{format(new Date(review.createdAt), "MMM d, yyyy")}</span>
          </div>
          <StarRating value={review.rating} size="sm" />
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
        </div>
      </div>
    </div>
  );
}

export default function StoreItemDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading } = useGetStoreItem(id!);
  const { data: reviews, refetch: refetchReviews } = useGetProductReviews(id!);
  const { mutate: submitReview, isPending: submittingReview } = useCreateProductReview();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [imageIndex, setImageIndex] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 w-40 bg-card rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="h-96 bg-card rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-card rounded w-3/4" />
            <div className="h-6 bg-card rounded w-1/2" />
            <div className="h-32 bg-card rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <Package className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Item not found</h2>
        <Link href="/store"><Button variant="outline">Back to Store</Button></Link>
      </div>
    );
  }

  const allImages = [item.imageUrl, ...(item.images || [])].filter(Boolean) as string[];
  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const handleAddToCart = () => {
    if (!user) {
      toast({ title: "Login required", description: "Please log in to add items to your cart.", variant: "destructive" });
      return;
    }
    addItem(item);
    toast({ title: "Added to cart!", description: `${item.name} added to your cart.` });
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Login required", variant: "destructive" });
      return;
    }
    if (reviewRating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    submitReview(
      { itemId: id!, data: { rating: reviewRating, comment: reviewComment } },
      {
        onSuccess: () => {
          toast({ title: "Review submitted!" });
          setReviewRating(0);
          setReviewComment("");
          refetchReviews();
        },
        onError: (err: any) => {
          toast({ title: "Failed to submit review", description: err?.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <Link href="/store">
        <Button variant="ghost" className="mb-8 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="space-y-4">
          <div className="relative bg-card border border-border rounded-2xl overflow-hidden flex items-center justify-center" style={{ minHeight: 340 }}>
            {allImages.length > 0 ? (
              <>
                <motion.img
                  key={imageIndex}
                  src={allImages[imageIndex]}
                  alt={item.name}
                  className="max-h-80 max-w-full object-contain p-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setImageIndex(i => (i - 1 + allImages.length) % allImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 border border-border rounded-full p-2 hover:bg-background transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setImageIndex(i => (i + 1) % allImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 border border-border rounded-full p-2 hover:bg-background transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                {item.isFeatured && (
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    FEATURED
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40">
                <Package className="w-20 h-20 mb-4" />
                <span className="text-sm">No image available</span>
              </div>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                    i === imageIndex ? "border-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="capitalize text-xs">{item.category.replace("_", " ")}</Badge>
              {item.badge && (
                <Badge variant="outline" className="text-primary border-primary/40 text-xs">{item.badge}</Badge>
              )}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black mb-3">{item.name}</h1>
            {reviews && reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <StarRating value={Math.round(avgRating)} size="sm" />
                <span className="text-sm text-muted-foreground">
                  {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 font-bold text-3xl">
              {item.currency === "usd" ? (
                <>
                  <DollarSign className="w-7 h-7 text-green-500" />
                  <span>{(item.price / 100).toFixed(2)}</span>
                  <span className="text-base font-normal text-muted-foreground">USD</span>
                </>
              ) : (
                <span className="text-yellow-400">{item.price} OWO Coins</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Description</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>
          </div>

          {item.features && item.features.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">What's Included</h3>
              <ul className="space-y-2">
                {item.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleAddToCart}
              size="lg"
              className="flex-1 bg-primary text-primary-foreground font-bold neon-glow-hover gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-12">
        <h2 className="font-display text-2xl font-bold mb-8">
          Customer Reviews
          {reviews && reviews.length > 0 && (
            <span className="text-muted-foreground font-normal text-lg ml-2">({reviews.length})</span>
          )}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {!reviews || reviews.length === 0 ? (
              <div className="py-12 text-center bg-card rounded-xl border border-border">
                <Star className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="font-medium mb-1">No reviews yet</p>
                <p className="text-sm text-muted-foreground">Be the first to share your experience!</p>
              </div>
            ) : (
              reviews.map(review => <ReviewCard key={review.id} review={review} />)
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
              <h3 className="font-semibold mb-4">Write a Review</h3>
              {!user ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">Sign in to leave a review</p>
                  <Link href="/login">
                    <Button size="sm" className="bg-primary text-primary-foreground">Sign In</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Rating</label>
                    <StarRating value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Review</label>
                    <Textarea
                      required
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this item..."
                      className="bg-background border-border min-h-[100px] resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submittingReview || reviewRating === 0}
                    className="w-full bg-primary text-primary-foreground font-bold"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
