import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Package, 
  CreditCard, 
  Truck, 
  RefreshCw, 
  HelpCircle, 
  MessageCircle,
  Search,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would search the knowledge base
    console.log(`Searching for: ${searchQuery}`);
  };
  
  const helpCategories = [
    {
      title: "Orders",
      icon: Package,
      description: "Track, cancel, or return orders",
      links: [
        { title: "Track my order", url: "/track-order" },
        { title: "Return an item", url: "/shipping" },
        { title: "Cancel my order", url: "/contact" }
      ]
    },
    {
      title: "Payments",
      icon: CreditCard,
      description: "Payment methods, gift cards, refunds",
      links: [
        { title: "Payment methods", url: "/faq" },
        { title: "Redeem a gift card", url: "/contact" },
        { title: "Refund status", url: "/contact" }
      ]
    },
    {
      title: "Shipping",
      icon: Truck,
      description: "Shipping methods, delivery times",
      links: [
        { title: "Shipping information", url: "/shipping" },
        { title: "International shipping", url: "/shipping" },
        { title: "Shipping delays", url: "/contact" }
      ]
    },
    {
      title: "Returns & Refunds",
      icon: RefreshCw,
      description: "Return policy, exchange information",
      links: [
        { title: "Return policy", url: "/shipping" },
        { title: "Start a return", url: "/my-orders" },
        { title: "Exchange an item", url: "/contact" }
      ]
    },
    {
      title: "Product Support",
      icon: HelpCircle,
      description: "Product information, warranties",
      links: [
        { title: "Size guide", url: "/size-guide" },
        { title: "Product guides", url: "/faq" },
        { title: "Warranty information", url: "/contact" }
      ]
    },
    {
      title: "Contact Us",
      icon: MessageCircle,
      description: "Get in touch with our support team",
      links: [
        { title: "Contact form", url: "/contact" },
        { title: "Chat with us", url: "/contact" },
        { title: "Email support", url: "/contact" }
      ]
    }
  ];
  
  const popularArticles = [
    { title: "How to track your order", url: "/track-order" },
    { title: "What is your return policy?", url: "/shipping" },
    { title: "How to change or cancel my order", url: "/faq" },
    { title: "Do you ship internationally?", url: "/shipping" },
    { title: "How do I find my size?", url: "/size-guide" }
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-3xl mx-auto mb-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Help Center</h1>
        <p className="text-gray-600 mb-8">
          Find answers to common questions or contact our support team for assistance.
        </p>
        
        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
          <Input
            type="text"
            placeholder="Search for help..."
            className="pl-10 py-6 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Button type="submit" className="absolute right-1 top-1/2 transform -translate-y-1/2">
            Search
          </Button>
        </form>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {helpCategories.map((category, index) => (
          <Card key={index} className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>{category.title}</CardTitle>
              </div>
              <CardDescription className="pt-2">{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {category.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link href={link.url} className="text-primary hover:underline flex items-center">
                      <span>{link.title}</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Popular Articles</h2>
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {popularArticles.map((article, index) => (
                <li key={index} className="py-3 px-4 hover:bg-gray-50">
                  <Link href={article.url} className="text-primary hover:underline flex justify-between items-center">
                    <span>{article.title}</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <div className="max-w-3xl mx-auto mt-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Can't find what you're looking for?</h2>
        <p className="text-gray-600 mb-4">
          Our customer service team is available to help you with any questions or concerns.
        </p>
        <Link href="/contact">
          <Button size="lg">Contact Support</Button>
        </Link>
      </div>
    </div>
  );
} 