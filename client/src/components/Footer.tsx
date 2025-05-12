import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for newsletter subscription could be added here
  };

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 font-heading">BeautyEssence</h3>
            <p className="text-gray-600 mb-4">Premium cosmetics for your unique beauty needs. Discover the best products for your skincare, makeup, and haircare routine.</p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 font-heading">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/category/skincare">
                  <a className="text-gray-600 hover:text-primary transition-colors">Skincare</a>
                </Link>
              </li>
              <li>
                <Link href="/category/makeup">
                  <a className="text-gray-600 hover:text-primary transition-colors">Makeup</a>
                </Link>
              </li>
              <li>
                <Link href="/category/haircare">
                  <a className="text-gray-600 hover:text-primary transition-colors">Haircare</a>
                </Link>
              </li>
              <li>
                <Link href="/category/fragrance">
                  <a className="text-gray-600 hover:text-primary transition-colors">Fragrance</a>
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals">
                  <a className="text-gray-600 hover:text-primary transition-colors">New Arrivals</a>
                </Link>
              </li>
              <li>
                <Link href="/best-sellers">
                  <a className="text-gray-600 hover:text-primary transition-colors">Best Sellers</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 font-heading">Information</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <a className="text-gray-600 hover:text-primary transition-colors">About Us</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-gray-600 hover:text-primary transition-colors">Contact Us</a>
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns">
                  <a className="text-gray-600 hover:text-primary transition-colors">Shipping & Returns</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <a className="text-gray-600 hover:text-primary transition-colors">Privacy Policy</a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="text-gray-600 hover:text-primary transition-colors">Terms & Conditions</a>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <a className="text-gray-600 hover:text-primary transition-colors">FAQ</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 font-heading">Newsletter</h3>
            <p className="text-gray-600 mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
            <form className="mb-4" onSubmit={handleSubscribe}>
              <div className="flex">
                <Input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 rounded-r-none"
                  required
                />
                <Button
                  type="submit"
                  className="bg-primary hover:bg-pink-600 text-white rounded-l-none transition-colors"
                >
                  Subscribe
                </Button>
              </div>
            </form>
            <p className="text-gray-500 text-sm">By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.</p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 mb-4 md:mb-0">&copy; {new Date().getFullYear()} BeautyEssence. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <svg className="h-8" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="40" rx="4" fill="#1A1F71"/>
                <path d="M23.5 24.5H36.5V15.5H23.5V24.5Z" fill="#FFFFFF"/>
                <path d="M24.5 20C24.5 17.5 26.5 15.5 29 15.5C31.5 15.5 33.5 17.5 33.5 20C33.5 22.5 31.5 24.5 29 24.5C26.5 24.5 24.5 22.5 24.5 20Z" fill="#F7B600"/>
              </svg>
              <svg className="h-8" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="40" rx="4" fill="#000000"/>
                <path d="M20 28H24L25 25H35L36 28H40L35 12H25L20 28ZM26 21L28 16L30 21H26Z" fill="#FF5F00"/>
                <circle cx="30" cy="20" r="5" fill="#EB001B"/>
                <circle cx="40" cy="20" r="5" fill="#F79E1B"/>
              </svg>
              <svg className="h-8" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="40" rx="4" fill="#003087"/>
                <path d="M20 15H25C28 15 29 16.5 28.5 19C28 21.5 26 23 23 23H21L20 28H16L20 15ZM22 19.5H24C25 19.5 25.5 19 25.7 18C25.9 17 25.5 16.5 24.5 16.5H22.5L21.5 19.5H22Z" fill="#FFFFFF"/>
                <path d="M29 23H33L33.5 20.5H37.5L38 23H42L38 15H32L29 23ZM34 19L35 17L35.5 19H34Z" fill="#FFFFFF"/>
                <path d="M43 15L39 23H43L46 15H43Z" fill="#FFFFFF"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
