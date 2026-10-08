// =============================================
// LABSOURCED — CHECKOUT (checkout.js)
// =============================================

const MIN_ORDER_USD = 190;   // Minimum order value in USD
const SHIPPING_FEE_USD = 35; // Flat shipping fee
let currentStep = 1;

// Promo code state
let appliedPromo = null;  // { code, discount_percent }

document.addEventListener('DOMContentLoaded', () => {
  renderSummary();
  if (Cart.getItems().length === 0) {
    window.location.href = 'shop.html';
  }

  // Allow pressing Enter in promo code input
  const promoInput = document.getElementById('promoCodeInput');
  if (promoInput) {
    promoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); applyPromoCode(); }
    });
  }
});

function getDiscountedSubtotal() {
  const subtotal = Cart.getTotal();
  if (appliedPromo) {
    const discount = subtotal * (appliedPromo.discount_percent / 100);
    return subtotal - discount;
  }
  return subtotal;
}

function getOrderTotal() {
  return getDiscountedSubtotal() + SHIPPING_FEE_USD;
}

// Keep old name as alias for compatibility
function getDiscountedTotal() { return getOrderTotal(); }

function renderSummary() {
  const items = Cart.getItems();
  const summaryItems = document.getElementById('summaryItems');
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryTotal = document.getElementById('summaryTotal');
  const currencyNote = document.getElementById('summaryCurrencyNote');
  const minOrderNotice = document.getElementById('minOrderNotice');

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

  const subtotal = Cart.getTotal();
  const discountedSubtotal = getDiscountedSubtotal();
  const orderTotal = getOrderTotal();

  if (summarySubtotal) summarySubtotal.textContent = formatPrice(subtotal);
  if (summaryTotal) summaryTotal.textContent = formatPrice(orderTotal);

  // Update shipping display
  const shippingEl = document.getElementById('summaryShipping');
  if (shippingEl) shippingEl.textContent = formatPrice(SHIPPING_FEE_USD);

  // Show/hide promo discount row
  const promoRow = document.getElementById('promoDiscountRow');
  const promoAmountEl = document.getElementById('promoDiscountAmount');
  const promoCodeAppliedEl = document.getElementById('promoCodeApplied');
  if (promoRow && promoAmountEl) {
    if (appliedPromo) {
      const discountAmt = subtotal * (appliedPromo.discount_percent / 100);
      promoRow.style.display = '';
      promoAmountEl.textContent = `-${formatPrice(discountAmt)}`;
      if (promoCodeAppliedEl) promoCodeAppliedEl.textContent = appliedPromo.code;
    } else {
      promoRow.style.display = 'none';
    }
  }

  // Minimum order notice
  if (minOrderNotice) {
    minOrderNotice.style.display = subtotal < MIN_ORDER_USD ? '' : 'none';
  }

  const curr = Prefs.getCurrency();
  if (currencyNote && curr !== 'USD') {
    currencyNote.textContent = `Displayed in ${curr}. Payment processed in USD.`;
  }
}

// =============================================
// PROMO CODE
// =============================================
async function applyPromoCode() {
  const input = document.getElementById('promoCodeInput');
  const msgEl = document.getElementById('promoMessage');
  const applyBtn = document.getElementById('applyPromoBtn');
  const code = (input?.value || '').trim().toUpperCase();

  if (!code) {
    showPromoMessage('Please enter a promo code.', 'error');
    return;
  }

  applyBtn.textContent = '...';
  applyBtn.disabled = true;

  try {
    // Fetch promo from Supabase — match code case-insensitively
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/promo_codes?code=ilike.${encodeURIComponent(code)}&is_active=eq.true&select=*`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const promos = await res.json();
    const promo = Array.isArray(promos) ? promos[0] : null;

    if (!promo) {
      appliedPromo = null;
      showPromoMessage('Invalid or expired promo code.', 'error');
      renderSummary();
      return;
    }

    // Check expiry
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      appliedPromo = null;
      showPromoMessage('This promo code has expired.', 'error');
      renderSummary();
      return;
    }

    // Check max uses
    if (promo.max_uses !== null && promo.usage_count >= promo.max_uses) {
      appliedPromo = null;
      showPromoMessage('This promo code has reached its usage limit.', 'error');
      renderSummary();
      return;
    }

    // Apply!
    appliedPromo = { id: promo.id, code: promo.code.toUpperCase(), discount_percent: parseFloat(promo.discount_percent) };
    showPromoMessage(`✓ Code "${appliedPromo.code}" applied! ${appliedPromo.discount_percent}% discount.`, 'success');
    renderSummary();
  } catch (e) {
    console.error('Promo code error:', e);
    showPromoMessage('Could not verify promo code. Please try again.', 'error');
  } finally {
    applyBtn.textContent = 'Apply';
    applyBtn.disabled = false;
  }
}
window.applyPromoCode = applyPromoCode;

function removePromoCode() {
  appliedPromo = null;
  const input = document.getElementById('promoCodeInput');
  if (input) input.value = '';
  showPromoMessage('', '');
  renderSummary();
}
window.removePromoCode = removePromoCode;

function showPromoMessage(msg, type) {
  const el = document.getElementById('promoMessage');
  if (!el) return;
  el.textContent = msg;
  el.className = `promo-message${type ? ' promo-msg-' + type : ''}`;
}

// =============================================
// STEP NAVIGATION
// =============================================
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
    // ── Minimum order check ──
    const subtotal = Cart.getTotal();
    if (subtotal < MIN_ORDER_USD) {
      showToast(`Minimum order is $${MIN_ORDER_USD.toFixed(2)}. Please add more items to your cart.`, 'error');
      return false;
    }

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

  const subtotal = Cart.getTotal();
  const discountedSubtotal = getDiscountedSubtotal();
  const orderTotal = getOrderTotal();
  const hasDiscount = appliedPromo && discountedSubtotal < subtotal;

  container.innerHTML = `
    <div class="order-review-section">
      <h4>Items Ordered</h4>
      ${items.map(item => `
        <div class="or-row">
          <span>${item.product_name} (${item.variation_label}) × ${item.quantity}</span>
          <strong>${formatPrice(item.price_usd * item.quantity)}</strong>
        </div>`).join('')}
      ${hasDiscount ? `
        <div class="or-row" style="color:#888;">
          <span>Subtotal</span><strong>${formatPrice(subtotal)}</strong>
        </div>
        <div class="or-row" style="color:#C8A96A;">
          <span>Promo Discount (${appliedPromo.code} — ${appliedPromo.discount_percent}% off)</span>
          <strong>-${formatPrice(subtotal * appliedPromo.discount_percent / 100)}</strong>
        </div>` : `
        <div class="or-row" style="color:#888;">
          <span>Subtotal</span><strong>${formatPrice(subtotal)}</strong>
        </div>`}
      <div class="or-row" style="color:#555;">
        <span>Shipping</span><strong>${formatPrice(SHIPPING_FEE_USD)}</strong>
      </div>
      <div class="or-row" style="border-top:1px solid #eee;padding-top:.75rem;margin-top:.5rem;font-weight:700;">
        <span>Total (incl. shipping)</span><strong>${formatPrice(orderTotal)}</strong>
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

  // Final minimum order check
  const subtotal = Cart.getTotal();
  if (subtotal < MIN_ORDER_USD) {
    showToast(`Minimum order is $${MIN_ORDER_USD.toFixed(2)}. Please add more items.`, 'error');
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

  const finalTotal = getOrderTotal();
  const discountedSubtotal = getDiscountedSubtotal();
  const discountAmt = subtotal - discountedSubtotal;

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
    subtotal_usd: subtotal,
    shipping_usd: SHIPPING_FEE_USD,
    total_usd: finalTotal,
    promo_code: appliedPromo ? appliedPromo.code : null,
    promo_discount_percent: appliedPromo ? appliedPromo.discount_percent : null,
    promo_discount_amount: appliedPromo ? parseFloat(discountAmt.toFixed(2)) : null,
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

      // Increment promo code usage
      if (appliedPromo?.id) {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/promo_codes?id=eq.${appliedPromo.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ usage_count: (await getPromoUsageCount(appliedPromo.id)) + 1 })
          });
        } catch(e) { /* non-critical */ }
      }
    }

    // Save order for invoice generation
    LS.set('last_order_data', JSON.stringify({ order: orderData, items: items }));

    // Show success
    Cart.clear();
    showSuccess(trackingCode);
    
    // Send emails asynchronously
    sendInvoiceEmail(orderData, items);
  } catch(err) {
    console.error('Order error:', err);
    // Still show success with tracking code (graceful fallback)
    LS.set('last_order_data', JSON.stringify({ order: orderData, items: items }));
    Cart.clear();
    showSuccess(trackingCode);
    sendInvoiceEmail(orderData, items);
  }
}
window.placeOrder = placeOrder;

async function getPromoUsageCount(promoId) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/promo_codes?id=eq.${promoId}&select=usage_count`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }});
    const data = await res.json();
    return data[0]?.usage_count || 0;
  } catch(e) { return 0; }
}

async function sendInvoiceEmail(order, items) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.tracking_code}`;
  const shippingAmt = (order.shipping_usd || SHIPPING_FEE_USD).toFixed(2);
  const subtotalAmt = parseFloat(order.subtotal_usd).toFixed(2);
  const totalAmt = parseFloat(order.total_usd).toFixed(2);

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #eee;font-size:14px;">${item.product_name} <span style="color:#888;">(${item.variation_label})</span></td>
      <td style="padding:12px 14px;border-bottom:1px solid #eee;text-align:center;font-size:14px;">${item.quantity}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:600;">$${(item.price_usd * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const promoRow = order.promo_code ? `
    <tr>
      <td colspan="2" style="padding:8px 14px;text-align:right;color:#C8A96A;font-size:13px;">Promo (${order.promo_code} — ${order.promo_discount_percent}% off):</td>
      <td style="padding:8px 14px;text-align:right;color:#C8A96A;font-size:13px;">-$${parseFloat(order.promo_discount_amount).toFixed(2)}</td>
    </tr>` : '';

  const htmlContent = `
    <div style="font-family:'Inter',Helvetica,Arial,sans-serif;max-width:620px;margin:0 auto;background:#fff;border:1px solid #e0e8e8;border-radius:12px;overflow:hidden;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#06332F 0%,#0b4a43 100%);padding:32px 40px;text-align:center;">
        <h1 style="color:#fff;margin:0 0 4px 0;font-size:30px;font-weight:700;">Labsourced</h1>
        <p style="color:rgba(200,169,106,0.9);margin:0;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">Premium Research Peptides</p>
      </div>

      <div style="padding:32px 40px;">

        <!-- Order info box -->
        <div style="background:#f7fbfb;border:1px solid #e0e8e8;border-radius:8px;padding:18px 22px;margin-bottom:28px;">
          <h2 style="color:#06332F;margin:0 0 14px 0;font-size:17px;border-bottom:1px solid #e0e8e8;padding-bottom:10px;">Order Confirmation &amp; Invoice</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:4px 0;color:#888;width:150px;">Tracking Number</td><td style="padding:4px 0;font-weight:700;color:#06332F;">${order.tracking_code}</td></tr>
            <tr><td style="padding:4px 0;color:#888;">Order Date</td><td style="padding:4px 0;">${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</td></tr>
            <tr><td style="padding:4px 0;color:#888;">Customer</td><td style="padding:4px 0;">${order.full_name}</td></tr>
            <tr><td style="padding:4px 0;color:#888;">Shipping To</td><td style="padding:4px 0;">${order.address}, ${order.city}, ${order.country}</td></tr>
            <tr><td style="padding:4px 0;color:#888;">Payment Method</td><td style="padding:4px 0;font-weight:600;">${order.payment_method}</td></tr>
          </table>
        </div>

        <!-- Items table -->
        <h3 style="color:#06332F;font-size:15px;margin:0 0 10px 0;">Items Ordered</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#06332F;color:#fff;">
              <th style="padding:11px 14px;text-align:left;font-weight:600;font-size:13px;">Product</th>
              <th style="padding:11px 14px;text-align:center;font-weight:600;font-size:13px;">Qty</th>
              <th style="padding:11px 14px;text-align:right;font-weight:600;font-size:13px;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            ${promoRow}
            <tr><td colspan="2" style="padding:8px 14px;text-align:right;color:#888;font-size:13px;">Subtotal:</td><td style="padding:8px 14px;text-align:right;color:#888;font-size:13px;">$${subtotalAmt}</td></tr>
            <tr><td colspan="2" style="padding:8px 14px;text-align:right;color:#888;font-size:13px;">Shipping:</td><td style="padding:8px 14px;text-align:right;color:#888;font-size:13px;">$${shippingAmt}</td></tr>
            <tr style="background:#f7fbfb;border-top:2px solid #06332F;">
              <td colspan="2" style="padding:14px;text-align:right;font-weight:700;color:#06332F;font-size:16px;">Grand Total (USD):</td>
              <td style="padding:14px;text-align:right;font-weight:700;color:#06332F;font-size:16px;">$${totalAmt}</td>
            </tr>
          </tfoot>
        </table>

        <!-- PAYMENT INSTRUCTIONS — CRITICAL -->
        <div style="background:linear-gradient(135deg,#041f1c 0%,#06332F 100%);border-radius:12px;padding:26px 28px;margin-bottom:28px;">
          <h3 style="margin:0 0 14px 0;font-size:16px;color:#C8A96A;">&#9889; Action Required: Complete Your Payment</h3>
          <p style="margin:0 0 16px 0;font-size:14px;line-height:1.75;color:rgba(255,255,255,0.88);">
            Thank you for your order, <strong style="color:#fff;">${order.full_name}</strong>. Your research order is currently
            <strong style="color:#C8A96A;">pending payment</strong>. To finalise your order, please send
            <strong style="color:#C8A96A;">$${totalAmt} USD</strong> via <strong style="color:#fff;">${order.payment_method}</strong>.
          </p>
          <div style="background:rgba(200,169,106,0.12);border:1.5px solid rgba(200,169,106,0.45);border-radius:10px;padding:16px 20px;text-align:center;margin-bottom:16px;">
            <p style="margin:0 0 4px 0;font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.15em;">Text or Message Us to Confirm Payment</p>
            <p style="margin:0;font-size:26px;font-weight:700;color:#C8A96A;letter-spacing:2px;">(661) 293-7097</p>
          </div>
          <p style="margin:0;font-size:12.5px;color:rgba(255,255,255,0.6);line-height:1.7;">
            &#128274; <em>For security and swift processing, please include your order tracking number
            <strong style="color:#C8A96A;">${order.tracking_code}</strong> in your message.
            All transactions are handled with complete discretion. Your order will be dispatched within 24&#8211;48 hours of payment confirmation.</em>
          </p>
        </div>

        <!-- QR -->
        <div style="text-align:center;margin-bottom:28px;">
          <p style="color:#888;font-size:13px;margin-bottom:10px;">Scan to Track Your Order</p>
          <img src="${qrUrl}" alt="Tracking QR Code" style="border:1px solid #e0e0e0;border-radius:6px;padding:6px;background:#fff;" width="110" height="110">
          <p style="color:#aaa;font-size:11px;margin-top:6px;">${order.tracking_code}</p>
        </div>

      </div>

      <!-- Footer -->
      <div style="background:#f7fbfb;border-top:1px solid #e0e8e8;padding:20px 40px;text-align:center;color:#aaa;font-size:12px;">
        <p style="margin:0 0 4px 0;">&#9879; All compounds are for <em>in vitro</em> / laboratory research use only. Not for human or animal administration.</p>
        <p style="margin:0;">Labsourced &nbsp;|&nbsp; support@labsourced.co &nbsp;|&nbsp; (661) 293-7097</p>
      </div>
    </div>
  `;

  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Labsourced <support@labsourced.co>',
        to: [order.email, 'support@labsourced.co'],
        subject: `Labsourced Invoice — Order ${order.tracking_code} | Action Required`,
        html: htmlContent
      })
    });
  } catch(e) {
    console.error('Email send failed', e);
  }
}


function showSuccess(trackingCode) {
  document.querySelectorAll('.checkout-step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step5').classList.add('active');

  const display = document.getElementById('trackingDisplay');
  if (display) {
    display.innerHTML = `
      <div class="td-label">Your Tracking Number</div>
      <div class="td-code">${trackingCode}</div>
      <div style="margin-top: 2rem;">
        <a href="invoice.html?track=${trackingCode}" target="_blank" class="btn btn-outline" style="border-color:#C8A96A;color:#C8A96A;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download Invoice
        </a>
      </div>
    `;
  }

  // Save tracking to localStorage
  LS.set('last_tracking', trackingCode);

  // Update step indicators
  document.querySelectorAll('.co-step').forEach(s => s.classList.add('completed'));
}
