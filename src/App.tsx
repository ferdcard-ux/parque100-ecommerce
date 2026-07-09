import { createContext, useContext, useMemo, useEffect } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { useCartController } from './controllers/use-cart-controller';
import { usePaymentController } from './controllers/use-payment-controller';
import { useProductController } from './controllers/use-product-controller';
import { useAuthController } from './controllers/use-auth-controller';
import { RootLayout } from './views/components/layout/RootLayout';
import { HomePage } from './views/pages/HomePage';
import { CartPage } from './views/pages/CartPage';
import { LoginPage } from './views/pages/LoginPage';
import { RegisterPage } from './views/pages/RegisterPage';
import { AddressPage } from './views/pages/AddressPage';
import { PaymentMethodPage } from './views/pages/PaymentMethodPage';
import { CardPaymentPage } from './views/pages/CardPaymentPage';
import { PaymentSuccessPage } from './views/pages/PaymentSuccessPage';
import { AdminInventoryPage } from './views/pages/AdminInventoryPage';
import type { CardPaymentData, User, LoginCredentials, RegisterData, DeliveryAddress, PaymentMethodType, Product, CartItem, AdminProduct } from './models';

/* ── Context Definition ── */
interface AppContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartShipping: number;
  cartTotal: number;
  products: Product[];
  adminProducts: AdminProduct[];
  deleteAdminProduct: (id: number) => void;
  createAdminProduct: (data: {
    ID_Producto: string;
    Nombre: string;
    Descripcion: string;
    Imagen?: string;
    Precio_Venta: number;
    Stock_Minimo: number;
    ID_Categoria: number;
  }) => Promise<void>;
  updateAdminProduct: (id: string, data: {
    Nombre: string;
    Descripcion: string;
    Imagen?: string;
    Precio_Venta: number;
    Stock_Minimo: number;
    ID_Categoria: number;
  }) => Promise<void>;
  paymentMethod: PaymentMethodType | null;
  selectPaymentMethod: (m: PaymentMethodType) => void;
  saveAddress: (addr: DeliveryAddress) => void;
  isPaymentProcessing: boolean;
  payWithCard: (data: CardPaymentData) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within App provider');
  return ctx;
}

/* ── Route Components (have access to context via useApp) ── */
function LayoutWrapper() {
  const { cartCount, isAdmin, isLoggedIn, user, logout } = useApp();
  return <RootLayout cartCount={cartCount} isAdmin={isAdmin} isLoggedIn={isLoggedIn} user={user} onLogout={logout} />;
}

function HomeWrapper() { const { addToCart } = useApp(); return <HomePage onAddToCart={addToCart} />; }
function CartWrapper() { const ctx = useApp(); return <CartPage items={ctx.cartItems} products={ctx.products} subtotal={ctx.cartSubtotal} shipping={ctx.cartShipping} total={ctx.cartTotal} onRemove={ctx.removeFromCart} onUpdateQuantity={ctx.updateQuantity} />; }
function AddressWrapper() { const { saveAddress } = useApp(); return <AddressPage onAddressSubmit={saveAddress} />; }
function PaymentMethodWrapper() { const ctx = useApp(); return <PaymentMethodPage selectedMethod={ctx.paymentMethod} onSelectMethod={ctx.selectPaymentMethod} />; }
function CardPaymentWrapper() { const ctx = useApp(); return <CardPaymentPage total={ctx.cartTotal} isProcessing={ctx.isPaymentProcessing} onPay={ctx.payWithCard} />; }
function AdminWrapper() { const ctx = useApp(); return <AdminInventoryPage products={ctx.adminProducts} onDelete={ctx.deleteAdminProduct} onCreate={ctx.createAdminProduct} onUpdate={ctx.updateAdminProduct} />; }

/* ── App Component ── */
export default function App() {
  const cart = useCartController();
  const payment = usePaymentController();
  const productCtrl = useProductController();
  const auth = useAuthController();

  const handlePayWithCard = async (data: CardPaymentData) => {
    await payment.processPayment(data, cart.total, cart.items);
    cart.clearItems();
    payment.reset();
  };

  const contextValue: AppContextValue = useMemo(() => ({
    user: auth.user,
    isLoggedIn: auth.isLoggedIn,
    isAdmin: auth.isAdmin,
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    cartItems: cart.items,
    addToCart: cart.addItem,
    removeFromCart: cart.removeItem,
    updateQuantity: cart.updateQuantity,
    clearCart: cart.clearItems,
    cartCount: cart.itemCount,
    cartSubtotal: cart.subtotal,
    cartShipping: cart.shipping,
    cartTotal: cart.total,
    products: productCtrl.products,
    adminProducts: productCtrl.adminProducts,
    deleteAdminProduct: productCtrl.deleteProduct,
    createAdminProduct: productCtrl.createProduct,
    updateAdminProduct: productCtrl.updateProduct,
    paymentMethod: payment.method,
    selectPaymentMethod: payment.selectMethod,
    saveAddress: payment.saveAddress,
    isPaymentProcessing: payment.isProcessing,
    payWithCard: handlePayWithCard,
  }), [
    auth.user, auth.isLoggedIn, auth.isAdmin,
    cart.items, cart.itemCount, cart.subtotal, cart.shipping, cart.total,
    productCtrl.products, productCtrl.adminProducts,
    payment.method, payment.isProcessing,
  ]);

  const router = useMemo(() => createBrowserRouter([
    {
      path: '/',
      Component: LayoutWrapper,
      children: [
        { index: true, Component: HomeWrapper },
        { path: 'cart', Component: CartWrapper },
        { path: 'address', Component: AddressWrapper },
        { path: 'payment-method', Component: PaymentMethodWrapper },
        { path: 'payment-card', Component: CardPaymentWrapper },
      ],
    },
    { path: '/login', Component: LoginPage },
    { path: '/register', Component: RegisterPage },
    { path: '/payment-success', Component: PaymentSuccessPage },
    { path: '/admin', Component: AdminWrapper },
  ]), []);

  return (
    <AppContext.Provider value={contextValue}>
      <RouterProvider router={router} />
    </AppContext.Provider>
  );
}
