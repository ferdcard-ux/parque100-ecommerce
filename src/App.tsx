import { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import {
  RouterProvider,
  createBrowserRouter,
  isRouteErrorResponse,
  Link,
  Navigate,
  Outlet,
  useLocation,
  useRouteError,
} from 'react-router';
import { useCartController } from './controllers/use-cart-controller';
import { usePaymentController } from './controllers/use-payment-controller';
import { useProductController } from './controllers/use-product-controller';
import { useAuthController } from './controllers/use-auth-controller';
import { useUserDeliveryController } from './controllers/use-user-delivery-controller';
import { RootLayout } from './views/components/layout/RootLayout';
import { HomePage } from './views/pages/HomePage';
import { CartPage } from './views/pages/CartPage';
import { LoginPage } from './views/pages/LoginPage';
import { AddressPage } from './views/pages/AddressPage';
import { PaymentMethodPage } from './views/pages/PaymentMethodPage';
import { CardPaymentPage } from './views/pages/CardPaymentPage';
import { PaymentSuccessPage } from './views/pages/PaymentSuccessPage';
import { AdminInventoryPage } from './views/pages/AdminInventoryPage';
import { AdminDashboardPage } from './views/pages/AdminDashboardPage';
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
import { SiteDisclaimerGate } from './views/components/auth/SiteDisclaimerGate';
import { activityService } from './services/activity.service';
import type { User, UserRole, LoginCredentials, RegisterData, DeliveryAddress, PaymentMethodType, PaymentModeState, Product, CartItem, Category, UnitOfMeasure, AdminProduct, Order, ProductCreate, ProductUpsert } from './models';

/* ── Context Definition ── */
interface AppContextValue {
  user: User | null;
  sessions: User[];
  switchSession: (id: number) => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  userRole: UserRole | null;
  isDomiciliario: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: { firstName: string; lastName: string; email: string; phone: string; photo?: string | null }) => Promise<User>;  cartItems: CartItem[];
  changePassword: (email: string, currentPassword: string, newPassword: string) => Promise<void>;
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartShipping: number;
  cartTotal: number;
  products: Product[];
  categories: Category[];
  units: UnitOfMeasure[];
  unitCatalogError: string | null;
  adminProducts: AdminProduct[];
  deleteAdminProduct: (id: number) => Promise<void>;
  createAdminProduct: (data: ProductCreate) => Promise<void>;
  updateAdminProduct: (id: string, data: ProductUpsert) => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  updateCategory: (id: number, name: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  createUnit: (name: string) => Promise<void>;
  updateUnit: (id: number, name: string) => Promise<void>;
  deleteUnit: (id: number) => Promise<void>;
  reloadProducts: () => Promise<void>;
  fetchInventoryRows: () => Promise<any[]>;
  paymentMethod: PaymentMethodType | null;
  paymentMode: PaymentModeState;
  selectPaymentMethod: (m: PaymentMethodType) => void;
  saveAddress: (addr: DeliveryAddress) => void;
  isPaymentProcessing: boolean;
  lastOrder: Order | null;
  payWithCash: (tendered: number) => Promise<void>;
  startDemoPayment: (method: Exclude<PaymentMethodType, 'cash'>) => Promise<string>;
  cancelDemoPayment: (reference: string) => Promise<void>;
  payWithDemo: (method: Exclude<PaymentMethodType, 'cash'>, reference: string) => Promise<void>;
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

/**
 * Protege rutas operativas (pedidos): admin total o domiciliario.
 * El cliente solo accede a su flujo de compras, perfil y sus compras.
 */
function RequireStaff({ children }: { children: React.JSX.Element }) {
  const { isLoggedIn, isAdmin, isDomiciliario } = useApp();
  const location = useLocation();
  if (!isLoggedIn) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (!isAdmin && !isDomiciliario) return <Navigate to="/" replace />;
  return children;
}

function Protected({ children }: { children: React.JSX.Element }) {
  return <RequireAuth>{children}</RequireAuth>;
}

function LayoutWrapper() {
  const { cartCount, isAdmin, isDomiciliario, isLoggedIn, user, sessions, switchSession, logout } = useApp();
  const { pathname } = useLocation();
  /** Cada navegacion arranca arriba: evita heredar el scroll de la pagina anterior. */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return <RootLayout cartCount={cartCount} isAdmin={isAdmin || isDomiciliario} isLoggedIn={isLoggedIn} user={user} userRole={user?.role ?? null} sessions={sessions} onSwitchSession={switchSession} onLogout={logout} />;
}

function HomeWrapper() { const { addToCart, user } = useApp(); return <HomePage onAddToCart={addToCart} userId={user?.id ?? null} />; }
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
function AccountAddressWrapper() {
  const { user, cartCount, cartTotal } = useApp();
  const delivery = useUserDeliveryController(user?.id ?? null);
  return (
    <Protected><AddressPage
      mode="account"
      user={user}
      deliveryDetails={delivery.details}
      isLoadingProfile={user !== null && delivery.isLoading}
      isSaving={delivery.isSaving}
      loadError={delivery.loadError}
      saveError={delivery.saveError}
      onRetryLoad={delivery.loadDetails}
      onSaveDetails={delivery.saveDetails}
      onAddressSubmit={() => {}}
      itemCount={cartCount}
      total={cartTotal}
    /></Protected>
  );
}
function PaymentMethodWrapper() { const ctx = useApp(); return <Protected><PaymentMethodPage selectedMethod={ctx.paymentMethod} paymentMode={ctx.paymentMode} onSelectMethod={ctx.selectPaymentMethod} itemCount={ctx.cartCount} total={ctx.cartTotal} /></Protected>; }
function CardPaymentWrapper() { const ctx = useApp(); return <Protected><CardPaymentPage total={ctx.cartTotal} itemCount={ctx.cartCount} isProcessing={ctx.isPaymentProcessing} paymentMode={ctx.paymentMode} onPayCash={ctx.payWithCash} onStartDemo={ctx.startDemoPayment} onCancelDemo={ctx.cancelDemoPayment} onPayDemo={ctx.payWithDemo} /></Protected>; }
function AdminWrapper() { const ctx = useApp(); return <AdminInventoryPage products={ctx.adminProducts} catalogProducts={ctx.products} categories={ctx.categories} units={ctx.units} unitCatalogError={ctx.unitCatalogError} onDelete={ctx.deleteAdminProduct} onCreate={ctx.createAdminProduct} onUpdate={ctx.updateAdminProduct} onImported={ctx.reloadProducts} onFetchRows={ctx.fetchInventoryRows} onCreateCategory={ctx.createCategory} onUpdateCategory={ctx.updateCategory} onDeleteCategory={ctx.deleteCategory} onCreateUnit={ctx.createUnit} onUpdateUnit={ctx.updateUnit} onDeleteUnit={ctx.deleteUnit} />; }
function AccountWrapper() { return <Protected><AccountPage /></Protected>; }
function ProfileWrapper() { return <Protected><ProfilePage /></Protected>; }
function OrdersWrapper() { return <Protected><OrdersPage /></Protected>; }
function OrderDetailWrapper() { return <Protected><OrderDetailPage /></Protected>; }
function FavoritesWrapper() { return <Protected><FavoritesPage /></Protected>; }
function PaymentSuccessWrapper() { return <Protected><PaymentSuccessPage /></Protected>; }

function AppErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main className="grid min-h-screen place-items-center bg-[#F5F5F5] px-4">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-bold text-[#212121]">
          {notFound ? 'Página no encontrada' : 'No fue posible cargar el sitio'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {notFound
            ? 'La dirección solicitada no corresponde a una página disponible.'
            : 'Ocurrió un error inesperado. Puedes volver al inicio e intentarlo de nuevo.'}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-[#C62828] px-5 py-3 font-semibold text-white"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}

function IndexRedirect() {
  const { search } = useLocation();
  const requested = new URLSearchParams(search).get('next');
  let destination = '/';

  if (requested) {
    try {
      const url = new URL(requested, window.location.origin);
      if (url.origin === window.location.origin
        && !url.pathname.startsWith('/access.html')
        && url.pathname !== '/index.html') {
        destination = `${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      destination = '/';
    }
  }

  return <Navigate to={destination} replace />;
}

/* ── App Component ── */
function AppDataProvider() {
  const auth = useAuthController();
  const cart = useCartController(auth.user ? String(auth.user.id) : 'guest');
  const payment = usePaymentController();
  const productCtrl = useProductController();

  const handlePayWithCash = async (tendered: number) => {
    await payment.processCash(tendered, cart.total, cart.items, auth.user?.id ?? null);
    cart.clearItems();
    payment.reset();
  };

  const handlePayWithDemo = useCallback(async (method: Exclude<PaymentMethodType, 'cash'>, reference: string) => {
    await payment.processDemo(method, cart.items, reference, auth.user?.id ?? null);
    cart.clearItems();
    payment.reset();
  }, [payment.processDemo, payment.reset, cart.items, cart.clearItems, auth.user?.id]);

  const handleStartDemoPayment = useCallback(
    (method: Exclude<PaymentMethodType, 'cash'>) => payment.startDemo(method),
    [payment.startDemo],
  );

  const handleCancelDemoPayment = useCallback(
    (reference: string) => payment.cancelDemo(reference),
    [payment.cancelDemo],
  );

  /** Agrega al carrito solo con sesion; si no, redirige al login con retorno. */
  const handleAddToCart = useCallback((product: Product) => {
    if (!auth.isLoggedIn) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
      return;
    }
    const existing = cart.items.find((item) => item.id === product.id);
    const willAdd = product.stock > 0
      && (!existing || existing.quantity < product.stock);
    cart.addItem(product);
    if (willAdd) activityService.recordInteraction('cart.add', product.id);
  }, [auth.isLoggedIn, cart]);

  const handleRemoveFromCart = useCallback((id: number) => {
    const exists = cart.items.some((item) => item.id === id);
    cart.removeItem(id);
    if (exists) activityService.recordInteraction('cart.remove', id);
  }, [cart.items, cart.removeItem]);

  const contextValue: AppContextValue = useMemo(() => ({
    user: auth.user,
    sessions: auth.sessions,
    switchSession: auth.switchSession,
    isLoggedIn: auth.isLoggedIn,
    isAdmin: auth.isAdmin,
    userRole: auth.user?.role ?? null,
    isDomiciliario: (auth.user?.role ?? null) === 'domiciliario',
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    updateProfile: auth.updateProfile,
    changePassword: auth.changePassword,
    cartItems: cart.items,
    addToCart: handleAddToCart,
    removeFromCart: handleRemoveFromCart,
    updateQuantity: cart.updateQuantity,
    clearCart: cart.clearItems,
    cartCount: cart.itemCount,
    cartSubtotal: cart.subtotal,
    cartShipping: cart.shipping,
    cartTotal: cart.total,
    products: productCtrl.products,
    categories: productCtrl.categories,
    units: productCtrl.units,
    unitCatalogError: productCtrl.unitCatalogError,
    adminProducts: productCtrl.adminProducts,
    deleteAdminProduct: productCtrl.deleteProduct,
    createAdminProduct: productCtrl.createProduct,
    updateAdminProduct: productCtrl.updateProduct,
    createCategory: productCtrl.createCategory,
    updateCategory: productCtrl.updateCategory,
    deleteCategory: productCtrl.deleteCategory,
    createUnit: productCtrl.createUnit,
    updateUnit: productCtrl.updateUnit,
    deleteUnit: productCtrl.deleteUnit,
    reloadProducts: productCtrl.reload,
    fetchInventoryRows: productCtrl.getInventoryRows,
    paymentMethod: payment.method,
    paymentMode: payment.paymentMode,
    selectPaymentMethod: payment.selectMethod,
    saveAddress: payment.saveAddress,
    isPaymentProcessing: payment.isProcessing,
    lastOrder: payment.lastOrder,
    payWithCash: handlePayWithCash,
    startDemoPayment: handleStartDemoPayment,
    cancelDemoPayment: handleCancelDemoPayment,
    payWithDemo: handlePayWithDemo,
  }), [
    auth.user, auth.sessions, auth.switchSession, auth.isLoggedIn, auth.isAdmin, auth.updateProfile,
    auth.changePassword,
    cart.items, cart.itemCount, cart.subtotal, cart.shipping, cart.total, handleAddToCart,
    productCtrl.products, productCtrl.categories, productCtrl.units, productCtrl.unitCatalogError, productCtrl.adminProducts,
    productCtrl.createCategory, productCtrl.updateCategory, productCtrl.deleteCategory,
    productCtrl.createUnit, productCtrl.updateUnit, productCtrl.deleteUnit,
    payment.method, payment.paymentMode, payment.isProcessing, handleStartDemoPayment,
    handleCancelDemoPayment, handlePayWithDemo,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      <Outlet />
    </AppContext.Provider>
  );
}

export default function App() {
  const router = useMemo(() => createBrowserRouter([
    {
      Component: SiteDisclaimerGate,
      errorElement: <AppErrorBoundary />,
      children: [
        {
          Component: AppDataProvider,
          children: [
            {
              path: '/',
              Component: LayoutWrapper,
              children: [
                { index: true, Component: HomeWrapper },
                { path: 'cart', Component: CartWrapper },
                { path: 'address', Component: AddressWrapper },
                { path: 'direccion', Component: AccountAddressWrapper },
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
            { path: '/index.html', Component: IndexRedirect },
            { path: '/register', Component: () => <Navigate to="/access.html" replace /> },
            { path: '/payment-success', Component: PaymentSuccessWrapper },
            { path: '/admin', Component: () => <RequireStaff><AdminDashboardPage /></RequireStaff> },
            { path: '/admin/inventario', Component: () => <RequireAdmin><AdminWrapper /></RequireAdmin> },
            { path: '/admin/pedidos-pendientes', Component: () => <RequireStaff><AdminPendingOrdersPage /></RequireStaff> },
            { path: '/admin/pedidos', Component: () => <RequireStaff><AdminOrdersPage /></RequireStaff> },
            { path: '/admin/pedidos/:id', Component: () => <RequireStaff><AdminOrderDetailPage /></RequireStaff> },
            { path: '/admin/reportes', Component: () => <RequireAdmin><AdminReportsPage /></RequireAdmin> },
            { path: '/admin/clientes', Component: () => <RequireAdmin><AdminClientsPage /></RequireAdmin> },
            { path: '/admin/configuracion', Component: () => <RequireAdmin><AdminSettingsPage /></RequireAdmin> },
          ],
        },
      ],
    },
  ]), []);

  return <RouterProvider router={router} />;
}
