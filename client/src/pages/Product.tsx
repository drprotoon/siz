import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import PostalCodeLookup from "@/components/PostalCodeLookup";
import ProductCard from "@/components/ProductCard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getDiscountPercentage } from "@/lib/utils";
import { Heart, ShoppingBag, CheckCircle, Truck, CreditCard, Loader2 } from "lucide-react";
// Frenet integrado ao freight-client
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

export default function Product() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState("");
  const [selectedShipping, setSelectedShipping] = useState<{ name: string; price: number } | null>(null);
  const [isProcessingBuyNow, setIsProcessingBuyNow] = useState(false);

  // Use o hook useAuth para verificar a autenticação de forma confiável
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Use o hook useCart para acessar o contexto do carrinho
  const { buyNow } = useCart();

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

  // Handle freight option selection
  const handleFreightSelection = (option: FrenetShippingService) => {
    // Criar um objeto com o formato esperado pelo restante do código
    const freightOption = {
      name: `${option.Carrier} - ${option.ServiceDescription}`,
      price: option.ShippingPrice
    };

    setSelectedShipping(freightOption);
    toast({
      title: "Opção de frete selecionada",
      description: `${freightOption.name} - ${formatCurrency(freightOption.price)}`,
    });
  };

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
      toast({
        title: "Error",
        description: error.message || "Could not add item to cart.",
        variant: "destructive",
      });
    },
  });

  // Handle add to cart
  const handleAddToCart = () => {
    addToCartMutation.mutate();

    // Notify user about shipping if selected
    if (selectedShipping) {
      toast({
        title: "Frete calculado",
        description: `Frete (${selectedShipping.name}): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedShipping.price)}`,
        variant: "default",
      });
    } else {
      toast({
        title: "Dica",
        description: "Calcule o frete antes de finalizar a compra.",
        variant: "default",
      });
    }
  };

  // Handle buy now - go directly to checkout
  const handleBuyNow = async () => {
    // Verificar se o usuário está autenticado
    if (!isAuthenticated) {
      // Salvar o estado atual para redirecionamento após login
      sessionStorage.setItem('redirectAfterLogin', '/checkout');
      sessionStorage.setItem('pendingProductId', product?.id?.toString() || '');
      sessionStorage.setItem('pendingProductQuantity', quantity.toString());
      if (selectedShipping) {
        sessionStorage.setItem('pendingShipping', JSON.stringify(selectedShipping));
      }

      toast({
        title: "Autenticação necessária",
        description: "Você precisa estar logado para finalizar a compra. Você será redirecionado após o login.",
        variant: "default",
      });

      navigate("/login");
      return;
    }

    // Verificar se o produto está carregado
    if (!product || typeof product !== 'object') {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do produto. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingBuyNow(true);

    try {
      // Usar a função buyNow do contexto do carrinho
      // Isso vai limpar o carrinho e adicionar apenas este produto
      buyNow({
        id: product.id as number,
        name: product.name as string,
        price: product.price as string | number,
        images: product.images as string[],
        weight: product.weight as number,
        height: product.height as number,
        width: product.width as number,
        length: product.length as number,
        sku: product.sku as string
      }, quantity);

      // Navegar para o checkout
      navigate("/checkout");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível prosseguir para o checkout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBuyNow(false);
    }
  };

  // Check if product is in wishlist
  const { data: wishlistCheck } = useQuery({
    queryKey: [`/api/wishlist/check/${product?.id}`],
    enabled: isAuthenticated && !!product?.id,
  });

  const isInWishlist = wishlistCheck?.isInWishlist;

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/wishlist", {
        productId: product.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wishlist/check/${product.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Adicionado à lista de desejos",
        description: `${product.name} foi adicionado à sua lista de desejos.`,
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
      const wishlistItem = wishlistItems.find((item: any) => item.productId === product.id);

      if (!wishlistItem) {
        throw new Error("Item não encontrado na lista de desejos");
      }

      return apiRequest("DELETE", `/api/wishlist/${wishlistItem.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wishlist/check/${product.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Removido da lista de desejos",
        description: `${product.name} foi removido da sua lista de desejos.`,
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

  // Handle add to wishlist
  const handleToggleWishlist = () => {
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
        <h2 className="text-2xl font-bold mb-4">Produto Não Encontrado</h2>
        <p className="text-gray-600 mb-8">O produto que você está procurando não existe ou foi removido.</p>
        <Button onClick={() => window.history.back()}>Voltar</Button>
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
                  <label className="block text-gray-700 mb-2">Peso</label>
                  <div className="border border-gray-300 rounded-md p-3">
                    {product.weight}g
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Quantidade</label>
                  <QuantitySelector
                    initialValue={quantity}
                    min={1}
                    max={product.quantity}
                    onChange={(value) => setQuantity(value)}
                  />
                </div>
              </div>

              {/* Shipping Calculator */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center"><Truck className="mr-2" size={20} /> Cálculo de Frete</CardTitle>
                  <CardDescription>Informe seu CEP para calcular o frete</CardDescription>
                </CardHeader>
                <CardContent>
                  <PostalCodeLookup
                    productWeight={Number(product.weight) / 1000} // Converter de gramas para kg
                    sellerCEP="74591-990"
                    showCard={false}
                    onShippingOptionSelect={handleFreightSelection}
                  />
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  Valores calculados via API da Frenet. Prazo estimado a partir da data de postagem.
                </CardFooter>
              </Card>

              {/* Add to Cart and Buy Now */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="bg-primary hover:bg-pink-600 text-white rounded-md py-3 font-semibold transition-colors flex items-center justify-center"
                    onClick={handleAddToCart}
                    disabled={addToCartMutation.isPending || product.quantity <= 0}
                  >
                    <ShoppingBag className="mr-2" size={18} />
                    {addToCartMutation.isPending ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                  </Button>
                  <Button
                    variant="outline"
                    className={`border ${isInWishlist ? 'bg-primary text-white' : 'border-primary text-primary hover:bg-primary hover:text-white'} rounded-md py-3 font-semibold transition-colors flex items-center justify-center`}
                    onClick={handleToggleWishlist}
                    disabled={addToWishlistMutation.isPending || removeFromWishlistMutation.isPending}
                  >
                    <Heart className="mr-2" size={18} fill={isInWishlist ? 'currentColor' : 'none'} />
                    {isInWishlist ? 'Remover da Lista de Desejos' : 'Adicionar à Lista de Desejos'}
                  </Button>
                </div>

                {/* Buy Now Button */}
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md py-3 font-semibold transition-colors flex items-center justify-center"
                  onClick={handleBuyNow}
                  disabled={product.quantity <= 0 || isProcessingBuyNow}
                >
                  {isProcessingBuyNow ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2" size={18} />
                      Comprar Agora
                    </>
                  )}
                </Button>
              </div>

              {/* Stock Status */}
              <div className="flex items-center">
                {product.quantity > 0 ? (
                  <div className="flex items-center text-success">
                    <CheckCircle className="mr-2" size={18} />
                    <span>
                      {product.quantity > 10
                        ? 'Em Estoque - Pronto para Envio'
                        : `Estoque Baixo - Apenas ${product.quantity} restantes`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-500">
                    <span>Fora de Estoque</span>
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
            <TabsTrigger value="description" className="px-6 py-3 font-medium">Descrição</TabsTrigger>
            <TabsTrigger value="ingredients" className="px-6 py-3 font-medium">Ingredientes</TabsTrigger>
            <TabsTrigger value="how-to-use" className="px-6 py-3 font-medium">Modo de Uso</TabsTrigger>
            <TabsTrigger value="reviews" className="px-6 py-3 font-medium">Avaliações ({product.reviewCount})</TabsTrigger>
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
                    <h4 className="font-medium mb-1">Ingredientes Naturais</h4>
                    <p className="text-sm text-gray-500">Feito com 95% de ingredientes de origem natural</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-primary text-xl mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <h4 className="font-medium mb-1">Testado Dermatologicamente</h4>
                    <p className="text-sm text-gray-500">Seguro para todos os tipos de pele, incluindo pele sensível</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-primary text-xl mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                    </div>
                    <h4 className="font-medium mb-1">Livre de Crueldade</h4>
                    <p className="text-sm text-gray-500">Nunca testado em animais</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ingredients">
              <div>
                <p className="mb-4">Lista Completa de Ingredientes:</p>
                <p className="mb-4">{product.ingredients}</p>

                <div className="mt-6">
                  <h4 className="font-medium mb-2">Ingredientes Principais:</h4>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h5 className="font-medium">Ácido Hialurônico</h5>
                      <p className="text-sm text-gray-600">Um potente umectante que pode reter até 1000x seu peso em água, proporcionando hidratação intensa e ajudando a dar volume à pele.</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h5 className="font-medium">Manteiga de Karité</h5>
                      <p className="text-sm text-gray-600">Rica em vitaminas e ácidos graxos, a manteiga de karité ajuda a nutrir e suavizar a pele enquanto fortalece a barreira natural da pele.</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h5 className="font-medium">Aloe Vera</h5>
                      <p className="text-sm text-gray-600">Conhecida por suas propriedades calmantes, a aloe vera ajuda a acalmar e condicionar a pele enquanto proporciona hidratação.</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="how-to-use">
              <div>
                <h4 className="font-medium mb-4">Instruções de Uso:</h4>
                {product.howToUse ? (
                  <p>{product.howToUse}</p>
                ) : (
                  <ol className="list-decimal pl-5 mb-6 space-y-2">
                    <li>Limpe o rosto com seu limpador preferido e seque suavemente.</li>
                    <li>Se estiver usando um tônico, aplique-o antes do produto.</li>
                    <li>Coloque uma pequena quantidade do produto nas pontas dos dedos.</li>
                    <li>Massageie suavemente no rosto e pescoço com movimentos circulares ascendentes.</li>
                    <li>Deixe absorver completamente antes de aplicar maquiagem ou protetor solar.</li>
                  </ol>
                )}

                <p className="mb-4">Para melhores resultados, use conforme indicado e como parte da sua rotina diária de cuidados com a pele. Apenas para uso externo. Evite contato com os olhos. Descontinue o uso se ocorrer irritação.</p>

                <div className="mt-8 bg-gray-50 rounded-lg p-5">
                  <h4 className="font-medium mb-3">Dica Profissional</h4>
                  <p className="text-gray-700">Para um impulso extra de eficácia, aplique na pele levemente úmida após a limpeza. Isso ajuda a reter umidade adicional e aumenta a eficácia do produto.</p>
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
                      <div className="text-gray-500">Baseado em {product.reviewCount} avaliações</div>
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
                            title: "Autenticação necessária",
                            description: "Por favor, faça login para escrever uma avaliação.",
                            variant: "destructive",
                          });
                          return;
                        }
                        // Show review form logic would go here
                        toast({
                          title: "Recurso não implementado",
                          description: "O envio de avaliações estará disponível em breve.",
                          variant: "default",
                        });
                      }}
                    >
                      Escrever uma Avaliação
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
                        <p className="text-gray-500">Ainda não há avaliações. Seja o primeiro a avaliar este produto!</p>
                      </div>
                    )}
                  </div>

                  {product.reviewCount > 3 && (
                    <div className="mt-6 flex justify-center">
                      <Button variant="link" className="text-primary hover:text-pink-700 flex items-center">
                        Carregar Mais Avaliações
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
