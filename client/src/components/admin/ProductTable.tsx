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
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Package, Edit, Eye, EyeOff, Trash } from "lucide-react";

export default function ProductTable() {
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch products
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["/api/products"],
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
        title: "Product deleted",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting product",
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
        title: "Product visibility updated",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle delete product
  const handleDelete = (id: number) => {
    setProductToDelete(id);
  };

  // Handle toggle visibility
  const handleToggleVisibility = (id: number, currentVisibility: boolean) => {
    toggleVisibilityMutation.mutate({ id, visible: !currentVisibility });
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading products...</div>;
  }

  if (isError) {
    return <div className="text-center py-10 text-red-500">Error loading products</div>;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold font-heading">Product Management</h2>
          <Button
            className="bg-primary hover:bg-pink-600 text-white transition-colors flex items-center"
            onClick={() => window.location.href = '/admin/products/add'}
          >
            <Package className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products && products.length > 0 ? (
                products.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <img
                          src={product.images?.[0] || "https://via.placeholder.com/100"}
                          alt={product.name}
                          className="w-12 h-12 rounded-md object-cover mr-3"
                        />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.category?.name}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(parseFloat(product.price))}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>
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
                            ? "Out of Stock"
                            : product.quantity < 10
                            ? "Low Stock"
                            : "In Stock"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => window.location.href = `/admin/products/edit/${product.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-600 hover:text-gray-800"
                          onClick={() => handleToggleVisibility(product.id, product.visible)}
                        >
                          {product.visible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    No products found
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => productToDelete && deleteProductMutation.mutate(productToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
