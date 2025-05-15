import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function Wishlist() {
  const { toast } = useToast();

  // Fetch wishlist items
  const { data: wishlistItems, isLoading, isError } = useQuery({
    queryKey: ["/api/wishlist"],
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/wishlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Item removido",
        description: "O item foi removido da sua lista de desejos.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o item da lista de desejos.",
        variant: "destructive",
      });
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("POST", "/api/cart", {
        productId,
        quantity: 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Adicionado ao carrinho",
        description: "O produto foi adicionado ao seu carrinho.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar o item ao carrinho.",
        variant: "destructive",
      });
    },
  });

  // Handle remove from wishlist
  const handleRemoveFromWishlist = (id: number) => {
    removeFromWishlistMutation.mutate(id);
  };

  // Handle add to cart
  const handleAddToCart = (productId: number, wishlistItemId: number) => {
    addToCartMutation.mutate(productId);
    // Optionally remove from wishlist after adding to cart
    // removeFromWishlistMutation.mutate(wishlistItemId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Minha Lista de Desejos</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-6">Minha Lista de Desejos</h1>
        <p className="text-red-500 mb-4">Ocorreu um erro ao carregar sua lista de desejos.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] })}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Empty wishlist
  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Sua Lista de Desejos está Vazia</h1>
        <p className="text-gray-600 mb-8">Você ainda não adicionou nenhum produto à sua lista de desejos.</p>
        <Link href="/">
          <Button className="bg-primary hover:bg-pink-600 text-white">
            <ArrowLeft className="mr-2" size={16} />
            Continuar Comprando
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Minha Lista de Desejos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((item: any) => (
          <Card key={item.id} className="overflow-hidden">
            <Link href={`/product/${item.product.slug}`}>
              <div className="relative h-48 overflow-hidden">
                <img
                  src={Array.isArray(item.product.images) && item.product.images.length > 0 
                    ? item.product.images[0] 
                    : 'https://via.placeholder.com/300'}
                  alt={item.product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            </Link>
            <CardContent className="p-4">
              <Link href={`/product/${item.product.slug}`}>
                <h3 className="font-medium mb-1 hover:text-primary transition-colors">{item.product.name}</h3>
              </Link>
              <p className="text-gray-500 text-sm mb-2">{item.product.category?.name}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold">{formatCurrency(parseFloat(item.product.price))}</span>
                {item.product.compareAtPrice && (
                  <span className="text-gray-500 line-through text-sm">
                    {formatCurrency(parseFloat(item.product.compareAtPrice))}
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  className="flex-1 bg-primary hover:bg-pink-600 text-white"
                  onClick={() => handleAddToCart(item.productId, item.id)}
                  disabled={addToCartMutation.isPending}
                >
                  <ShoppingBag className="mr-2" size={16} />
                  Adicionar ao Carrinho
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-300"
                  onClick={() => handleRemoveFromWishlist(item.id)}
                  disabled={removeFromWishlistMutation.isPending}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
