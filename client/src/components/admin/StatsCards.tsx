import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Package, Users, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

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

  const { theme } = useTheme();
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
      <div className="mb-8 text-center py-6 bg-card rounded-lg transition-colors duration-300">
        <p className="text-muted-foreground">Não foi possível carregar as estatísticas. Por favor, tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="transition-colors duration-300">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-muted-foreground text-sm">Vendas Totais</h3>
            <span className="text-green-500 text-sm">+16.5%</span>
          </div>
          <div className="flex items-end">
            <span className="text-3xl font-bold">{formatCurrency(displayStats.totalSales)}</span>
            <span className="text-muted-foreground ml-2 mb-1">este mês</span>
          </div>
          <div className="mt-4">
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="transition-colors duration-300">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-muted-foreground text-sm">Total de Pedidos</h3>
            <span className="text-green-500 text-sm">+8.2%</span>
          </div>
          <div className="flex items-end">
            <span className="text-3xl font-bold">{displayStats.totalOrders}</span>
            <span className="text-muted-foreground ml-2 mb-1">pedidos</span>
          </div>
          <div className="mt-4">
            <Package className="h-4 w-4 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="transition-colors duration-300">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-muted-foreground text-sm">Novos Clientes</h3>
            <span className="text-green-500 text-sm">+12.3%</span>
          </div>
          <div className="flex items-end">
            <span className="text-3xl font-bold">{displayStats.newCustomers}</span>
            <span className="text-muted-foreground ml-2 mb-1">esta semana</span>
          </div>
          <div className="mt-4">
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="transition-colors duration-300">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-muted-foreground text-sm">Estoque Baixo</h3>
            <span className="text-red-500 text-sm">Alerta</span>
          </div>
          <div className="flex items-end">
            <span className="text-3xl font-bold">{displayStats.lowStockProducts}</span>
            <span className="text-muted-foreground ml-2 mb-1">produtos</span>
          </div>
          <div className="mt-4">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
