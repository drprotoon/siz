import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import { ChevronRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function Home() {
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch featured products
  const { data: featuredProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products", { featured: true }],
  });

  // Fetch best sellers
  const { data: bestSellers, isLoading: bestSellersLoading } = useQuery({
    queryKey: ["/api/products", { bestSeller: true }],
  });

  const { theme } = useTheme();

  return (
    <div className="homepage-container bg-background text-foreground transition-colors duration-300">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="rounded-lg overflow-hidden relative">
          <img
            src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=600"
            alt="Coleção de cosméticos premium SIZ"
            className="w-full h-[400px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
            <div className="text-white p-8 md:p-16 max-w-lg">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 font-heading leading-tight">
                Descubra Sua Rotina de Beleza Perfeita
              </h1>
              <p className="mb-6 text-gray-100">
                Produtos premium para seu tipo de pele e necessidades de beleza únicas
              </p>
              <Link href="/category/skincare">
                <Button className="bg-primary hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-full transition-colors">
                  Comprar Agora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals - Moved to appear before Categories */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold font-heading">Novidades</h2>
          <Link href="/new-arrivals">
            <Button variant="link" className="text-primary hover:underline flex items-center">
              Ver Todas <ChevronRight size={16} className="ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {productsLoading ? (
            // Skeleton loading for products
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-3 bg-card rounded-lg p-4 h-full">
                <Skeleton className="h-64 w-full rounded-lg aspect-square" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))
          ) : featuredProducts && featuredProducts.length > 0 ? (
            // Map through featured products
            featuredProducts.filter((p: any) => p.newArrival).slice(0, 4).map((product: any) => (
              <div className="h-full" key={product.id}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  compareAtPrice={product.compareAtPrice}
                  categoryName={product.category?.name || "Uncategorized"}
                  rating={product.rating}
                  reviewCount={product.reviewCount || 0}
                  mainImage={product.images?.[0] || "https://placehold.co/400x400?text=No+Image"}
                  bestSeller={product.bestSeller}
                  newArrival={product.newArrival}
                />
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-10">
              <p className="text-muted-foreground mb-4">Nenhuma novidade encontrada</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center font-heading">Compre por Categoria</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categoriesLoading ? (
            // Skeleton loading for categories
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-3 bg-card rounded-lg p-4 h-full">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-28 mx-auto" />
              </div>
            ))
          ) : categories && categories.length > 0 ? (
            // Mostrar apenas categorias principais (sem parentId)
            categories
              .filter((category: any) => category.parentId === null)
              .map((category: any) => {
                // Encontrar subcategorias para esta categoria principal
                const subcategories = categories.filter(
                  (subcat: any) => subcat.parentId === category.id
                );

                // Adicionar subcategorias à categoria principal
                const categoryWithChildren = {
                  ...category,
                  children: subcategories
                };

                return (
                  <div className="h-full" key={category.id}>
                    <CategoryCard
                      category={categoryWithChildren}
                      showSubcategories={true}
                    />
                  </div>
                );
              })
          ) : (
            <div className="col-span-4 text-center py-10">
              <p className="text-muted-foreground mb-4">Nenhuma categoria encontrada</p>
            </div>
          )}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold font-heading">Mais Vendidos</h2>
          <Link href="/best-sellers">
            <Button variant="link" className="text-primary hover:underline flex items-center">
              Ver Todos <ChevronRight size={16} className="ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {bestSellersLoading ? (
            // Skeleton loading for products
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-3 bg-card rounded-lg p-4 h-full">
                <Skeleton className="h-64 w-full rounded-lg aspect-square" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))
          ) : bestSellers && bestSellers.length > 0 ? (
            // Map through best sellers
            bestSellers.slice(0, 4).map((product: any) => (
              <div className="h-full" key={product.id}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  compareAtPrice={product.compareAtPrice}
                  categoryName={product.category?.name || "Uncategorized"}
                  rating={product.rating}
                  reviewCount={product.reviewCount || 0}
                  mainImage={product.images?.[0] || "https://placehold.co/400x400?text=No+Image"}
                  bestSeller={product.bestSeller}
                  newArrival={product.newArrival}
                />
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-10">
              <p className="text-muted-foreground mb-4">Nenhum produto mais vendido encontrado</p>
            </div>
          )}
        </div>
      </section>

      {/* Promotion Banner */}
      <section className="mb-16">
        <div className="bg-gradient-to-r from-primary to-pink-400 rounded-lg overflow-hidden">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-white mb-8 md:mb-0 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-4 font-heading">Oferta Especial</h2>
                <p className="text-lg mb-6 max-w-md">
                  Ganhe 20% de desconto em todos os produtos para cuidados com a pele. Use o código <span className="font-bold">BELEZA20</span> no checkout.
                </p>
                <Link href="/category/skincare">
                  <Button className="bg-white text-primary font-semibold hover:bg-gray-100 transition-colors">
                    Comprar Agora
                  </Button>
                </Link>
              </div>
              <div className="w-full md:w-1/3">
                <img
                  src="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=600"
                  alt="Coleção de Cuidados com a Pele SIZ"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
