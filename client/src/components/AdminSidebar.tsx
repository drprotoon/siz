import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart,
  Settings,
  LogOut,
  FolderTree,
  Truck
} from "lucide-react";

export default function AdminSidebar() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { theme } = useTheme();

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = "/";
      toast({
        title: "Logged out successfully",
        variant: "default",
      });
    },
  });

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="w-full md:w-64 bg-card text-card-foreground shadow-md transition-colors duration-300">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold text-primary font-heading">Admin Panel</h2>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          <li>
            <Link href="/admin">
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive("/admin")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Dashboard
              </a>
            </Link>
          </li>
          <li>
            <Link href="/admin/categories">
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive("/admin/categories") || isActive("/admin/categories/add") || isActive("/admin/categories/edit")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <FolderTree className="mr-3 h-5 w-5" />
                Categorias
              </a>
            </Link>
          </li>
          <li>
            <Link href="/admin/products">
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive("/admin/products") || isActive("/admin/products/add") || isActive("/admin/products/edit")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Package className="mr-3 h-5 w-5" />
                Produtos
              </a>
            </Link>
          </li>
          <li>
            <Link href="/admin/orders">
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive("/admin/orders")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <ShoppingCart className="mr-3 h-5 w-5" />
                Pedidos
              </a>
            </Link>
          </li>
          <li>
            <Link href="/admin/customers">
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive("/admin/customers")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Users className="mr-3 h-5 w-5" />
                Clientes
              </a>
            </Link>
          </li>
          <li>
            <Link href="/admin/analytics">
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive("/admin/analytics")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <BarChart className="mr-3 h-5 w-5" />
                Análises
              </a>
            </Link>
          </li>
          <li>
            <Link href="/admin/frenet-settings">
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive("/admin/frenet-settings")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Truck className="mr-3 h-5 w-5" />
                Frenet
              </a>
            </Link>
          </li>
          <li>
            <Link href="/admin/settings">
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive("/admin/settings")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Settings className="mr-3 h-5 w-5" />
                Configurações
              </a>
            </Link>
          </li>
          <li className="pt-4 mt-4 border-t border-border">
            <button
              className="flex w-full items-center px-4 py-2 rounded-md text-foreground hover:bg-muted transition-colors"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
