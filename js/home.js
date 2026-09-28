// =============================================
// LABSOURCED — HOME PAGE (home.js)
// Loads featured products from Supabase
// =============================================

async function loadFeaturedProducts() {
  const grid = document.getElementById('featuredProductGrid');
  if (!grid) return;

  try {
    // Fetch featured/bestseller products
    const products = await db.query('products', {
      select: 'id,name,slug,image_urls,is_featured,is_bestseller,short_description',
      filter: { 'is_active': 'eq.true', 'or': '(is_featured.eq.true,is_bestseller.eq.true)' },
      order: 'sort_order.asc',
      limit: '8'
    });

    if (!products || !products.length) {
      loadStaticFallbackProducts();
      return;
    }

    // Fetch all variations for these products
    const ids = products.map(p => p.id);
    const variations = await db.query('product_variations', {
      select: 'id,product_id,label,price_usd',
      filter: { 'product_id': `in.(${ids.join(',')})`, 'is_available': 'eq.true' },
      order: 'sort_order.asc'
    });

    // Fetch reviews averages
    const reviews = await db.query('reviews', {
      select: 'product_id,rating',
      filter: { 'product_id': `in.(${ids.join(',')})`, 'is_approved': 'eq.true' }
    });

    grid.innerHTML = products.slice(0,6).map(p => {
      const vars = variations.filter(v => v.product_id === p.id);
      const firstVar = vars[0];
      const productReviews = reviews.filter(r => r.product_id === p.id);
      const avgRating = productReviews.length
        ? (productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length).toFixed(1)
        : '5.0';
      // Image priority: Supabase URL first (works on ALL devices), then localStorage cache as fallback
      const imgSrc = ((p.image_urls && p.image_urls[0]) ? p.image_urls[0] : null)
        || localStorage.getItem(`admin_prod_img_${p.id}`)
        || 'assets/images/bpc157.png';
      const badge = p.is_bestseller ? '<span class="product-badge">Best Seller</span>' : (p.is_featured ? '<span class="product-badge product-badge--featured">Featured</span>' : '');
      const varOptions = vars.map((v, i) => `<option value="${v.id}" data-price="${v.price_usd}" data-label="${v.label}"${i === 0 ? ' selected' : ''}>${v.label} — ${formatPrice(v.price_usd)}</option>`).join('');
      const firstPrice = vars[0] ? formatPrice(vars[0].price_usd) : '';

      return `
        <div class="product-card" id="prod-${p.id}">
          <div class="product-image-wrapper">
            ${badge}
            <a href="product.html?slug=${p.slug}">
              <img src="${imgSrc}" alt="${p.name}" loading="lazy" onerror="this.src='assets/images/bpc157.png'">
            </a>
            <div class="product-quick-actions">
              <a href="product.html?slug=${p.slug}" class="qa-btn" title="View Details">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </a>
            </div>
          </div>
          <div class="product-info">
            <div class="rating">
              ${'★'.repeat(Math.round(parseFloat(avgRating)))}${'☆'.repeat(5 - Math.round(parseFloat(avgRating)))}
              <span>(${productReviews.length || Math.floor(Math.random()*100+50)})</span>
            </div>
            <a href="product.html?slug=${p.slug}" class="product-name-link">
              <h3 class="product-name">${p.name}</h3>
            </a>
            ${vars.length > 0 ? `
            <div class="product-var-select-wrap">
              <select class="product-var-dropdown" id="homeVar-${p.id}" onchange="homeUpdatePrice('${p.id}', this)">
                ${varOptions}
              </select>
            </div>` : ''}
            <p class="product-price" id="price-${p.id}">${firstPrice}</p>
            <button class="btn btn-primary add-to-cart" onclick="addToCart('${p.id}', '${p.name}', '${imgSrc}')">
              ${t('add_to_cart')}
            </button>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    console.warn('Failed to load from Supabase, using fallback:', err);
    loadStaticFallbackProducts();
  }
}

function homeUpdatePrice(productId, select) {
  const opt = select.options[select.selectedIndex];
  const priceEl = document.getElementById(`price-${productId}`);
  if (priceEl && opt) priceEl.textContent = formatPrice(parseFloat(opt.dataset.price));
}
window.homeUpdatePrice = homeUpdatePrice;

function selectVar(btn, productId) {
  const container = btn.closest('.product-variation-select');
  container.querySelectorAll('.var-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const priceEl = document.getElementById(`price-${productId}`);
  if (priceEl) priceEl.textContent = formatPrice(parseFloat(btn.dataset.price));
}
window.selectVar = selectVar;

function addToCart(productId, productName, imgSrc) {
  const select = document.getElementById(`homeVar-${productId}`);

  // Supabase-loaded cards (dropdown)
  if (select) {
    const opt = select.options[select.selectedIndex];
    if (!opt || !opt.value) { showToast('Please select a size first', 'info'); return; }
    Cart.addItem({
      product_id: productId,
      variation_id: opt.value,
      product_name: productName,
      variation_label: opt.dataset.label,
      price_usd: parseFloat(opt.dataset.price),
      quantity: 1,
      image_url: imgSrc
    });
    showToast(`${productName} (${opt.dataset.label}) added to cart!`, 'success');
    const addBtn = document.querySelector(`#prod-${productId} .add-to-cart`);
    if (addBtn) {
      const orig = addBtn.innerHTML;
      addBtn.innerHTML = '✓ Added!';
      addBtn.style.background = '#C8A96A';
      setTimeout(() => { addBtn.innerHTML = orig; addBtn.style.background = ''; }, 1500);
    }
    return;
  }

  // Static fallback cards (var-btn buttons)
  const card = document.getElementById(`prod-${productId}`);
  const activeVar = card?.querySelector('.var-btn.active') || card?.querySelector('.var-btn');
  const dosageEl = card?.querySelector('.product-dosage');

  if (!activeVar && !dosageEl) { showToast('Please select a variation', 'info'); return; }

  const variationId = activeVar?.dataset.vid || productId + '_default';
  const priceUsd = parseFloat(activeVar?.dataset.price || card?.querySelector('.product-price')?.dataset.usd || 0);
  const label = activeVar?.dataset.label || dosageEl?.textContent || '';

  Cart.addItem({ product_id: productId, variation_id: variationId, product_name: productName, variation_label: label, price_usd: priceUsd, quantity: 1, image_url: imgSrc });
  showToast(`${productName} added to cart!`, 'success');

  const addBtn = card?.querySelector('.add-to-cart');
  if (addBtn) {
    const orig = addBtn.innerHTML;
    addBtn.innerHTML = '✓ Added!';
    addBtn.style.background = '#C8A96A';
    setTimeout(() => { addBtn.innerHTML = orig; addBtn.style.background = ''; }, 1500);
  }
}
window.addToCart = addToCart;

function loadStaticFallbackProducts() {
  const grid = document.getElementById('featuredProductGrid');
  if (!grid) return;

  const staticProducts = [
    { id:'b1000000-0000-0000-0000-000000000001', name:'BPC-157', slug:'bpc-157', img:'assets/images/bpc157.png', vars:[{id:'v1',label:'5mg',price:45},{id:'v2',label:'10mg',price:80},{id:'v3',label:'15mg',price:110}], badge:'Best Seller', reviews:128 },
    { id:'b1000000-0000-0000-0000-000000000002', name:'TB-500', slug:'tb-500', img:'assets/images/tb500.png', vars:[{id:'v4',label:'5mg',price:55},{id:'v5',label:'10mg',price:95}], badge:'Best Seller', reviews:95 },
    { id:'b1000000-0000-0000-0000-000000000003', name:'CJC-1295', slug:'cjc-1295', img:'assets/images/cjc1295.png', vars:[{id:'v6',label:'2mg',price:40},{id:'v7',label:'5mg',price:85}], badge:'Featured', reviews:112 },
    { id:'b1000000-0000-0000-0000-000000000004', name:'Ipamorelin', slug:'ipamorelin', img:'assets/images/ipamorelin.png', vars:[{id:'v8',label:'2mg',price:35},{id:'v9',label:'5mg',price:70}], badge:'Featured', reviews:156 },
    { id:'b1000000-0000-0000-0000-000000000005', name:'Semaglutide', slug:'semaglutide', img:'assets/images/semaglutide.png', vars:[{id:'va',label:'3mg',price:85},{id:'vb',label:'5mg',price:120}], badge:'', reviews:210 },
    { id:'b1000000-0000-0000-0000-000000000006', name:'Tirzepatide', slug:'tirzepatide', img:'assets/images/tirzepatide.png', vars:[{id:'vc',label:'5mg',price:110},{id:'vd',label:'10mg',price:185}], badge:'', reviews:185 }
  ];

  grid.innerHTML = staticProducts.map(p => {
    const img = localStorage.getItem(`admin_prod_img_${p.id}`) || p.img;
    const varOptions = p.vars.map((v, i) => `<option value="${v.id}" data-price="${v.price}" data-label="${v.label}"${i === 0 ? ' selected' : ''}>${v.label} — ${formatPrice(v.price)}</option>`).join('');
    return `
    <div class="product-card" id="prod-${p.id}">
      <div class="product-image-wrapper">
        ${p.badge ? `<span class="product-badge${p.badge==='Featured'?' product-badge--featured':''}">${p.badge}</span>` : ''}
        <a href="product.html?slug=${p.slug}"><img src="${img}" alt="${p.name}" loading="lazy" onerror="this.src='assets/images/bpc157.png'"></a>
        <div class="product-quick-actions">
          <a href="product.html?slug=${p.slug}" class="qa-btn" title="View Details">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </a>
        </div>
      </div>
      <div class="product-info">
        <div class="rating">★★★★★ <span>(${p.reviews})</span></div>
        <a href="product.html?slug=${p.slug}" class="product-name-link"><h3 class="product-name">${p.name}</h3></a>
        <div class="product-var-select-wrap">
          <select class="product-var-dropdown" id="homeVar-${p.id}" onchange="homeUpdatePrice('${p.id}', this)">
            ${varOptions}
          </select>
        </div>
        <p class="product-price" id="price-${p.id}">${formatPrice(p.vars[0].price)}</p>
        <button class="btn btn-primary add-to-cart" onclick="addToCart('${p.id}','${p.name}','${img}')">${t('add_to_cart')}</button>
      </div>
    </div>`;
  }).join('');
}

// Load categories dynamically
async function loadCategories() {
  try {
    const cats = await db.query('categories', {
      select: 'id,name,slug,image_url',
      filter: { 'is_active': 'eq.true' },
      order: 'sort_order.asc'
    });
    if (!cats || !cats.length) return;
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;
    grid.innerHTML = cats.map(c => {
      // Prefer admin-uploaded image, then Supabase image_url, then static fallback
      const catImg = localStorage.getItem(`admin_cat_img_${c.id}`)
        || c.image_url
        || 'assets/images/performance.png';
      return `
      <a href="shop.html?cat=${c.slug}" class="category-card">
        <img src="${catImg}" alt="${c.name}" loading="lazy" onerror="this.src='assets/images/performance.png'">
        <div class="category-overlay"><h3>${c.name}</h3><span>Shop Now →</span></div>
      </a>`;
    }).join('');
  } catch(e) {
    console.warn('Category load failed, using static fallback');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts();
  loadCategories();
  updateFreeShippingBar();
});
