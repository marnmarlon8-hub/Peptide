// =============================================
// LABSOURCED — SHOP PAGE (shop.js)
// =============================================

const STATIC_PRODUCTS = [
  { id:'b1000000-0000-0000-0000-000000000001', name:'BPC-157', slug:'bpc-157', category_slug:'recovery', img:'assets/images/bpc157.png', vars:[{id:'v1',label:'5mg',price:45},{id:'v2',label:'10mg',price:80},{id:'v3',label:'15mg',price:110}], badge:'Best Seller', reviews:128, is_bestseller:true, is_featured:true },
  { id:'b1000000-0000-0000-0000-000000000002', name:'TB-500', slug:'tb-500', category_slug:'recovery', img:'assets/images/tb500.png', vars:[{id:'v4',label:'5mg',price:55},{id:'v5',label:'10mg',price:95}], badge:'Best Seller', reviews:95, is_bestseller:true, is_featured:false },
  { id:'b1000000-0000-0000-0000-000000000003', name:'CJC-1295', slug:'cjc-1295', category_slug:'performance', img:'assets/images/cjc1295.png', vars:[{id:'v6',label:'2mg',price:40},{id:'v7',label:'5mg',price:85}], badge:'Featured', reviews:112, is_bestseller:false, is_featured:true },
  { id:'b1000000-0000-0000-0000-000000000004', name:'Ipamorelin', slug:'ipamorelin', category_slug:'performance', img:'assets/images/ipamorelin.png', vars:[{id:'v8',label:'2mg',price:35},{id:'v9',label:'5mg',price:70}], badge:'Featured', reviews:156, is_bestseller:false, is_featured:true },
  { id:'b1000000-0000-0000-0000-000000000005', name:'Semaglutide', slug:'semaglutide', category_slug:'longevity', img:'assets/images/semaglutide.png', vars:[{id:'va',label:'3mg',price:85},{id:'vb',label:'5mg',price:120}], badge:'', reviews:210, is_bestseller:true, is_featured:false },
  { id:'b1000000-0000-0000-0000-000000000006', name:'Tirzepatide', slug:'tirzepatide', category_slug:'longevity', img:'assets/images/tirzepatide.png', vars:[{id:'vc',label:'5mg',price:110},{id:'vd',label:'10mg',price:185}], badge:'', reviews:185, is_bestseller:true, is_featured:false }
];

let allProducts = [];
let allVariations = {};
let currentCat = '';

async function loadShopProducts() {
  const urlParams = new URLSearchParams(window.location.search);
  currentCat = urlParams.get('cat') || '';

  // Highlight active category filter
  if (currentCat) {
    document.querySelectorAll('.cat-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === currentCat);
    });
  }

  try {
    const filter = { 'is_active': 'eq.true' };
    const products = await db.query('products', {
      select: 'id,name,slug,image_urls,short_description,is_featured,is_bestseller,category_id',
      filter,
      order: 'sort_order.asc'
    });

    const variations = await db.query('product_variations', {
      select: 'id,product_id,label,price_usd',
      filter: { 'is_available': 'eq.true' },
      order: 'sort_order.asc'
    });

    const categories = await db.query('categories', { select: 'id,slug', filter: { 'is_active': 'eq.true' } });
    const catMap = {};
    categories.forEach(c => catMap[c.id] = c.slug);

    allProducts = products.map(p => ({
      ...p,
      category_slug: catMap[p.category_id] || '',
      img: localStorage.getItem(`admin_prod_img_${p.id}`) || (p.image_urls && p.image_urls[0]) || 'assets/images/bpc157.png',
      vars: variations.filter(v => v.product_id === p.id).map(v => ({ id: v.id, label: v.label, price: parseFloat(v.price_usd) }))
    }));

  } catch(e) {
    console.warn('Using static fallback:', e);
    allProducts = STATIC_PRODUCTS;
  }

  filterAndRender();
}

function filterAndRender() {
  const searchQuery = document.getElementById('shopSearch')?.value.toLowerCase() || '';
  const sortVal = document.getElementById('sortSelect')?.value || 'sort_order.asc';

  let filtered = allProducts.filter(p => {
    const matchCat = !currentCat || p.category_slug === currentCat;
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery) || (p.short_description || '').toLowerCase().includes(searchQuery);
    return matchCat && matchSearch;
  });

  // Sort
  if (sortVal === 'name.asc') filtered.sort((a,b) => a.name.localeCompare(b.name));
  if (sortVal === 'name.desc') filtered.sort((a,b) => b.name.localeCompare(a.name));

  renderProducts(filtered);
}

function renderProducts(products) {
  const grid = document.getElementById('shopProductGrid');
  const count = document.getElementById('shopCount');
  if (!grid) return;
  if (count) count.textContent = `${products.length} product${products.length !== 1 ? 's' : ''} found`;

  if (!products.length) {
    grid.innerHTML = `<div class="shop-no-results"><h3>No Products Found</h3><p>Try a different category or search term.</p></div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const firstVar = p.vars[0];
    const badge = p.is_bestseller ? '<span class="product-badge">Best Seller</span>' : (p.is_featured ? '<span class="product-badge product-badge--featured">Featured</span>' : '');
    const prices = p.vars.map(v => v.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const priceRange = minPrice === maxPrice ? formatPrice(minPrice) : `From ${formatPrice(minPrice)}`;

    return `
      <div class="product-card" id="prod-${p.id}">
        <div class="product-image-wrapper">
          ${badge}
          <a href="product.html?slug=${p.slug}"><img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.src='assets/images/bpc157.png'"></a>
          <div class="product-quick-actions">
            <a href="product.html?slug=${p.slug}" class="qa-btn" title="View Details">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </a>
          </div>
        </div>
        <div class="product-info">
          <div class="rating">★★★★★ <span>(${Math.floor(Math.random()*100+80)})</span></div>
          <a href="product.html?slug=${p.slug}" class="product-name-link"><h3 class="product-name">${p.name}</h3></a>
          ${p.short_description ? `<p class="product-short-desc">${p.short_description}</p>` : ''}
          ${p.vars.length > 0 ? `
          <div class="product-variation-select" data-product-id="${p.id}">
            <select class="var-dropdown" onchange="selectVarDropdown(this, '${p.id}')">
              <option value="" disabled selected>Select Size</option>
              ${p.vars.map(v => `<option value="${v.id}" data-price="${v.price}" data-label="${v.label}">${v.label} — ${formatPrice(v.price)}</option>`).join('')}
            </select>
          </div>` : ''}
          <p class="product-price" id="price-${p.id}">${priceRange}</p>
          <button class="btn btn-primary add-to-cart" onclick="addToCartShop('${p.id}','${p.name}','${p.img}')">${t('add_to_cart')}</button>
        </div>
      </div>`;
  }).join('');
}

function selectVarDropdown(select, productId) {
  const option = select.options[select.selectedIndex];
  const priceEl = document.getElementById(`price-${productId}`);
  if (priceEl && option.value) {
    priceEl.textContent = formatPrice(parseFloat(option.dataset.price));
  }
}
window.selectVarDropdown = selectVarDropdown;

function addToCartShop(productId, productName, imgSrc) {
  const card = document.getElementById(`prod-${productId}`);
  const select = card?.querySelector('.var-dropdown');
  
  if (select) {
    if (!select.value) {
      showToast('Please select a specific size/gram before adding to cart', 'info');
      select.style.borderColor = '#e74c3c';
      select.style.boxShadow = '0 0 0 2px rgba(231,76,60,0.2)';
      setTimeout(() => { select.style.borderColor = ''; select.style.boxShadow = ''; }, 2500);
      return;
    }
    const option = select.options[select.selectedIndex];
    Cart.addItem({
      product_id: productId,
      variation_id: option.value,
      product_name: productName,
      variation_label: option.dataset.label,
      price_usd: parseFloat(option.dataset.price),
      quantity: 1,
      image_url: imgSrc
    });
  }

  showToast(`${productName} added to cart!`, 'success');

  const addBtn = card?.querySelector('.add-to-cart');
  if (addBtn) {
    const orig = addBtn.textContent;
    addBtn.textContent = '✓ Added!';
    addBtn.style.background = '#C8A96A';
    setTimeout(() => { addBtn.textContent = orig; addBtn.style.background = ''; }, 1500);
  }
}
window.addToCartShop = addToCartShop;

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadShopProducts();

  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat;
      filterAndRender();
    });
  });

  document.getElementById('sortSelect')?.addEventListener('change', filterAndRender);

  let searchTimer;
  document.getElementById('shopSearch')?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(filterAndRender, 300);
  });

  updateFreeShippingBar();
});
