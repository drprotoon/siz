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
  LogOut,
  Moon,
  Sun
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { Toggle } from "@/components/ui/toggle";

export default function Header() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  // Auth query to check if user is logged in
  const { data: authData, isLoading: isAuthLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Categories query
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Cart items query - now works for both logged in and guest users
  const { data: cartItems } = useQuery({
    queryKey: ["/api/cart"],
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
    onSuccess: async (data) => {
      setIsLoginDialogOpen(false);
      loginForm.reset();

      try {
        // Aguardar a resposta JSON para garantir que temos os dados do usuário
        const userData = await data.json();

        // Invalidate queries AFTER we have the user data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });

        toast({
          title: "Login realizado com sucesso",
          variant: "default",
        });

        // Redirecionar imediatamente para a página inicial
        if (userData.user && userData.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Erro ao processar resposta de login:", error);
        // Em caso de erro ao processar o JSON, redireciona para a home
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });

        navigate("/");
        toast({
          title: "Login realizado com sucesso",
          variant: "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Falha no login",
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
        title: "Cadastro realizado com sucesso",
        description: "Agora você pode fazer login com suas credenciais",
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
    <header className="bg-background border-b border-border shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row justify-between items-center py-4">
          <div className="flex items-center justify-between w-full lg:w-auto mb-4 lg:mb-0">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary font-heading cursor-pointer">SIZ COSMETICOS</h1>
            </Link>

            {/* Mobile menu toggle and dark mode toggle */}
            <div className="flex items-center space-x-2 lg:hidden">
              <Toggle
                pressed={theme === 'dark'}
                onPressedChange={toggleTheme}
                aria-label="Toggle dark mode"
                className="bg-background border border-border"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Toggle>

              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:text-primary hover:bg-transparent lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>

          <div className="w-full lg:w-1/3 mb-4 lg:mb-0">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Buscar produtos..."
                className="w-full px-4 py-2 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-2 text-muted-foreground hover:text-primary hover:bg-transparent"
              >
                <Search size={18} />
              </Button>
            </form>
          </div>

          <div className="flex items-center space-x-2 md:space-x-6">
            {/* Dark mode toggle - desktop */}
            <div className="hidden lg:block">
              <Toggle
                pressed={theme === 'dark'}
                onPressedChange={toggleTheme}
                aria-label="Toggle dark mode"
                className="bg-background border border-border"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Toggle>
            </div>

            {!isAuthLoading && (
              <>
                {!authData?.user ? (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      className="text-foreground hover:text-primary hover:bg-transparent flex items-center"
                      onClick={() => navigate("/login")}
                    >
                      <LogIn className="mr-1" size={18} />
                      <span className="hidden sm:inline">Entrar</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary hover:text-white flex items-center"
                      onClick={() => navigate("/register")}
                    >
                      <UserPlus className="mr-1 sm:mr-2" size={18} />
                      <span className="hidden sm:inline">Cadastrar</span>
                    </Button>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-foreground hover:text-primary hover:bg-transparent"
                      >
                        <User size={24} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
                      {authData.user.role === "admin" && (
                        <DropdownMenuItem onClick={() => navigate("/admin")}>
                          Painel de Administração
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => navigate("/profile")}>
                        Meu Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/orders")}>
                        Meus Pedidos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:text-primary hover:bg-transparent"
              onClick={() => navigate("/wishlist")}
            >
              <Heart size={24} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:text-primary hover:bg-transparent relative"
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

        {/* Desktop Navigation */}
        <nav className={`py-4 border-t border-border hidden lg:block`}>
          <ul className="flex flex-wrap justify-center lg:justify-start space-x-1 lg:space-x-8">
            <li>
              <Link href="/">
                <span className="px-3 py-2 font-medium hover:text-primary transition-colors cursor-pointer">Início</span>
              </Link>
            </li>

            {/* Feminino Dropdown */}
            <li className="relative group">
              <div className="px-3 py-2 font-medium hover:text-primary transition-colors flex items-center cursor-pointer">
                Feminino <ChevronDown size={16} className="ml-1" />
              </div>
              <div className="absolute left-0 mt-2 w-48 bg-popover text-popover-foreground shadow-lg rounded-md overflow-hidden z-20 transform opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-top-left hidden group-hover:block border border-border">
                <Link href="/category/perfumes-femininos">
                  <span className="block px-4 py-2 text-sm hover:bg-primary hover:text-white transition-colors">Perfumes</span>
                </Link>
                <Link href="/category/fragrancias">
                  <span className="block px-4 py-2 text-sm hover:bg-primary hover:text-white transition-colors">Fragrâncias</span>
                </Link>
                <Link href="/category/skincare">
                  <span className="block px-4 py-2 text-sm hover:bg-primary hover:text-white transition-colors">Skincare</span>
                </Link>
                <Link href="/category/maquiagem">
                  <span className="block px-4 py-2 text-sm hover:bg-primary hover:text-white transition-colors">Maquiagem</span>
                </Link>
              </div>
            </li>

            {/* Masculino Dropdown */}
            <li className="relative group">
              <div className="px-3 py-2 font-medium hover:text-primary transition-colors flex items-center cursor-pointer">
                Masculino <ChevronDown size={16} className="ml-1" />
              </div>
              <div className="absolute left-0 mt-2 w-48 bg-popover text-popover-foreground shadow-lg rounded-md overflow-hidden z-20 transform opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-top-left hidden group-hover:block border border-border">
                <Link href="/category/perfumes-masculinos">
                  <span className="block px-4 py-2 text-sm hover:bg-primary hover:text-white transition-colors">Perfumes</span>
                </Link>
                <Link href="/category/kits">
                  <span className="block px-4 py-2 text-sm hover:bg-primary hover:text-white transition-colors">Kits</span>
                </Link>
              </div>
            </li>

            <li>
              <Link href="/new-arrivals">
                <span className="px-3 py-2 font-medium hover:text-primary transition-colors cursor-pointer">Novidades</span>
              </Link>
            </li>
            <li>
              <Link href="/best-sellers">
                <span className="px-3 py-2 font-medium hover:text-primary transition-colors cursor-pointer">Mais Vendidos</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile Navigation */}
        <nav className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:hidden py-4 border-t border-border`}>
          <ul className="flex flex-col space-y-2">
            <li>
              <Link href="/">
                <span className="block px-3 py-2 font-medium hover:text-primary transition-colors cursor-pointer">Início</span>
              </Link>
            </li>

            {/* Feminino Section */}
            <li>
              <div className="px-3 py-2 font-medium text-primary transition-colors">Feminino</div>
              <ul className="pl-6 space-y-1">
                <li>
                  <Link href="/category/perfumes-femininos">
                    <span className="block px-3 py-1 text-sm hover:text-primary transition-colors">Perfumes</span>
                  </Link>
                </li>
                <li>
                  <Link href="/category/fragrancias">
                    <span className="block px-3 py-1 text-sm hover:text-primary transition-colors">Fragrâncias</span>
                  </Link>
                </li>
                <li>
                  <Link href="/category/skincare">
                    <span className="block px-3 py-1 text-sm hover:text-primary transition-colors">Skincare</span>
                  </Link>
                </li>
                <li>
                  <Link href="/category/maquiagem">
                    <span className="block px-3 py-1 text-sm hover:text-primary transition-colors">Maquiagem</span>
                  </Link>
                </li>
              </ul>
            </li>

            {/* Masculino Section */}
            <li>
              <div className="px-3 py-2 font-medium text-primary transition-colors">Masculino</div>
              <ul className="pl-6 space-y-1">
                <li>
                  <Link href="/category/perfumes-masculinos">
                    <span className="block px-3 py-1 text-sm hover:text-primary transition-colors">Perfumes</span>
                  </Link>
                </li>
                <li>
                  <Link href="/category/kits">
                    <span className="block px-3 py-1 text-sm hover:text-primary transition-colors">Kits</span>
                  </Link>
                </li>
              </ul>
            </li>

            <li>
              <Link href="/new-arrivals">
                <span className="block px-3 py-2 font-medium hover:text-primary transition-colors cursor-pointer">Novidades</span>
              </Link>
            </li>
            <li>
              <Link href="/best-sellers">
                <span className="block px-3 py-2 font-medium hover:text-primary transition-colors cursor-pointer">Mais Vendidos</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Entrar na sua conta</DialogTitle>
            <DialogDescription>
              Digite suas credenciais para acessar sua conta.
            </DialogDescription>
          </DialogHeader>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite seu nome de usuário" {...field} />
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite sua senha" {...field} />
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
                  Criar Conta
                </Button>
                <Button type="submit" disabled={loginMutation.isPending}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
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
            <DialogTitle>Criar uma nova conta</DialogTitle>
            <DialogDescription>
              Preencha o formulário abaixo para criar sua conta.
            </DialogDescription>
          </DialogHeader>
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="Escolha um nome de usuário" {...field} />
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
                      <Input type="email" placeholder="Digite seu email" {...field} />
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Crie uma senha" {...field} />
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
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirme sua senha" {...field} />
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
                  Já tenho uma conta
                </Button>
                <Button type="submit" disabled={registerMutation.isPending}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {registerMutation.isPending ? "Criando conta..." : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
