import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function Footer() {
  const { theme } = useTheme();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for newsletter subscription could be added here
  };

  return (
    <footer className="bg-background border-t border-border transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 font-heading text-foreground">SIZ COSMETICOS</h3>
            <p className="text-muted-foreground mb-4">Cosméticos premium para suas necessidades únicas de beleza. Descubra os melhores produtos para sua rotina de skincare, maquiagem e cuidados com o cabelo.</p>
            <div className="bg-muted p-3 rounded-md border border-border text-sm text-muted-foreground mb-4">
              <p><strong>Compras sem complicação:</strong> Navegue, adicione ao carrinho e só faça login na hora de finalizar a compra.</p>
            </div>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div className="mt-8 sm:mt-0">
            <h3 className="text-lg font-bold mb-4 font-heading text-foreground">Comprar</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/category/skincare">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Skincare</span>
                </Link>
              </li>
              <li>
                <Link href="/category/makeup">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Maquiagem</span>
                </Link>
              </li>
              <li>
                <Link href="/category/fragrance">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Fragrâncias</span>
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Novidades</span>
                </Link>
              </li>
              <li>
                <Link href="/best-sellers">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Mais Vendidos</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-8 lg:mt-0">
            <h3 className="text-lg font-bold mb-4 font-heading text-foreground">Informações</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Sobre Nós</span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Contato</span>
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Envio & Devoluções</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Política de Privacidade</span>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Termos & Condições</span>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">FAQ</span>
                </Link>
              </li>
              <li>
                <Link href="/track-order">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Rastrear Pedido</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-8 lg:mt-0">
            <h3 className="text-lg font-bold mb-4 font-heading text-foreground">Newsletter</h3>
            <p className="text-muted-foreground mb-4">Inscreva-se para receber atualizações, acesso a ofertas exclusivas e mais.</p>
            <form className="mb-4" onSubmit={handleSubscribe}>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="Seu endereço de email"
                  className="flex-1 rounded-r-none sm:rounded-r-none bg-background"
                  required
                />
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-l-none sm:rounded-l-none transition-colors"
                >
                  Inscrever
                </Button>
              </div>
            </form>
            <p className="text-muted-foreground text-sm">Ao se inscrever, você concorda com nossa Política de Privacidade e consente em receber atualizações de nossa empresa.</p>
          </div>
        </div>

        <div className="border-t border-border mt-8 md:mt-12 pt-6 md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground mb-4 md:mb-0">&copy; {new Date().getFullYear()} SIZ COSMETICOS. Todos os direitos reservados.</p>
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
