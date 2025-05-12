import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart,
  Settings,
  LogOut
} from "lucide-react";

export default function AdminSidebar() {
  const [location] = useLocation();
  const { toast } = useToast();

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
    <div className="w-full md:w-64 bg-white shadow-md">
      <div className="p-4 border-b border-gray-200">
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
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Dashboard
              </a>
            </Link>
          </li>
          <li>
            <Link href="/admin/products">
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive("/admin/products")
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Package className="mr-3 h-5 w-5" />
                Products
              </a>
            </Link>
          </li>
          <li>
            <Link href="/admin/orders">
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive("/admin/orders")
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <ShoppingCart className="mr-3 h-5 w-5" />
                Orders
              </a>
            </Link>
          </li>
          <li>
            <Link href="/admin/customers">
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive("/admin/customers")
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Users className="mr-3 h-5 w-5" />
                Customers
              </a>
            </Link>
          </li>
          <li>
            <Link href="/admin/analytics">
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive("/admin/analytics")
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <BarChart className="mr-3 h-5 w-5" />
                Analytics
              </a>
            </Link>
          </li>
          <li>
            <Link href="/admin/settings">
              <a
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive("/admin/settings")
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </a>
            </Link>
          </li>
          <li className="pt-4 mt-4 border-t border-gray-200">
            <button
              className="flex w-full items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
