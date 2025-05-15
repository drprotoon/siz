import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { EyeIcon } from "lucide-react";

interface OrderTableProps {
  limit?: number;
  statusFilter?: string;
  searchTerm?: string;
}

export default function OrderTable({ limit, statusFilter = "all", searchTerm = "" }: OrderTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();

  const ordersPerPage = limit || 10;

  // Fetch all orders
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      return apiRequest("PUT", `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status do pedido atualizado",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status do pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter orders based on status and search term
  const filteredOrders = orders ? orders.filter((order: any) => {
    // Filter by status
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const orderIdMatch = `#ORD-${order.id}`.toLowerCase().includes(searchLower);
      const userNameMatch = order.user.fullName?.toLowerCase().includes(searchLower) || false;
      const userEmailMatch = order.user.email.toLowerCase().includes(searchLower);

      return orderIdMatch || userNameMatch || userEmailMatch;
    }

    return true;
  }) : [];

  // Paginate orders
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Handle order details view
  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setViewDetailsOpen(true);
  };

  // Handle status change
  const handleStatusChange = (id: number, status: string) => {
    updateOrderStatusMutation.mutate({ id, status });
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">Pendente</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800">Processando</Badge>;
      case "shipping":
        return <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800">Enviando</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">Entregue</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/4" />
        </div>
        <div className="border rounded-md">
          <div className="h-12 border-b px-6 flex items-center bg-gray-50">
            <Skeleton className="h-5 w-full" />
          </div>
          <div className="divide-y">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-6">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-red-500 dark:text-red-400">
        Erro ao carregar pedidos. Por favor, tente novamente mais tarde.
      </div>
    );
  }

  return (
    <>
      <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border transition-colors duration-300">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>ID do Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{`ORD-${order.id}`}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.user.fullName || order.user.username}</div>
                        <div className="text-muted-foreground text-sm">{order.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>{formatCurrency(parseFloat(order.total))}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border-border"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center p-4">
            <Pagination>
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

                  // Only show a limited number of pages
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <Button
                          variant={page === currentPage ? "default" : "outline"}
                          size="icon"
                          onClick={() => setCurrentPage(page)}
                          className="h-9 w-9"
                        >
                          {page}
                        </Button>
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
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-3xl bg-background text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido - #{selectedOrder && `ORD-${selectedOrder.id}`}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedOrder && (
                <span>
                  Realizado em {new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-medium">Informações do Cliente</h3>
                  <p>Nome: {selectedOrder.user.fullName || selectedOrder.user.username}</p>
                  <p>Email: {selectedOrder.user.email}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Informações de Envio</h3>
                  <p>{selectedOrder.shippingAddress}</p>
                  <p>{selectedOrder.shippingCity}, {selectedOrder.shippingState}</p>
                  <p>{selectedOrder.shippingPostalCode}, {selectedOrder.shippingCountry}</p>
                  <p>Método de Envio: {selectedOrder.shippingMethod}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Status do Pedido</h3>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                    disabled={updateOrderStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-[180px] bg-background border-border">
                      <SelectValue placeholder="Selecionar status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground border-border">
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="processing">Processando</SelectItem>
                      <SelectItem value="shipping">Enviando</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="border rounded-md mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(item.price))}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(item.price) * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(
                    selectedOrder.items.reduce(
                      (sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity),
                      0
                    )
                  )}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>{formatCurrency(parseFloat(selectedOrder.shippingCost) || 0)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(parseFloat(selectedOrder.total))}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDetailsOpen(false)} className="border-border">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
