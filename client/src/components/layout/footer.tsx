import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">ShopElite</h3>
            <p className="text-gray-400">Premium shopping experience with quality products and exceptional service.</p>
            <div className="mt-4 flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="text-gray-400 hover:text-white">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/shop?sort=new" className="text-gray-400 hover:text-white">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/shop?featured=true" className="text-gray-400 hover:text-white">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link href="/shop?discount=true" className="text-gray-400 hover:text-white">
                  Discounted
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact Us</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-white">FAQs</Link></li>
              <li><Link href="/shipping" className="text-gray-400 hover:text-white">Shipping & Returns</Link></li>
              <li><Link href="/track-order" className="text-gray-400 hover:text-white">Track Order</Link></li>
              <li><Link href="/help-center" className="text-gray-400 hover:text-white">Help Center</Link></li>
              <li><Link href="/size-guide" className="text-gray-400 hover:text-white">Size Guide</Link></li>
              <li><Link href="/warranty" className="text-gray-400 hover:text-white">Warranty Information</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">About</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-400 hover:text-white">Our Story</Link></li>
              <li><Link href="/about/team" className="text-gray-400 hover:text-white">Our Team</Link></li>
              <li><Link href="/about/sustainability" className="text-gray-400 hover:text-white">Sustainability</Link></li>
              <li><Link href="/about/investors" className="text-gray-400 hover:text-white">Investors</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link></li>
              <li><Link href="/careers" className="text-gray-400 hover:text-white">Careers</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} ShopElite. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}