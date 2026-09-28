// =============================================
// LABSOURCED — PRODUCT DETAIL PAGE (product.js)
// =============================================

const STATIC_PRODUCT_DATA = {
  'bpc-157': { id:'b1000000-0000-0000-0000-000000000001', name:'BPC-157', slug:'bpc-157', category_slug:'recovery', short_description:'Body Protection Compound for accelerated healing and tissue repair.', detailed_description:'BPC-157 is a synthetic peptide consisting of 15 amino acids derived from a protein found in human gastric juice. Widely researched for its regenerative properties including tendon, ligament, and muscle repair. It works by stimulating growth factor expression and angiogenesis.', specifications:{ purity:'99%+', molecular_weight:'1419.5 g/mol', sequence:'Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val', storage:'Lyophilized powder, store at -20°C', origin:'Synthetic' }, image_urls:['assets/images/bpc157.png'], is_featured:true, is_bestseller:true, vars:[{id:'v1',label:'5mg',price_usd:45},{id:'v2',label:'10mg',price_usd:80},{id:'v3',label:'15mg',price_usd:110}] },
  'tb-500': { id:'b1000000-0000-0000-0000-000000000002', name:'TB-500', slug:'tb-500', category_slug:'recovery', short_description:'Thymosin Beta-4 for systemic tissue healing and inflammation reduction.', detailed_description:'TB-500, also known as Thymosin Beta-4, is a naturally occurring 43-amino acid peptide. It promotes healing of wounds and injuries by increasing cell migration via actin modulation and reducing inflammation.', specifications:{ purity:'99%+', molecular_weight:'4963.5 g/mol', storage:'Lyophilized powder, store at -20°C', origin:'Synthetic' }, image_urls:['assets/images/tb500.png'], is_featured:false, is_bestseller:true, vars:[{id:'v4',label:'5mg',price_usd:55},{id:'v5',label:'10mg',price_usd:95}] },
  'cjc-1295': { id:'b1000000-0000-0000-0000-000000000003', name:'CJC-1295', slug:'cjc-1295', category_slug:'performance', short_description:'Growth hormone releasing hormone analogue with extended half-life.', detailed_description:'CJC-1295 is a synthetic analogue of growth hormone-releasing hormone (GHRH). It increases plasma growth hormone and IGF-1 levels by binding to GHRH receptors.', specifications:{ purity:'99%+', molecular_weight:'3647.2 g/mol', storage:'Lyophilized powder, store at -20°C', origin:'Synthetic' }, image_urls:['assets/images/cjc1295.png'], is_featured:true, is_bestseller:false, vars:[{id:'v6',label:'2mg',price_usd:40},{id:'v7',label:'5mg',price_usd:85}] },
  'ipamorelin': { id:'b1000000-0000-0000-0000-000000000004', name:'Ipamorelin', slug:'ipamorelin', category_slug:'performance', short_description:'Selective growth hormone secretagogue with minimal side effects.', detailed_description:'Ipamorelin is a pentapeptide growth hormone secretagogue that selectively stimulates pituitary GH release without affecting cortisol, prolactin, or acetylcholine levels.', specifications:{ purity:'99%+', molecular_weight:'711.9 g/mol', sequence:'Aib-His-D-2-Nal-D-Phe-Lys-NH2', storage:'Lyophilized powder, store at -20°C', origin:'Synthetic' }, image_urls:['assets/images/ipamorelin.png'], is_featured:true, is_bestseller:false, vars:[{id:'v8',label:'2mg',price_usd:35},{id:'v9',label:'5mg',price_usd:70}] },
  'semaglutide': { id:'b1000000-0000-0000-0000-000000000005', name:'Semaglutide', slug:'semaglutide', category_slug:'longevity', short_description:'GLP-1 receptor agonist for metabolic research and weight management studies.', detailed_description:'Semaglutide is a glucagon-like peptide-1 (GLP-1) receptor agonist with high affinity for the GLP-1 receptor. Widely studied for metabolic regulation and appetite modulation.', specifications:{ purity:'99%+', molecular_weight:'4113.6 g/mol', storage:'Lyophilized powder, store at -20°C', origin:'Synthetic' }, image_urls:['assets/images/semaglutide.png'], is_featured:false, is_bestseller:true, vars:[{id:'va',label:'3mg',price_usd:85},{id:'vb',label:'5mg',price_usd:120}] },
  'tirzepatide': { id:'b1000000-0000-0000-0000-000000000006', name:'Tirzepatide', slug:'tirzepatide', category_slug:'longevity', short_description:'Dual GIP/GLP-1 receptor agonist for advanced metabolic research.', detailed_description:'Tirzepatide is a novel dual GIP and GLP-1 receptor agonist. Its dual action mechanism makes it a subject of significant metabolic research interest.', specifications:{ purity:'99%+', molecular_weight:'4813.5 g/mol', storage:'Lyophilized powder, store at -20°C', origin:'Synthetic' }, image_urls:['assets/images/tirzepatide.png'], is_featured:false, is_bestseller:true, vars:[{id:'vc',label:'5mg',price_usd:110},{id:'vd',label:'10mg',price_usd:185}] }
};

let currentProduct = null;
let currentVariation = null;
let currentQty = 1;
let selectedRating = 5;

async function loadProduct() {
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) { window.location.href = 'shop.html'; return; }

  let product = null;
  let variations = [];
  let reviews = [];

  try {
    const products = await db.query('products', {
      select: '*',
      filter: { 'slug': `eq.${slug}`, 'is_active': 'eq.true' }
    });
    if (products && products.length) {
      product = products[0];
      variations = await db.query('product_variations', {
        select: '*', filter: { 'product_id': `eq.${product.id}`, 'is_available': 'eq.true' }, order: 'sort_order.asc'
      });
      reviews = await db.query('reviews', {
        select: '*', filter: { 'product_id': `eq.${product.id}`, 'is_approved': 'eq.true' }, order: 'created_at.desc'
      });
      product.vars = variations.map(v => ({ id: v.id, label: v.label, price_usd: parseFloat(v.price_usd) }));
    }
  } catch(e) {
    console.warn('Using static fallback');
  }

  if (!product) {
    product = STATIC_PRODUCT_DATA[slug];
    if (!product) { window.location.href = 'shop.html'; return; }
    reviews = [
      { reviewer_name:'Dr. James M.', rating:5, title:'Exceptional Quality', body:'The purity and consistency have significantly improved the reliability of our ongoing research. Exceptional quality.', created_at: new Date().toISOString() },
      { reviewer_name:'Sarah T.', rating:5, title:'Perfect Results', body:'Shipping was remarkably fast, and the packaging reflects their premium standards. Yielded perfect analytical results.', created_at: new Date().toISOString() }
    ];
  }

  currentProduct = product;
  currentVariation = product.vars[0];

  renderProductDetail(product, reviews);
  loadRelatedProducts(product);
}

function renderProductDetail(product, reviews) {
  const content = document.getElementById('productDetailContent');
  if (!content) return;

  document.title = `${product.name} | Labsourced`;
  const breadcrumb = document.getElementById('breadcrumbProduct');
  if (breadcrumb) breadcrumb.textContent = product.name;

  const imgSrc = (product.image_urls && product.image_urls[0]) || 'assets/images/bpc157.png';
  const badge = product.is_bestseller ? 'Best Seller' : (product.is_featured ? 'Featured' : '');
  const avgRating = reviews.length ? (reviews.reduce((s,r) => s + r.rating, 0) / reviews.length).toFixed(1) : '5.0';
  const specs = product.specifications || {};
  const coas = product.coa_urls || [];

  // Build COA strip HTML
  const coaStripHtml = coas.length > 0 ? `
    <div class="pd-coa-strip" id="pdCoaStrip">
      <div class="pd-coa-strip-label">
        📋 COA Documents <span>${coas.length}</span>
      </div>
      ${coas.map((url, idx) => {
        const isPdf = url.toLowerCase().includes('.pdf') || url.startsWith('data:application/pdf');
        const isDataUrl = url.startsWith('data:');
        const fileType = isPdf ? 'PDF Certificate' : 'Image Certificate';
        const iconSvg = isPdf
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
        return `
          <div class="pd-coa-thumb" id="pdCoaThumb${idx}" onclick="switchToCoa(${idx})" title="View COA Document ${idx + 1}">
            <div class="pd-coa-thumb-icon${isPdf ? '' : ' img-type'}">${iconSvg}</div>
            <div class="pd-coa-thumb-info">
              <div class="pd-coa-thumb-name">COA Document ${idx + 1}</div>
              <div class="pd-coa-thumb-type">${fileType}</div>
            </div>
            <div class="pd-coa-thumb-open">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>`;
      }).join('')}
    </div>` : '';

  content.className = 'product-detail-layout';
  content.innerHTML = `
    <div class="pd-image-side">
      <div class="pd-back-hint" id="pdBackHint">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Viewing COA — tap product image below to go back
      </div>
      <div class="pd-main-display" id="pdMainDisplay">
        <span class="pd-coa-frame-label" id="pdCoaFrameLabel">COA Document</span>
        <img src="${imgSrc}" alt="${product.name}" id="pdMainImage" class="pd-display-img" onerror="this.src='assets/images/bpc157.png'">
        <div class="pd-coa-frame-wrap" id="pdCoaFrameWrap">
          <!-- COA content rendered here dynamically -->
        </div>
      </div>
      ${coas.length > 0 ? `
      <div class="pd-product-thumb" id="pdProductThumb" onclick="switchToProduct()" title="Back to product view" style="display:none;">
        <img src="${imgSrc}" class="pd-pt-img" alt="${product.name}" onerror="this.src='assets/images/bpc157.png'">
        <div>
          <div class="pd-product-thumb-label">${product.name}</div>
          <div class="pd-product-thumb-sub">Tap to view product image</div>
        </div>
      </div>
      ` : ''}
      ${coaStripHtml}
    </div>
    <div class="pd-info-side">
      ${badge ? `<div class="pd-badge">${badge}</div>` : ''}
      <h1 class="pd-title">${product.name}</h1>
      <div class="pd-rating-row">
        <span class="pd-stars">${'★'.repeat(Math.round(parseFloat(avgRating)))}${'☆'.repeat(5-Math.round(parseFloat(avgRating)))}</span>
        <span class="pd-review-count">${avgRating} (${reviews.length} review${reviews.length !== 1 ? 's' : ''})</span>
      </div>
      <p class="pd-short-desc">${product.short_description || ''}</p>

      <p class="pd-variations-label">Select Size</p>
      <div class="pd-variations-grid" id="pdVariations">
        ${product.vars.map((v,i) => `
          <button class="pd-var-btn${i===0?' active':''}" data-vid="${v.id}" data-price="${v.price_usd}" data-label="${v.label}" onclick="selectPdVar(this)">
            ${v.label}
            <span class="var-price">${formatPrice(v.price_usd)}</span>
          </button>`).join('')}
      </div>

      <div class="pd-price-row">
        <span class="pd-price" id="pdPrice">${formatPrice(product.vars[0]?.price_usd || 0)}</span>
      </div>

      <div class="pd-qty-row">
        <span class="pd-qty-label">Qty</span>
        <div class="pd-qty-ctrl">
          <button class="pd-qty-minus" onclick="changeQty(-1)">−</button>
          <input type="number" class="pd-qty-num" id="pdQty" value="1" min="1" max="99" onchange="currentQty=parseInt(this.value)||1">
          <button class="pd-qty-plus" onclick="changeQty(1)">+</button>
        </div>
      </div>

      <button class="btn btn-primary pd-add-btn" onclick="addProductToCart()">🛒 ${t('add_to_cart')}</button>

      <div class="pd-tabs">
        <div class="pd-tab-nav">
          <button class="pd-tab-btn active" onclick="showTab('description', this)">Description</button>
          <button class="pd-tab-btn" onclick="showTab('specifications', this)">Specifications</button>
          <button class="pd-tab-btn" onclick="showTab('shipping', this)">Shipping</button>
        </div>
        <div class="pd-tab-content active" id="tab-description">
          <p class="pd-desc">${product.detailed_description || product.short_description || ''}</p>
        </div>
        <div class="pd-tab-content" id="tab-specifications">
          <table class="pd-specs-table">
            ${Object.entries(specs).map(([k,v]) => `<tr><td>${k.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</td><td>${v}</td></tr>`).join('')}
            <tr><td>For Research Use</td><td>Only — Not for Human Consumption</td></tr>
          </table>
        </div>
        <div class="pd-tab-content" id="tab-shipping">
          <p class="pd-desc">Free worldwide shipping on orders over ${formatPrice(150)}. Orders processed within 1-3 business days. Estimated delivery: 7-14 business days. All orders shipped in discreet, temperature-controlled packaging.</p>
        </div>
      </div>

      <div class="pd-trust">
        <div class="pd-trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          99%+ Purity Guaranteed
        </div>
        <div class="pd-trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Secure Checkout
        </div>
        <div class="pd-trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Worldwide Shipping
        </div>
      </div>
    </div>`;

  // Store COA urls for switcher
  window._pdCoaUrls = coas;


  // Render reviews
  renderReviews(reviews);
  document.getElementById('reviewsSection').style.display = 'block';

  // Setup star rating input
  initStarRating();
  updateFreeShippingBar();
}

// =============================================
// COA GALLERY SWITCHER
// =============================================
function switchToCoa(idx) {
  const coas = window._pdCoaUrls || [];
  if (!coas[idx]) return;

  const url = coas[idx];
  const display = document.getElementById('pdMainDisplay');
  const frameWrap = document.getElementById('pdCoaFrameWrap');
  const label = document.getElementById('pdCoaFrameLabel');
  const backHint = document.getElementById('pdBackHint');
  const productThumb = document.getElementById('pdProductThumb');

  if (!display || !frameWrap) return;

  // Mark all COA thumbs — clear active, set active on tapped one
  document.querySelectorAll('.pd-coa-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
  });

  // Determine type
  const isPdf = url.toLowerCase().includes('.pdf') || url.startsWith('data:application/pdf');
  const isImg = !isPdf;

  // Build inner content
  if (isPdf) {
    frameWrap.innerHTML = `<iframe src="${url}" title="COA Document ${idx + 1}" style="width:100%;height:100%;border:none;"></iframe>`;
  } else {
    frameWrap.innerHTML = `<img class="coa-img-preview" src="${url}" alt="COA Document ${idx + 1}" onerror="this.style.display='none'">`;
  }

  if (label) label.textContent = `COA Document ${idx + 1}`;

  // Activate coa-active class (CSS transitions handle the fade)
  display.classList.add('coa-active');

  // Show back hint and product thumbnail
  if (backHint) backHint.classList.add('visible');
  if (productThumb) productThumb.style.display = 'flex';
}
window.switchToCoa = switchToCoa;

function switchToProduct() {
  const display = document.getElementById('pdMainDisplay');
  const frameWrap = document.getElementById('pdCoaFrameWrap');
  const backHint = document.getElementById('pdBackHint');
  const productThumb = document.getElementById('pdProductThumb');

  if (display) display.classList.remove('coa-active');
  if (frameWrap) frameWrap.innerHTML = '';
  if (backHint) backHint.classList.remove('visible');
  if (productThumb) productThumb.style.display = 'none';

  // Deactivate all COA thumbs
  document.querySelectorAll('.pd-coa-thumb').forEach(t => t.classList.remove('active'));
}
window.switchToProduct = switchToProduct;

function selectPdVar(btn) {
  document.querySelectorAll('.pd-var-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentVariation = { id: btn.dataset.vid, label: btn.dataset.label, price_usd: parseFloat(btn.dataset.price) };
  document.getElementById('pdPrice').textContent = formatPrice(currentVariation.price_usd);
}
window.selectPdVar = selectPdVar;

function changeQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  document.getElementById('pdQty').value = currentQty;
}
window.changeQty = changeQty;

function addProductToCart() {
  if (!currentProduct || !currentVariation) return;
  const imgSrc = (currentProduct.image_urls && currentProduct.image_urls[0]) || 'assets/images/bpc157.png';
  Cart.addItem({
    product_id: currentProduct.id,
    variation_id: currentVariation.id,
    product_name: currentProduct.name,
    variation_label: currentVariation.label,
    price_usd: currentVariation.price_usd,
    quantity: currentQty,
    image_url: imgSrc
  });
  showToast(`${currentProduct.name} (${currentVariation.label}) added to cart!`, 'success');
  // Open cart
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCart();
}
window.addProductToCart = addProductToCart;

function showTab(tabId, btn) {
  document.querySelectorAll('.pd-tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.pd-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tabId}`)?.classList.add('active');
  btn.classList.add('active');
}
window.showTab = showTab;

function renderReviews(reviews) {
  const summary = document.getElementById('reviewsSummary');
  const list = document.getElementById('reviewsList');
  if (!summary || !list || !reviews.length) return;

  const avg = (reviews.reduce((s,r) => s + r.rating, 0) / reviews.length).toFixed(1);
  summary.innerHTML = `
    <div class="rs-big-rating">${avg}</div>
    <div>
      <div class="rs-stars">${'★'.repeat(Math.round(parseFloat(avg)))}${'☆'.repeat(5-Math.round(parseFloat(avg)))}</div>
      <div class="rs-count">Based on ${reviews.length} review${reviews.length!==1?'s':''}</div>
    </div>`;

  list.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-card-header">
        <div class="review-name">${r.reviewer_name || 'Anonymous'}</div>
        <div class="review-date">${new Date(r.created_at).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</div>
      </div>
      <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
      ${r.title ? `<div class="review-title">${r.title}</div>` : ''}
      <div class="review-body">${r.body}</div>
    </div>`).join('');
}

function initStarRating() {
  const stars = document.querySelectorAll('.star-inp');
  stars.forEach((star, idx) => {
    star.addEventListener('click', () => {
      selectedRating = idx + 1;
      document.getElementById('reviewRating').value = selectedRating;
      stars.forEach((s, i) => s.classList.toggle('active', i < selectedRating));
    });
    star.addEventListener('mouseenter', () => {
      stars.forEach((s, i) => s.classList.toggle('active', i <= idx));
    });
  });
  document.getElementById('starRatingInput')?.addEventListener('mouseleave', () => {
    stars.forEach((s, i) => s.classList.toggle('active', i < selectedRating));
  });
  // Set initial
  stars.forEach((s, i) => s.classList.toggle('active', i < selectedRating));
}

async function submitReview(e) {
  e.preventDefault();
  if (!currentProduct) return;
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Submitting...'; btn.disabled = true;

  const reviewData = {
    product_id: currentProduct.id,
    reviewer_name: document.getElementById('reviewName').value,
    reviewer_email: document.getElementById('reviewEmail').value || null,
    rating: selectedRating,
    title: document.getElementById('reviewTitle').value || null,
    body: document.getElementById('reviewBody').value,
    is_approved: false
  };

  try {
    await db.insert('reviews', reviewData);
    showToast('Review submitted! It will appear after approval.', 'success');
    document.getElementById('reviewForm').reset();
    selectedRating = 5;
    document.querySelectorAll('.star-inp').forEach((s, i) => s.classList.toggle('active', i < 5));
  } catch(err) {
    showToast('Error submitting review. Please try again.', 'error');
  }

  btn.textContent = 'Submit Review'; btn.disabled = false;
}
window.submitReview = submitReview;

async function loadRelatedProducts(product) {
  const section = document.getElementById('relatedSection');
  const grid = document.getElementById('relatedGrid');
  if (!section || !grid) return;

  let related = [];

  // 1. Try Supabase — same category first
  try {
    if (product.category_id) {
      let sameCat = await db.query('products', {
        select: '*',
        filter: { 'category_id': `eq.${product.category_id}`, 'is_active': 'eq.true', 'id': `neq.${product.id}` },
        order: 'sort_order.asc',
        limit: 4
      });
      // Attach variations
      for (let p of sameCat) {
        try {
          p.vars = await db.query('product_variations', {
            select: '*', filter: { 'product_id': `eq.${p.id}`, 'is_available': 'eq.true' }, order: 'sort_order.asc'
          });
          p.vars = p.vars.map(v => ({ id: v.id, label: v.label, price_usd: parseFloat(v.price_usd) }));
        } catch(e) { p.vars = []; }
      }
      related = sameCat.filter(p => p.vars && p.vars.length > 0);
    }

    // 2. If not enough, pad with other active products
    if (related.length < 4) {
      const exclude = [product.id, ...related.map(r => r.id)];
      let others = await db.query('products', {
        select: '*',
        filter: { 'is_active': 'eq.true' },
        order: 'is_featured.desc',
        limit: 8
      });
      others = others.filter(p => !exclude.includes(p.id));
      for (let p of others) {
        if (related.length >= 4) break;
        try {
          p.vars = await db.query('product_variations', {
            select: '*', filter: { 'product_id': `eq.${p.id}`, 'is_available': 'eq.true' }, order: 'sort_order.asc'
          });
          p.vars = p.vars.map(v => ({ id: v.id, label: v.label, price_usd: parseFloat(v.price_usd) }));
          if (p.vars.length) related.push(p);
        } catch(e) {}
      }
    }
  } catch(e) {
    console.warn('Related products: using static fallback');
  }

  // 3. Static fallback — same category first, then anything else
  if (!related.length) {
    const allStatic = Object.values(STATIC_PRODUCT_DATA);
    const sameCat = allStatic.filter(p => p.slug !== product.slug && p.category_slug === product.category_slug);
    const otherCat = allStatic.filter(p => p.slug !== product.slug && p.category_slug !== product.category_slug);
    // Fill up to 4: same category first, then others
    related = [...sameCat, ...otherCat].slice(0, 4);
  }

  if (!related.length) { section.style.display = 'none'; return; }

  section.style.display = 'block';
  grid.innerHTML = related.map(p => {
    const img = localStorage.getItem(`admin_prod_img_${p.id}`)
      || (p.image_urls && p.image_urls[0])
      || 'assets/images/bpc157.png';
    const firstPrice = p.vars && p.vars[0] ? p.vars[0].price_usd : 0;
    const badge = p.is_bestseller ? '<span class="pc-badge bestseller">Best Seller</span>'
                : p.is_featured   ? '<span class="pc-badge featured">Featured</span>' : '';

    const varOptions = p.vars && p.vars.length
      ? p.vars.map((v, i) => `<option value="${v.id}" data-price="${v.price_usd}" data-label="${v.label}"${i === 0 ? ' selected' : ''}>${v.label} — ${formatPrice(v.price_usd)}</option>`).join('')
      : '';

    return `
    <div class="product-card" id="rel-${p.id}">
      <div class="product-image-wrapper">
        ${badge}
        <a href="product.html?slug=${p.slug}">
          <img src="${img}" alt="${p.name}" loading="lazy" onerror="this.src='assets/images/bpc157.png'">
        </a>
        <div class="product-quick-actions">
          <a href="product.html?slug=${p.slug}" class="qa-btn" title="View Details">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </a>
        </div>
      </div>
      <div class="product-info">
        <div class="rating">★★★★★ <span>(${Math.floor(Math.random() * 80 + 40)})</span></div>
        <a href="product.html?slug=${p.slug}" class="product-name-link"><h3 class="product-name">${p.name}</h3></a>
        <p class="product-short-desc">${p.short_description || ''}</p>
        ${varOptions ? `
        <div class="product-var-select-wrap">
          <select class="product-var-dropdown" id="relVar-${p.id}" onchange="relatedUpdatePrice('${p.id}', this)">
            ${varOptions}
          </select>
        </div>` : ''}
        <p class="product-price" id="relPrice-${p.id}">${formatPrice(firstPrice)}</p>
        <button class="btn btn-primary" onclick="relatedAddToCart('${p.id}', '${p.name.replace(/'/g,"\\'")}', '${img.replace(/'/g,"\\'")}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Add to Cart
        </button>
      </div>
    </div>`;
  }).join('');
}

function relatedUpdatePrice(productId, select) {
  const opt = select.options[select.selectedIndex];
  const priceEl = document.getElementById(`relPrice-${productId}`);
  if (priceEl && opt) priceEl.textContent = formatPrice(parseFloat(opt.dataset.price));
}
window.relatedUpdatePrice = relatedUpdatePrice;

function relatedAddToCart(productId, name, img) {
  const select = document.getElementById(`relVar-${productId}`);
  if (!select) return;
  const opt = select.options[select.selectedIndex];
  if (!opt) return;
  Cart.addItem({
    product_id: productId,
    variation_id: opt.value,
    product_name: name,
    variation_label: opt.dataset.label,
    price_usd: parseFloat(opt.dataset.price),
    quantity: 1,
    image_url: img
  });
  showToast(`${name} (${opt.dataset.label}) added to cart!`, 'success');
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCart();
}
window.relatedAddToCart = relatedAddToCart;

function renderCart() {
  const items = Cart.getItems();
  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const cartTotal = document.getElementById('cartTotal');
  if (!cartItems) return;
  if (!items.length) {
    cartItems.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🧪</div><p>${t('empty_cart')}</p></div>`;
    if (cartFooter) cartFooter.style.display = 'none';
    return;
  }
  cartItems.innerHTML = items.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.image_url||'assets/images/bpc157.png'}" alt="${item.product_name}" onerror="this.src='assets/images/bpc157.png'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.product_name}</div>
        <div class="cart-item-variation">${item.variation_label}</div>
        <div class="cart-item-price">${formatPrice(item.price_usd * item.quantity)}</div>
        <div class="cart-item-actions">
          <button class="cart-qty-btn" onclick="cartQty('${item.variation_id}',${item.quantity-1})">−</button>
          <span class="cart-qty-num">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="cartQty('${item.variation_id}',${item.quantity+1})">+</button>
          <button class="cart-remove-btn" onclick="cartRemove('${item.variation_id}')">✕ Remove</button>
        </div>
      </div>
    </div>`).join('');
  if (cartFooter) cartFooter.style.display = 'block';
  if (cartTotal) cartTotal.textContent = formatPrice(Cart.getTotal());
}

function cartQty(vid, qty) { if (qty < 1) Cart.removeItem(vid); else Cart.updateQuantity(vid, qty); renderCart(); }
function cartRemove(vid) { Cart.removeItem(vid); renderCart(); }
window.cartQty = cartQty; window.cartRemove = cartRemove;

document.addEventListener('DOMContentLoaded', loadProduct);
