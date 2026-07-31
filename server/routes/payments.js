const express = require('express');
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { pool } = require('../config/database');
const axios = require('axios');
const router = express.Router();

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

// @route   POST /api/payments/create
// @desc    Create a payment request
router.post('/create', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    
    const prices = {
      premium: 9.99,
      vip: 19.99
    };

    const price = prices[plan];
    if (!price) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    // Create payment in NowPayments
    const paymentData = {
      price_amount: price,
      price_currency: 'usd',
      pay_currency: 'USDT',
      order_id: `order_${req.user.id}_${Date.now()}`,
      order_description: `DateFi ${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
      ipn_callback_url: `${process.env.NOWPAYMENTS_WEBHOOK_URL || 'http://localhost:5000'}/api/payments/webhook`,
      success_url: 'http://localhost:3000/payment/success',
      cancel_url: 'http://localhost:3000/payment/cancel'
    };

    const response = await axios.post('https://api.nowpayments.io/v1/payment', paymentData, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const payment = await Payment.create({
      user_id: req.user.id,
      plan,
      amount: price,
      currency: 'USD',
      payment_id: response.data.payment_id,
      order_id: response.data.order_id
    });

    res.json({
      paymentId: payment.payment_id,
      payAddress: response.data.pay_address,
      amount: price,
      currency: 'USD',
      orderId: response.data.order_id,
      paymentUrl: response.data.payment_url
    });
  } catch (error) {
    console.error('Payment creation error:', error.message);
    res.status(500).json({ message: 'Failed to create payment', error: error.message });
  }
});

// @route   GET /api/payments/history
// @desc    Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.getHistory(req.user.id);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/payments/webhook
// @desc    NowPayments IPN webhook
router.post('/webhook', async (req, res) => {
  try {
    const paymentData = req.body;
    
    const payment = await Payment.findByPaymentId(paymentData.payment_id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment status
    await Payment.updateStatus(paymentData.payment_id, paymentData.payment_status, paymentData.txid);
    await Payment.updateWebhookData(paymentData.payment_id, paymentData);

    // If payment is finished, upgrade user subscription
    if (paymentData.payment_status === 'finished') {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);

      await User.updateSubscription(payment.user_id, payment.plan, endDate);
      
      const io = req.app.get('io');
      if (io) {
        io.to(payment.user_id.toString()).emit('subscription_upgraded', {
          plan: payment.plan,
          endDate: endDate
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

module.exports = router;