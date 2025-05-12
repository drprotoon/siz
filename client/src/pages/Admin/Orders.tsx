import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/AdminSidebar";
import OrderTable from "@/components/admin/OrderTable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

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
          <h1 className="text-2xl font-bold mb-2 font-heading">Order Management</h1>
          <p className="text-gray-600">View and manage customer orders.</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
          
          <div className="w-full md:w-1/4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/6">
            <Button 
              variant="outline" 
              onClick={() => {
                setStatusFilter("all");
                setSearchTerm("");
              }}
              className="w-full"
            >
              Reset Filters
            </Button>
          </div>
        </div>
        
        {/* Orders Table */}
        <OrderTable statusFilter={statusFilter} searchTerm={searchTerm} />
      </div>
    </div>
  );
}
