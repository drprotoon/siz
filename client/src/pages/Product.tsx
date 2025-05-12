import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import FreightCalculator from "@/components/FreightCalculator";
import ProductCard from "@/components/ProductCard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getDiscountPercentage } from "@/lib/utils";
import { Heart, ShoppingBag, CheckCircle } from "lucide-react";

export default function Product() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState("");
  const [selectedShipping, setSelectedShipping] = useState<{ name: string; price: number } | null>(null);
  
  // Check if user is authenticated
  const { data: authData } = queryClient.getQueryData<any>(["/api/auth/me"]) || {};
  const isAuthenticated = !!authData?.user;

  // Fetch product details
  const { 
    data: product, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: [`/api/products/${slug}`],
  });

  // Set initial main image when product data loads
  if (product && product.images && product.images.length > 0 && !mainImage) {
    setMainImage(product.images[0]);
  }

  // Fetch related products
  const { data: relatedProducts, isLoading: relatedLoading } = useQuery({
    queryKey: ['/api/products', { categoryId: product?.categoryId }],
    enabled: !!product?.categoryId,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: quantity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
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

  // Handle freight selection
  const handleFreightSelection = (option: { name: string; price: number }) => {
    setSelectedShipping(option);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    addToCartMutation.mutate();
  };

  // Handle add to wishlist
  const handleAddToWishlist = () => {
    toast({
      title: "Feature not implemented",
      description: "Add to wishlist will be available soon.",
      variant: "default",
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div>
          <Skeleton className="w-full h-[500px] rounded-lg mb-4" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="w-full h-24 rounded-md" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  // Calculate discount percentage if there is a compareAtPrice
  const discountPercentage = product.compareAtPrice ? 
    getDiscountPercentage(parseFloat(product.price), parseFloat(product.compareAtPrice)) : 0;

  return (
    <>
      {/* Breadcrumb */}
      <div className="py-4 mb-6">
        <div className="flex items-center text-sm text-gray-500">
          <a href="/" className="hover:text-primary">Home</a>
          <span className="mx-2">/</span>
          <a href={`/category/${product.category.slug}`} className="hover:text-primary">{product.category.name}</a>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{product.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          <div className="mb-4">
            <img 
              src={mainImage || product.images[0]} 
              alt={product.name} 
              className="w-full h-auto rounded-lg" 
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image: string, index: number) => (
              <button 
                key={index}
                className={`border-2 ${mainImage === image ? 'border-primary' : 'border-transparent hover:border-primary'} rounded-md overflow-hidden transition-colors`}
                onClick={() => setMainImage(image)}
              >
                <img src={image} alt={`${product.name} - ${index + 1}`} className="w-full h-auto" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div>
          <div className="mb-4">
            <span className="text-gray-500">{product.category.name}</span>
            <h1 className="text-3xl font-bold mt-1 font-heading">{product.name}</h1>
            
            <div className="flex items-center mt-2 mb-4">
              <StarRating rating={parseFloat(product.rating)} count={product.reviewCount} />
            </div>
            
            <div className="flex items-center mb-6">
              <span className="text-2xl font-bold mr-3">{formatCurrency(parseFloat(product.price))}</span>
              {product.compareAtPrice && (
                <>
                  <span className="text-gray-500 line-through">{formatCurrency(parseFloat(product.compareAtPrice))}</span>
                  <span className="ml-3 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">{discountPercentage}% OFF</span>
                </>
              )}
            </div>

            <div className="space-y-6">
              {/* Weight & Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Weight</label>
                  <div className="border border-gray-300 rounded-md p-3">
                    {product.weight}g
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Quantity</label>
                  <QuantitySelector 
                    initialValue={quantity} 
                    min={1} 
                    max={product.quantity}
                    onChange={(value) => setQuantity(value)}
                  />
                </div>
              </div>

              {/* Shipping Calculator */}
              <FreightCalculator 
                productWeight={parseFloat(product.weight)} 
                onSelect={handleFreightSelection}
              />

              {/* Add to Cart */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="bg-primary hover:bg-pink-600 text-white rounded-md py-3 font-semibold transition-colors flex items-center justify-center"
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending || product.quantity <= 0}
                >
                  <ShoppingBag className="mr-2" size={18} />
                  {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                </Button>
                <Button 
                  variant="outline" 
                  className="border border-primary text-primary hover:bg-primary hover:text-white rounded-md py-3 font-semibold transition-colors flex items-center justify-center"
                  onClick={handleAddToWishlist}
                >
                  <Heart className="mr-2" size={18} />
                  Add to Wishlist
                </Button>
              </div>

              {/* Stock Status */}
              <div className="flex items-center">
                {product.quantity > 0 ? (
                  <div className="flex items-center text-success">
                    <CheckCircle className="mr-2" size={18} />
                    <span>
                      {product.quantity > 10 
                        ? 'In Stock - Ready to Ship' 
                        : `Low Stock - Only ${product.quantity} left`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-500">
                    <span>Out of Stock</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Information Tabs */}
      <div className="mb-16">
        <Tabs defaultValue="description">
          <TabsList className="w-full border-b border-gray-200 justify-start">
            <TabsTrigger value="description" className="px-6 py-3 font-medium">Description</TabsTrigger>
            <TabsTrigger value="ingredients" className="px-6 py-3 font-medium">Ingredients</TabsTrigger>
            <TabsTrigger value="how-to-use" className="px-6 py-3 font-medium">How To Use</TabsTrigger>
            <TabsTrigger value="reviews" className="px-6 py-3 font-medium">Reviews ({product.reviewCount})</TabsTrigger>
          </TabsList>
          
          <div className="py-6">
            <TabsContent value="description">
              <div className="space-y-4">
                <p>{product.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-primary text-xl mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <h4 className="font-medium mb-1">Natural Ingredients</h4>
                    <p className="text-sm text-gray-500">Made with 95% natural origin ingredients</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-primary text-xl mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <h4 className="font-medium mb-1">Dermatologically Tested</h4>
                    <p className="text-sm text-gray-500">Safe for all skin types, including sensitive skin</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-primary text-xl mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                    </div>
                    <h4 className="font-medium mb-1">Cruelty Free</h4>
                    <p className="text-sm text-gray-500">Never tested on animals</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ingredients">
              <div>
                <p className="mb-4">Full Ingredients List:</p>
                <p className="mb-4">{product.ingredients}</p>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Key Ingredients:</h4>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h5 className="font-medium">Hyaluronic Acid</h5>
                      <p className="text-sm text-gray-600">A powerful humectant that can hold up to 1000x its weight in water, providing intense hydration and helping to plump the skin.</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h5 className="font-medium">Shea Butter</h5>
                      <p className="text-sm text-gray-600">Rich in vitamins and fatty acids, shea butter helps to nourish and soften the skin while supporting the skin's natural barrier.</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h5 className="font-medium">Aloe Vera</h5>
                      <p className="text-sm text-gray-600">Known for its soothing properties, aloe vera helps to calm and condition the skin while providing hydration.</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="how-to-use">
              <div>
                <h4 className="font-medium mb-4">Directions for Use:</h4>
                {product.howToUse ? (
                  <p>{product.howToUse}</p>
                ) : (
                  <ol className="list-decimal pl-5 mb-6 space-y-2">
                    <li>Cleanse your face with your preferred cleanser and pat dry.</li>
                    <li>If using a toner, apply it before the product.</li>
                    <li>Take a small amount of the product onto your fingertips.</li>
                    <li>Gently massage into your face and neck using upward circular motions.</li>
                    <li>Allow to fully absorb before applying makeup or sunscreen.</li>
                  </ol>
                )}
                
                <p className="mb-4">For best results, use as directed and as part of your daily skincare routine. For external use only. Avoid contact with eyes. Discontinue use if irritation occurs.</p>
                
                <div className="mt-8 bg-gray-50 rounded-lg p-5">
                  <h4 className="font-medium mb-3">Pro Tip</h4>
                  <p className="text-gray-700">For an extra boost of efficacy, apply to slightly damp skin after cleansing. This helps to lock in additional moisture and enhances the effectiveness of the product.</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reviews">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <div className="text-center mb-4">
                      <div className="text-5xl font-bold text-gray-800">{product.rating}</div>
                      <div className="flex justify-center my-2">
                        <StarRating rating={parseFloat(product.rating)} />
                      </div>
                      <div className="text-gray-500">Based on {product.reviewCount} reviews</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="text-sm w-10">5 ★</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full ml-2">
                          <div className="h-2 bg-yellow-400 rounded-full" style={{ width: "75%" }}></div>
                        </div>
                        <span className="text-sm w-10 text-right">32</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm w-10">4 ★</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full ml-2">
                          <div className="h-2 bg-yellow-400 rounded-full" style={{ width: "15%" }}></div>
                        </div>
                        <span className="text-sm w-10 text-right">6</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm w-10">3 ★</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full ml-2">
                          <div className="h-2 bg-yellow-400 rounded-full" style={{ width: "7%" }}></div>
                        </div>
                        <span className="text-sm w-10 text-right">3</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm w-10">2 ★</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full ml-2">
                          <div className="h-2 bg-yellow-400 rounded-full" style={{ width: "2%" }}></div>
                        </div>
                        <span className="text-sm w-10 text-right">1</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm w-10">1 ★</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full ml-2">
                          <div className="h-2 bg-yellow-400 rounded-full" style={{ width: "0%" }}></div>
                        </div>
                        <span className="text-sm w-10 text-right">0</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-6 bg-primary hover:bg-pink-600 text-white rounded-md py-2 font-medium transition-colors"
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast({
                            title: "Authentication required",
                            description: "Please log in to write a review.",
                            variant: "destructive",
                          });
                          return;
                        }
                        // Show review form logic would go here
                        toast({
                          title: "Feature not implemented",
                          description: "Review submission will be available soon.",
                          variant: "default",
                        });
                      }}
                    >
                      Write a Review
                    </Button>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <div className="space-y-6">
                    {product.reviewCount > 0 ? (
                      // Here would be the actual reviews from the API
                      // For now showing sample reviews
                      <>
                        <div className="border-b border-gray-200 pb-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-medium">Amazing product!</h5>
                              <div className="flex text-yellow-400 my-1">
                                <StarRating rating={5} />
                              </div>
                            </div>
                            <span className="text-gray-500 text-sm">May 15, 2023</span>
                          </div>
                          <div className="flex items-center mb-2">
                            <span className="text-gray-700 font-medium mr-2">Maria S.</span>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Verified Purchase</span>
                          </div>
                          <p className="text-gray-600">I've been using this for a month now and the results are incredible. My skin feels so much more hydrated and smooth. I highly recommend it!</p>
                        </div>
                        
                        <div className="border-b border-gray-200 pb-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-medium">Good but not perfect</h5>
                              <div className="flex text-yellow-400 my-1">
                                <StarRating rating={4} />
                              </div>
                            </div>
                            <span className="text-gray-500 text-sm">Apr 30, 2023</span>
                          </div>
                          <div className="flex items-center mb-2">
                            <span className="text-gray-700 font-medium mr-2">João P.</span>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Verified Purchase</span>
                          </div>
                          <p className="text-gray-600">This product provides great results and absorbs well. My skin definitely feels better after using it. I'm giving it 4 stars because the fragrance is a bit stronger than I'd prefer, but overall it's a good product for the price.</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                      </div>
                    )}
                  </div>
                  
                  {product.reviewCount > 3 && (
                    <div className="mt-6 flex justify-center">
                      <Button variant="link" className="text-primary hover:text-pink-700 flex items-center">
                        Load More Reviews
                        <svg className="ml-1 w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Related Products */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 font-heading">You May Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {relatedLoading ? (
            // Skeleton loading for related products
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-64 w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))
          ) : relatedProducts && relatedProducts.length > 0 ? (
            // Filter out the current product and take max 4 related products
            relatedProducts
              .filter((p: any) => p.id !== product.id)
              .slice(0, 4)
              .map((relatedProduct: any) => (
                <ProductCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  name={relatedProduct.name}
                  slug={relatedProduct.slug}
                  price={relatedProduct.price}
                  compareAtPrice={relatedProduct.compareAtPrice}
                  categoryName={relatedProduct.category.name}
                  rating={relatedProduct.rating}
                  reviewCount={relatedProduct.reviewCount}
                  mainImage={relatedProduct.images[0]}
                  bestSeller={relatedProduct.bestSeller}
                  newArrival={relatedProduct.newArrival}
                />
              ))
          ) : (
            <div className="col-span-4 text-center py-10">No related products found</div>
          )}
        </div>
      </section>
    </>
  );
}
