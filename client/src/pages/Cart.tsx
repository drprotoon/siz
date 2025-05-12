import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, ShoppingBag, ArrowLeft, CreditCard } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { processPayment } from "@/lib/paymentService";

export default function Cart() {
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Check if user is authenticated
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Fetch cart items (now works for both logged in and guest users)
  const { data: cartItems, isLoading, isError } = useQuery({
    queryKey: ["/api/cart"],
  });

  // Update cart item quantity mutation
  const updateCartItemMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      return apiRequest("PUT", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating quantity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove item from cart mutation
  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "The item has been removed from your cart.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error clearing cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle quantity change
  const handleQuantityChange = (id: number, quantity: number) => {
    updateCartItemMutation.mutate({ id, quantity });
  };

  // Handle remove item
  const handleRemoveItem = (id: number) => {
    removeItemMutation.mutate(id);
  };

  // Handle clear cart
  const handleClearCart = () => {
    clearCartMutation.mutate();
  };

  // Handle checkout
  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      // Calculate total amount
      const total = cartItems.reduce((sum: number, item: any) => (
        sum + (parseFloat(item.product.price) * item.quantity)
      ), 0);
      
      // Process payment (simplified for this example)
      const paymentResult = await processPayment(total);
      
      if (paymentResult.success) {
        // Create order with all cart items
        // This would be implemented in a real application
        
        // Clear cart after successful order
        await clearCartMutation.mutateAsync();
        
        toast({
          title: "Order placed successfully!",
          description: "Thank you for your purchase.",
          variant: "default",
        });
        
        // Navigate to order confirmation page
        // This would redirect to an order confirmation page in a real application
      } else {
        throw new Error("Payment processing failed. Please try again.");
      }
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Calculate cart totals
  const calculateSubtotal = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((sum: number, item: any) => (
      sum + (parseFloat(item.product.price) * item.quantity)
    ), 0);
  };

  // Assume shipping cost for now - in a real app this would come from the freight calculation
  const shippingCost = cartItems && cartItems.length > 0 ? 15.0 : 0;
  
  // Calculate total
  const total = calculateSubtotal() + shippingCost;

  // If not authenticated
  if (!authData?.user) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Please Log In To View Your Cart</h1>
        <p className="text-gray-600 mb-8">You need to be logged in to view and manage your shopping cart.</p>
        <Button onClick={() => window.history.back()} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-6">Your Shopping Cart</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center border-b pb-4">
              <Skeleton className="h-24 w-24 rounded-md mr-4" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-16 ml-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Error Loading Cart</h1>
        <p className="text-gray-600 mb-8">There was a problem loading your cart. Please try again later.</p>
        <Button onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  // Empty cart
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-8">Looks like you haven't added any products to your cart yet.</p>
        <Link href="/">
          <Button className="bg-primary hover:bg-pink-600 text-white">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold mb-6">Your Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="w-full lg:w-2/3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartItems.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded-md mr-4" 
                      />
                      <div>
                        <Link href={`/product/${item.product.slug}`}>
                          <a className="font-medium hover:text-primary">{item.product.name}</a>
                        </Link>
                        <p className="text-sm text-gray-500">{item.product.category.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(parseFloat(item.product.price))}</TableCell>
                  <TableCell>
                    <QuantitySelector 
                      initialValue={item.quantity} 
                      min={1} 
                      max={item.product.quantity} 
                      onChange={(value) => handleQuantityChange(item.id, value)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(parseFloat(item.product.price) * item.quantity)}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Continue Shopping
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClearCart}
              className="text-red-500 border-red-500 hover:bg-red-50"
            >
              Clear Cart
            </Button>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">{formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="font-bold">Total</span>
                <span className="font-bold text-xl">{formatCurrency(total)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full bg-primary hover:bg-pink-600 text-white flex items-center justify-center"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Proceed to Checkout
                </span>
              )}
            </Button>
            
            <div className="mt-4 text-sm text-gray-500 text-center">
              <p>Secure checkout with encryption</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
