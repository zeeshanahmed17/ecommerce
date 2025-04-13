import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Product, insertProductSchema } from "@shared/schema";
import AdminSidebar from "@/components/admin/sidebar";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  Loader2,
  ArrowUpDown,
  EyeIcon
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Extended product schema for form validation
const productFormSchema = insertProductSchema.extend({
  imageUrl: z.string().url("Please enter a valid URL"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function AdminInventory() {
  const { user, isLoading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  
  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [sortField, setSortField] = useState<"name" | "inventory" | "price">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<number | null>(null);

  // Get URL query params
  const queryParams = new URLSearchParams(search);
  const actionParam = queryParams.get("action");
  const idParam = queryParams.get("id");

  // Fetch products
  const { 
    data: products, 
    isLoading: isProductsLoading,
    isError,
    refetch
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Get current product for editing
  const currentProduct = currentProductId 
    ? products?.find(p => p.id === currentProductId) 
    : null;

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Product created",
        description: "The product has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<ProductFormValues> }) => {
      const res = await apiRequest("PUT", `/api/products/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setCurrentProductId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Product form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      category: "Electronics",
      inventory: 0,
      sku: "",
      featured: false,
    },
  });

  // Edit form
  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      category: "Electronics",
      inventory: 0,
      sku: "",
      featured: false,
    },
  });

  // Set edit form values when current product changes
  useEffect(() => {
    if (currentProduct) {
      editForm.reset({
        name: currentProduct.name,
        description: currentProduct.description,
        price: currentProduct.price,
        imageUrl: currentProduct.imageUrl,
        category: currentProduct.category,
        inventory: currentProduct.inventory,
        sku: currentProduct.sku,
        featured: currentProduct.featured,
      });
    }
  }, [currentProduct, editForm]);

  // Handle restock action from URL params
  useEffect(() => {
    if (actionParam === "restock" && idParam) {
      const productId = parseInt(idParam);
      if (!isNaN(productId)) {
        setCurrentProductId(productId);
        setIsEditDialogOpen(true);
        // Clear URL params after processing
        navigate("/admin/inventory");
      }
    }
  }, [actionParam, idParam, navigate]);

  // Handle form submission
  const onSubmit = (data: ProductFormValues) => {
    createProductMutation.mutate(data);
  };

  // Handle edit form submission
  const onEditSubmit = (data: ProductFormValues) => {
    if (currentProductId) {
      updateProductMutation.mutate({ id: currentProductId, data });
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search logic
  };

  // Filter and sort products
  const filteredProducts = products?.filter(product => {
    // Apply search filter
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply category filter
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    // Apply low stock filter
    const matchesLowStock = !showLowStock || product.inventory <= 10;
    
    return matchesSearch && matchesCategory && matchesLowStock;
  }) || [];

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const factor = sortOrder === "asc" ? 1 : -1;
    
    switch (sortField) {
      case "name":
        return a.name.localeCompare(b.name) * factor;
      case "inventory":
        return (a.inventory - b.inventory) * factor;
      case "price":
        return (a.price - b.price) * factor;
      default:
        return 0;
    }
  });

  // Toggle sort order
  const toggleSort = (field: "name" | "inventory" | "price") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // If not admin, redirect to home
  if (!authLoading && (!user || !user.isAdmin)) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600">Manage your product inventory, add new products, and update existing ones.</p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <form onSubmit={handleSearch} className="relative flex w-full md:w-1/3">
                  <Input
                    type="text"
                    placeholder="Search by name, description or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                  <Button type="submit" variant="ghost" size="sm" className="absolute right-0 top-0 h-full">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                
                <div className="flex items-center space-x-4 w-full md:w-auto">
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Fashion">Fashion</SelectItem>
                      <SelectItem value="Home & Kitchen">Home & Kitchen</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={showLowStock}
                      onCheckedChange={setShowLowStock}
                      id="low-stock"
                    />
                    <label htmlFor="low-stock" className="text-sm">Low Stock Only</label>
                  </div>
                  
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>
                          Fill in the details to add a new product to your inventory.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter product name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Enter product description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price ($)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="inventory"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Inventory</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number"
                                      placeholder="0"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Electronics">Electronics</SelectItem>
                                      <SelectItem value="Fashion">Fashion</SelectItem>
                                      <SelectItem value="Home & Kitchen">Home & Kitchen</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="sku"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>SKU</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter SKU" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Image URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter image URL" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Enter a URL for the product image.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
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
                                  <FormLabel>
                                    Featured Product
                                  </FormLabel>
                                  <FormDescription>
                                    Featured products appear on the homepage.
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button 
                              type="submit" 
                              disabled={createProductMutation.isPending}
                            >
                              {createProductMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                "Create Product"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Table */}
          <Card>
            <CardContent className="p-0">
              {isProductsLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : isError ? (
                <div className="p-6 text-center">
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Failed to load products</h3>
                  <p className="text-gray-500 mb-4">There was an error loading your products.</p>
                  <Button onClick={() => refetch()}>Try Again</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">ID</TableHead>
                        <TableHead className="w-[300px]">
                          <div className="flex items-center cursor-pointer" onClick={() => toggleSort("name")}>
                            Product
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>
                          <div className="flex items-center cursor-pointer" onClick={() => toggleSort("price")}>
                            Price
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center cursor-pointer" onClick={() => toggleSort("inventory")}>
                            Stock
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6">
                            <p className="text-gray-500">No products found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="h-10 w-10 rounded object-cover"
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="font-medium truncate max-w-[200px]">{product.name}</div>
                                  {product.featured && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell>${product.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={
                                product.inventory <= 5 
                                  ? "text-red-600 font-medium" 
                                  : product.inventory <= 10 
                                    ? "text-orange-600 font-medium" 
                                    : "text-green-600"
                              }>
                                {product.inventory}
                              </span>
                            </TableCell>
                            <TableCell>
                              {product.inventory > 0 ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  In Stock
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  Out of Stock
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setCurrentProductId(product.id);
                                  navigate(`/product/${product.id}`);
                                }}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setCurrentProductId(product.id);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setCurrentProductId(product.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Product Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update the product details.
                </DialogDescription>
              </DialogHeader>
              
              {currentProduct && (
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter product name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter product description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="inventory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inventory</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Electronics">Electronics</SelectItem>
                                <SelectItem value="Fashion">Fashion</SelectItem>
                                <SelectItem value="Home & Kitchen">Home & Kitchen</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SKU</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter SKU" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={editForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter image URL" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter a URL for the product image.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
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
                            <FormLabel>
                              Featured Product
                            </FormLabel>
                            <FormDescription>
                              Featured products appear on the homepage.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={updateProductMutation.isPending}
                      >
                        {updateProductMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Product"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this product? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => currentProductId && deleteProductMutation.mutate(currentProductId)}
                  disabled={deleteProductMutation.isPending}
                >
                  {deleteProductMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
