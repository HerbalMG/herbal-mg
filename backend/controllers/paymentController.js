const sql = require('../config/supabase');
// const phonePeService = require('../services/phonePeService');

exports.getAllPayments = async (req, res) => {
  try {
    const payments = await sql`SELECT * FROM payment ORDER BY id DESC`;
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const [payment] = await sql`SELECT * FROM payment WHERE id = ${req.params.id}`;
    if (!payment) return res.status(404).json({ error: 'Not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPayment = async (req, res) => {
  const { order_id, amount, status, method, payment_date } = req.body;
  try {
    const [payment] = await sql`
      INSERT INTO payment (order_id, amount, status, method, payment_date)
      VALUES (${order_id}, ${amount}, ${status}, ${method}, ${payment_date})
      RETURNING *`;
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePayment = async (req, res) => {
  const { order_id, amount, status, method, payment_date } = req.body;
  try {
    const [payment] = await sql`
      UPDATE payment
      SET order_id=${order_id}, amount=${amount}, status=${status},
          method=${method}, payment_date=${payment_date}, updated_at=NOW()
      WHERE id=${req.params.id}
      RETURNING *`;
    if (!payment) return res.status(404).json({ error: 'Not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const [deleted] = await sql`
      DELETE FROM payment WHERE id=${req.params.id}
      RETURNING *`;
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PhonePe Integration Methods

exports.initiatePhonePePayment = async (req, res) => {
  try {
    const { orderId, amount, userId, mobileNumber } = req.body;

    if (!orderId || !amount || !userId || !mobileNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields: orderId, amount, userId, mobileNumber' 
      });
    }

    const orderData = {
      orderId,
      amount: parseFloat(amount),
      userId,
      mobileNumber
    };

    const result = await phonePeService.initiatePayment(orderData);

    if (result.success) {
      // Store payment record with pending status
      const [payment] = await sql`
        INSERT INTO payment (
          order_id, 
          amount, 
          status, 
          method, 
          merchant_transaction_id,
          payment_date
        )
        VALUES (
          ${orderId}, 
          ${amount}, 
          'PENDING', 
          'PHONEPE',
          ${result.merchantTransactionId},
          NOW()
        )
        RETURNING *`;

      res.json({
        success: true,
        paymentUrl: result.paymentUrl,
        merchantTransactionId: result.merchantTransactionId,
        payment
      });
    } else {
      res.status(400).json({ error: result.error });
    }

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.phonePeCallback = async (req, res) => {
  try {
    const { response } = req.body;
    const xVerify = req.headers['x-verify'];

    if (!response || !xVerify) {
      return res.status(400).json({ error: 'Missing response or verification header' });
    }

    // Verify the callback signature
    const isValid = phonePeService.verifyCallback(xVerify, response);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Decode the response
    const decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString());
    const { merchantTransactionId, transactionId, amount, state, responseCode } = decodedResponse;

    // Update payment status in database
    const status = state === 'COMPLETED' ? 'SUCCESS' : 'FAILED';
    
    const [updatedPayment] = await sql`
      UPDATE payment 
      SET 
        status = ${status},
        transaction_id = ${transactionId},
        response_code = ${responseCode},
        updated_at = NOW()
      WHERE merchant_transaction_id = ${merchantTransactionId}
      RETURNING *`;

    if (updatedPayment && status === 'SUCCESS') {
      // Update order status if payment successful
      await sql`
        UPDATE orders 
        SET payment_status = 'PAID', updated_at = NOW()
        WHERE id = ${updatedPayment.order_id}`;
    }

    res.json({ success: true, status });

  } catch (error) {
    console.error('PhonePe callback error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.checkPaymentStatus = async (req, res) => {
  try {
    const { merchantTransactionId } = req.params;

    const result = await phonePeService.checkPaymentStatus(merchantTransactionId);

    if (result.success) {
      const { state, responseCode, amount, transactionId } = result.data.data;
      
      // Update local payment record
      const status = state === 'COMPLETED' ? 'SUCCESS' : 'FAILED';
      
      const [updatedPayment] = await sql`
        UPDATE payment 
        SET 
          status = ${status},
          transaction_id = ${transactionId || null},
          response_code = ${responseCode},
          updated_at = NOW()
        WHERE merchant_transaction_id = ${merchantTransactionId}
        RETURNING *`;

      res.json({
        success: true,
        status,
        payment: updatedPayment,
        phonePeData: result.data
      });
    } else {
      res.status(400).json({ error: result.error });
    }

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ error: error.message });
  }
};