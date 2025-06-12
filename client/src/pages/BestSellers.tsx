import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useTheme } from "@/contexts/ThemeContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBestSellers } from "@/hooks/useProducts";

export default function best_sellers() {
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const { theme } = useTheme();

  // Fetch products with best_seller flag
  const { data: products, isLoading: productsLoading } = useBestSellers();

  // Sort products based on selected option
  const sortProducts = (products: any[]) => {
    if (!products) return [];

    const sortedProducts = [...products];

    switch (sortBy) {
      case "price-asc":
        return sortedProducts.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sortedProducts.sort((a, b) => b.price - a.price);
      case "name-asc":
        return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
      case "newest":
      default:
        return sortedProducts.sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime());
    }
  };

  // Paginate products
  const paginateProducts = (products: any[]) => {
    if (!products) return [];

    const startIndex = (currentPage - 1) * productsPerPage;
    return products.slice(startIndex, startIndex + productsPerPage);
  };

  const sortedProducts = sortProducts(products || []);
  const paginatedProducts = paginateProducts(sortedProducts);
  const totalPages = products ? Math.ceil(products.length / productsPerPage) : 0;

  return (
    <div className="bg-background text-foreground transition-colors duration-300">
      {/* Category header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading elegant-heading">Mais Vendidos</h1>
        <p className="text-muted-foreground">Conheça os produtos favoritos dos nossos clientes</p>
      </div>

      {/* Sorting and filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center">
          <span className="text-sm font-medium mr-2">Ordenar por:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-card border-border">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="price-asc">Preço: Menor para Maior</SelectItem>
              <SelectItem value="price-desc">Preço: Maior para Menor</SelectItem>
              <SelectItem value="name-asc">Nome: A-Z</SelectItem>
              <SelectItem value="name-desc">Nome: Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {products ? `Mostrando ${paginatedProducts.length} de ${products.length} produtos` : ""}
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {productsLoading ? (
          // Skeleton loading for products
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="space-y-3 bg-card rounded-lg p-4 h-full">
              <Skeleton className="h-64 w-full rounded-lg aspect-square" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))
        ) : products && products.length > 0 ? (
          // Map through paginated products
          paginatedProducts.map((product: any) => (
            <div className="h-full" key={product.id}>
              <ProductCard
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                compareAtPrice={product.compareatprice}
                categoryName={product.category?.name || "Uncategorized"}
                rating={product.rating}
                reviewCount={product.reviewcount || 0}
                mainImage={product.images?.[0] || "https://placehold.co/400x400?text=No+Image"}
                bestSeller={product.best_seller}
                newArrival={product.new_arrival}
              />
            </div>
          ))
        ) : (
          <div className="col-span-4 text-center py-10">
            <p className="text-muted-foreground mb-4">Nenhum produto mais vendido encontrado.</p>
            <Button onClick={() => window.history.back()} className="bg-primary text-primary-foreground hover:bg-primary/90">Voltar</Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="my-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
                className={`${currentPage === 1 ? "pointer-events-none opacity-50" : ""} bg-card text-card-foreground border-border hover:bg-muted`}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNumber = i + 1;
              // Show first page, last page, current page, and pages around current page
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(pageNumber);
                      }}
                      isActive={pageNumber === currentPage}
                      className={`${pageNumber === currentPage ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"} border-border hover:bg-muted`}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              }

              // Show ellipsis if there's a gap
              if (
                (pageNumber === 2 && currentPage > 3) ||
                (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationEllipsis className="text-muted-foreground" />
                  </PaginationItem>
                );
              }

              return null;
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
                className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : ""} bg-card text-card-foreground border-border hover:bg-muted`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
