import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  order: number;
  children?: Category[];
}

interface CategoryMenuProps {
  categories: Category[];
  onClose?: () => void;
}

export default function CategoryMenu({ categories, onClose }: CategoryMenuProps) {
  const [organizedCategories, setOrganizedCategories] = useState<Category[]>([]);
  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Organizar categorias em hierarquia
    const mainCategories: Category[] = [];
    const categoryMap: Record<number, Category> = {};

    // Primeiro, mapear todas as categorias por ID
    categories.forEach(category => {
      categoryMap[category.id] = { ...category, children: [] };
    });

    // Em seguida, organizar em hierarquia
    categories.forEach(category => {
      if (category.parentId === null) {
        // Categoria principal
        mainCategories.push(categoryMap[category.id]);
      } else if (categoryMap[category.parentId]) {
        // Subcategoria
        if (!categoryMap[category.parentId].children) {
          categoryMap[category.parentId].children = [];
        }
        categoryMap[category.parentId].children!.push(categoryMap[category.id]);
      }
    });

    // Ordenar categorias principais e subcategorias pelo campo order
    mainCategories.sort((a, b) => a.order - b.order);
    mainCategories.forEach(category => {
      if (category.children) {
        category.children.sort((a, b) => a.order - b.order);
      }
    });

    setOrganizedCategories(mainCategories);
  }, [categories]);

  const toggleCategory = (categoryId: number) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleCategoryClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="category-menu">
      <h3 className="font-bold text-lg mb-4">Categorias</h3>
      <ul className="space-y-2">
        {organizedCategories.map(category => (
          <li key={category.id}>
            {category.children && category.children.length > 0 ? (
              <Collapsible
                open={openCategories[category.id]}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <div className="flex items-center">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                      {openCategories[category.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <Link href={`/category/${category.slug}`}>
                    <a 
                      className="text-primary hover:underline font-medium"
                      onClick={handleCategoryClick}
                    >
                      {category.name}
                    </a>
                  </Link>
                </div>
                <CollapsibleContent>
                  <ul className="pl-8 mt-2 space-y-2">
                    {category.children.map(subCategory => (
                      <li key={subCategory.id}>
                        <Link href={`/category/${subCategory.slug}`}>
                          <a 
                            className="text-gray-700 hover:text-primary hover:underline"
                            onClick={handleCategoryClick}
                          >
                            {subCategory.name}
                          </a>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link href={`/category/${category.slug}`}>
                <a 
                  className="text-primary hover:underline font-medium"
                  onClick={handleCategoryClick}
                >
                  {category.name}
                </a>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
