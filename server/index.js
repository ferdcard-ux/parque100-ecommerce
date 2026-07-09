import express from 'express';
import cors from 'cors';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import authRouter from './routes/auth.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payments.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api', productsRouter);
app.use('/api', categoriesRouter);
app.use('/api', authRouter);
app.use('/api', ordersRouter);
app.use('/api', paymentsRouter);

app.listen(PORT, () => {
  console.log(`Servidor backend en http://localhost:${PORT}`);
});
