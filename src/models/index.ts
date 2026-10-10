/**
 * @fileoverview Barrel de modelos.
 * Punto unico de exportacion de los tipos del dominio para que el
 * resto de capas importe desde 'models' sin conocer archivos internos.
 */
export type { Product, Category, AdminProduct, InventoryStatus } from './product';
export type { CartItem } from './cart';
export type { User, UserDeliveryDetails, AuthState, LoginCredentials, RegisterData, UserRole } from './user';
export type { DeliveryAddress, Order, PaymentMethodType, OrderStatus, OrderEstado, ApiOrder, ApiOrderItem } from './order';
export type { CardPaymentData, PaymentResult } from './payment';
export type { Business, BusinessUpdate } from './business';
export type { Rating, RatingCreate, RatingSummary, RatingType } from './rating';
