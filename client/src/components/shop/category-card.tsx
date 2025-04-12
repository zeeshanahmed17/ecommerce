import { Link } from "wouter";

interface CategoryCardProps {
  name: string;
  imageUrl: string;
  productCount: number;
}

export default function CategoryCard({ name, imageUrl, productCount }: CategoryCardProps) {
  return (
    <Link href={`/shop?category=${encodeURIComponent(name)}`}>
      <div className="group relative rounded-lg overflow-hidden bg-gray-100 hover:bg-gray-200 transition-colors duration-300 cursor-pointer h-64">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover object-center" 
        />
        <div className="p-4 bg-white bg-opacity-90 absolute bottom-0 w-full">
          <h3 className="text-lg font-medium text-gray-900">{name}</h3>
          <p className="mt-1 text-sm text-gray-500">{productCount} products</p>
          <span className="mt-2 text-sm font-medium text-primary hover:text-indigo-600 flex items-center">
            Browse Category 
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="ml-1 h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
