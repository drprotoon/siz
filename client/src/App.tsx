import { Switch, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Product from "@/pages/Product";
import Category from "@/pages/Category";
import Cart from "@/pages/Cart";
import AdminDashboard from "@/pages/Admin/Dashboard";
import AdminProducts from "@/pages/Admin/Products";
import AdminOrders from "@/pages/Admin/Orders";

function Router() {
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isAdmin = authData?.user?.role === "admin";

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/product/:slug" component={Product} />
      <Route path="/category/:slug" component={Category} />
      <Route path="/cart" component={Cart} />
      
      {/* Admin routes - protected with isAdmin check */}
      <Route path="/admin">
        {isAdmin ? <AdminDashboard /> : <NotFound />}
      </Route>
      <Route path="/admin/products">
        {isAdmin ? <AdminProducts /> : <NotFound />}
      </Route>
      <Route path="/admin/orders">
        {isAdmin ? <AdminOrders /> : <NotFound />}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Layout>
      <Router />
    </Layout>
  );
}

export default App;
