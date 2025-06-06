import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Product from "@/pages/Product";
import Category from "@/pages/Category";
import Cart from "@/pages/Cart";
import Wishlist from "@/pages/Wishlist";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import TrackOrder from "@/pages/TrackOrder";
import Profile from "@/pages/Profile";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import AdminDashboard from "@/pages/Admin/Dashboard";
import AdminProducts from "@/pages/Admin/Products";
import AdminOrders from "@/pages/Admin/Orders";
import AdminCustomers from "@/pages/Admin/Customers";
import AdminCategories from "@/pages/Admin/Categories";
import ProductForm from "@/pages/Admin/ProductForm";
import CategoryForm from "@/pages/Admin/CategoryForm";
import FrenetSettings from "@/pages/admin/FrenetSettings";
import AdminSettings from "@/pages/Admin/Settings";
import FreightTest from "@/pages/FreightTest";
import TestPixCheckout from "@/pages/TestPixCheckout";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ShippingProvider } from "@/contexts/ShippingContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Protected route component
function AdminRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return isAdmin ? <Component /> : <NotFound />;
}

function Routes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/product/:slug" component={Product} />
      <Route path="/category/:slug" component={Category} />
      <Route path="/cart" component={Cart} />
      <Route path="/wishlist">
        {isAuthenticated ? <Wishlist /> : <Login />}
      </Route>
      <Route path="/profile">
        {isAuthenticated ? <Profile /> : <Login />}
      </Route>
      <Route path="/checkout">
        {isAuthenticated ? <Checkout /> : <Login />}
      </Route>
      <Route path="/order-confirmation/:id">
        {isAuthenticated ? <OrderConfirmation /> : <Login />}
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/track-order" component={TrackOrder} />
      <Route path="/freight-test" component={FreightTest} />
      <Route path="/test-pix-checkout" component={TestPixCheckout} />

      {/* Admin routes */}
      <Route path="/admin">
        <AdminRoute component={AdminDashboard} />
      </Route>
      <Route path="/admin/products">
        <AdminRoute component={AdminProducts} />
      </Route>
      <Route path="/admin/orders">
        <AdminRoute component={AdminOrders} />
      </Route>
      <Route path="/admin/customers">
        <AdminRoute component={AdminCustomers} />
      </Route>
      <Route path="/admin/categories">
        <AdminRoute component={AdminCategories} />
      </Route>
      <Route path="/admin/categories/add">
        <AdminRoute component={CategoryForm} />
      </Route>
      <Route path="/admin/categories/edit/:id">
        <AdminRoute component={CategoryForm} />
      </Route>
      <Route path="/admin/products/add">
        <AdminRoute component={ProductForm} />
      </Route>
      <Route path="/admin/products/edit/:id">
        <AdminRoute component={ProductForm} />
      </Route>
      <Route path="/admin/frenet-settings">
        <AdminRoute component={FrenetSettings} />
      </Route>
      <Route path="/admin/settings">
        <AdminRoute component={AdminSettings} />
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ShippingProvider>
            <Layout>
              <Routes />
              <Toaster />
            </Layout>
          </ShippingProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
