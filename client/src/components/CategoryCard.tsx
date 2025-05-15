import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";

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

interface CategoryCardProps {
  category: Category;
  showSubcategories?: boolean;
}

export default function CategoryCard({ category, showSubcategories = false }: CategoryCardProps) {
  const { name, slug, imageUrl, children } = category;
  const { theme } = useTheme();

  return (
    <div className="group h-full flex flex-col">
      <Link href={`/category/${slug}`}>
        <div className="relative rounded-lg overflow-hidden mb-3 cursor-pointer aspect-[4/3]">
          <img
            src={imageUrl || "https://placehold.co/400x400?text=No+Image"}
            alt={`${name} Collection`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 flex items-end backdrop-blur-[1px]">
            <div className="p-4 w-full text-center">
              <h3 className="text-white font-bold text-xl font-heading">{name}</h3>
            </div>
          </div>
        </div>
      </Link>

      {showSubcategories && children && children.length > 0 ? (
        <div className="mt-2 flex-grow">
          <ul className="text-sm space-y-1">
            {children.map(subCategory => (
              <li key={subCategory.id}>
                <Link href={`/category/${subCategory.slug}`}>
                  <a className="text-foreground hover:text-primary hover:underline transition-colors duration-200">
                    {subCategory.name}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-auto">
          <Link href={`/category/${slug}`}>
            <a className="block text-center text-primary hover:underline transition-colors duration-200">
              Ver Todos os {name}
            </a>
          </Link>
        </div>
      )}
    </div>
  );
}
