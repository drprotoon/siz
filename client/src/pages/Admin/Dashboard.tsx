import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/AdminSidebar";
import StatsCards from "@/components/admin/StatsCards";
import OrderTable from "@/components/admin/OrderTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function AdminDashboard() {
  // Check if user is admin
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  const isAdmin = authData?.user?.role === "admin";

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin,
  });

  // Fetch products for charts
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    enabled: isAdmin,
  });

  // Mock data for sales chart - in a real app, this would come from the API
  const salesData = [
    { name: "Jan", sales: 2400 },
    { name: "Feb", sales: 1398 },
    { name: "Mar", sales: 9800 },
    { name: "Apr", sales: 3908 },
    { name: "May", sales: 4800 },
    { name: "Jun", sales: 3800 },
    { name: "Jul", sales: 4300 },
  ];

  // Prepare category distribution data
  const getCategoryDistribution = () => {
    if (!products) return [];
    
    const categoryCounts: Record<string, number> = {};
    
    products.forEach((product: any) => {
      const categoryName = product.category.name;
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
    });
    
    return Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const categoryData = getCategoryDistribution();
  
  // Colors for pie chart
  const COLORS = ["#FF6B81", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];

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
          <h1 className="text-2xl font-bold mb-2 font-heading">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back, Admin! Here's what's happening with your store today.</p>
        </div>
        
        {/* Stats Cards */}
        <StatsCards stats={stats} loading={statsLoading} />
        
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Monthly sales performance</CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$${value}`, "Sales"]} />
                    <Bar dataKey="sales" fill="#FF6B81" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>Distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} products`, ""]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Orders */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders and status</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderTable limit={5} />
          </CardContent>
        </Card>
        
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sales">
              <TabsList>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="visits">Visits</TabsTrigger>
                <TabsTrigger value="conversions">Conversions</TabsTrigger>
              </TabsList>
              <TabsContent value="sales">
                <div className="py-4">
                  <h3 className="text-lg font-medium mb-2">Monthly Sales Growth</h3>
                  <p className="text-gray-600 mb-4">Showing a 16.5% increase compared to last month.</p>
                  <div className="h-4 bg-gray-200 rounded-full">
                    <div className="h-4 bg-primary rounded-full" style={{ width: "16.5%" }}></div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="visits">
                <div className="py-4">
                  <h3 className="text-lg font-medium mb-2">Website Visits</h3>
                  <p className="text-gray-600 mb-4">12.3% increase in unique visitors this month.</p>
                  <div className="h-4 bg-gray-200 rounded-full">
                    <div className="h-4 bg-primary rounded-full" style={{ width: "12.3%" }}></div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="conversions">
                <div className="py-4">
                  <h3 className="text-lg font-medium mb-2">Conversion Rate</h3>
                  <p className="text-gray-600 mb-4">Current conversion rate is 3.2%</p>
                  <div className="h-4 bg-gray-200 rounded-full">
                    <div className="h-4 bg-primary rounded-full" style={{ width: "3.2%" }}></div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
