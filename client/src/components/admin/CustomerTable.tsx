import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { EyeIcon, Search } from "lucide-react";

export default function CustomerTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  const customersPerPage = 10;

  // Fetch all customers
  const { data: customers, isLoading, isError } = useQuery({
    queryKey: ["/api/users"],
    refetchInterval: 30000, // Recarregar a cada 30 segundos
    refetchOnWindowFocus: true, // Recarregar quando a janela ganhar foco
  });

  // Filter customers based on search term
  const filteredCustomers = customers
    ? customers.filter((customer: any) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          customer.username.toLowerCase().includes(searchLower) ||
          (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
          (customer.fullName && customer.fullName.toLowerCase().includes(searchLower))
        );
      })
    : [];

  // Paginate customers
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * customersPerPage,
    currentPage * customersPerPage
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle view details
  const handleViewDetails = (customer: any) => {
    setSelectedCustomer(customer);
    setViewDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError) {
    return <div>Erro ao carregar clientes</div>;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-bold font-heading">Clientes</h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar clientes..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.fullName || "-"}
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        customer.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {customer.role === "admin" ? "Administrador" : "Cliente"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(customer)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {searchTerm ? "Nenhum cliente encontrado com este termo de busca" : "Nenhum cliente encontrado"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Customer Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Informações completas do cliente
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Nome Completo</h4>
                  <p className="font-medium">{selectedCustomer.fullName || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Usuário</h4>
                  <p className="font-medium">{selectedCustomer.username}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Email</h4>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Função</h4>
                  <p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedCustomer.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {selectedCustomer.role === "admin" ? "Administrador" : "Cliente"}
                    </span>
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Telefone</h4>
                  <p className="font-medium">{selectedCustomer.phone || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Data de Cadastro</h4>
                  <p className="font-medium">
                    {selectedCustomer.createdAt
                      ? new Date(selectedCustomer.createdAt).toLocaleDateString('pt-BR')
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Endereço</h4>
                {selectedCustomer.address ? (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium">{selectedCustomer.address}</p>
                    <p>
                      {selectedCustomer.city}
                      {selectedCustomer.state ? `, ${selectedCustomer.state}` : ""}
                      {selectedCustomer.postalCode ? ` - ${selectedCustomer.postalCode}` : ""}
                    </p>
                    <p>{selectedCustomer.country}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Nenhum endereço cadastrado</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewDetailsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
