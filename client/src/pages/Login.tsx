import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export default function Login() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { checkoutRedirectUrl, setCheckoutRedirectUrl } = useAuth();

  // Verificar se há um redirecionamento para checkout
  useEffect(() => {
    // Adicionar mensagem se o usuário foi redirecionado do checkout
    if (checkoutRedirectUrl) {
      toast({
        title: "Login necessário para finalizar a compra",
        description: "Faça login para continuar com o checkout.",
        variant: "default",
      });
    }
  }, [checkoutRedirectUrl, toast]);

  // Create form
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle login mutation
  const loginMutation = useMutation({
    mutationFn: async (values: z.infer<typeof loginSchema>) => {
      return apiRequest("POST", "/api/auth/login", values);
    },
    onSuccess: async (data) => {
      try {
        // Aguardar a resposta JSON para garantir que temos os dados do usuário
        const userData = await data.json();

        // Invalidate queries AFTER we have the user data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });

        toast({
          title: "Login bem-sucedido",
          description: "Você foi autenticado com sucesso.",
          variant: "default",
        });

        // Verificar se há dados pendentes no sessionStorage
        const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
        const pendingProductId = sessionStorage.getItem('pendingProductId');
        const pendingProductQuantity = sessionStorage.getItem('pendingProductQuantity');
        const pendingShipping = sessionStorage.getItem('pendingShipping');

        // Se houver um produto pendente, adicionar ao carrinho
        if (pendingProductId && pendingProductQuantity) {
          try {
            // Adicionar o produto ao carrinho
            await apiRequest("POST", "/api/cart", {
              productId: parseInt(pendingProductId),
              quantity: parseInt(pendingProductQuantity)
            });

            // Invalidar a query do carrinho para atualizar os dados
            queryClient.invalidateQueries({ queryKey: ["/api/cart"] });

            // Limpar os dados pendentes
            sessionStorage.removeItem('pendingProductId');
            sessionStorage.removeItem('pendingProductQuantity');

            // Mostrar mensagem de sucesso
            toast({
              title: "Produto adicionado ao carrinho",
              description: "O produto foi adicionado ao seu carrinho.",
              variant: "default",
            });
          } catch (error) {
            console.error("Erro ao adicionar produto pendente ao carrinho:", error);
          }
        }

        // Determinar para onde redirecionar após o refresh
        let redirectTo = "/";

        if (checkoutRedirectUrl) {
          // Limpar o redirecionamento pendente
          setCheckoutRedirectUrl(null);
          redirectTo = checkoutRedirectUrl;

          toast({
            title: "Login realizado com sucesso",
            description: "Continuando para finalizar sua compra.",
            variant: "default",
          });
        } else if (redirectAfterLogin) {
          // Limpar o redirecionamento pendente
          sessionStorage.removeItem('redirectAfterLogin');
          redirectTo = redirectAfterLogin;
        } else if (userData.user && userData.user.role === "admin") {
          redirectTo = "/admin";
        }

        // Armazenar o destino de redirecionamento no sessionStorage
        sessionStorage.setItem('loginRedirectTo', redirectTo);

        // Fazer um refresh da página para garantir que o estado de autenticação seja atualizado
        window.location.href = redirectTo;
      } catch (error) {
        console.error("Erro ao processar resposta de login:", error);
        // Em caso de erro ao processar o JSON, redireciona para a home
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });

        // Redirecionar para a página inicial mesmo em caso de erro
        navigate("/");
      }
    },
    onError: (error) => {
      toast({
        title: "Erro de autenticação",
        description: error.message || "Credenciais inválidas. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="container mx-auto max-w-md py-12">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
          <CardDescription>
            Digite suas credenciais para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome de usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-pink-600"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </span>
                ) : "Entrar"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-500">
            <span>Não tem uma conta? </span>
            <Link href="/register">
              <a className="text-primary hover:underline">Registre-se</a>
            </Link>
          </div>

          <div className="text-sm text-center text-gray-500">
            <Link href="/forgot-password">
              <a className="text-primary hover:underline">Esqueceu sua senha?</a>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}