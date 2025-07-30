import { Link } from "wouter";
import { Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, StarHalf } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, isProductInCart } = useCart();
  const productInCart = isProductInCart(product.id);

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="group relative bg-white rounded-lg xs:rounded-xl shadow-sm overflow-hidden hover:shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
        <div className="aspect-w-3 aspect-h-4 bg-gray-200 group-hover:opacity-75 transition-opacity duration-300">
          <img 
            src={product.imageUrl}
            alt={product.name} 
            className="w-full h-48 xs:h-56 sm:h-64 lg:h-56 xl:h-64 object-cover object-center"
          />
        </div>
        <CardContent className="p-3 xs:p-4 sm:p-5">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm xs:text-base sm:text-lg font-medium text-gray-900 truncate">{product.name}</h3>
              <p className="mt-1 text-xs xs:text-sm text-gray-500 line-clamp-2">
                {product.description.length > 50 
                  ? `${product.description.substring(0, 50)}...` 
                  : product.description}
              </p>
            </div>
            {product.featured && (
              <Badge className="bg-green-100 text-green-800 border-none text-xs px-2 py-1 flex-shrink-0">
                <span className="hidden xs:inline">New</span>
                <span className="xs:hidden">•</span>
              </Badge>
            )}
          </div>
          <div className="mt-3 xs:mt-4 flex justify-between items-center">
            <div className="flex-1">
              <p className="text-base xs:text-lg font-medium text-gray-900">${product.price.toFixed(2)}</p>
              <div className="flex items-center mt-1">
                <div className="flex">
                  <Star className="h-3 w-3 xs:h-4 xs:w-4 text-yellow-400 fill-current" />
                  <Star className="h-3 w-3 xs:h-4 xs:w-4 text-yellow-400 fill-current" />
                  <Star className="h-3 w-3 xs:h-4 xs:w-4 text-yellow-400 fill-current" />
                  <Star className="h-3 w-3 xs:h-4 xs:w-4 text-yellow-400 fill-current" />
                  <StarHalf className="h-3 w-3 xs:h-4 xs:w-4 text-yellow-400 fill-current" />
                </div>
                <span className="ml-1 text-xs xs:text-sm text-gray-500">(42)</span>
              </div>
            </div>
            <Button 
              size="icon"
              onClick={addToCart}
              variant={productInCart ? "secondary" : "default"}
              className="ml-2 xs:ml-4 p-1.5 xs:p-2 rounded-full flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <ShoppingCart className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
