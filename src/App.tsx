import { createContext, useContext, useMemo, useCallback } from 'react';
import { RouterProvider, createBrowserRouter, Navigate, useLocation } from 'react-router';
import { useCartController } from './controllers/use-cart-controller';
import { usePaymentController } from './controllers/use-payment-controller';
import { useProductController } from './controllers/use-product-controller';
import { useAuthController } from './controllers/use-auth-controller';
import { useUserDeliveryController } from './controllers/use-user-delivery-controller';
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
import { CatalogPage } from './views/pages/CatalogPage';
import { ProductDetailPage } from './views/pages/ProductDetailPage';
import { AccountPage } from './views/pages/AccountPage';
import { ProfilePage } from './views/pages/ProfilePage';
import { OrdersPage } from './views/pages/OrdersPage';
import { OrderDetailPage } from './views/pages/OrderDetailPage';
import { AdminPendingOrdersPage } from './views/pages/AdminPendingOrdersPage';
import { AdminOrdersPage } from './views/pages/AdminOrdersPage';
import { AdminOrderDetailPage } from './views/pages/AdminOrderDetailPage';
import { AdminReportsPage } from './views/pages/AdminReportsPage';
import { AdminClientsPage } from './views/pages/AdminClientsPage';
import { AdminSettingsPage } from './views/pages/AdminSettingsPage';
import { FavoritesPage } from './views/pages/FavoritesPage';
import { HelpPage } from './views/pages/HelpPage';
import { PrivacyPage } from './views/pages/PrivacyPage';
import { TermsPage } from './views/pages/TermsPage';
import { SitemapPage } from './views/pages/SitemapPage';
import type { CardPaymentData, User, LoginCredentials, RegisterData, DeliveryAddress, PaymentMethodType, Product, CartItem, AdminProduct, Order } from './models';

/* ── Context Definition ── */
interface AppContextValue {
  user: User | null;
  sessions: User[];
  switchSession: (id: number) => void;
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
  lastOrder: Order | null;
  payWithCard: (data: CardPaymentData) => Promise<void>;
  payWithNequi: (receiptDataUrl: string) => Promise<void>;
  payWithCash: (tendered: number) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within App provider');
  return ctx;
}

/* ── Route Components (have access to context via useApp) ── */

/** Protege rutas de compra/cuenta: redirige al login con retorno. */
function RequireAuth({ children }: { children: React.JSX.Element }) {
  const { isLoggedIn } = useApp();
  const location = useLocation();
  if (!isLoggedIn) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}

/** Protege el panel admin: solo administradores autenticados. */
function RequireAdmin({ children }: { children: React.JSX.Element }) {
  const { isLoggedIn, isAdmin } = useApp();
  const location = useLocation();
  if (!isLoggedIn) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function Protected({ children }: { children: React.JSX.Element }) {
  return <RequireAuth>{children}</RequireAuth>;
}

function LayoutWrapper() {
  const { cartCount, isAdmin, isLoggedIn, user, sessions, switchSession, logout } = useApp();
  return <RootLayout cartCount={cartCount} isAdmin={isAdmin} isLoggedIn={isLoggedIn} user={user} sessions={sessions} onSwitchSession={switchSession} onLogout={logout} />;
}

function HomeWrapper() { const { addToCart } = useApp(); return <HomePage onAddToCart={addToCart} />; }
function CartWrapper() { const ctx = useApp(); return <Protected><CartPage items={ctx.cartItems} products={ctx.products} subtotal={ctx.cartSubtotal} shipping={ctx.cartShipping} total={ctx.cartTotal} onRemove={ctx.removeFromCart} onUpdateQuantity={ctx.updateQuantity} /></Protected>; }
function AddressWrapper() {
  const { user, saveAddress, cartCount, cartTotal } = useApp();
  const delivery = useUserDeliveryController(user?.id ?? null);
  return (
    <Protected><AddressPage
      user={user}
      deliveryDetails={delivery.details}
      isLoadingProfile={user !== null && delivery.isLoading}
      isSaving={delivery.isSaving}
      loadError={delivery.loadError}
      saveError={delivery.saveError}
      onRetryLoad={delivery.loadDetails}
      onSaveDetails={delivery.saveDetails}
      onAddressSubmit={saveAddress}
      itemCount={cartCount}
      total={cartTotal}
    /></Protected>
  );
}
function PaymentMethodWrapper() { const ctx = useApp(); return <Protected><PaymentMethodPage selectedMethod={ctx.paymentMethod} onSelectMethod={ctx.selectPaymentMethod} itemCount={ctx.cartCount} total={ctx.cartTotal} /></Protected>; }
function CardPaymentWrapper() { const ctx = useApp(); return <Protected><CardPaymentPage total={ctx.cartTotal} itemCount={ctx.cartCount} isProcessing={ctx.isPaymentProcessing} onPay={ctx.payWithCard} onPayNequi={ctx.payWithNequi} onPayCash={ctx.payWithCash} /></Protected>; }
function AdminWrapper() { const ctx = useApp(); return <AdminInventoryPage products={ctx.adminProducts} onDelete={ctx.deleteAdminProduct} onCreate={ctx.createAdminProduct} onUpdate={ctx.updateAdminProduct} />; }
function AccountWrapper() { return <Protected><AccountPage /></Protected>; }
function ProfileWrapper() { return <Protected><ProfilePage /></Protected>; }
function OrdersWrapper() { return <Protected><OrdersPage /></Protected>; }
function OrderDetailWrapper() { return <Protected><OrderDetailPage /></Protected>; }
function FavoritesWrapper() { return <Protected><FavoritesPage /></Protected>; }

/* ── App Component ── */
export default function App() {
  const auth = useAuthController();
  const cart = useCartController(auth.user ? String(auth.user.id) : 'guest');
  const payment = usePaymentController();
  const productCtrl = useProductController();

  const handlePayWithCard = async (data: CardPaymentData) => {
    await payment.processPayment(data, cart.total, cart.items, auth.user?.id ?? null);
    cart.clearItems();
    payment.reset();
  };

  const handlePayWithNequi = async (receiptDataUrl: string) => {
    await payment.processNequi(receiptDataUrl, cart.total, cart.items, auth.user?.id ?? null);
    cart.clearItems();
    payment.reset();
  };

  const handlePayWithCash = async (tendered: number) => {
    await payment.processCash(tendered, cart.total, cart.items, auth.user?.id ?? null);
    cart.clearItems();
    payment.reset();
  };

  /** Agrega al carrito solo con sesion; si no, redirige al login con retorno. */
  const handleAddToCart = useCallback((product: Product) => {
    if (!auth.isLoggedIn) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
      return;
    }
    cart.addItem(product);
  }, [auth.isLoggedIn, cart]);

  const contextValue: AppContextValue = useMemo(() => ({
    user: auth.user,
    sessions: auth.sessions,
    switchSession: auth.switchSession,
    isLoggedIn: auth.isLoggedIn,
    isAdmin: auth.isAdmin,
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    cartItems: cart.items,
    addToCart: handleAddToCart,
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
    lastOrder: payment.lastOrder,
    payWithCard: handlePayWithCard,
    payWithNequi: handlePayWithNequi,
    payWithCash: handlePayWithCash,
  }), [
    auth.user, auth.sessions, auth.switchSession, auth.isLoggedIn, auth.isAdmin,
    cart.items, cart.itemCount, cart.subtotal, cart.shipping, cart.total, handleAddToCart,
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
        { path: 'catalogo', Component: CatalogPage },
        { path: 'producto/:id', Component: ProductDetailPage },
        { path: 'cuenta', Component: AccountWrapper },
        { path: 'perfil', Component: ProfileWrapper },
        { path: 'compras', Component: OrdersWrapper },
        { path: 'compras/:id', Component: OrderDetailWrapper },
        { path: 'favoritos', Component: FavoritesWrapper },
        { path: 'ayuda', Component: HelpPage },
        { path: 'privacidad', Component: PrivacyPage },
        { path: 'terminos', Component: TermsPage },
        { path: 'mapa-sitio', Component: SitemapPage },
      ],
    },
    { path: '/login', Component: LoginPage },
    { path: '/register', Component: RegisterPage },
    { path: '/payment-success', Component: PaymentSuccessPage },
    { path: '/admin', Component: () => <RequireAdmin><AdminWrapper /></RequireAdmin> },
    { path: '/admin/pedidos-pendientes', Component: () => <RequireAdmin><AdminPendingOrdersPage /></RequireAdmin> },
    { path: '/admin/pedidos', Component: () => <RequireAdmin><AdminOrdersPage /></RequireAdmin> },
    { path: '/admin/pedidos/:id', Component: () => <RequireAdmin><AdminOrderDetailPage /></RequireAdmin> },
    { path: '/admin/reportes', Component: () => <RequireAdmin><AdminReportsPage /></RequireAdmin> },
    { path: '/admin/clientes', Component: () => <RequireAdmin><AdminClientsPage /></RequireAdmin> },
    { path: '/admin/configuracion', Component: () => <RequireAdmin><AdminSettingsPage /></RequireAdmin> },
  ]), []);

  return (
    <AppContext.Provider value={contextValue}>
      <RouterProvider router={router} />
    </AppContext.Provider>
  );
}
