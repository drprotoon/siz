import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/AdminSidebar";
import ProductTable from "@/components/admin/ProductTable";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminProducts() {
  // Check if user is admin
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  const isAdmin = authData?.user?.role === "admin";

  if (authLoading) {
    return (
      <div className="flex flex-col md:flex-row h-screen bg-gray-100">
        <Skeleton className="w-64 h-screen" />
        <div className="flex-1 p-6">
          <Skeleton className="h-10 w-1/3 mb-6" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 font-heading">Product Management</h1>
          <p className="text-gray-600">Manage your products, inventory, and visibility.</p>
        </div>
        
        <ProductTable />
      </div>
    </div>
  );
}
