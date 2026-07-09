import { Router } from 'express';

const router = Router();

router.post('/payments/process', async (req, res) => {
  const { cardNumber, expiryDate, cvv, amount } = req.body;

  if (!cardNumber || !expiryDate || !cvv || !amount) {
    return res.status(400).json({ error: 'Datos de pago incompletos' });
  }

  const success = Math.random() > 0.1;

  if (success) {
    res.json({
      success: true,
      transactionId: 'TXN-' + Date.now(),
      message: 'Pago procesado exitosamente'
    });
  } else {
    res.status(402).json({
      success: false,
      message: 'La transaccion fue rechazada'
    });
  }
});

export default router;
