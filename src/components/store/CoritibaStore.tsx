"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Search,
  User,
  Menu,
  X,
  Heart,
  ChevronRight,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Play,
  ArrowRight,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
} from "lucide-react";

// ==================== TYPES ====================
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  isNew?: boolean;
  rating: number;
  reviews: number;
}

interface Category {
  id: string;
  name: string;
  image: string;
  count: number;
}

// ==================== DATA ====================
const products: Product[] = [
  {
    id: 1,
    name: "Camisa Oficial I 2024",
    category: "Camisas",
    price: 299.90,
    originalPrice: 349.90,
    image: "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=600&h=800&fit=crop",
    badge: "LANCAMENTO",
    isNew: true,
    rating: 4.9,
    reviews: 128,
  },
  {
    id: 2,
    name: "Camisa Oficial II 2024",
    category: "Camisas",
    price: 299.90,
    image: "https://images.unsplash.com/photo-1551854838-212c50b4c184?w=600&h=800&fit=crop",
    isNew: true,
    rating: 4.8,
    reviews: 95,
  },
  {
    id: 3,
    name: "Jaqueta Corta-Vento Premium",
    category: "Agasalhos",
    price: 399.90,
    originalPrice: 499.90,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=800&fit=crop",
    badge: "-20%",
    rating: 4.7,
    reviews: 67,
  },
  {
    id: 4,
    name: "Bone Oficial Estruturado",
    category: "Acessorios",
    price: 129.90,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&h=800&fit=crop",
    rating: 4.6,
    reviews: 234,
  },
  {
    id: 5,
    name: "Shorts de Treino Performance",
    category: "Treino",
    price: 149.90,
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=800&fit=crop",
    rating: 4.5,
    reviews: 89,
  },
  {
    id: 6,
    name: "Mochila Oficial Premium",
    category: "Acessorios",
    price: 249.90,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=800&fit=crop",
    badge: "EXCLUSIVO",
    rating: 4.8,
    reviews: 156,
  },
  {
    id: 7,
    name: "Polo Casual Verde",
    category: "Casual",
    price: 199.90,
    image: "https://images.unsplash.com/photo-1625910513413-5fc45f5df2f7?w=600&h=800&fit=crop",
    rating: 4.4,
    reviews: 78,
  },
  {
    id: 8,
    name: "Cachecol Oficial Centenario",
    category: "Acessorios",
    price: 89.90,
    image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&h=800&fit=crop",
    isNew: true,
    rating: 4.9,
    reviews: 312,
  },
];

const categories: Category[] = [
  {
    id: "camisas",
    name: "Camisas Oficiais",
    image: "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=600&h=400&fit=crop",
    count: 24,
  },
  {
    id: "agasalhos",
    name: "Agasalhos",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=400&fit=crop",
    count: 18,
  },
  {
    id: "acessorios",
    name: "Acessorios",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&h=400&fit=crop",
    count: 45,
  },
  {
    id: "treino",
    name: "Linha Treino",
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=400&fit=crop",
    count: 32,
  },
];

// ==================== COMPONENTS ====================

// Header Component
function Header({ cartCount }: { cartCount: number }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Lancamentos", href: "#lancamentos" },
    { name: "Camisas", href: "#camisas" },
    { name: "Agasalhos", href: "#agasalhos" },
    { name: "Acessorios", href: "#acessorios" },
    { name: "Treino", href: "#treino" },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-coritiba-green text-white text-xs py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <p className="hidden sm:block">Frete gratis acima de R$ 299 | Parcele em ate 10x</p>
          <p className="sm:hidden text-center w-full">Frete gratis acima de R$ 299</p>
          <div className="hidden sm:flex items-center gap-4">
            <a href="#" className="hover:underline">Central de Ajuda</a>
            <a href="#" className="hover:underline">Rastrear Pedido</a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <motion.header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-sm"
            : "bg-background"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-foreground hover:text-coritiba-green transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <a href="#" className="flex items-center gap-2">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-coritiba-green flex items-center justify-center">
                <span className="text-white font-bold text-lg lg:text-xl">C</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg lg:text-xl tracking-tight text-foreground">CORITIBA</span>
                <span className="block text-[10px] lg:text-xs text-muted-foreground tracking-[0.2em] -mt-1">STORE</span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-foreground hover:text-coritiba-green transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-coritiba-green transition-all group-hover:w-full" />
                </a>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-foreground hover:text-coritiba-green transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <button className="hidden sm:block p-2 text-foreground hover:text-coritiba-green transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="hidden sm:block p-2 text-foreground hover:text-coritiba-green transition-colors">
                <User className="w-5 h-5" />
              </button>
              <button className="p-2 text-foreground hover:text-coritiba-green transition-colors relative">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-coritiba-green text-white text-xs rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-background z-50 lg:hidden"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="font-bold text-lg text-foreground">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-foreground hover:text-coritiba-green"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="p-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="block py-3 text-lg font-medium text-foreground hover:text-coritiba-green border-b border-border"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50"
              onClick={() => setIsSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-0 left-0 right-0 bg-background z-50 p-6"
            >
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="O que voce esta procurando?"
                    className="w-full pl-12 pr-12 py-4 text-lg bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-coritiba-green text-foreground"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Populares:</span>
                  {["Camisa 2024", "Agasalho", "Bone", "Shorts"].map((term) => (
                    <button
                      key={term}
                      className="px-3 py-1 text-sm bg-muted rounded-full text-foreground hover:bg-coritiba-green hover:text-white transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Hero Section
function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative h-[90vh] lg:h-screen overflow-hidden bg-zinc-950">
      {/* Background */}
      <motion.div style={{ y }} className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&h=1080&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative h-full max-w-7xl mx-auto px-4 flex items-center"
      >
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 bg-coritiba-green text-white text-sm font-medium rounded-full mb-6">
              Nova Colecao 2024
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6"
          >
            Vista a sua
            <br />
            <span className="text-coritiba-green">paixao</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg lg:text-xl text-zinc-300 mb-8 max-w-lg"
          >
            Mais de 100 anos de historia. Uma torcida apaixonada. 
            Produtos oficiais que carregam o orgulho de ser Coxa-Branca.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#lancamentos"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-coritiba-green text-white font-medium rounded-lg hover:bg-coritiba-green-dark transition-colors"
            >
              Ver Lancamentos
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#colecao"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <Play className="w-5 h-5" />
              Assista ao Video
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// Categories Section
function CategoriesSection() {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Explore por Categoria
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Encontre o produto perfeito para demonstrar seu amor pelo Coxa
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <motion.a
              key={category.id}
              href={`#${category.id}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden"
            >
              <img
                src={category.image}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                <h3 className="text-white font-bold text-lg lg:text-xl mb-1">
                  {category.name}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {category.count} produtos
                </p>
              </div>
              <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

// Product Card
function ProductCard({ product, index }: { product: Product; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-4">
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.badge && (
            <span className="px-3 py-1 bg-coritiba-green text-white text-xs font-bold rounded-full">
              {product.badge}
            </span>
          )}
          {product.isNew && !product.badge && (
            <span className="px-3 py-1 bg-zinc-900 text-white text-xs font-bold rounded-full">
              NOVO
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isWishlisted
              ? "bg-red-500 text-white"
              : "bg-white/80 text-zinc-700 opacity-0 group-hover:opacity-100"
          }`}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Quick Add */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
          className="absolute bottom-4 left-4 right-4"
        >
          <button className="w-full py-3 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-coritiba-green transition-colors">
            Adicionar ao Carrinho
          </button>
        </motion.div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
        <h3 className="font-medium text-foreground mb-2 group-hover:text-coritiba-green transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm text-foreground">{product.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({product.reviews})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              R$ {product.originalPrice.toFixed(2).replace(".", ",")}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Products Section
function ProductsSection() {
  const [activeFilter, setActiveFilter] = useState("todos");

  const filters = [
    { id: "todos", name: "Todos" },
    { id: "camisas", name: "Camisas" },
    { id: "agasalhos", name: "Agasalhos" },
    { id: "acessorios", name: "Acessorios" },
    { id: "treino", name: "Treino" },
  ];

  const filteredProducts =
    activeFilter === "todos"
      ? products
      : products.filter(
          (p) => p.category.toLowerCase() === activeFilter.toLowerCase()
        );

  return (
    <section id="lancamentos" className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12"
        >
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Os itens mais desejados pelos torcedores. Qualidade oficial com o orgulho verde e branco.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  activeFilter === filter.id
                    ? "bg-coritiba-green text-white"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a
            href="#"
            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-coritiba-green text-coritiba-green font-medium rounded-lg hover:bg-coritiba-green hover:text-white transition-colors"
          >
            Ver Todos os Produtos
            <ChevronRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// Featured Banner
function FeaturedBanner() {
  return (
    <section className="py-16 lg:py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <span className="inline-block px-4 py-2 bg-coritiba-green/20 text-coritiba-green text-sm font-medium rounded-full mb-6">
              Edicao Limitada
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Camisa Centenario
              <br />
              <span className="text-coritiba-green">1909 - 2024</span>
            </h2>
            <p className="text-lg text-zinc-400 mb-8">
              Uma homenagem aos 115 anos de historia. Design exclusivo com detalhes 
              que celebram as maiores conquistas do Coxa. Tiragem limitada de 1909 pecas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-coritiba-green text-white font-medium rounded-lg hover:bg-coritiba-green-dark transition-colors"
              >
                Garantir a Minha
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
            <div className="flex items-center gap-8 mt-8 pt-8 border-t border-zinc-800">
              <div>
                <p className="text-3xl font-bold text-white">1909</p>
                <p className="text-sm text-zinc-500">Pecas disponiveis</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">115</p>
                <p className="text-sm text-zinc-500">Anos de historia</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-coritiba-green">3x</p>
                <p className="text-sm text-zinc-500">Campeao Brasileiro</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2 relative"
          >
            <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-coritiba-green/20 to-zinc-900">
              <img
                src="https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=800&h=800&fit=crop"
                alt="Camisa Centenario"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-coritiba-green rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">R$ 499</p>
                <p className="text-xs text-white/70">ou 10x R$ 49,90</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Trust Badges
function TrustBadges() {
  const badges = [
    {
      icon: Truck,
      title: "Frete Gratis",
      description: "Para compras acima de R$ 299",
    },
    {
      icon: Shield,
      title: "Compra Segura",
      description: "Seus dados protegidos",
    },
    {
      icon: RotateCcw,
      title: "Troca Facil",
      description: "Ate 30 dias para trocar",
    },
    {
      icon: Star,
      title: "Produto Oficial",
      description: "Licenciado pelo clube",
    },
  ];

  return (
    <section className="py-12 lg:py-16 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 bg-coritiba-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <badge.icon className="w-7 h-7 text-coritiba-green" />
              </div>
              <h3 className="font-bold text-foreground mb-1">{badge.title}</h3>
              <p className="text-sm text-muted-foreground">{badge.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Newsletter
function Newsletter() {
  const [email, setEmail] = useState("");

  return (
    <section className="py-16 lg:py-24 bg-coritiba-green">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Fique por Dentro
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Cadastre-se e receba em primeira mao lancamentos exclusivos, 
              promocoes e novidades do Coxa.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                className="flex-1 px-6 py-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-white text-coritiba-green font-bold rounded-lg hover:bg-zinc-100 transition-colors"
              >
                Cadastrar
              </button>
            </form>
            <p className="text-sm text-white/60 mt-4">
              Ao se cadastrar, voce concorda com nossa Politica de Privacidade.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  const links = {
    institucional: [
      { name: "Sobre Nos", href: "#" },
      { name: "Nossas Lojas", href: "#" },
      { name: "Trabalhe Conosco", href: "#" },
      { name: "Sustentabilidade", href: "#" },
    ],
    ajuda: [
      { name: "Central de Ajuda", href: "#" },
      { name: "Como Comprar", href: "#" },
      { name: "Formas de Pagamento", href: "#" },
      { name: "Trocas e Devolucoes", href: "#" },
    ],
    conta: [
      { name: "Minha Conta", href: "#" },
      { name: "Meus Pedidos", href: "#" },
      { name: "Lista de Desejos", href: "#" },
      { name: "Rastrear Pedido", href: "#" },
    ],
  };

  return (
    <footer className="bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-coritiba-green flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <div>
                <span className="font-bold text-xl">CORITIBA</span>
                <span className="block text-xs text-zinc-400 tracking-[0.2em]">STORE</span>
              </div>
            </div>
            <p className="text-zinc-400 mb-6 max-w-sm">
              A loja oficial do Coritiba Foot Ball Club. Produtos licenciados 
              com a qualidade que o torcedor merece.
            </p>
            <div className="flex gap-4">
              {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-coritiba-green transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold mb-4">Institucional</h4>
            <ul className="space-y-3">
              {links.institucional.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-zinc-400 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Ajuda</h4>
            <ul className="space-y-3">
              {links.ajuda.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-zinc-400 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Minha Conta</h4>
            <ul className="space-y-3">
              {links.conta.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-zinc-400 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-zinc-400">
                <MapPin className="w-5 h-5 text-coritiba-green" />
                <span>Curitiba, PR</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Phone className="w-5 h-5 text-coritiba-green" />
                <span>(41) 3000-0000</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Mail className="w-5 h-5 text-coritiba-green" />
                <span>contato@coritibastore.com.br</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-zinc-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <p className="text-zinc-500 text-sm">
            2024 Coritiba Store. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="text-zinc-500 hover:text-white">Termos de Uso</a>
            <a href="#" className="text-zinc-500 hover:text-white">Politica de Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ==================== MAIN COMPONENT ====================
export function CoritibaStore() {
  const [cartCount, setCartCount] = useState(2);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header cartCount={cartCount} />
      <main>
        <HeroSection />
        <CategoriesSection />
        <ProductsSection />
        <FeaturedBanner />
        <TrustBadges />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
