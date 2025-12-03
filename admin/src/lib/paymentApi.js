const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const PAYMENT_ENDPOINT = `${API_URL}/payments`;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export async function getPayments() {
  const res = await fetch(PAYMENT_ENDPOINT, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch payments');
  return res.json();
}

export async function getPayment(id) {
  const res = await fetch(`${PAYMENT_ENDPOINT}/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch payment');
  return res.json();
}

export async function createPayment(payment) {
  const res = await fetch(PAYMENT_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payment),
  });
  if (!res.ok) throw new Error('Failed to create payment');
  return res.json();
}

export async function updatePayment(id, payment) {
  const res = await fetch(`${PAYMENT_ENDPOINT}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payment),
  });
  if (!res.ok) throw new Error('Failed to update payment');
  return res.json();
}

export async function deletePayment(id) {
  const res = await fetch(`${PAYMENT_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete payment');
  return res.json();
}

// PhonePe specific functions
export async function initiatePhonePePayment(paymentData) {
  const res = await fetch(`${PAYMENT_ENDPOINT}/phonepe/initiate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(paymentData),
  });
  if (!res.ok) throw new Error('Failed to initiate PhonePe payment');
  return res.json();
}

export async function checkPhonePeStatus(merchantTransactionId) {
  const res = await fetch(`${PAYMENT_ENDPOINT}/phonepe/status/${merchantTransactionId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to check PhonePe payment status');
  return res.json();
} 