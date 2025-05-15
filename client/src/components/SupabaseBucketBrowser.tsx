import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Folder, Image, Search, X, FolderTree, FolderPlus } from "lucide-react";

interface BucketImage {
  name: string;
  url: string;
  path: string;
  folder: string;
}

interface BucketFolder {
  name: string;
  path: string;
  hasSubfolders: boolean;
}

interface SupabaseBucketBrowserProps {
  onSelectImages: (images: string[]) => void;
  categoryId?: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SupabaseBucketBrowser({
  onSelectImages,
  categoryId,
  isOpen,
  onOpenChange,
}: SupabaseBucketBrowserProps) {
  const { toast } = useToast();
  const [folders, setFolders] = useState<BucketFolder[]>([]);
  const [images, setImages] = useState<BucketImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeSubfolders, setIncludeSubfolders] = useState(false);

  // Fetch folders when component mounts
  useEffect(() => {
    if (isOpen) {
      fetchFolders();
      // Reset selected images when opening
      setSelectedImages([]);
    }
  }, [isOpen]);

  // Fetch images when folder or includeSubfolders changes
  useEffect(() => {
    if (currentFolder) {
      fetchImages(currentFolder, includeSubfolders);
    }
  }, [currentFolder, includeSubfolders]);

  // Fetch folders from the API
  const fetchFolders = async (path?: string) => {
    setIsLoading(true);
    try {
      console.log(`Fetching folders from storage API at path: ${path || 'root'}...`);
      const url = path
        ? `/api/storage/folders?path=${encodeURIComponent(path)}`
        : "/api/storage/folders";

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch folders: ${response.status} ${errorText}`);
        throw new Error(`Falha ao buscar pastas: ${response.status}`);
      }

      const data = await response.json();
      console.log("Folders fetched successfully:", data);
      setFolders(data.folders || []);

      // Log the current path for debugging
      if (path) {
        console.log(`Current path: ${path.split('/')}`);
      } else {
        console.log('At root folder');
      }

      // If we have a categoryId and we're at the root, try to find a matching folder
      if (categoryId && !path) {
        console.log("Trying to find folder for category ID:", categoryId);
        const category = await fetchCategoryById(categoryId);
        if (category && category.slug) {
          console.log("Found category:", category);
          // If the category folder exists, select it
          const categoryFolder = data.folders.find((f: BucketFolder) => f.path === category.slug);
          if (categoryFolder) {
            console.log("Setting current folder to:", categoryFolder.path);
            setCurrentFolder(categoryFolder.path);
          } else {
            console.log("Category folder not found in bucket folders");
          }
        } else {
          console.log("Category not found or has no slug");
        }
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
      toast({
        title: "Erro ao buscar pastas",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch category by ID
  const fetchCategoryById = async (id: number) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching category:", error);
      return null;
    }
  };

  // Fetch images from the API
  const fetchImages = async (folder: string, includeSubfolders: boolean = false) => {
    setIsLoading(true);
    try {
      console.log(`Fetching images from folder: ${folder}, includeSubfolders: ${includeSubfolders}`);
      const url = new URL('/api/storage/images', window.location.origin);
      url.searchParams.append('folder', folder);
      if (includeSubfolders) {
        url.searchParams.append('includeSubfolders', 'true');
      }

      const response = await fetch(url.toString(), {
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch images: ${response.status} ${errorText}`);
        throw new Error(`Falha ao buscar imagens: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Images fetched successfully:`, data);
      setImages(data.images || []);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast({
        title: "Erro ao buscar imagens",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle folder selection
  const handleFolderSelect = (folderPath: string) => {
    console.log(`Selected folder: ${folderPath}`);
    setCurrentFolder(folderPath);

    // If the folder has subfolders, fetch them
    const selectedFolder = folders.find(f => f.path === folderPath);
    if (selectedFolder?.hasSubfolders) {
      fetchFolders(folderPath);
    }
  };

  // Handle image selection
  const handleImageSelect = (image: BucketImage) => {
    setSelectedImages((prev) => {
      // If already selected, remove it
      if (prev.includes(image.url)) {
        return prev.filter((url) => url !== image.url);
      }
      // Otherwise add it
      return [...prev, image.url];
    });
  };

  // Handle confirm selection
  const handleConfirm = () => {
    console.log("Confirming selection of images:", selectedImages);
    onSelectImages(selectedImages);
    onOpenChange(false);
  };

  // Handle creating a new folder
  const handleCreateFolder = async () => {
    try {
      // Prompt for folder name
      const folderName = prompt("Digite o nome da nova pasta:");
      if (!folderName) return;

      // Construct the full path
      const newFolderPath = currentFolder
        ? `${currentFolder}/${folderName}`
        : folderName;

      console.log(`Creating new folder: ${newFolderPath}`);

      // Call API to create folder
      const response = await fetch('/api/storage/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: newFolderPath }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha ao criar pasta: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Pasta criada com sucesso",
          description: result.message,
          variant: "default",
        });

        // Refresh folders
        fetchFolders(currentFolder || undefined);
      } else {
        throw new Error(result.message || "Erro desconhecido ao criar pasta");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Erro ao criar pasta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // Filter images by search term
  const filteredImages = searchTerm
    ? images.filter((image) =>
        image.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : images;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Imagens do Bucket</DialogTitle>
          <DialogDescription>
            Navegue pelas pastas e selecione as imagens que deseja adicionar ao produto.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 my-4">
          <div className="flex-1 flex space-x-2">
            <div className="flex-1">
              <Select value={currentFolder} onValueChange={handleFolderSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma pasta" />
                </SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem key={folder.path} value={folder.path}>
                    <div className="flex items-center">
                      <Folder className="mr-2 h-4 w-4" />
                      {folder.name}
                      {folder.hasSubfolders && <span className="ml-1 text-xs text-gray-500">(+)</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleCreateFolder}
              title="Criar nova pasta"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar imagens..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1.5 h-6 w-6"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-subfolders"
              checked={includeSubfolders}
              onCheckedChange={(checked) => setIncludeSubfolders(checked === true)}
            />
            <label
              htmlFor="include-subfolders"
              className="text-sm cursor-pointer flex items-center"
            >
              <FolderTree className="h-4 w-4 mr-1" />
              Incluir subpastas
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md p-2">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-32" />
              ))}
            </div>
          ) : filteredImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.path}
                  className={`relative group cursor-pointer border rounded-md overflow-hidden ${
                    selectedImages.includes(image.url)
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => handleImageSelect(image)}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      console.error(`Error loading image: ${image.url}`);
                      // Fallback para uma imagem de erro
                      e.currentTarget.src = "https://via.placeholder.com/150?text=Error";
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                    {image.name}
                  </div>
                  {selectedImages.includes(image.url) && (
                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Image className="h-12 w-12 text-gray-400 mb-4" />
              {currentFolder ? (
                <>
                  <p className="text-lg font-medium">Nenhuma imagem encontrada</p>
                  <p className="text-sm text-gray-500">
                    Não há imagens na pasta selecionada ou que correspondam à sua busca.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">Selecione uma pasta</p>
                  <p className="text-sm text-gray-500">
                    Escolha uma pasta para visualizar as imagens disponíveis.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            {selectedImages.length} imagens selecionadas
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={selectedImages.length === 0}>
              Adicionar Imagens
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
