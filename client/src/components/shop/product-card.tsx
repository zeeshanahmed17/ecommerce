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
      <Card className="group relative bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        <div className="aspect-w-3 aspect-h-4 bg-gray-200 group-hover:opacity-75">
          <img 
            src={product.imageUrl}
            alt={product.name} 
            className="w-full h-64 object-cover object-center"
          />
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {product.description.length > 60 
                  ? `${product.description.substring(0, 60)}...` 
                  : product.description}
              </p>
            </div>
            {product.featured && (
              <Badge className="bg-green-100 text-green-800 border-none">New</Badge>
            )}
          </div>
          <div className="mt-3 flex justify-between items-center">
            <div>
              <p className="text-lg font-medium text-gray-900">${product.price.toFixed(2)}</p>
              <div className="flex mt-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <StarHalf className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="ml-1 text-sm text-gray-500">(42)</span>
              </div>
            </div>
            <Button 
              size="icon"
              onClick={addToCart}
              variant={productInCart ? "secondary" : "default"}
              className="ml-4 p-2 rounded-full"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
