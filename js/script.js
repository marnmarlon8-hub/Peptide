// =============================================
// LABSOURCED — MAIN SCRIPT (script.js)
// Handles: Welcome, Cart Drawer, Mobile Menu, Header scroll
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  initWelcome();
  initMobileMenu();
  initCartDrawer();
  initHeader();
  applyTranslations();
  updateLangCurrDisplay();
});

// =============================================
// WELCOME MODAL
// =============================================
function initWelcome() {
  const overlay = document.getElementById('welcome-overlay');
  if (!overlay) return;

  // Check if already seen
  if (LS.get('prefs_set')) {
    overlay.classList.add('hidden');
    return;
  }

  // Language selection
  const langOpts = document.querySelectorAll('#lang-options .welcome-opt');
  langOpts.forEach(btn => {
    btn.addEventListener('click', () => {
      langOpts.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Currency selection
  const currOpts = document.querySelectorAll('#currency-options .welcome-opt');
  currOpts.forEach(btn => {
    btn.addEventListener('click', () => {
      currOpts.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Confirm & Age Verification
  const confirmBtn = document.getElementById('welcome-confirm');
  const ageVerify = document.getElementById('ageVerifyCheckbox');

  if (ageVerify && confirmBtn) {
    ageVerify.addEventListener('change', (e) => {
      if (e.target.checked) {
        confirmBtn.classList.remove('disabled');
      } else {
        confirmBtn.classList.add('disabled');
      }
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (ageVerify && !ageVerify.checked) return;

      const lang = document.querySelector('#lang-options .welcome-opt.active')?.dataset.val || 'en';
      const currBtn = document.querySelector('#currency-options .welcome-opt.active');
      const currency = currBtn?.dataset.val || 'USD';
      const symbol = currBtn?.dataset.symbol || '$';
      const rate = parseFloat(currBtn?.dataset.rate) || 1;
      const country = document.getElementById('country-select')?.value || '';

      Prefs.set(lang, currency, country, rate, symbol);
      LS.set('prefs_set', true);

      overlay.style.opacity = '0';
      setTimeout(() => overlay.classList.add('hidden'), 400);

      applyTranslations();
      updateLangCurrDisplay();
      updateFreeShippingBar();
    });
  }
}

function reopenWelcome() {
  LS.remove('prefs_set');
  location.reload();
}
window.reopenWelcome = reopenWelcome;

function updateLangCurrDisplay() {
  const lang = Prefs.getLang().toUpperCase();
  const curr = Prefs.getCurrency();
  const el = document.getElementById('currentLang');
  const el2 = document.getElementById('currentCurrency');
  const footer = document.getElementById('footerLangCurr');
  if (el) el.textContent = lang;
  if (el2) el2.textContent = curr;
  if (footer) footer.textContent = `${lang} / ${curr}`;
}

function updateFreeShippingBar() {
  const el = document.getElementById('free-ship-amount');
  if (el) el.textContent = formatPrice(150);
}

// =============================================
// MOBILE MENU
// =============================================
function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const nav = document.getElementById('mobileNav');
  const closeBtn = document.getElementById('mobileCloseBtn');

  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    nav.classList.toggle('open');
    btn.classList.toggle('active');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.classList.remove('active');
    });
  }

  // Close on link click
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.classList.remove('active');
    });
  });
}

// =============================================
// CART DRAWER
// =============================================
function initCartDrawer() {
  const cartBtn = document.getElementById('cartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartCloseBtn = document.getElementById('cartCloseBtn');

  if (!cartBtn) return;

  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCart();
  }

  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  cartBtn.addEventListener('click', openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
}

function renderCart() {
  const items = Cart.getItems();
  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const cartTotal = document.getElementById('cartTotal');

  if (!cartItems) return;

  if (!items.length) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🧪</div>
        <p>${t('empty_cart')}</p>
        <a href="shop.html" class="btn btn-primary" style="margin-top:1rem;display:inline-block;">${t('shop')}</a>
      </div>`;
    if (cartFooter) cartFooter.style.display = 'none';
    return;
  }

  cartItems.innerHTML = items.map(item => `
    <div class="cart-item" data-vid="${item.variation_id}">
      <img class="cart-item-img" src="${item.image_url || 'assets/images/bpc157.png'}" alt="${item.product_name}" onerror="this.src='assets/images/bpc157.png'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.product_name}</div>
        <div class="cart-item-variation">${item.variation_label}</div>
        <div class="cart-item-price">${formatPrice(item.price_usd * item.quantity)}</div>
        <div class="cart-item-actions">
          <button class="cart-qty-btn" onclick="cartQty('${item.variation_id}', ${item.quantity - 1})">−</button>
          <span class="cart-qty-num">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="cartQty('${item.variation_id}', ${item.quantity + 1})">+</button>
          <button class="cart-remove-btn" onclick="cartRemove('${item.variation_id}')" title="${t('remove')}">✕ ${t('remove')}</button>
        </div>
      </div>
    </div>`).join('');

  if (cartFooter) cartFooter.style.display = 'block';
  if (cartTotal) cartTotal.textContent = formatPrice(Cart.getTotal());
}

function cartQty(variationId, qty) {
  if (qty < 1) {
    Cart.removeItem(variationId);
  } else {
    Cart.updateQuantity(variationId, qty);
  }
  renderCart();
}
window.cartQty = cartQty;

function cartRemove(variationId) {
  Cart.removeItem(variationId);
  renderCart();
}
window.cartRemove = cartRemove;

// =============================================
// HEADER SCROLL EFFECT
// =============================================
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// =============================================
// NEWSLETTER
// =============================================
function handleNewsletter(e) {
  e.preventDefault();
  const email = document.getElementById('newsletterEmail')?.value;
  if (email) {
    showToast('Thank you for subscribing!', 'success');
    document.getElementById('newsletterForm').reset();
  }
}
window.handleNewsletter = handleNewsletter;

// =============================================
// LIVE CHAT (TAWK.TO)
// =============================================
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/6ab9d67a82874034480849fa/1k3iurjp9';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
