import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryCardProps {
  name: string;
  slug: string;
  imageUrl: string;
}

export default function CategoryCard({ name, slug, imageUrl }: CategoryCardProps) {
  return (
    <div className="group">
      <Link href={`/category/${slug}`}>
        <div className="relative rounded-lg overflow-hidden mb-3 cursor-pointer">
          <img 
            src={imageUrl} 
            alt={`${name} Collection`} 
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-black/25 flex items-end">
            <div className="p-4 w-full text-center">
              <h3 className="text-white font-bold text-xl font-heading">{name}</h3>
            </div>
          </div>
        </div>
      </Link>
      <Link href={`/category/${slug}`}>
        <a className="block text-center text-primary hover:underline">Shop All {name}</a>
      </Link>
    </div>
  );
}
