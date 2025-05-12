import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  ChevronDown, 
  LogIn, 
  UserPlus, 
  LogOut
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const { toast } = useToast();

  // Auth query to check if user is logged in
  const { data: authData, isLoading: isAuthLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Categories query
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Cart items query
  const { data: cartItems } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!authData?.user,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged out successfully",
        variant: "default",
      });
    },
  });

  // Login form schema
  const loginFormSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  // Register form schema
  const registerFormSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  // Login form
  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (values: z.infer<typeof loginFormSchema>) => {
      return apiRequest("POST", "/api/auth/login", values);
    },
    onSuccess: () => {
      setIsLoginDialogOpen(false);
      loginForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Logged in successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (values: z.infer<typeof registerFormSchema>) => {
      const { confirmPassword, ...userData } = values;
      return apiRequest("POST", "/api/auth/register", userData);
    },
    onSuccess: () => {
      setIsRegisterDialogOpen(false);
      registerForm.reset();
      setIsLoginDialogOpen(true);
      toast({
        title: "Registration successful",
        description: "You can now log in with your credentials",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle login form submission
  const onLoginSubmit = (values: z.infer<typeof loginFormSchema>) => {
    loginMutation.mutate(values);
  };

  // Handle register form submission
  const onRegisterSubmit = (values: z.infer<typeof registerFormSchema>) => {
    registerMutation.mutate(values);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Switch from login to register dialog
  const switchToRegister = () => {
    setIsLoginDialogOpen(false);
    setIsRegisterDialogOpen(true);
  };

  // Switch from register to login dialog
  const switchToLogin = () => {
    setIsRegisterDialogOpen(false);
    setIsLoginDialogOpen(true);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row justify-between items-center py-4">
          <div className="flex items-center mb-4 lg:mb-0">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary font-heading cursor-pointer">BeautyEssence</h1>
            </Link>
          </div>
          
          <div className="w-full lg:w-1/3 mb-4 lg:mb-0">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button 
                type="submit"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-2 text-gray-400 hover:text-primary hover:bg-transparent"
              >
                <Search size={18} />
              </Button>
            </form>
          </div>
          
          <div className="flex items-center space-x-6">
            {!isAuthLoading && (
              <>
                {!authData?.user ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600 hover:text-primary hover:bg-transparent"
                    onClick={() => setIsLoginDialogOpen(true)}
                  >
                    <User size={24} />
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-600 hover:text-primary hover:bg-transparent"
                      >
                        <User size={24} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {authData.user.role === "admin" && (
                        <DropdownMenuItem onClick={() => navigate("/admin")}>
                          Admin Dashboard
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => navigate("/profile")}>
                        My Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/orders")}>
                        My Orders
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-primary hover:bg-transparent"
              onClick={() => navigate("/wishlist")}
            >
              <Heart size={24} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-primary hover:bg-transparent relative"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={24} />
              {cartItems && cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Button>
          </div>
        </div>
        
        <nav className="py-4 border-t border-gray-100">
          <ul className="flex flex-wrap justify-center lg:justify-start space-x-1 lg:space-x-8">
            <li>
              <Link href="/">
                <a className="px-3 py-2 font-medium hover:text-primary transition-colors">Home</a>
              </Link>
            </li>
            
            {categories?.map((category) => (
              <li key={category.id} className="relative group">
                <Link href={`/category/${category.slug}`}>
                  <a className="px-3 py-2 font-medium hover:text-primary transition-colors flex items-center">
                    {category.name} <ChevronDown size={16} className="ml-1" />
                  </a>
                </Link>
                {/* Dropdown for subcategories could be added here */}
              </li>
            ))}
            
            <li>
              <Link href="/new-arrivals">
                <a className="px-3 py-2 font-medium hover:text-primary transition-colors">New Arrivals</a>
              </Link>
            </li>
            <li>
              <Link href="/best-sellers">
                <a className="px-3 py-2 font-medium hover:text-primary transition-colors">Best Sellers</a>
              </Link>
            </li>
            <li>
              <Link href="/sale">
                <a className="px-3 py-2 font-medium hover:text-primary transition-colors">Sale</a>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Login to your account</DialogTitle>
            <DialogDescription>
              Enter your credentials to access your account.
            </DialogDescription>
          </DialogHeader>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={switchToRegister}
                  className="mb-2 sm:mb-0"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </Button>
                <Button type="submit" disabled={loginMutation.isPending}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Register Dialog */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a new account</DialogTitle>
            <DialogDescription>
              Fill out the form below to create your account.
            </DialogDescription>
          </DialogHeader>
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Create a password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={switchToLogin}
                  className="mb-2 sm:mb-0"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  I already have an account
                </Button>
                <Button type="submit" disabled={registerMutation.isPending}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {registerMutation.isPending ? "Creating account..." : "Register"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
