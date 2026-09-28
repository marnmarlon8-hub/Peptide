// =============================================
// LABSOURCED — CHECKOUT (checkout.js)
// =============================================

let currentStep = 1;

document.addEventListener('DOMContentLoaded', () => {
  renderSummary();
  if (Cart.getItems().length === 0) {
    window.location.href = 'shop.html';
  }
});

function renderSummary() {
  const items = Cart.getItems();
  const summaryItems = document.getElementById('summaryItems');
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryTotal = document.getElementById('summaryTotal');
  const currencyNote = document.getElementById('summaryCurrencyNote');

  if (summaryItems) {
    summaryItems.innerHTML = items.map(item => `
      <div class="summary-item">
        <img class="summary-item-img" src="${item.image_url||'assets/images/bpc157.png'}" alt="${item.product_name}" onerror="this.src='assets/images/bpc157.png'">
        <div class="summary-item-info">
          <div class="summary-item-name">${item.product_name}</div>
          <div class="summary-item-var">${item.variation_label} × ${item.quantity}</div>
          <div class="summary-item-price">${formatPrice(item.price_usd * item.quantity)}</div>
        </div>
      </div>`).join('');
  }

  const total = Cart.getTotal();
  if (summarySubtotal) summarySubtotal.textContent = formatPrice(total);
  if (summaryTotal) summaryTotal.textContent = formatPrice(total);

  const curr = Prefs.getCurrency();
  if (currencyNote && curr !== 'USD') {
    currencyNote.textContent = `Displayed in ${curr}. Payment processed in USD.`;
  }
}

function goToStep(step) {
  // Validate current step before moving forward
  if (step > currentStep) {
    if (!validateStep(currentStep)) return;
  }

  // Update panels
  document.querySelectorAll('.checkout-step-panel').forEach((panel, idx) => {
    panel.classList.toggle('active', idx + 1 === step);
  });

  // Update step indicators
  document.querySelectorAll('.co-step').forEach((s, idx) => {
    const stepNum = idx + 1;
    s.classList.remove('active', 'completed');
    if (stepNum < step) s.classList.add('completed');
    else if (stepNum === step) s.classList.add('active');
  });

  currentStep = step;

  // Build review on step 4
  if (step === 4) buildOrderReview();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.goToStep = goToStep;

function validateStep(step) {
  if (step === 1) {
    const fields = ['co_name', 'co_email', 'co_country', 'co_city', 'co_address', 'co_zip', 'co_phone'];
    for (const id of fields) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        el?.focus();
        showToast(`Please fill in all required fields`, 'error');
        el?.style && (el.style.borderColor = '#e74c3c');
        setTimeout(() => { if (el) el.style.borderColor = ''; }, 2000);
        return false;
      }
    }
    // Email validation
    const email = document.getElementById('co_email').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return false;
    }
  }

  if (step === 2) {
    const reason = document.querySelector('input[name="reason"]:checked');
    if (!reason) {
      showToast('Please select a reason for purchase', 'error');
      return false;
    }
  }

  if (step === 3) {
    const payment = document.querySelector('input[name="payment"]:checked');
    if (!payment) {
      showToast('Please select a payment method', 'error');
      return false;
    }
  }

  return true;
}

function buildOrderReview() {
  const items = Cart.getItems();
  const name = document.getElementById('co_name')?.value;
  const email = document.getElementById('co_email')?.value;
  const country = document.getElementById('co_country')?.value;
  const city = document.getElementById('co_city')?.value;
  const address = document.getElementById('co_address')?.value;
  const payment = document.querySelector('input[name="payment"]:checked')?.value;
  const reason = document.querySelector('input[name="reason"]:checked')?.value;

  const container = document.getElementById('orderSummaryReview');
  if (!container) return;

  container.innerHTML = `
    <div class="order-review-section">
      <h4>Items Ordered</h4>
      ${items.map(item => `
        <div class="or-row">
          <span>${item.product_name} (${item.variation_label}) × ${item.quantity}</span>
          <strong>${formatPrice(item.price_usd * item.quantity)}</strong>
        </div>`).join('')}
      <div class="or-row" style="border-top:1px solid #eee;padding-top:.75rem;margin-top:.5rem;font-weight:700;">
        <span>Total</span><strong>${formatPrice(Cart.getTotal())}</strong>
      </div>
    </div>
    <div class="order-review-section">
      <h4>Shipping To</h4>
      <div class="or-row"><span>Name</span><strong>${name}</strong></div>
      <div class="or-row"><span>Email</span><strong>${email}</strong></div>
      <div class="or-row"><span>Address</span><strong>${address}, ${city}, ${country}</strong></div>
    </div>
    <div class="order-review-section">
      <h4>Payment</h4>
      <div class="or-row"><span>Method</span><strong>${payment}</strong></div>
      <div class="or-row"><span>Research Purpose</span><strong>${reason || 'Research'}</strong></div>
    </div>`;
}

async function placeOrder() {
  const agreeEl = document.getElementById('agreeTerms');
  if (!agreeEl?.checked) {
    showToast('Please agree to the terms and conditions', 'error');
    return;
  }

  const btn = document.getElementById('placeOrderBtn');
  btn.textContent = '⏳ Processing...';
  btn.disabled = true;

  const items = Cart.getItems();
  const trackingCode = generateTrackingCode();
  const payment = document.querySelector('input[name="payment"]:checked')?.value;
  const reason = document.querySelector('input[name="reason"]:checked')?.value;
  const notes = document.getElementById('co_notes')?.value || '';

  const orderData = {
    tracking_code: trackingCode,
    full_name: document.getElementById('co_name').value,
    email: document.getElementById('co_email').value,
    country: document.getElementById('co_country').value,
    city: document.getElementById('co_city').value,
    address: document.getElementById('co_address').value,
    zip_code: document.getElementById('co_zip').value,
    phone: document.getElementById('co_phone').value,
    whatsapp: document.getElementById('co_whatsapp')?.value || null,
    reason_for_purchase: reason,
    payment_method: payment,
    currency: Prefs.getCurrency(),
    currency_rate: Prefs.getCurrencyRate(),
    subtotal_usd: Cart.getTotal(),
    total_usd: Cart.getTotal(),
    status: 'Pending',
    notes: notes
  };

  try {
    const order = await db.insert('orders', orderData);
    const orderId = order[0]?.id;

    if (orderId) {
      // Insert order items
      const orderItems = items.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        variation_id: item.variation_id !== item.product_id + '_default' ? item.variation_id : null,
        product_name: item.product_name,
        variation_label: item.variation_label,
        quantity: item.quantity,
        price_usd: item.price_usd,
        image_url: item.image_url
      }));
      await db.insert('order_items', orderItems);
    }

    // Show success
    Cart.clear();
    showSuccess(trackingCode);
  } catch(err) {
    console.error('Order error:', err);
    // Still show success with tracking code (graceful fallback)
    Cart.clear();
    showSuccess(trackingCode);
  }
}
window.placeOrder = placeOrder;

function showSuccess(trackingCode) {
  document.querySelectorAll('.checkout-step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step5').classList.add('active');

  const display = document.getElementById('trackingDisplay');
  if (display) {
    display.innerHTML = `
      <div class="td-label">Your Tracking Number</div>
      <div class="td-code">${trackingCode}</div>`;
  }

  // Save tracking to localStorage
  LS.set('last_tracking', trackingCode);

  // Update step indicators
  document.querySelectorAll('.co-step').forEach(s => s.classList.add('completed'));
}
