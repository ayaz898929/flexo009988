import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate,
  useNavigate,
  useParams
} from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  X, 
  Facebook, 
  Instagram, 
  Twitter, 
  ArrowRight, 
  ArrowLeft,
  Star, 
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  Camera,
  Eye,
  Sparkles,
  Send,
  MessageSquare,
  Bot,
  MoreVertical,
  Home,
  LayoutGrid,
  Shirt,
  Truck,
  CreditCard,
  RefreshCcw,
  Info,
  PhoneCall,
  HelpCircle,
  ChevronDown,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import { generateProductDescription, getChatResponse, getShoppingRecommendations } from './services/geminiService';

// --- Types ---
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  rating: number;
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  product: string;
  total: number;
  paymentMethod: string;
  trxID: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  date: string;
}

interface Banner {
  id: string;
  url: string;
  type: 'image' | 'video';
}

interface WebsiteContent {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  footerDescription: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  banners: Banner[];
}

const DEFAULT_CONTENT: WebsiteContent = {
  heroTitle: "Elevate Your Everyday Style.",
  heroSubtitle: "New Collection 2026",
  heroDescription: "Discover our curated collection of premium essentials designed for modern living. Quality you can feel, style you can trust.",
  footerDescription: "Your one-stop destination for premium lifestyle products. Quality and style delivered to your doorstep.",
  contactPhone: "+880 1627 000110",
  contactEmail: "flexobrand1@gmail.com",
  contactAddress: "Khulna, Bangladesh",
  banners: [
    { id: '1', url: "https://picsum.photos/seed/flexo-banner-1/1920/600", type: 'image' }
  ]
};

// --- Mock Data ---
const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    price: 12000,
    category: "Electronics",
    image: "https://picsum.photos/seed/headphones/600/600",
    rating: 4.8,
    description: "High-quality sound with noise cancellation technology."
  },
  {
    id: 2,
    name: "Minimalist Leather Watch",
    price: 4500,
    category: "Accessories",
    image: "https://picsum.photos/seed/watch/600/600",
    rating: 4.5,
    description: "Elegant leather strap with a scratch-resistant glass face."
  },
  {
    id: 3,
    name: "Smart Fitness Tracker",
    price: 3500,
    category: "Electronics",
    image: "https://picsum.photos/seed/tracker/600/600",
    rating: 4.2,
    description: "Track your steps, heart rate, and sleep patterns easily."
  },
  {
    id: 4,
    name: "Ergonomic Office Chair",
    price: 18000,
    category: "Furniture",
    image: "https://picsum.photos/seed/chair/600/600",
    rating: 4.9,
    description: "Maximum comfort for long working hours."
  },
  {
    id: 5,
    name: "Portable Bluetooth Speaker",
    price: 2800,
    category: "Electronics",
    image: "https://picsum.photos/seed/speaker/600/600",
    rating: 4.6,
    description: "Compact design with powerful bass and long battery life."
  },
  {
    id: 6,
    name: "Designer Sunglasses",
    price: 1500,
    category: "Accessories",
    image: "https://picsum.photos/seed/sunglasses/600/600",
    rating: 4.4,
    description: "UV protection with a stylish modern frame."
  }
];

const INITIAL_CATEGORIES = ["All", "Electronics", "Accessories", "Furniture"];

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedFont, setSelectedFont] = useState("font-inter");
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent>(DEFAULT_CONTENT);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);

  // Shared Cart & Order States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [directOrderProduct, setDirectOrderProduct] = useState<Product | null>(null);
  const [isDirectOrderOpen, setIsDirectOrderOpen] = useState(false);
  const [directOrderStep, setDirectOrderStep] = useState<'shipping' | 'payment' | 'success'>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket' | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerDistrict, setCustomerDistrict] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState(100);
  const [isFetchingCharge, setIsFetchingCharge] = useState(false);
  const [trxID, setTrxID] = useState("");

  // Load cart from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('soloshop_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem('soloshop_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleOrderNow = (product: Product) => {
    setDirectOrderProduct(product);
    setDirectOrderStep('shipping');
    setIsDirectOrderOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const saveOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Date.now()}`,
      date: new Date().toLocaleString(),
      status: 'pending'
    };
    
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
    } catch (e) {
      console.error("Failed to save order", e);
    }
  };

  const confirmDirectOrder = () => {
    if (directOrderProduct) {
      saveOrder({
        customerName,
        phone: customerPhone,
        address: `${customerAddress}, ${customerDistrict}`,
        product: directOrderProduct.name,
        total: directOrderProduct.price + deliveryCharge,
        paymentMethod: paymentMethod || 'Unknown',
        trxID: trxID
      });
      setDirectOrderStep('success');
    }
  };

  const fetchDeliveryCharge = async (district: string) => {
    if (!district) return;
    setIsFetchingCharge(true);
    try {
      const response = await fetch('/api/delivery-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district })
      });
      const data = await response.json();
      if (data.status === 200) {
        setDeliveryCharge(data.delivery_charge);
      }
    } catch (error) {
      console.error("Failed to fetch delivery charge", error);
    } finally {
      setIsFetchingCharge(false);
    }
  };

  useEffect(() => {
    if (customerDistrict) {
      fetchDeliveryCharge(customerDistrict);
    }
  }, [customerDistrict]);

  const fetchData = async () => {
    try {
      const [prodRes, catRes, fontRes, contentRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/settings/font'),
        fetch('/api/settings/content')
      ]);

      const prods = await prodRes.json();
      const cats = await catRes.json();
      const font = await fontRes.json();
      const content = await contentRes.json();

      if (prods.length > 0) setProducts(prods);
      else {
        // Initial seed if DB is empty
        for (const p of PRODUCTS) {
          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
          });
        }
        const freshProds = await fetch('/api/products').then(r => r.json());
        setProducts(freshProds);
      }

      if (cats.length > 0) setCategories(cats);
      if (font) setSelectedFont(font);
      if (content) {
        setWebsiteContent({ ...DEFAULT_CONTENT, ...content });
      }
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateProducts = async (newProducts: Product[]) => {
    // This is handled by individual add/edit/delete in Admin now for efficiency
    // but we keep this for compatibility and state sync
    setProducts(newProducts);
  };

  const updateFont = async (font: string) => {
    setSelectedFont(font);
    await fetch('/api/settings/font', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(font)
    });
  };

  const updateContent = async (content: WebsiteContent) => {
    setWebsiteContent(content);
    await fetch('/api/settings/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content)
    });
  };

  const updateCategories = async (newCategories: string[]) => {
    // Handled by individual add/delete in Admin
    setCategories(newCategories);
  };

  return (
    <BrowserRouter>
      <div className={selectedFont}>
        <Routes>
          <Route path="/" element={
            <Shop 
              products={products} 
              content={websiteContent} 
              categories={categories} 
              cart={cart}
              setCart={setCart}
              isCartOpen={isCartOpen}
              setIsCartOpen={setIsCartOpen}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              updateQuantity={updateQuantity}
              onOrderNow={handleOrderNow}
              isDirectOrderOpen={isDirectOrderOpen}
              setIsDirectOrderOpen={setIsDirectOrderOpen}
              directOrderProduct={directOrderProduct}
              setDirectOrderProduct={setDirectOrderProduct}
              directOrderStep={directOrderStep}
              setDirectOrderStep={setDirectOrderStep}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              customerName={customerName}
              setCustomerName={setCustomerName}
              customerPhone={customerPhone}
              setCustomerPhone={setCustomerPhone}
              customerAddress={customerAddress}
              setCustomerAddress={setCustomerAddress}
              customerDistrict={customerDistrict}
              setCustomerDistrict={setCustomerDistrict}
              deliveryCharge={deliveryCharge}
              isFetchingCharge={isFetchingCharge}
              trxID={trxID}
              setTrxID={setTrxID}
              confirmDirectOrder={confirmDirectOrder}
              saveOrder={saveOrder}
            />
          } />
          <Route path="/product/:id" element={
            <ProductDetail 
              products={products} 
              onAddToCart={addToCart} 
              onOrderNow={handleOrderNow}
              cart={cart}
              setIsCartOpen={setIsCartOpen}
              isCartOpen={isCartOpen}
              removeFromCart={removeFromCart}
              updateQuantity={updateQuantity}
              isDirectOrderOpen={isDirectOrderOpen}
              setIsDirectOrderOpen={setIsDirectOrderOpen}
              directOrderProduct={directOrderProduct}
              setDirectOrderProduct={setDirectOrderProduct}
              directOrderStep={directOrderStep}
              setDirectOrderStep={setDirectOrderStep}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              customerName={customerName}
              setCustomerName={setCustomerName}
              customerPhone={customerPhone}
              setCustomerPhone={setCustomerPhone}
              customerAddress={customerAddress}
              setCustomerAddress={setCustomerAddress}
              customerDistrict={customerDistrict}
              setCustomerDistrict={setCustomerDistrict}
              deliveryCharge={deliveryCharge}
              isFetchingCharge={isFetchingCharge}
              trxID={trxID}
              setTrxID={setTrxID}
              confirmDirectOrder={confirmDirectOrder}
              saveOrder={saveOrder}
            />
          } />
          <Route path="/flexo-secret-access-99" element={
            <Admin 
              products={products} 
              onUpdateProducts={updateProducts} 
              currentFont={selectedFont} 
              onUpdateFont={updateFont} 
              content={websiteContent}
              onUpdateContent={updateContent}
              categories={categories}
              onUpdateCategories={updateCategories}
            />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// --- Constants ---
const DISTRICTS = [
  "Dhaka", "Chittagong", "Gazipur", "Narayanganj", "Sylhet", "Rajshahi", "Khulna", "Barisal", "Rangpur", "Mymensingh",
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogra", "Brahmanbaria", "Chandpur", "Chapainawabganj",
  "Chuadanga", "Comilla", "Cox's Bazar", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gopalganj", "Habiganj",
  "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachari", "Kishoreganj", "Kurigram", "Kushtia",
  "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj",
  "Naogaon", "Narail", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh",
  "Patuakhali", "Pirojpur", "Rajbari", "Rangamati", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Tangail", "Thakurgaon"
];

// --- Components ---
interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onAddToCart: (p: Product) => void;
  onOrderNow: (p: Product) => void;
}

function ProductCard({ product, onAddToCart, onOrderNow }: ProductCardProps) {
  const navigate = useNavigate();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white p-4 rounded-3xl border border-transparent hover:border-gold-light hover:shadow-xl transition-all cursor-pointer"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-50 mb-4">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[10px] text-gold-dark font-bold uppercase tracking-wider mb-1">{product.category}</p>
            <h3 className="font-bold text-lg leading-tight group-hover:text-gold-dark transition-colors">{product.name}</h3>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-zinc-900">৳{product.price.toLocaleString()}</p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-xs text-zinc-400 line-through">৳{product.originalPrice.toLocaleString()}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-zinc-400 text-xs">
          <Star size={12} className="text-gold" fill="currentColor" />
          <span>{product.rating} (120+ reviews)</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
          className="py-3 border border-gold text-gold font-bold rounded-xl hover:bg-gold-light transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
        >
          <Plus size={16} /> Add to Cart
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onOrderNow(product); }}
          className="py-3 bg-gold text-white font-bold rounded-xl hover:bg-gold-dark transition-all shadow-md shadow-gold/10 flex items-center justify-center gap-2 active:scale-95 text-sm"
        >
          <ShoppingBag size={16} /> Order Now
        </button>
      </div>
    </motion.div>
  );
}

function ProductDetail({ 
  products, 
  onAddToCart, 
  onOrderNow,
  cart,
  setIsCartOpen,
  isCartOpen,
  removeFromCart,
  updateQuantity,
  isDirectOrderOpen,
  setIsDirectOrderOpen,
  directOrderProduct,
  setDirectOrderProduct,
  directOrderStep,
  setDirectOrderStep,
  paymentMethod,
  setPaymentMethod,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerAddress,
  setCustomerAddress,
  customerDistrict,
  setCustomerDistrict,
  deliveryCharge,
  isFetchingCharge,
  trxID,
  setTrxID,
  confirmDirectOrder,
  saveOrder
}: { 
  products: Product[], 
  onAddToCart: (p: Product) => void, 
  onOrderNow: (p: Product) => void,
  cart: CartItem[],
  setIsCartOpen: (o: boolean) => void,
  isCartOpen: boolean,
  removeFromCart: (id: number) => void,
  updateQuantity: (id: number, d: number) => void,
  isDirectOrderOpen: boolean,
  setIsDirectOrderOpen: (o: boolean) => void,
  directOrderProduct: Product | null,
  setDirectOrderProduct: (p: Product | null) => void,
  directOrderStep: 'shipping' | 'payment' | 'success',
  setDirectOrderStep: (s: 'shipping' | 'payment' | 'success') => void,
  paymentMethod: 'bkash' | 'nagad' | 'rocket' | null,
  setPaymentMethod: (m: 'bkash' | 'nagad' | 'rocket' | null) => void,
  customerName: string,
  setCustomerName: (n: string) => void,
  customerPhone: string,
  setCustomerPhone: (p: string) => void,
  customerAddress: string,
  setCustomerAddress: (a: string) => void,
  customerDistrict: string,
  setCustomerDistrict: (d: string) => void,
  deliveryCharge: number,
  isFetchingCharge: boolean,
  trxID: string,
  setTrxID: (t: string) => void,
  confirmDirectOrder: () => void,
  saveOrder: (o: any) => void
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p.id.toString() === id);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-gold text-white rounded-full">Back to Shop</button>
      </div>
    );
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gold-light px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gold-dark">Product Details</h1>
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <ShoppingBag size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="aspect-square rounded-3xl overflow-hidden bg-white shadow-xl border border-gold-light/20"
        >
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Info Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center"
        >
          <p className="text-xs font-bold text-gold uppercase tracking-widest mb-2">{product.category}</p>
          <h2 className="text-4xl font-bold text-zinc-900 mb-4">{product.name}</h2>
          
          <div className="flex items-center gap-4 mb-8">
            <p className="text-3xl font-bold text-gold-dark">৳{product.price.toLocaleString()}</p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-xl text-zinc-400 line-through">৳{product.originalPrice.toLocaleString()}</p>
            )}
            <div className="ml-auto flex items-center gap-1 text-gold">
              <Star size={16} fill="currentColor" />
              <span className="font-bold">{product.rating}</span>
            </div>
          </div>

          <div className="prose prose-zinc mb-12">
            <p className="text-zinc-600 leading-relaxed">{product.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => onAddToCart(product)}
              className="py-4 border-2 border-gold text-gold font-bold rounded-2xl hover:bg-gold-light transition-all flex items-center justify-center gap-2 text-lg"
            >
              <Plus size={20} /> Add to Cart
            </button>
            <button 
              onClick={() => onOrderNow(product)}
              className="py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold-dark transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2 text-lg"
            >
              <ShoppingBag size={20} /> Order Now
            </button>
          </div>
        </motion.div>
      </main>

      {/* --- Direct Order Modal --- */}
      <AnimatePresence>
        {isDirectOrderOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDirectOrderOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[90vh] bg-white z-[210] shadow-2xl rounded-3xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gold-light flex justify-between items-center bg-zinc-50">
                <h2 className="text-xl font-bold text-zinc-900">অর্ডার কনফার্ম করুন</h2>
                <button onClick={() => setIsDirectOrderOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {directOrderStep === 'shipping' && (
                  <div className="space-y-6">
                    <div className="flex gap-4 p-4 bg-gold-light/20 rounded-2xl border border-gold-light/50">
                      <img src={directOrderProduct?.image} className="w-20 h-20 rounded-xl object-cover" />
                      <div>
                        <h4 className="font-bold">{directOrderProduct?.name}</h4>
                        <p className="text-gold-dark font-bold">৳{directOrderProduct?.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">আপনার নাম</label>
                        <input 
                          type="text" 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                          placeholder="John Doe" 
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">ফোন নাম্বার</label>
                        <input 
                          type="tel" 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                          placeholder="01XXXXXXXXX" 
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">জেলা</label>
                      <select 
                        className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none"
                        value={customerDistrict}
                        onChange={(e) => setCustomerDistrict(e.target.value)}
                      >
                        <option value="">সিলেক্ট করুন</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">পুরো ঠিকানা</label>
                      <textarea 
                        className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none h-24" 
                        placeholder="House, Road, Area"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                      ></textarea>
                    </div>
                    <button 
                      onClick={() => setDirectOrderStep('payment')}
                      disabled={!customerName || !customerPhone || !customerAddress || !customerDistrict || isFetchingCharge}
                      className="w-full py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isFetchingCharge ? 'Calculating Charge...' : 'Next: Payment'} <ChevronRight size={18} />
                    </button>
                  </div>
                )}

                {directOrderStep === 'payment' && (
                  <div className="space-y-6">
                    <div className="bg-gold-light/20 p-4 rounded-2xl border border-gold-light/50">
                      <p className="text-sm text-zinc-600 mb-2">Delivery Charge (Advance Payment Required)</p>
                      <p className="text-xl font-bold text-gold-dark">৳{deliveryCharge}</p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-zinc-800">Select Payment Method</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {['bkash', 'nagad', 'rocket'].map((method) => (
                          <button 
                            key={method}
                            onClick={() => setPaymentMethod(method as any)}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === method ? 'border-gold bg-gold-light/30' : 'border-zinc-100 bg-zinc-50 hover:border-gold-light'}`}
                          >
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-[10px] uppercase text-zinc-400">
                              {method}
                            </div>
                            <span className="text-xs font-bold capitalize">{method}</span>
                          </button>
                        ))}
                      </div>

                      {paymentMethod && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-zinc-900 text-white rounded-2xl space-y-3"
                        >
                          <p className="text-sm opacity-80">Send <span className="text-gold font-bold">৳{deliveryCharge}</span> to this Personal number:</p>
                          <div className="text-2xl font-bold tracking-wider text-gold">01627000110</div>
                          <p className="text-[10px] opacity-60 uppercase tracking-widest">No QR Code needed. Just send money.</p>
                        </motion.div>
                      )}

                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Transaction ID</label>
                        <input 
                          type="text" 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                          placeholder="Enter TrxID" 
                          value={trxID}
                          onChange={(e) => setTrxID(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setDirectOrderStep('shipping')}
                        className="flex-1 py-4 border border-gold text-gold font-bold rounded-2xl hover:bg-gold-light transition-all"
                      >
                        Back
                      </button>
                      <button 
                        onClick={confirmDirectOrder}
                        disabled={!paymentMethod || !trxID}
                        className="flex-[2] py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold-dark transition-all disabled:opacity-50"
                      >
                        Confirm Order
                      </button>
                    </div>
                  </div>
                )}

                {directOrderStep === 'success' && (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                      className="w-32 h-32 bg-gold text-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-gold/40"
                    >
                      <CheckCircle2 size={72} />
                    </motion.div>
                    <h3 className="text-3xl font-bold mb-4 text-zinc-900">আপনার অর্ডারটি কনফার্ম করা হয়েছে</h3>
                    <p className="text-zinc-500 mb-10 max-w-xs mx-auto">ধন্যবাদ! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
                    <button 
                      onClick={() => setIsDirectOrderOpen(false)}
                      className="px-12 py-4 bg-gold text-white font-bold rounded-full w-full shadow-lg shadow-gold/20"
                    >
                      Continue Shopping
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Cart Sidebar --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gold-light flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gold-dark">
                  <ShoppingBag size={20} /> Your Cart
                </h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-gold-light rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-gold-light rounded-full flex items-center justify-center mb-6 text-gold">
                      <ShoppingBag size={32} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Your cart is empty</h3>
                    <p className="text-zinc-500 mb-8">Looks like you haven't added anything yet.</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="px-8 py-3 bg-gold text-white font-bold rounded-full shadow-lg shadow-gold/20"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-50 shrink-0 border border-gold-light/30">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <h4 className="font-bold text-sm">{item.name}</h4>
                            <button onClick={() => removeFromCart(item.id)} className="text-zinc-300 hover:text-red-500"><Trash2 size={16} /></button>
                          </div>
                          <p className="text-gold-dark text-xs font-bold mb-3">৳{item.price.toLocaleString()}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-gold-light rounded-lg">
                              <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gold-light"><Minus size={14} /></button>
                              <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gold-light"><Plus size={14} /></button>
                            </div>
                            <p className="text-sm font-bold ml-auto">৳{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gold-light bg-gold-light/10">
                  <div className="flex justify-between mb-2 text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-gold-dark">৳{cartTotal.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => { setIsCartOpen(false); navigate('/'); /* In a real app, this would go to checkout */ }}
                    className="w-full py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/20"
                  >
                    Proceed to Checkout <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Shop({ 
  products, 
  content, 
  categories, 
  cart,
  setCart,
  isCartOpen,
  setIsCartOpen,
  addToCart,
  removeFromCart,
  updateQuantity,
  onOrderNow,
  isDirectOrderOpen,
  setIsDirectOrderOpen,
  directOrderProduct,
  setDirectOrderProduct,
  directOrderStep,
  setDirectOrderStep,
  paymentMethod,
  setPaymentMethod,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerAddress,
  setCustomerAddress,
  customerDistrict,
  setCustomerDistrict,
  deliveryCharge,
  isFetchingCharge,
  trxID,
  setTrxID,
  confirmDirectOrder,
  saveOrder
}: { 
  products: Product[], 
  content: WebsiteContent, 
  categories: string[], 
  cart: CartItem[],
  setCart: (c: CartItem[]) => void,
  isCartOpen: boolean,
  setIsCartOpen: (o: boolean) => void,
  addToCart: (p: Product) => void,
  removeFromCart: (id: number) => void,
  updateQuantity: (id: number, d: number) => void,
  onOrderNow: (p: Product) => void,
  isDirectOrderOpen: boolean,
  setIsDirectOrderOpen: (o: boolean) => void,
  directOrderProduct: Product | null,
  setDirectOrderProduct: (p: Product | null) => void,
  directOrderStep: 'shipping' | 'payment' | 'success',
  setDirectOrderStep: (s: 'shipping' | 'payment' | 'success') => void,
  paymentMethod: 'bkash' | 'nagad' | 'rocket' | null,
  setPaymentMethod: (m: 'bkash' | 'nagad' | 'rocket' | null) => void,
  customerName: string,
  setCustomerName: (n: string) => void,
  customerPhone: string,
  setCustomerPhone: (p: string) => void,
  customerAddress: string,
  setCustomerAddress: (a: string) => void,
  customerDistrict: string,
  setCustomerDistrict: (d: string) => void,
  deliveryCharge: number,
  isFetchingCharge: boolean,
  trxID: string,
  setTrxID: (t: string) => void,
  confirmDirectOrder: () => void,
  saveOrder: (o: any) => void
}) {
  const navigate = useNavigate();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<string | null>(null);
  const [trackOrderNumber, setTrackOrderNumber] = useState("");
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText("01627000110");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderNumber) return;
    setIsTrackLoading(true);
    setTrackedOrder(null);
    try {
      const res = await fetch('/api/orders');
      const allOrders: Order[] = await res.json();
      const order = allOrders.find(o => o.id === trackOrderNumber);
      if (order) {
        setTrackedOrder(order);
      } else {
        alert("Order not found. Please check your order number.");
      }
    } catch (e) {
      console.error("Tracking error:", e);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsTrackLoading(false);
    }
  };
  
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Hi! I am your Flexo AI Assistant. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<Product[]>([]);
  const [isAiRecLoading, setIsAiRecLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'success'>('cart');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Auto-slide banners
  useEffect(() => {
    if (content.banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % content.banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [content.banners.length]);

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);
    
    const response = await getChatResponse(userMsg, products);
    setChatMessages(prev => [...prev, { role: 'bot', text: response || "I'm sorry, I couldn't process that." }]);
    setIsChatLoading(false);
  };

  const getAiRecs = async () => {
    if (!chatInput.trim()) return;
    setIsAiRecLoading(true);
    const recIds = await getShoppingRecommendations(chatInput, products);
    const recs = products.filter(p => recIds.includes(p.id.toString()));
    setAiRecommendations(recs);
    setIsAiRecLoading(false);
    if (recs.length === 0) {
      alert("AI couldn't find specific matches, but here are some other products you might like!");
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-gold selection:text-white">
      {/* --- Navigation --- */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gold-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Menu */}
            <div className="flex items-center gap-2">
              {/* Three-Dot Menu Button (Moved from Right) */}
              <div className="relative">
                <button 
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`p-2 rounded-full transition-all ${isMoreMenuOpen ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'hover:bg-gold-light text-zinc-700'}`}
                >
                  <MoreVertical size={20} />
                </button>

                <AnimatePresence>
                  {isMoreMenuOpen && (
                    <>
                      {/* Backdrop for closing */}
                      <div 
                        className="fixed inset-0 z-[100]" 
                        onClick={() => setIsMoreMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-zinc-100 z-[110] overflow-hidden"
                      >
                        <div className="p-2">
                          <button 
                            onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); setIsMoreMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-gold rounded-2xl transition-all group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-gold-light transition-colors">
                              <Home size={16} />
                            </div>
                            Home
                          </button>
                          
                          <button 
                            onClick={() => { setSelectedCategory("All"); setIsMoreMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-gold rounded-2xl transition-all group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-gold-light transition-colors">
                              <LayoutGrid size={16} />
                            </div>
                            All Products
                          </button>

                          <div className="px-2 py-1">
                            <button 
                              onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                              className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-gold rounded-2xl transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-gold-light transition-colors">
                                  <Menu size={16} />
                                </div>
                                Categories
                              </div>
                              <ChevronDown size={14} className={`transition-transform duration-300 ${isCategoriesExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            
                            <AnimatePresence>
                              {isCategoriesExpanded && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden ml-11 space-y-1 mt-1"
                                >
                                  {["Perfume", "T-Shirt", "Shirt", "Pant", "Watch"].map(cat => (
                                    <button 
                                      key={cat}
                                      onClick={() => { setSelectedCategory(cat); setIsMoreMenuOpen(false); }}
                                      className="w-full text-left px-4 py-2 text-xs font-bold text-zinc-400 hover:text-gold transition-colors"
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="h-px bg-zinc-50 my-2 mx-4" />

                          <button 
                            onClick={() => { setActiveInfoModal('track'); setIsMoreMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-gold rounded-2xl transition-all group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-gold-light transition-colors">
                              <Truck size={16} />
                            </div>
                            Track Order
                          </button>

                          <button 
                            onClick={() => { setActiveInfoModal('return'); setIsMoreMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-gold rounded-2xl transition-all group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-gold-light transition-colors">
                              <RefreshCcw size={16} />
                            </div>
                            Return & Exchange
                          </button>

                          <div className="h-px bg-zinc-50 my-2 mx-4" />

                          <button 
                            onClick={() => { setActiveInfoModal('about'); setIsMoreMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-gold rounded-2xl transition-all group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-gold-light transition-colors">
                              <Info size={16} />
                            </div>
                            About Flexo
                          </button>

                          <button 
                            onClick={() => { setActiveInfoModal('contact'); setIsMoreMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-gold rounded-2xl transition-all group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-gold-light transition-colors">
                              <PhoneCall size={16} />
                            </div>
                            Contact Us
                          </button>

                          <button 
                            onClick={() => { setActiveInfoModal('faq'); setIsMoreMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-gold rounded-2xl transition-all group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-gold-light transition-colors">
                              <HelpCircle size={16} />
                            </div>
                            FAQ
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                <img src="https://i.ibb.co.com/V0sN4Z7b/logo.png" alt="Flexo Brand Logo" className="w-10 h-10 object-contain" />
                <span className="text-xl font-bold tracking-tight hidden sm:block">Flexo Brand</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-sm font-medium transition-colors ${selectedCategory === cat ? 'text-gold-dark border-b-2 border-gold' : 'text-zinc-400 hover:text-gold'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-full text-sm focus:ring-2 focus:ring-gold w-48 lg:w-64 transition-all outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-gold-light rounded-full transition-colors"
              >
                <ShoppingBag size={20} className="text-zinc-700" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-gold text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Mobile Menu --- */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-64 bg-white z-[70] shadow-2xl lg:hidden p-6"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="text-xl font-bold">Menu</span>
                <button onClick={() => setIsMenuOpen(false)}><X size={20} /></button>
              </div>
              <div className="flex flex-col gap-4">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setIsMenuOpen(false); }}
                    className={`text-left py-2 text-lg font-medium ${selectedCategory === cat ? 'text-zinc-900' : 'text-zinc-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Top Multi-Banner Slider --- */}
      <section className="w-full aspect-[21/9] md:aspect-[21/7] bg-zinc-200 relative overflow-hidden group">
        <div className="flex transition-transform duration-700 ease-out h-full" style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}>
          {content.banners.map((banner, idx) => (
            <div key={banner.id} className="min-w-full h-full relative">
              {banner.type === 'video' ? (
                <video 
                  src={banner.url} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={banner.url} 
                  alt={`Banner ${idx + 1}`} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-black/10" />
            </div>
          ))}
        </div>

        {content.banners.length > 1 && (
          <>
            <button 
              onClick={() => setCurrentBannerIndex(prev => (prev - 1 + content.banners.length) % content.banners.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setCurrentBannerIndex(prev => (prev + 1) % content.banners.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40"
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {content.banners.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentBannerIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${currentBannerIndex === idx ? 'bg-gold w-6' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* --- Product Grid --- */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Text moved here, near Featured Products */}
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-xl"
            >
              <span className="inline-block px-3 py-1 bg-zinc-900 text-white text-[8px] font-bold tracking-[0.2em] uppercase rounded-full mb-2">
                {content.heroSubtitle}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 leading-[1.1] text-zinc-900 whitespace-pre-line">
                {content.heroTitle}
              </h2>
              <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
                {content.heroDescription}
              </p>
              <div className="flex items-center gap-4">
                <button className="px-6 py-2.5 bg-zinc-900 text-white font-bold rounded-full hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-zinc-900/10 text-xs">
                  Shop Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
                
                {/* Trust Badge integrated here */}
                <div className="flex items-center gap-2 ml-4">
                  <div className="flex -space-x-2">
                    {[1, 2].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-zinc-100 shadow-sm">
                        <img 
                          src={i === 1 ? "https://i.ibb.co.com/WpsF8kLw/image.png" : `https://i.pravatar.cc/100?u=${i+50}`} 
                          alt="User" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map(i => <Star key={i} size={8} fill="currentColor" />)}
                    </div>
                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">5k+ Trusted</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-t border-zinc-100 pt-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
              <p className="text-zinc-500">Handpicked items just for you.</p>
            </div>
            <div className="flex gap-2 bg-gold-light/50 p-1 rounded-full overflow-x-auto no-scrollbar max-w-full">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-white shadow-sm text-gold-dark font-bold' : 'text-zinc-500 hover:text-gold'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={addToCart} 
                onOrderNow={onOrderNow} 
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                <Search size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-zinc-500">Try adjusting your search or category filter.</p>
            </div>
          )}
        </div>
      </section>

      {/* --- Why Choose Us --- */}
      <section className="py-20 bg-white border-y border-gold-light/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { title: "Fast Delivery", desc: "Get your products delivered within 24-48 hours across the country.", icon: <ArrowRight /> },
              { title: "Quality Guarantee", desc: "Every product is hand-checked for quality before shipping.", icon: <CheckCircle2 /> },
              { title: "Secure Payment", desc: "Multiple secure payment options including Cash on Delivery.", icon: <ShoppingBag /> }
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 bg-gold-light rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 text-gold-dark group-hover:bg-gold group-hover:text-white transition-all duration-300">
                  {React.cloneElement(item.icon as React.ReactElement, { size: 28 })}
                </div>
                <h3 className="text-xl font-bold mb-3 text-zinc-900">{item.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- AI Shopping Assistant Section --- */}
      <section className="py-16 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold-dark rounded-full mb-6">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">AI Shopping Assistant</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Need help choosing?</h2>
          <p className="text-zinc-500 mb-8 max-w-xl mx-auto">Tell our AI what you are looking for and get personalized recommendations.</p>
          
          <div className="max-w-2xl mx-auto flex gap-2 mb-12">
            <input 
              type="text" 
              placeholder="e.g. I need a modern chair for my office under 5000"
              className="flex-1 p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-gold"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && getAiRecs()}
            />
            <button 
              onClick={getAiRecs}
              disabled={isAiRecLoading}
              className="px-8 py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold-dark transition-all shadow-lg shadow-gold/20 disabled:opacity-50"
            >
              {isAiRecLoading ? 'Thinking...' : 'Get Advice'}
            </button>
          </div>

          {aiRecommendations.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
              {aiRecommendations.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={addToCart} 
                  onOrderNow={onOrderNow} 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- Happy Customers Section --- */}
      <section className="py-20 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/3">
              <h2 className="text-4xl font-bold mb-6 text-zinc-900">Happy Customers</h2>
              <p className="text-zinc-500 text-lg leading-relaxed">Real stories from people who transformed their style and confidence with Flexo Brand.</p>
              <div className="mt-8 flex items-center gap-3 text-gold-dark font-bold">
                <CheckCircle2 size={24} className="text-emerald-500" />
                <span>100% Verified Reviews</span>
              </div>
            </div>
            <div className="md:w-2/3 grid sm:grid-cols-2 gap-8">
              {[
                { name: "Sarah Ahmed", text: "The quality is amazing. I ordered a dress and it's very comfortable. Highly recommended!", img: "https://i.ibb.co.com/WpsF8kLw/image.png" },
                { name: "Rahat Kabir", text: "Fast delivery and great customer service. The product was exactly as described.", img: "https://i.pravatar.cc/100?u=10" }
              ].map((testimonial, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex text-yellow-400 mb-6">
                    {[1,2,3,4,5].map(star => <Star key={star} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-zinc-600 mb-8 italic leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-4">
                    <img 
                      src={testimonial.img} 
                      alt={testimonial.name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-gold-light p-0.5" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-bold text-zinc-900">{testimonial.name}</h4>
                      <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">Verified Buyer</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-white text-zinc-900 pt-20 pb-10 border-t border-gold-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <img src="https://i.ibb.co.com/V0sN4Z7b/logo.png" alt="Flexo Brand Logo" className="w-10 h-10 object-contain" />
                <span className="text-xl font-bold tracking-tight">Flexo Brand</span>
              </div>
              <p className="text-zinc-500 mb-6 leading-relaxed">
                {content.footerDescription}
              </p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/share/1AqgmC4UAF/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gold-light flex items-center justify-center text-gold-dark hover:bg-gold hover:text-white transition-all">
                  <Facebook size={18} />
                </a>
                <a href="https://www.instagram.com/flexo.brand?igsh=ZWQ1dnpodngxZzA5" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gold-light flex items-center justify-center text-gold-dark hover:bg-gold hover:text-white transition-all">
                  <Instagram size={18} />
                </a>
                <a href="https://www.tiktok.com/@flexo.brand?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gold-light flex items-center justify-center text-gold-dark hover:bg-gold hover:text-white transition-all">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg text-gold-dark">Quick Links</h4>
              <ul className="space-y-4 text-zinc-500">
                <li><a href="#" className="hover:text-gold transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Terms & Conditions</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg text-gold-dark">Categories</h4>
              <ul className="space-y-4 text-zinc-500">
                {categories.slice(1).map(cat => (
                  <li key={cat}><button onClick={() => setSelectedCategory(cat)} className="hover:text-gold transition-colors">{cat}</button></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg text-gold-dark">Contact Us</h4>
              <ul className="space-y-4 text-zinc-500">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="shrink-0 mt-1 text-gold" />
                  <span>{content.contactAddress}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="shrink-0 text-gold" />
                  <a href={`tel:${content.contactPhone}`} className="hover:text-gold transition-colors">{content.contactPhone}</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="shrink-0 text-gold" />
                  <a href={`mailto:${content.contactEmail}`} className="hover:text-gold transition-colors">{content.contactEmail}</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gold-light flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-400 text-sm">
            <p>© 2026 Flexo Brand. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gold">Privacy Policy</a>
              <a href="#" className="hover:text-gold">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* --- AI Chatbot --- */}
      <div className="fixed bottom-24 right-6 z-[100]">
        <AnimatePresence>
          {isAIChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-zinc-100 flex flex-col overflow-hidden"
            >
              <div className="p-4 bg-gold text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bot size={20} />
                  <span className="font-bold">Flexo AI Support</span>
                </div>
                <button onClick={() => setIsAIChatOpen(false)}><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-gold text-white rounded-tr-none' 
                        : 'bg-zinc-100 text-zinc-800 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start italic text-xs text-zinc-400">AI is typing...</div>
                )}
              </div>

              <div className="p-4 border-t border-zinc-100 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ask me anything..."
                  className="flex-1 p-2 bg-zinc-50 border border-zinc-100 rounded-xl text-sm outline-none focus:ring-1 focus:ring-gold"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                />
                <button 
                  onClick={handleChatSend}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="p-2 bg-gold text-white rounded-xl hover:bg-gold-dark transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setIsAIChatOpen(!isAIChatOpen)}
          className="w-14 h-14 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all group"
        >
          {isAIChatOpen ? <X size={24} /> : <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />}
        </button>
      </div>

      {/* --- Floating WhatsApp Button --- */}
      <a 
        href="https://wa.me/8801627000110" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Phone size={28} />
        <span className="absolute right-full mr-3 bg-white text-zinc-900 px-3 py-1 rounded-lg text-sm font-bold shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Order on WhatsApp
        </span>
      </a>

      {/* --- Direct Order Modal --- */}
      <AnimatePresence>
        {isDirectOrderOpen && directOrderProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDirectOrderOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[90vh] bg-white z-[160] shadow-2xl rounded-3xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gold-light flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gold-dark">
                  {directOrderStep === 'success' ? 'Order Confirmed' : 'Quick Checkout'}
                </h2>
                <button 
                  onClick={() => setIsDirectOrderOpen(false)}
                  className="p-2 hover:bg-gold-light rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {directOrderStep === 'shipping' && (
                  <div className="space-y-6">
                    <div className="flex gap-4 p-4 bg-gold-light/20 rounded-2xl border border-gold-light/50">
                      <img src={directOrderProduct.image} alt={directOrderProduct.name} className="w-20 h-20 rounded-xl object-cover" />
                      <div>
                        <h4 className="font-bold">{directOrderProduct.name}</h4>
                        <p className="text-gold-dark font-bold">৳{directOrderProduct.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-zinc-800">Shipping Information</h3>
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                          placeholder="Enter your name" 
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Phone Number</label>
                        <input 
                          type="tel" 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                          placeholder="01XXXXXXXXX" 
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">District</label>
                        <select 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none"
                          value={customerDistrict}
                          onChange={(e) => setCustomerDistrict(e.target.value)}
                        >
                          <option value="">Select District</option>
                          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Full Address</label>
                        <textarea 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none h-24" 
                          placeholder="Enter your full address"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                    <button 
                      onClick={() => setDirectOrderStep('payment')}
                      disabled={!customerName || !customerPhone || !customerAddress || !customerDistrict || isFetchingCharge}
                      className="w-full py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isFetchingCharge ? 'Calculating Charge...' : 'Next: Payment'} <ChevronRight size={18} />
                    </button>
                  </div>
                )}

                {directOrderStep === 'payment' && (
                  <div className="space-y-6">
                    <div className="bg-gold-light/20 p-4 rounded-2xl border border-gold-light/50">
                      <p className="text-sm text-zinc-600 mb-2">Delivery Charge (Advance Payment Required)</p>
                      <p className="text-xl font-bold text-gold-dark">৳{deliveryCharge}</p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-zinc-800">Select Payment Method</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {['bkash', 'nagad', 'rocket'].map((method) => (
                          <button 
                            key={method}
                            onClick={() => setPaymentMethod(method as any)}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === method ? 'border-gold bg-gold-light/30' : 'border-zinc-100 bg-zinc-50 hover:border-gold-light'}`}
                          >
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-[10px] uppercase text-zinc-400">
                              {method}
                            </div>
                            <span className="text-xs font-bold capitalize">{method}</span>
                          </button>
                        ))}
                      </div>

                      {paymentMethod && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-zinc-900 text-white rounded-2xl space-y-3"
                        >
                          <p className="text-sm opacity-80">Send <span className="text-gold font-bold">৳{deliveryCharge}</span> to this Personal number:</p>
                          <div className="text-2xl font-bold tracking-wider text-gold">01627000110</div>
                          <p className="text-[10px] opacity-60 uppercase tracking-widest">No QR Code needed. Just send money.</p>
                        </motion.div>
                      )}

                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Transaction ID</label>
                        <input 
                          type="text" 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                          placeholder="Enter TrxID" 
                          value={trxID}
                          onChange={(e) => setTrxID(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setDirectOrderStep('shipping')}
                        className="flex-1 py-4 border border-gold text-gold font-bold rounded-2xl hover:bg-gold-light transition-all"
                      >
                        Back
                      </button>
                      <button 
                        onClick={confirmDirectOrder}
                        disabled={!paymentMethod || !trxID}
                        className="flex-[2] py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold-dark transition-all disabled:opacity-50"
                      >
                        Confirm Order
                      </button>
                    </div>
                  </div>
                )}

                {directOrderStep === 'success' && (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                      className="w-32 h-32 bg-gold text-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-gold/40"
                    >
                      <CheckCircle2 size={72} />
                    </motion.div>
                    <h3 className="text-3xl font-bold mb-4 text-zinc-900">আপনার অর্ডারটি কনফার্ম করা হয়েছে</h3>
                    <p className="text-zinc-500 mb-10 max-w-xs mx-auto">ধন্যবাদ! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
                    <button 
                      onClick={() => setIsDirectOrderOpen(false)}
                      className="px-12 py-4 bg-gold text-white font-bold rounded-full w-full shadow-lg shadow-gold/20"
                    >
                      Continue Shopping
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Cart Sidebar --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gold-light flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gold-dark">
                  <ShoppingBag size={20} /> Your Cart
                </h2>
                <button 
                  onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }}
                  className="p-2 hover:bg-gold-light rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {checkoutStep === 'cart' && (
                  <>
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gold-light rounded-full flex items-center justify-center mb-6 text-gold">
                          <ShoppingBag size={32} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Your cart is empty</h3>
                        <p className="text-zinc-500 mb-8">Looks like you haven't added anything yet.</p>
                        <button 
                          onClick={() => setIsCartOpen(false)}
                          className="px-8 py-3 bg-gold text-white font-bold rounded-full shadow-lg shadow-gold/20"
                        >
                          Start Shopping
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {cart.map(item => (
                          <div key={item.id} className="flex gap-4">
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-50 shrink-0 border border-gold-light/30">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <h4 className="font-bold text-sm">{item.name}</h4>
                                <button onClick={() => removeFromCart(item.id)} className="text-zinc-300 hover:text-red-500"><Trash2 size={16} /></button>
                              </div>
                              <p className="text-gold-dark text-xs font-bold mb-3">৳{item.price.toLocaleString()}</p>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center border border-gold-light rounded-lg">
                                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gold-light"><Minus size={14} /></button>
                                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gold-light"><Plus size={14} /></button>
                                </div>
                                <p className="text-sm font-bold ml-auto">৳{(item.price * item.quantity).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {checkoutStep === 'shipping' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gold-dark">Shipping Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                          placeholder="John Doe" 
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Phone Number</label>
                        <input 
                          type="tel" 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                          placeholder="01XXXXXXXXX" 
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Full Address</label>
                        <textarea 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none h-24" 
                          placeholder="House, Road, Area, City"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 'success' && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 bg-gold-light text-gold-dark rounded-full flex items-center justify-center mb-6"
                    >
                      <CheckCircle2 size={40} />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-2">Order Placed!</h3>
                    <p className="text-zinc-500 mb-8">Thank you for your purchase. We'll contact you shortly to confirm your order.</p>
                    <button 
                      onClick={() => { setIsCartOpen(false); setCart([]); setCheckoutStep('cart'); }}
                      className="px-8 py-3 bg-gold text-white font-bold rounded-full w-full shadow-lg shadow-gold/20"
                    >
                      Continue Shopping
                    </button>
                  </div>
                )}
              </div>

              {cart.length > 0 && checkoutStep !== 'success' && (
                <div className="p-6 border-t border-gold-light bg-gold-light/10">
                  <div className="flex justify-between mb-2">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="font-bold">৳{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-6">
                    <span className="text-zinc-500">Shipping</span>
                    <span className="text-green-600 font-bold">Free</span>
                  </div>
                  <div className="flex justify-between mb-8 text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-gold-dark">৳{cartTotal.toLocaleString()}</span>
                  </div>
                  
                  {checkoutStep === 'cart' ? (
                    <button 
                      onClick={() => setCheckoutStep('shipping')}
                      className="w-full py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/20"
                    >
                      Proceed to Checkout <ChevronRight size={18} />
                    </button>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="p-4 bg-zinc-900 text-white rounded-2xl space-y-3">
                        <p className="text-xs opacity-80">Send <span className="text-gold font-bold">৳100</span> (Delivery Charge) to:</p>
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                          <div className="text-lg font-bold tracking-wider text-gold">01627000110</div>
                          <button 
                            onClick={handleCopyNumber}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg transition-all text-xs font-bold"
                          >
                            {isCopied ? (
                              <><Check size={14} /> Copied</>
                            ) : (
                              <><Copy size={14} /> Copy</>
                            )}
                          </button>
                        </div>
                        <input 
                          type="text" 
                          className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-sm outline-none focus:border-gold" 
                          placeholder="Enter TrxID" 
                          value={trxID}
                          onChange={(e) => setTrxID(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setCheckoutStep('cart')}
                          className="flex-1 py-4 border border-gold text-gold font-bold rounded-2xl hover:bg-gold-light transition-all"
                        >
                          Back
                        </button>
                        <button 
                          onClick={() => {
                            saveOrder({
                              customerName,
                              phone: customerPhone,
                              address: customerAddress,
                              product: cart.map(i => `${i.name} (x${i.quantity})`).join(', '),
                              total: cartTotal + 100,
                              paymentMethod: 'Advance Delivery Charge',
                              trxID: trxID
                            });
                            setCheckoutStep('success');
                          }}
                          disabled={!customerName || !customerPhone || !customerAddress || !trxID}
                          className="flex-[2] py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold-dark transition-all shadow-lg shadow-gold/20 disabled:opacity-50"
                        >
                          Confirm Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Info Modals --- */}
      <AnimatePresence>
        {activeInfoModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setActiveInfoModal(null); setTrackedOrder(null); setTrackOrderNumber(""); }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[80vh] bg-white z-[210] shadow-2xl rounded-3xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-900 capitalize">
                  {activeInfoModal === 'track' ? 'Track Your Order' : 
                   activeInfoModal === 'return' ? 'Return & Exchange' :
                   activeInfoModal === 'about' ? 'About Flexo' :
                   activeInfoModal === 'contact' ? 'Contact Us' : 'Frequently Asked Questions'}
                </h2>
                <button onClick={() => { setActiveInfoModal(null); setTrackedOrder(null); setTrackOrderNumber(""); }} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto">
                {activeInfoModal === 'track' && (
                  <div className="space-y-6">
                    <p className="text-zinc-500 text-sm">Enter your order ID to see the current status of your package.</p>
                    <form onSubmit={handleTrackOrder} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Order ID (e.g. ORD-123)"
                        className="flex-1 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-gold outline-none font-mono"
                        value={trackOrderNumber}
                        onChange={(e) => setTrackOrderNumber(e.target.value)}
                        required
                      />
                      <button 
                        type="submit"
                        disabled={isTrackLoading}
                        className="px-8 py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold-dark transition-all shadow-lg shadow-gold/20 disabled:opacity-50"
                      >
                        {isTrackLoading ? 'Searching...' : 'Track'}
                      </button>
                    </form>

                    {trackedOrder && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-zinc-50 rounded-3xl border border-gold-light"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Order Status</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              trackedOrder.status === 'delivered' ? 'bg-green-100 text-green-600' : 
                              trackedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {trackedOrder.status}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Order Date</p>
                            <p className="text-sm font-bold">{trackedOrder.date}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500">Product:</span>
                            <span className="font-bold">{trackedOrder.product}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500">Total Amount:</span>
                            <span className="font-bold text-gold-dark">৳{trackedOrder.total.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500">Payment:</span>
                            <span className="font-bold capitalize">{trackedOrder.paymentMethod}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {activeInfoModal === 'return' && (
                  <div className="space-y-6 text-zinc-600 leading-relaxed">
                    <h4 className="font-bold text-zinc-900">3-Day Exchange Policy</h4>
                    <p className="text-sm">At Flexo, we want you to be completely satisfied with your purchase. If the product doesn't fit or has any issues, you can exchange it within 3 days of receiving the delivery.</p>
                    <h4 className="font-bold text-zinc-900">Conditions for Exchange:</h4>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      <li>The product must be unused, unwashed, and in its original condition.</li>
                      <li>Original tags and packaging must be intact.</li>
                      <li>Exchange is subject to stock availability.</li>
                    </ul>
                    <p className="text-xs text-zinc-400 mt-4 italic">* Delivery charges for exchange must be borne by the customer unless the product was defective upon arrival.</p>
                  </div>
                )}

                {activeInfoModal === 'about' && (
                  <div className="space-y-6 text-zinc-600 leading-relaxed">
                    <div className="flex flex-col items-center text-center mb-8">
                      <img src="https://i.ibb.co.com/V0sN4Z7b/logo.png" alt="Flexo" className="w-20 h-20 mb-4" />
                      <h3 className="text-2xl font-bold text-zinc-900">Flexo Brand</h3>
                      <p className="text-zinc-400 text-sm">Premium Lifestyle Essentials</p>
                    </div>
                    <p className="text-sm">Flexo is a premium e-commerce brand based in Khulna, Bangladesh. We are dedicated to providing high-quality lifestyle products, from perfumes to apparel, designed for the modern individual who values both style and substance.</p>
                    <p className="text-sm">Our mission is to elevate your everyday experience through curated collections that blend contemporary design with exceptional quality.</p>
                  </div>
                )}

                {activeInfoModal === 'contact' && (
                  <div className="space-y-8">
                    <p className="text-zinc-500 text-center">We're here to help! Reach out to us through any of these channels.</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <a 
                        href={`https://wa.me/${content.contactPhone.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        className="flex flex-col items-center gap-3 p-6 bg-green-50 rounded-3xl border border-green-100 hover:shadow-lg transition-all group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          <MessageCircle size={24} />
                        </div>
                        <span className="font-bold text-green-700">WhatsApp</span>
                      </a>
                      <a 
                        href="https://facebook.com/flexobrand" 
                        target="_blank" 
                        className="flex flex-col items-center gap-3 p-6 bg-blue-50 rounded-3xl border border-blue-100 hover:shadow-lg transition-all group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Facebook size={24} />
                        </div>
                        <span className="font-bold text-blue-700">Facebook</span>
                      </a>
                      <a 
                        href={`tel:${content.contactPhone}`} 
                        className="flex flex-col items-center gap-3 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 hover:shadow-lg transition-all group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Phone size={24} />
                        </div>
                        <span className="font-bold text-zinc-900">Call Us</span>
                      </a>
                      <a 
                        href={`mailto:${content.contactEmail}`} 
                        className="flex flex-col items-center gap-3 p-6 bg-red-50 rounded-3xl border border-red-100 hover:shadow-lg transition-all group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Mail size={24} />
                        </div>
                        <span className="font-bold text-red-700">Email Us</span>
                      </a>
                    </div>
                  </div>
                )}

                {activeInfoModal === 'faq' && (
                  <div className="space-y-4">
                    {[
                      { q: "How long does delivery take?", a: "Inside Khulna takes 24-48 hours. Outside Khulna takes 2-4 business days." },
                      { q: "Do you have a physical shop?", a: "Currently, we operate exclusively online to provide the best prices and service directly to your doorstep." },
                      { q: "Can I cancel my order?", a: "Orders can be cancelled before they are shipped. Once shipped, the delivery charge is non-refundable." },
                      { q: "What if I receive a wrong product?", a: "Please contact us immediately via WhatsApp or Phone. We will arrange a free exchange for you." }
                    ].map((item, i) => (
                      <div key={i} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <h4 className="font-bold text-zinc-900 mb-2">{item.q}</h4>
                        <p className="text-sm text-zinc-500">{item.a}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Admin Panel Component ---
function Admin({ products, onUpdateProducts, currentFont, onUpdateFont, content, onUpdateContent, categories, onUpdateCategories }: { 
  products: Product[], 
  onUpdateProducts: (p: Product[]) => void,
  currentFont: string,
  onUpdateFont: (f: string) => void,
  content: WebsiteContent,
  onUpdateContent: (c: WebsiteContent) => void,
  categories: string[],
  onUpdateCategories: (c: string[]) => void
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'settings' | 'categories'>('dashboard');
  
  // Content Form State
  const [contentForm, setContentForm] = useState<WebsiteContent>(content);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Category Form State
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    setContentForm(content);
  }, [content]);

  const handleAiGenerateDescription = async () => {
    if (!productForm.name) {
      alert("Please enter a product name first.");
      return;
    }
    setIsAiGenerating(true);
    const description = await generateProductDescription(productForm.name, productForm.category);
    setProductForm({ ...productForm, description: description || "" });
    setIsAiGenerating(false);
  };
  
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onUpdateContent(contentForm);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to save content", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Product Form States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    originalPrice: '',
    category: 'Electronics',
    image: '',
    description: ''
  });

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error("Failed to fetch orders", e);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") { // Simple password for demo
      setIsLoggedIn(true);
    } else {
      alert("Incorrect password!");
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchOrders();
    } catch (e) {
      console.error("Failed to update order", e);
    }
  };

  const deleteOrder = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await fetch(`/api/orders/${id}`, { method: 'DELETE' });
        fetchOrders();
      } catch (e) {
        console.error("Failed to delete order", e);
      }
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: productForm.name,
      price: Number(productForm.price),
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : null,
      category: productForm.category,
      image: productForm.image || "https://picsum.photos/seed/product/600/600",
      description: productForm.description,
      rating: editingProduct ? editingProduct.rating : 5.0
    };

    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      }
      
      // Refresh products in parent state
      const freshProds = await fetch('/api/products').then(r => r.json());
      onUpdateProducts(freshProds);

      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({ name: '', price: '', originalPrice: '', category: 'Electronics', image: '', description: '' });
    } catch (e) {
      console.error("Failed to submit product", e);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      category: product.category,
      image: product.image,
      description: product.description
    });
    setIsProductModalOpen(true);
  };

  const deleteProduct = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        const freshProds = await fetch('/api/products').then(r => r.json());
        onUpdateProducts(freshProds);
      } catch (e) {
        console.error("Failed to delete product", e);
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gold-light"
        >
          <div className="flex flex-col items-center mb-8">
            <img src="https://i.ibb.co.com/V0sN4Z7b/logo.png" alt="Flexo Brand Logo" className="w-20 h-20 object-contain mb-4" />
            <h1 className="text-2xl font-bold text-zinc-900">Flexo Admin</h1>
            <p className="text-zinc-500">Enter password to access dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Password</label>
              <input 
                type="password" 
                className="w-full p-4 bg-zinc-50 border border-gold-light rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="w-full py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold-dark transition-all shadow-lg shadow-gold/20">
              Login to Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-white flex flex-col hidden lg:flex">
        <div className="p-8 flex items-center gap-3">
          <img src="https://i.ibb.co.com/V0sN4Z7b/logo.png" alt="Flexo Brand Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold tracking-tight">Flexo Admin</span>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-gold text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-gold text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          >
            <ShoppingBag size={20} /> Orders
            {pendingOrders > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-1 rounded-full">{pendingOrders}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-gold text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          >
            <Package size={20} /> Products
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'categories' ? 'bg-gold text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          >
            <Menu size={20} /> Categories
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-gold text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          >
            <Settings size={20} /> Settings
          </button>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-zinc-200 p-6 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-zinc-900 capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">Admin User</p>
              <p className="text-xs text-zinc-400">Super Admin</p>
            </div>
            <div className="w-10 h-10 bg-zinc-100 rounded-full border border-zinc-200"></div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                  <p className="text-zinc-400 text-sm font-bold uppercase mb-2">Total Revenue</p>
                  <h3 className="text-3xl font-bold text-zinc-900">৳{totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                  <p className="text-zinc-400 text-sm font-bold uppercase mb-2">Total Orders</p>
                  <h3 className="text-3xl font-bold text-zinc-900">{orders.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                  <p className="text-zinc-400 text-sm font-bold uppercase mb-2">Pending Orders</p>
                  <h3 className="text-3xl font-bold text-red-500">{pendingOrders}</h3>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                  <h4 className="font-bold">Recent Orders</h4>
                  <button onClick={() => setActiveTab('orders')} className="text-gold font-bold text-sm hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 text-zinc-400 text-xs font-bold uppercase">
                      <tr>
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {orders.slice(0, 5).map(order => (
                        <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm">{order.customerName}</p>
                            <p className="text-xs text-zinc-400">{order.phone}</p>
                          </td>
                          <td className="px-6 py-4 text-sm">{order.product}</td>
                          <td className="px-6 py-4 font-bold">৳{order.total.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 text-zinc-400 text-xs font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer & Address</th>
                      <th className="px-6 py-4">Payment & TrxID</th>
                      <th className="px-6 py-4">Product & Total</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center text-zinc-400">No orders found yet.</td>
                      </tr>
                    ) : (
                      orders.map(order => (
                        <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs">
                            {order.id}
                            <p className="text-[10px] text-zinc-400 mt-1">{order.date}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm">{order.customerName}</p>
                            <p className="text-xs text-zinc-400">{order.phone}</p>
                            <p className="text-[10px] text-zinc-500 mt-1 max-w-[150px] truncate">{order.address}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold uppercase text-gold-dark">{order.paymentMethod}</p>
                            <p className="text-[10px] font-mono bg-zinc-100 px-2 py-1 rounded mt-1 inline-block">{order.trxID}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm">{order.product}</p>
                            <p className="font-bold text-gold-dark">৳{order.total.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <select 
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                              className="text-xs font-bold border border-zinc-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-gold"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => deleteOrder(order.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Manage Products</h3>
                <button 
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({ name: '', price: '', originalPrice: '', category: 'Electronics', image: '', description: '' });
                    setIsProductModalOpen(true);
                  }}
                  className="px-6 py-2 bg-gold text-white font-bold rounded-xl hover:bg-gold-dark transition-all flex items-center gap-2"
                >
                  <Plus size={18} /> Add New Product
                </button>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 text-zinc-400 text-xs font-bold uppercase">
                      <tr>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Offer Price</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {products.map(product => (
                        <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                            <span className="font-bold text-sm">{product.name}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">{product.category}</td>
                          <td className="px-6 py-4 font-bold">৳{product.price.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            {product.originalPrice ? (
                              <span className="text-green-600 font-bold text-xs">Active Offer</span>
                            ) : (
                              <span className="text-zinc-300 text-xs">No Offer</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => openEditModal(product)} className="p-2 text-gold hover:bg-gold-light rounded-lg transition-colors">
                                <Eye size={18} />
                              </button>
                              <button onClick={() => deleteProduct(product.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Manage Categories</h3>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
                  <h4 className="font-bold mb-6">Add New Category</h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Category Name"
                      className="flex-1 p-3 bg-zinc-50 border border-gold-light rounded-xl outline-none focus:ring-2 focus:ring-gold"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <button 
                      onClick={async () => {
                        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                          try {
                            await fetch('/api/categories', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: newCategory.trim() })
                            });
                            const freshCats = await fetch('/api/categories').then(r => r.json());
                            onUpdateCategories(freshCats);
                            setNewCategory("");
                          } catch (e) {
                            console.error("Failed to add category", e);
                          }
                        }
                      }}
                      className="px-6 py-3 bg-gold text-white font-bold rounded-xl hover:bg-gold-dark transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
                  <h4 className="font-bold mb-6">Current Categories</h4>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <div key={cat} className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl">
                        <span className="font-medium">{cat}</span>
                        {cat !== "All" && (
                          <button 
                            onClick={async () => {
                              try {
                                await fetch(`/api/categories/${cat}`, { method: 'DELETE' });
                                const freshCats = await fetch('/api/categories').then(r => r.json());
                                onUpdateCategories(freshCats);
                              } catch (e) {
                                console.error("Failed to delete category", e);
                              }
                            }}
                            className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Website Settings</h3>
                <button 
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className={`px-8 py-3 text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 min-w-[180px] justify-center ${
                    showSuccess 
                      ? 'bg-green-500 shadow-green-500/20' 
                      : 'bg-gold hover:bg-gold-dark shadow-gold/20'
                  } disabled:opacity-50`}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : showSuccess ? (
                    <><Check size={20} /> Saved!</>
                  ) : (
                    'Save All Changes'
                  )}
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Font Settings */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
                  <label className="block text-sm font-bold text-zinc-700 mb-6">Choose Website Font</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'font-inter', name: 'Inter (Modern)' },
                      { id: 'font-playfair', name: 'Playfair (Elegant)' },
                      { id: 'font-poppins', name: 'Poppins (Friendly)' },
                      { id: 'font-roboto', name: 'Roboto (Classic)' },
                      { id: 'font-opensans', name: 'Open Sans (Clean)' },
                      { id: 'font-mono', name: 'JetBrains Mono (Tech)' },
                    ].map((font) => (
                      <button
                        key={font.id}
                        onClick={() => onUpdateFont(font.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          currentFont === font.id 
                            ? 'border-gold bg-gold-light text-gold-dark' 
                            : 'border-zinc-100 hover:border-gold-light'
                        }`}
                      >
                        <span className={`block text-lg ${font.id}`}>{font.name}</span>
                        <span className="text-xs opacity-60">The quick brown fox jumps...</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Content Settings */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-6">
                  <h4 className="font-bold text-zinc-800 border-b border-zinc-100 pb-4">Edit Website Text</h4>
                  
                  <div className="space-y-4">
                    <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-zinc-800">Top Banners (Max 5)</h4>
                        <button 
                          onClick={() => {
                            if (contentForm.banners.length < 5) {
                              setContentForm({
                                ...contentForm,
                                banners: [...contentForm.banners, { id: Date.now().toString(), url: '', type: 'image' }]
                              });
                            }
                          }}
                          disabled={contentForm.banners.length >= 5}
                          className="px-4 py-2 bg-gold text-white text-xs font-bold rounded-xl hover:bg-gold-dark transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          <Plus size={14} /> Add Banner
                        </button>
                      </div>
                      
                      <div className="space-y-6">
                        {contentForm.banners.map((banner, index) => (
                          <div key={banner.id} className="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm space-y-4 relative">
                            <button 
                              onClick={() => {
                                setContentForm({
                                  ...contentForm,
                                  banners: contentForm.banners.filter(b => b.id !== banner.id)
                                });
                              }}
                              className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                            
                            <div className="flex gap-4">
                              <button 
                                onClick={() => {
                                  const newBanners = [...contentForm.banners];
                                  newBanners[index].type = 'image';
                                  setContentForm({...contentForm, banners: newBanners});
                                }}
                                className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all ${banner.type === 'image' ? 'border-gold bg-gold-light text-gold-dark' : 'border-zinc-50'}`}
                              >
                                Image
                              </button>
                              <button 
                                onClick={() => {
                                  const newBanners = [...contentForm.banners];
                                  newBanners[index].type = 'video';
                                  setContentForm({...contentForm, banners: newBanners});
                                }}
                                className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all ${banner.type === 'video' ? 'border-gold bg-gold-light text-gold-dark' : 'border-zinc-50'}`}
                              >
                                Video
                              </button>
                            </div>

                            <input 
                              type="text" 
                              className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none text-sm" 
                              placeholder={banner.type === 'image' ? "Image URL (e.g. https://...)" : "Video URL (e.g. https://...)"}
                              value={banner.url}
                              onChange={e => {
                                const newBanners = [...contentForm.banners];
                                newBanners[index].url = e.target.value;
                                setContentForm({...contentForm, banners: newBanners});
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Hero Title</label>
                      <input 
                        type="text" 
                        className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                        value={contentForm.heroTitle}
                        onChange={e => setContentForm({...contentForm, heroTitle: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Hero Subtitle</label>
                      <input 
                        type="text" 
                        className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                        value={contentForm.heroSubtitle}
                        onChange={e => setContentForm({...contentForm, heroSubtitle: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Hero Description</label>
                      <textarea 
                        className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none h-24" 
                        value={contentForm.heroDescription}
                        onChange={e => setContentForm({...contentForm, heroDescription: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Footer Description</label>
                      <textarea 
                        className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none h-24" 
                        value={contentForm.footerDescription}
                        onChange={e => setContentForm({...contentForm, footerDescription: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Contact Phone</label>
                        <input 
                          type="text" 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                          value={contentForm.contactPhone}
                          onChange={e => setContentForm({...contentForm, contactPhone: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Contact Email</label>
                        <input 
                          type="text" 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                          value={contentForm.contactEmail}
                          onChange={e => setContentForm({...contentForm, contactEmail: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Contact Address</label>
                      <input 
                        type="text" 
                        className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                        value={contentForm.contactAddress}
                        onChange={e => setContentForm({...contentForm, contactAddress: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Modal */}
          <AnimatePresence>
            {isProductModalOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsProductModalOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[90vh] bg-white z-[210] shadow-2xl rounded-3xl overflow-hidden flex flex-col"
                >
                  <div className="p-6 border-b border-gold-light flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gold-dark">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                    <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-gold-light rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleProductSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Product Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                        value={productForm.name}
                        onChange={e => setProductForm({...productForm, name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Selling Price (৳)</label>
                        <input 
                          required
                          type="number" 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                          value={productForm.price}
                          onChange={e => setProductForm({...productForm, price: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Original Price (For Offer)</label>
                        <input 
                          type="number" 
                          className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                          placeholder="Optional"
                          value={productForm.originalPrice}
                          onChange={e => setProductForm({...productForm, originalPrice: e.target.value})}
                        />
                        <p className="text-[10px] text-zinc-400 mt-1">If set, selling price will be shown as discount.</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Category</label>
                      <select 
                        className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none"
                        value={productForm.category}
                        onChange={e => setProductForm({...productForm, category: e.target.value})}
                      >
                        {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Image URL</label>
                      <input 
                        type="text" 
                        className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none" 
                        placeholder="https://..."
                        value={productForm.image}
                        onChange={e => setProductForm({...productForm, image: e.target.value})}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold uppercase text-zinc-400">Description</label>
                        <button 
                          type="button"
                          onClick={handleAiGenerateDescription}
                          disabled={isAiGenerating}
                          className="text-[10px] font-bold text-gold flex items-center gap-1 hover:text-gold-dark disabled:opacity-50"
                        >
                          <Sparkles size={10} /> {isAiGenerating ? 'Generating...' : 'AI Generate'}
                        </button>
                      </div>
                      <textarea 
                        className="w-full p-3 bg-zinc-50 border border-gold-light rounded-xl focus:ring-2 focus:ring-gold outline-none h-24"
                        value={productForm.description}
                        onChange={e => setProductForm({...productForm, description: e.target.value})}
                      ></textarea>
                    </div>
                    <button className="w-full py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold-dark transition-all shadow-lg shadow-gold/20">
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </button>
                  </form>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
