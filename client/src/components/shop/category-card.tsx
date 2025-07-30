import { Link } from "wouter";

interface CategoryCardProps {
  name: string;
  imageUrl: string;
  productCount: number;
}

export default function CategoryCard({ name, imageUrl, productCount }: CategoryCardProps) {
  return (
    <Link href={`/shop?category=${encodeURIComponent(name)}`}>
      <div className="group relative rounded-lg xs:rounded-xl overflow-hidden bg-gray-100 hover:bg-gray-200 transition-all duration-300 cursor-pointer h-48 xs:h-56 sm:h-64 shadow-sm hover:shadow-lg transform hover:-translate-y-1">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="p-3 xs:p-4 sm:p-5 bg-white bg-opacity-90 backdrop-blur-sm absolute bottom-0 w-full">
          <h3 className="text-base xs:text-lg font-medium text-gray-900 truncate">{name}</h3>
          <p className="mt-1 text-xs xs:text-sm text-gray-500">{productCount} products</p>
          <span className="mt-2 text-xs xs:text-sm font-medium text-primary hover:text-indigo-600 flex items-center transition-colors duration-200">
            <span className="hidden xs:inline">Browse Category</span>
            <span className="xs:hidden">Browse</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="ml-1 h-3 w-3 xs:h-4 xs:w-4 group-hover:translate-x-1 transition-transform duration-200" 
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
