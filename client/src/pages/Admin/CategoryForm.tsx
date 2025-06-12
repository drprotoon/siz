import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X } from "lucide-react";

// Form schema
const categoryFormSchema = z.object({
  name: z.string().min(3, "Nome da categoria deve ter pelo menos 3 caracteres"),
  slug: z.string().min(3, "Slug deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function CategoryForm() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const isEditMode = !!id;

  // Check if user is admin
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  const isAdmin = authData?.user?.role === "admin";

  // Fetch category if in edit mode
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: [`/api/categories`, { id }],
    enabled: isEditMode && isAdmin,
  });

  // Form
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
    },
  });

  // Set form values when category data is loaded
  useEffect(() => {
    if (category && isEditMode) {
      // Certifique-se de que category tem os dados esperados
      console.log("Category data loaded:", category);
      
      // Type assertion to ensure TypeScript recognizes the category properties
      form.reset({
        name: category?.name || "",
        slug: category?.slug || "",
        description: category?.description || "",
        imageUrl: category?.imageUrl || "",
      });
      
      // Set image URL
      if (category?.imageUrl) {
        setImageUrl(category.imageUrl);
      }
    }
  }, [category, isEditMode, form]);

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      return apiRequest("POST", "/api/categories", {
        ...data,
        imageUrl: imageUrl || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Categoria criada com sucesso",
        variant: "default",
      });
      navigate("/admin/categories");
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      return apiRequest("PUT", `/api/categories/${id}`, {
        ...data,
        imageUrl: imageUrl || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Categoria atualizada com sucesso",
        variant: "default",
      });
      navigate("/admin/categories");
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: CategoryFormValues) => {
    if (isEditMode) {
      updateCategoryMutation.mutate(data);
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      
      // Adiciona o arquivo ao FormData
      formData.append('images', file);
      
      // Envia para o endpoint de upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload da imagem');
      }

      const result = await response.json();
      if (result.urls && result.urls.length > 0) {
        setImageUrl(result.urls[0]);
      }
      
      setIsUploading(false);
      
      // Reset the input
      e.target.value = "";
    } catch (error) {
      console.error("Error uploading image:", error);
      setIsUploading(false);
      
      toast({
        title: "Erro ao fazer upload da imagem",
        variant: "destructive",
      });
    }
  };

  // Remove image
  const removeImage = () => {
    setImageUrl("");
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  if (authLoading || (isEditMode && categoryLoading)) {
    return (
      <div className="flex flex-col md:flex-row h-screen bg-gray-100">
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
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/categories")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold font-heading">
            {isEditMode ? "Editar Categoria" : "Adicionar Nova Categoria"}
          </h1>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Categoria</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome da categoria" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              if (!isEditMode) {
                                form.setValue("slug", generateSlug(e.target.value));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Category Slug */}
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="categoria-slug" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL amigável para a categoria
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Category Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrição da categoria" 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Category Image */}
                <div className="space-y-4">
                  <FormLabel>Imagem da Categoria</FormLabel>
                  
                  <div className="flex items-start space-x-4">
                    {imageUrl ? (
                      <div className="relative group">
                        <img
                          src={imageUrl}
                          alt="Category"
                          className="w-40 h-40 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center w-40 h-40 cursor-pointer hover:border-primary transition-colors">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Adicionar Imagem</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/categories")}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isUploading || createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  >
                    {isEditMode ? "Atualizar Categoria" : "Criar Categoria"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
