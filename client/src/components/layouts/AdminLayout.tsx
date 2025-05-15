import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/AdminSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/contexts/ThemeContext";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Check if user is admin
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const isAdmin = authData?.user?.role === "admin";
  const { theme } = useTheme();

  if (authLoading) {
    return (
      <div className="flex flex-col md:flex-row h-screen bg-background text-foreground transition-colors duration-300">
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
      <div className="text-center py-20 bg-background text-foreground transition-colors duration-300">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground transition-colors duration-300">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
