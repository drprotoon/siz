import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, X, Upload, FolderOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SupabaseBucketBrowser from "@/components/SupabaseBucketBrowser";

// Form schema
const productFormSchema = z.object({
  name: z.string().min(3, "Nome do produto deve ter pelo menos 3 caracteres"),
  slug: z.string().min(3, "Slug deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Preço é obrigatório e deve ser maior que zero"),
  compareAtPrice: z.coerce.number().optional(),
  sku: z.string().min(1, "SKU é obrigatório"),
  weight: z.coerce.number().min(0.01, "Peso é obrigatório e deve ser maior que zero"),
  quantity: z.coerce.number().int().min(0, "Quantidade não pode ser negativa"),
  categoryId: z.coerce.number().int().positive("Categoria é obrigatória"),
  ingredients: z.string().optional(),
  howToUse: z.string().optional(),
  visible: z.boolean().default(true),
  featured: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  images: z.array(z.string()).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductForm() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isBucketBrowserOpen, setIsBucketBrowserOpen] = useState(false);
  const isEditMode = !!id;

  // State for loading and data
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      compareAtPrice: undefined,
      sku: "",
      weight: 0,
      quantity: 0,
      categoryId: 0,
      ingredients: "",
      howToUse: "",
      visible: true,
      featured: false,
      newArrival: false,
      bestSeller: false,
      images: [],
    },
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          throw new Error('Failed to fetch categories');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        toast({
          title: "Erro ao carregar categorias",
          description: err instanceof Error ? err.message : "Erro desconhecido",
          variant: "destructive",
        });
      }
    };

    fetchCategories();
  }, [toast]);

  // Fetch product if in edit mode
  useEffect(() => {
    if (isEditMode && isAdmin) {
      const fetchProduct = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/products?id=${id}`, {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            setProduct(data);
            console.log("Product data loaded:", data);

            // Set form values
            const formValues = {
              name: data.name || "",
              slug: data.slug || "",
              description: data.description || "",
              price: data.price ? parseFloat(data.price.toString()) : 0,
              compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice.toString()) : undefined,
              sku: data.sku || "",
              weight: data.weight ? parseFloat(data.weight.toString()) : 0,
              quantity: data.quantity || 0,
              categoryId: data.categoryId || 0,
              ingredients: data.ingredients || "",
              howToUse: data.howToUse || "",
              visible: data.visible !== undefined ? data.visible : true,
              featured: data.featured !== undefined ? data.featured : false,
              newArrival: data.newArrival !== undefined ? data.newArrival : false,
              bestSeller: data.bestSeller !== undefined ? data.bestSeller : false,
            };

            form.reset(formValues);

            // Set images
            if (data.images) {
              console.log("Setting image URLs:", data.images);
              setImageUrls(Array.isArray(data.images) ? data.images : []);
            }
          } else {
            throw new Error('Failed to fetch product');
          }
        } catch (err) {
          console.error('Error fetching product:', err);
          setError(err instanceof Error ? err : new Error('Unknown error'));
          toast({
            title: "Erro ao carregar produto",
            description: err instanceof Error ? err.message : "Erro desconhecido",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchProduct();
    } else {
      setIsLoading(false);
    }
  }, [id, isEditMode, isAdmin, form, toast]);

  // Handle form submission
  const onSubmit = async (data: ProductFormValues) => {
    // Make sure the form has the latest image URLs
    const formDataWithImages = {
      ...data,
      images: imageUrls
    };

    console.log("Submitting form with data:", formDataWithImages);
    console.log("Images being submitted:", imageUrls);

    try {
      const url = isEditMode ? `/api/products/${id}` : '/api/products';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formDataWithImages,
          price: formDataWithImages.price.toString(),
          compareAtPrice: formDataWithImages.compareAtPrice ? formDataWithImages.compareAtPrice.toString() : undefined,
          weight: formDataWithImages.weight.toString(),
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${isEditMode ? 'updating' : 'creating'} product: ${response.status} ${errorText}`);
      }

      toast({
        title: isEditMode ? "Produto atualizado com sucesso" : "Produto criado com sucesso",
        variant: "default",
      });

      navigate("/admin/products");
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, error);
      toast({
        title: isEditMode ? "Erro ao atualizar produto" : "Erro ao criar produto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);

    try {
      const files = Array.from(e.target.files);
      const formData = new FormData();

      // Add each file to FormData
      files.forEach((file) => {
        formData.append('images', file);
      });

      // Add category ID for storage organization
      const categoryId = form.getValues('categoryId');
      if (categoryId) {
        formData.append('categoryId', categoryId.toString());
      }

      console.log("Uploading images with category ID:", categoryId);

      // Send to upload endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include credentials for authentication
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error uploading images: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log("Upload result:", result);

      if (result.urls && Array.isArray(result.urls)) {
        setImageUrls([...imageUrls, ...result.urls]);

        // Update the form value for images
        form.setValue('images', [...imageUrls, ...result.urls]);

        toast({
          title: "Imagens enviadas com sucesso",
          description: `${result.urls.length} imagens foram adicionadas`,
          variant: "default",
        });
      } else {
        throw new Error("Invalid response format from server");
      }

      // Reset the input
      e.target.value = "";
    } catch (error) {
      console.error("Error uploading images:", error);

      toast({
        title: "Erro ao fazer upload das imagens",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    const newImageUrls = [...imageUrls];
    newImageUrls.splice(index, 1);
    setImageUrls(newImageUrls);

    // Also update the form value
    form.setValue('images', newImageUrls);

    toast({
      title: "Imagem removida",
      variant: "default",
    });
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  if (isLoading) {
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

  // Show error state if product couldn't be loaded in edit mode
  if (isEditMode && error && !isLoading) {
    return (
      <div className="flex flex-col md:flex-row h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 p-6">
          <div className="mb-6 flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin/products")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold font-heading">
              Erro ao Carregar Produto
            </h1>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <h2 className="text-xl font-bold mb-4 text-red-600">Não foi possível carregar os dados do produto</h2>
                <p className="text-gray-600 mb-6">
                  Ocorreu um erro ao tentar carregar as informações do produto. Por favor, tente novamente mais tarde.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
            onClick={() => navigate("/admin/products")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold font-heading">
            {isEditMode ? "Editar Produto" : "Adicionar Novo Produto"}
          </h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do produto"
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

                  {/* Product Slug */}
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="produto-slug" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL amigável para o produto
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Product Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição detalhada do produto"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Price */}
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="99.90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Compare At Price */}
                  <FormField
                    control={form.control}
                    name="compareAtPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Comparativo (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="129.90" {...field} />
                        </FormControl>
                        <FormDescription>
                          Preço original antes do desconto
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(categories) ? categories.map((category: any) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            )) : (
                              <SelectItem value="0">Carregando categorias...</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Imagens do Produto</h3>
                    <div className="flex flex-wrap gap-4 mb-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Produto ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-md border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        {/* Upload from computer */}
                        <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                          <Upload className="h-6 w-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                          />
                        </label>

                        {/* Browse from Supabase bucket */}
                        <Button
                          type="button"
                          variant="outline"
                          className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center"
                          onClick={() => {
                            console.log("Opening Supabase bucket browser");
                            console.log("Current category ID:", form.getValues('categoryId'));
                            setIsBucketBrowserOpen(true);
                          }}
                        >
                          <FolderOpen className="h-6 w-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Bucket</span>
                        </Button>
                      </div>
                    </div>
                    {isUploading && <p className="text-sm text-gray-500">Enviando imagens...</p>}
                  </div>
                </div>

                {/* Supabase Bucket Browser */}
                <SupabaseBucketBrowser
                  isOpen={isBucketBrowserOpen}
                  onOpenChange={setIsBucketBrowserOpen}
                  onSelectImages={(selectedImages) => {
                    console.log("Selected images from bucket:", selectedImages);
                    // Add selected images to the form
                    const updatedImages = [...imageUrls, ...selectedImages];
                    console.log("Updated image URLs:", updatedImages);

                    setImageUrls(updatedImages);
                    form.setValue('images', updatedImages);

                    toast({
                      title: "Imagens adicionadas",
                      description: `${selectedImages.length} imagens foram adicionadas do bucket`,
                      variant: "default",
                    });
                  }}
                  categoryId={form.getValues('categoryId')}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* SKU */}
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="PROD001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Weight */}
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso (g)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="250" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantity */}
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade em Estoque</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Ingredients */}
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingredientes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Lista de ingredientes do produto"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* How to Use */}
                <FormField
                  control={form.control}
                  name="howToUse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modo de Uso</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Instruções de como usar o produto"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Visibilidade</h3>

                    {/* Visible */}
                    <FormField
                      control={form.control}
                      name="visible"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Visível na loja</FormLabel>
                            <FormDescription>
                              Produto será exibido para os clientes
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Destaque</h3>

                    {/* Featured */}
                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Produto em Destaque</FormLabel>
                            <FormDescription>
                              Exibido na seção de destaques da loja
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* New Arrival */}
                    <FormField
                      control={form.control}
                      name="newArrival"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Novidade</FormLabel>
                            <FormDescription>
                              Marcado como produto recém-chegado
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Best Seller */}
                    <FormField
                      control={form.control}
                      name="bestSeller"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Mais Vendido</FormLabel>
                            <FormDescription>
                              Marcado como produto mais vendido
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/products")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {isEditMode ? "Atualizar Produto" : "Criar Produto"}
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