/**
 * @fileoverview Barrel de servicios.
 * Punto unico de exportacion de los servicios (capa de acceso a
 * datos) para que controladores y vistas importen desde 'services'.
 */
export { productService } from './product.service';
export { authService } from './auth.service';
export { paymentService } from './payment.service';
export { orderService } from './order.service';
