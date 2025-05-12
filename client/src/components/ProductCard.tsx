import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Heart, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  id: number;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string;
  categoryName: string;
  rating: string;
  reviewCount: number;
  mainImage: string;
  bestSeller?: boolean;
  newArrival?: boolean;
}

export default function ProductCard({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  categoryName,
  rating,
  reviewCount,
  mainImage,
  bestSeller,
  newArrival
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  
  // Check if user is authenticated
  const { data: authData } = queryClient.getQueryData<any>(["/api/auth/me"]) || {};
  const isAuthenticated = !!authData?.user;

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cart", {
        productId: id,
        quantity: 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${name} has been added to your cart.`,
        variant: "default",
      });
    },
    onError: (error) => {
      if (!isAuthenticated) {
        toast({
          title: "Authentication required",
          description: "Please log in to add items to your cart.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Could not add item to cart.",
          variant: "destructive",
        });
      }
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCartMutation.mutate();
  };

  return (
    <Link href={`/product/${slug}`}>
      <Card 
        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <img 
            src={mainImage} 
            alt={name} 
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105" 
          />
          <div className={`absolute top-3 right-3 bg-white rounded-full p-2 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-800 hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Add to wishlist logic would go here
              }}
            >
              <Heart size={20} />
            </Button>
          </div>
          {(bestSeller || newArrival) && (
            <div className="absolute top-3 left-3">
              {bestSeller && (
                <span className="bg-primary text-white text-xs px-2 py-1 rounded">Best Seller</span>
              )}
              {newArrival && !bestSeller && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">New</span>
              )}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <p className="text-gray-500 text-sm mb-1">{categoryName}</p>
          <h3 className="font-medium mb-1 truncate">{name}</h3>
          <div className="flex items-center mb-2">
            <StarRating rating={parseFloat(rating)} count={reviewCount} />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold">{formatCurrency(parseFloat(price))}</span>
              {compareAtPrice && (
                <span className="text-gray-500 line-through ml-2 text-sm">
                  {formatCurrency(parseFloat(compareAtPrice))}
                </span>
              )}
            </div>
            <Button
              size="icon"
              className="bg-primary hover:bg-pink-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending}
            >
              <ShoppingBag size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
