import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Heart, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { theme } = useTheme();

  // Usar o hook de autenticação
  const { isAuthenticated } = useAuth();

  // Usar o contexto do carrinho
  const { addToCart, buyNow } = useCart();

  // Usar o hook de navegação
  const [, navigate] = useLocation();

  // Check if product is in wishlist
  const { data: wishlistCheck } = useQuery({
    queryKey: [`/api/wishlist/check/${id}`],
    enabled: isAuthenticated,
  });

  const isInWishlist = wishlistCheck?.isInWishlist;

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/wishlist", {
        productId: id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wishlist/check/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Adicionado à lista de desejos",
        description: `${name} foi adicionado à sua lista de desejos.`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar o item à lista de desejos.",
        variant: "destructive",
      });
    },
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async () => {
      // First get the wishlist item id
      const wishlistResponse = await apiRequest("GET", "/api/wishlist");
      const wishlistItems = await wishlistResponse.json();
      const wishlistItem = wishlistItems.find((item: any) => item.productId === id);

      if (!wishlistItem) {
        throw new Error("Item não encontrado na lista de desejos");
      }

      return apiRequest("DELETE", `/api/wishlist/${wishlistItem.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wishlist/check/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Removido da lista de desejos",
        description: `${name} foi removido da sua lista de desejos.`,
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Usar o contexto do carrinho em vez da mutação
    addToCart({
      id,
      name,
      price,
      images: [mainImage],
    }, 1);
  };

  // Função para compra direta
  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Verificar se o usuário está autenticado
    if (!isAuthenticated) {
      // Salvar o estado atual para redirecionamento após login
      sessionStorage.setItem('redirectAfterLogin', '/checkout');
      sessionStorage.setItem('pendingProductId', id.toString());
      sessionStorage.setItem('pendingProductQuantity', '1');

      toast({
        title: "Autenticação necessária",
        description: "Você precisa estar logado para finalizar a compra. Você será redirecionado após o login.",
        variant: "default",
      });

      navigate("/login");
      return;
    }

    // Usar a função buyNow do contexto do carrinho
    buyNow({
      id,
      name,
      price,
      images: [mainImage],
    }, 1);

    // Navegar para o checkout
    navigate("/checkout");
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para adicionar produtos à lista de desejos.",
        variant: "default",
      });
      return;
    }

    if (isInWishlist) {
      removeFromWishlistMutation.mutate();
    } else {
      addToWishlistMutation.mutate();
    }
  };

  return (
    <Link href={`/product/${slug}`}>
      <Card
        className="bg-card text-card-foreground rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-square overflow-hidden">
          <img
            src={mainImage}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className={`absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-2 ${isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-60'} transition-opacity`}>
            <Button
              variant="ghost"
              size="icon"
              className={`${isInWishlist ? 'text-primary' : 'text-foreground'} hover:text-primary`}
              onClick={handleToggleWishlist}
              disabled={addToWishlistMutation.isPending || removeFromWishlistMutation.isPending}
            >
              <Heart size={20} fill={isInWishlist ? 'currentColor' : 'none'} />
            </Button>
          </div>
          {(bestSeller || newArrival) && (
            <div className="absolute top-3 left-3">
              {bestSeller && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">Best Seller</span>
              )}
              {newArrival && !bestSeller && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">New</span>
              )}
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-grow flex flex-col">
          <div className="flex-grow">
            <p className="text-muted-foreground text-sm mb-1">{categoryName}</p>
            <h3 className="font-medium mb-1 line-clamp-2 h-12">{name}</h3>
            <div className="flex items-center mb-2">
              <StarRating rating={parseFloat(rating)} count={reviewCount} />
            </div>
          </div>
          <div className="flex justify-between items-center mt-auto pt-2">
            <div>
              <span className="font-bold">{formatCurrency(parseFloat(price))}</span>
              {compareAtPrice && (
                <span className="text-muted-foreground line-through ml-2 text-sm">
                  {formatCurrency(parseFloat(compareAtPrice))}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                size="icon"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                onClick={handleAddToCart}
              >
                <ShoppingBag size={16} />
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded-md"
                onClick={handleBuyNow}
              >
                Comprar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
