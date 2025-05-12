import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Package, Users, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  stats?: {
    totalSales: number;
    totalOrders: number;
    newCustomers: number;
    lowStockProducts: number;
  };
  loading?: boolean;
}

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  // If stats aren't provided, fetch them
  const { 
    data: fetchedStats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !stats && !loading,
  });
  
  const displayStats = stats || fetchedStats;
  const isLoading = loading || (!stats && statsLoading);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!displayStats) {
    return (
      <div className="mb-8 text-center py-6 bg-white rounded-lg">
        <p className="text-gray-500">Unable to load statistics. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 text-sm">Total Sales</h3>
            <span className="text-green-500 text-sm">+16.5%</span>
          </div>
          <div className="flex items-end">
            <span className="text-3xl font-bold">{formatCurrency(displayStats.totalSales)}</span>
            <span className="text-gray-500 ml-2 mb-1">this month</span>
          </div>
          <div className="mt-4">
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 text-sm">Total Orders</h3>
            <span className="text-green-500 text-sm">+8.2%</span>
          </div>
          <div className="flex items-end">
            <span className="text-3xl font-bold">{displayStats.totalOrders}</span>
            <span className="text-gray-500 ml-2 mb-1">orders</span>
          </div>
          <div className="mt-4">
            <Package className="h-4 w-4 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 text-sm">New Customers</h3>
            <span className="text-green-500 text-sm">+12.3%</span>
          </div>
          <div className="flex items-end">
            <span className="text-3xl font-bold">{displayStats.newCustomers}</span>
            <span className="text-gray-500 ml-2 mb-1">this week</span>
          </div>
          <div className="mt-4">
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 text-sm">Low Stock</h3>
            <span className="text-red-500 text-sm">Alert</span>
          </div>
          <div className="flex items-end">
            <span className="text-3xl font-bold">{displayStats.lowStockProducts}</span>
            <span className="text-gray-500 ml-2 mb-1">products</span>
          </div>
          <div className="mt-4">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
