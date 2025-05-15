import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FolderPlus, Edit, Trash, Eye, Package, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function CategoryTable() {
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const { toast } = useToast();

  // Fetch categories
  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch products for the selected category
  const { data: categoryProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products", { category: selectedCategory?.slug }],
    enabled: !!selectedCategory,
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCategoryToDelete(null);
      toast({
        title: "Categoria excluída",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle delete category
  const handleDelete = (id: number) => {
    setCategoryToDelete(id);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setCategoryToDelete(null);
  };

  // View products in category
  const viewCategoryProducts = (category: any) => {
    setSelectedCategory(category);
  };

  // Close products dialog
  const closeProductsDialog = () => {
    setSelectedCategory(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <h3 className="text-lg font-medium text-red-600 mb-2">Erro ao carregar categorias</h3>
        <p className="text-gray-600">Tente novamente mais tarde ou contate o suporte.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold font-heading mb-4 md:mb-0">Gerenciamento de Categorias</h2>
          <Button
            className="bg-primary hover:bg-pink-600 text-white transition-colors flex items-center w-full md:w-auto"
            onClick={() => window.location.href = '/admin/categories/add'}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            Adicionar Categoria
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="hidden md:table-cell">Slug</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories && categories.length > 0 ? (
                categories.map((category: any) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {category.imageUrl && (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-10 h-10 rounded-md object-cover mr-3"
                          />
                        )}
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{category.slug}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="max-w-xs truncate">
                        {category.description || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-800"
                          onClick={() => viewCategoryProducts(category)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Produtos</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => window.location.href = `/admin/categories/edit/${category.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(category.id)}
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
                  <TableCell colSpan={4} className="text-center py-10">
                    Nenhuma categoria encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={categoryToDelete !== null} onOpenChange={cancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Products Dialog */}
      <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && closeProductsDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedCategory?.imageUrl && (
                <img
                  src={selectedCategory.imageUrl}
                  alt={selectedCategory.name}
                  className="w-8 h-8 rounded-md object-cover mr-3"
                />
              )}
              Produtos na categoria: {selectedCategory?.name}
            </DialogTitle>
            <DialogDescription>
              Listagem de todos os produtos cadastrados nesta categoria
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Skeleton className="h-16 w-16 rounded-md" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : categoryProducts && categoryProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryProducts.map((product: any) => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <img
                          src={product.images?.[0] || "https://via.placeholder.com/100"}
                          alt={product.name}
                          className="w-16 h-16 rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{product.name}</h4>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-bold text-primary">
                              {formatCurrency(parseFloat(product.price))}
                            </span>
                            <Badge variant={product.quantity > 0 ? "default" : "destructive"}>
                              {product.quantity > 0 ? `Estoque: ${product.quantity}` : "Sem estoque"}
                            </Badge>
                          </div>
                          <div className="flex mt-3 space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => window.location.href = `/admin/products/edit/${product.id}`}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `/product/${product.slug}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-600 mb-4">Esta categoria ainda não possui produtos cadastrados.</p>
                <Button
                  onClick={() => window.location.href = '/admin/products/add'}
                  className="bg-primary hover:bg-pink-600 text-white"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
