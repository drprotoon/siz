import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Edit,
  Eye,
  EyeOff,
  Trash,
  Search,
  Filter,
  ArrowUpDown,
  ShoppingBag
} from "lucide-react";

export default function ProductTable() {
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const { toast } = useToast();
  const { theme } = useTheme();

  // Fetch products
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["/api/products"],
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setProductToDelete(null);
      toast({
        title: "Produto excluído com sucesso",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle product visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, visible }: { id: number; visible: boolean }) => {
      return apiRequest("PUT", `/api/products/${id}`, { visible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Visibilidade do produto atualizada",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter and sort products
  const filteredProducts = products
    ? products.filter((product: any) => {
        // Search filter
        const matchesSearch = searchTerm === "" ||
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase());

        // Category filter
        const matchesCategory = categoryFilter === "all" ||
          product.category?.id.toString() === categoryFilter;

        // Stock filter
        let matchesStock = true;
        if (stockFilter === "in-stock") {
          matchesStock = product.quantity > 0;
        } else if (stockFilter === "low-stock") {
          matchesStock = product.quantity > 0 && product.quantity < 10;
        } else if (stockFilter === "out-of-stock") {
          matchesStock = product.quantity === 0;
        }

        return matchesSearch && matchesCategory && matchesStock;
      })
    : [];

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a: any, b: any) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "price-asc":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-desc":
        return parseFloat(b.price) - parseFloat(a.price);
      case "stock-asc":
        return a.quantity - b.quantity;
      case "stock-desc":
        return b.quantity - a.quantity;
      default:
        return 0;
    }
  });

  // Handle delete product
  const handleDelete = (id: number) => {
    setProductToDelete(id);
  };

  // Handle toggle visibility
  const handleToggleVisibility = (id: number, currentVisibility: boolean) => {
    toggleVisibilityMutation.mutate({ id, visible: !currentVisibility });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStockFilter("all");
    setSortBy("name-asc");
  };

  if (isLoading) {
    return (
      <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6 border border-border transition-colors duration-300">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6 text-center border border-border transition-colors duration-300">
        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">Erro ao carregar produtos</h3>
        <p className="text-muted-foreground mb-4">Tente novamente mais tarde ou contate o suporte.</p>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/products"] })}
          variant="outline"
          className="border-border"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border transition-colors duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold font-heading mb-4 md:mb-0">Gerenciamento de Produtos</h2>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center w-full md:w-auto"
            onClick={() => window.location.href = '/admin/products/add'}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou SKU"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>

            {/* Category filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories && categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stock filter */}
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Filtrar por estoque" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="all">Todos os produtos</SelectItem>
                <SelectItem value="in-stock">Em estoque</SelectItem>
                <SelectItem value="low-stock">Estoque baixo</SelectItem>
                <SelectItem value="out-of-stock">Sem estoque</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                <SelectItem value="price-asc">Preço (menor-maior)</SelectItem>
                <SelectItem value="price-desc">Preço (maior-menor)</SelectItem>
                <SelectItem value="stock-asc">Estoque (menor-maior)</SelectItem>
                <SelectItem value="stock-desc">Estoque (maior-menor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter summary and reset */}
          {(searchTerm || categoryFilter !== "all" || stockFilter !== "all" || sortBy !== "name-asc") && (
            <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Filtros aplicados:</span>
                {searchTerm && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-background border-border">
                    <Search className="h-3 w-3" />
                    {searchTerm}
                  </Badge>
                )}
                {categoryFilter !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-background border-border">
                    <Filter className="h-3 w-3" />
                    {categories?.find((c: any) => c.id.toString() === categoryFilter)?.name || "Categoria"}
                  </Badge>
                )}
                {stockFilter !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-background border-border">
                    <Package className="h-3 w-3" />
                    {stockFilter === "in-stock" ? "Em estoque" :
                     stockFilter === "low-stock" ? "Estoque baixo" : "Sem estoque"}
                  </Badge>
                )}
                {sortBy !== "name-asc" && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-background border-border">
                    <ArrowUpDown className="h-3 w-3" />
                    {sortBy === "name-desc" ? "Nome (Z-A)" :
                     sortBy === "price-asc" ? "Preço (menor-maior)" :
                     sortBy === "price-desc" ? "Preço (maior-menor)" :
                     sortBy === "stock-asc" ? "Estoque (menor-maior)" : "Estoque (maior-menor)"}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="mt-2 sm:mt-0 text-muted-foreground hover:text-foreground"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>

        {/* Products table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="hidden md:table-cell">Estoque</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.length > 0 ? (
                sortedProducts.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <img
                          src={product.images?.[0] || "https://via.placeholder.com/100"}
                          alt={product.name}
                          className="w-12 h-12 rounded-md object-cover mr-3"
                        />
                        <div>
                          <span className="font-medium block">{product.name}</span>
                          <span className="text-xs text-gray-500 md:hidden">
                            {product.category?.name}
                          </span>
                          <div className="md:hidden mt-1">
                            <Badge
                              variant={
                                product.quantity === 0 ? "destructive" :
                                product.quantity < 10 ? "outline" : "default"
                              }
                              className="text-xs"
                            >
                              {product.quantity === 0
                                ? "Sem estoque"
                                : product.quantity < 10
                                ? `Baixo: ${product.quantity}`
                                : `Estoque: ${product.quantity}`}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{product.category?.name}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(parseFloat(product.price))}</TableCell>
                    <TableCell className="hidden md:table-cell">{product.quantity}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center">
                        <span
                          className={`w-3 h-3 rounded-full mr-2 ${
                            product.quantity === 0
                              ? "bg-red-500"
                              : product.quantity < 10
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        />
                        <span>
                          {product.quantity === 0
                            ? "Sem estoque"
                            : product.quantity < 10
                            ? "Estoque baixo"
                            : "Em estoque"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => window.location.href = `/admin/products/edit/${product.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-600 hover:text-gray-800"
                          onClick={() => handleToggleVisibility(product.id, product.visible)}
                        >
                          {product.visible ? (
                            <Eye className="h-4 w-4 mr-1" />
                          ) : (
                            <EyeOff className="h-4 w-4 mr-1" />
                          )}
                          <span className="hidden sm:inline">
                            {product.visible ? "Visível" : "Oculto"}
                          </span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    {searchTerm || categoryFilter !== "all" || stockFilter !== "all" ? (
                      <div>
                        <p className="text-gray-500 mb-2">Nenhum produto encontrado com os filtros aplicados.</p>
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                          Limpar filtros
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-500 mb-2">Nenhum produto cadastrado.</p>
                        <Button
                          className="bg-primary hover:bg-pink-600 text-white"
                          onClick={() => window.location.href = '/admin/products/add'}
                        >
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Adicionar Produto
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={productToDelete !== null} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => productToDelete && deleteProductMutation.mutate(productToDelete)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
