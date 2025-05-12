import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import ProductCard from "@/components/ProductCard";
import { SlidersHorizontal } from "lucide-react";

export default function Category() {
  const { slug } = useParams();
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Fetch category details
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: [`/api/categories/${slug}`],
  });

  // Fetch products for this category
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products", { category: slug }],
  });

  // Sort products based on selected sort option
  const sortProducts = (products: any[]) => {
    if (!products) return [];
    
    switch (sortBy) {
      case "price-low":
        return [...products].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      case "price-high":
        return [...products].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      case "rating":
        return [...products].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
      case "newest":
      default:
        return [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    <div>
      {/* Category header */}
      <div className="mb-8">
        {categoryLoading ? (
          <Skeleton className="h-12 w-1/3 mb-2" />
        ) : (
          <h1 className="text-3xl font-bold font-heading">{category?.name}</h1>
        )}
        {categoryLoading ? (
          <Skeleton className="h-6 w-2/3" />
        ) : (
          <p className="text-gray-600">{category?.description}</p>
        )}
      </div>

      {/* Filters and sorting */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="flex items-center">
            <SlidersHorizontal size={16} className="mr-2" />
            Filters
          </Button>
          <Button variant="outline">All Products</Button>
          <Button variant="outline">Best Sellers</Button>
          <Button variant="outline">New Arrivals</Button>
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Best Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {productsLoading ? (
          // Skeleton loading for products
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-64 w-full rounded-lg" />
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
            <ProductCard
              key={product.id}
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
          ))
        ) : (
          <div className="col-span-4 text-center py-10">
            <p className="text-gray-500 mb-4">No products found in this category.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
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
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              
              // Show first page, last page, and pages around current page
              if (
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={page === currentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              
              // Show ellipsis for gaps
              if (page === 2 || page === totalPages - 1) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
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
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
