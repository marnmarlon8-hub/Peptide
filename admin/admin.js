// =============================================
// LABSOURCED — ADMIN DASHBOARD JS (admin.js)
// =============================================

const SUPABASE_URL = 'https://qlqkawvxlkkqbqkhoufp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscWthd3Z4bGtrcWJxa2hvdWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0OTUzOTcsImV4cCI6MjEwNjA3MTM5N30.aX5OPRxdKslk9sTVFXuYK5JWmfm_PAjq1AstQ2WMjm0';
const ORDER_STATUSES = ['Pending','Approved','Payment Confirmed','Processing','Shipped','At Port','Out For Delivery','Delivered','Cancelled'];

let adminToken = null;
let allOrders = [], allProducts = [], allCategories = [], allReviews = [], allVariations = [];
let editingOrderId = null;
let pendingCatImage = null;
let pendingProductImage = null;

// =============================================
// INIT & AUTH CHECK
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  adminToken = localStorage.getItem('admin_token');
  if (!adminToken) { window.location.href = 'login.html'; return; }

  // Verify token
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error('Invalid token');
    const user = await res.json();
    const emailEl = document.getElementById('adminEmailDisplay');
    const avatarEl = document.getElementById('adminAvatar');
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) avatarEl.textContent = user.email.charAt(0).toUpperCase();
  } catch(e) {
    localStorage.removeItem('admin_token');
    window.location.href = 'login.html'; return;
  }

  await loadAllData();
});

function getCustomLocal(table) {
  try { return JSON.parse(localStorage.getItem('ls_custom_' + table)) || []; } catch(e) { return []; }
}
function setCustomLocal(table, items) {
  try {
    localStorage.setItem('ls_custom_' + table, JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage limit reached. Could not save to local fallback:', e);
    alert('Warning: Your browser storage is full. Large files (like big COA PDFs) could not be saved locally because the Supabase database blocked the upload. Please use the "Supabase RLS Fix" button to enable direct database saving.');
  }
}

async function adminFetch(table, params = {}) {
  let dbData = [];
  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const qp = new URLSearchParams();
    if (params.select) qp.set('select', params.select);
    if (params.filter) Object.entries(params.filter).forEach(([k,v]) => qp.set(k,v));
    if (params.order) qp.set('order', params.order);
    if (params.limit) qp.set('limit', params.limit);
    const qs = qp.toString(); if (qs) url += '?' + qs;
    const res = await fetch(url, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }});
    if (res.ok) dbData = await res.json();
  } catch(e) {
    console.warn(`adminFetch for ${table} network error:`, e);
  }

  const localItems = getCustomLocal(table);
  if (localItems.length > 0) {
    const map = new Map();
    (dbData || []).forEach(item => map.set(item.id, item));
    localItems.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  }
  return dbData || [];
}

async function adminPost(table, data) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    const txt = await res.text();
    if (!res.ok) {
      console.warn(`adminPost error on ${table}: ${txt}. Saving locally.`);
      const newId = data.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8));
      const newObj = { id: newId, ...data, created_at: new Date().toISOString() };
      const local = getCustomLocal(table);
      local.push(newObj);
      setCustomLocal(table, local);
      return [newObj];
    }
    const json = JSON.parse(txt);
    
    // Detect silent column drops (e.g. coa_urls missing in DB schema)
    let droppedColumns = false;
    for (const key of Object.keys(data)) {
      if (json[0] && !(key in json[0])) droppedColumns = true;
    }
    if (droppedColumns) {
      console.warn(`adminPost: Supabase dropped columns on ${table}. Saving override locally.`);
      const newObj = { ...json[0], ...data };
      const local = getCustomLocal(table);
      local.push(newObj);
      setCustomLocal(table, local);
      return [newObj];
    }
    return json;
  } catch(e) {
    console.warn(`adminPost exception on ${table}:`, e);
    const newId = data.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8));
    const newObj = { id: newId, ...data, created_at: new Date().toISOString() };
    const local = getCustomLocal(table);
    local.push(newObj);
    setCustomLocal(table, local);
    return [newObj];
  }
}

async function adminPatch(table, data, filter) {
  let targetId = null;
  if (filter && filter.id && filter.id.startsWith('eq.')) {
    targetId = filter.id.slice(3);
  }

  if (targetId) {
    const local = getCustomLocal(table);
    const idx = local.findIndex(x => x.id === targetId);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...data, updated_at: new Date().toISOString() };
      setCustomLocal(table, local);
    }
  }

  let dbSuccess = false;
  let droppedColumns = false;
  let returnedJson = null;

  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}?${new URLSearchParams(filter).toString()}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      dbSuccess = true;
      returnedJson = await res.json();
      
      // Check if Supabase silently dropped columns (like coa_urls)
      if (returnedJson && returnedJson[0]) {
        for (const key of Object.keys(data)) {
          if (!(key in returnedJson[0])) droppedColumns = true;
        }
      }
    }
  } catch(e) {
    console.warn(`adminPatch exception on ${table}:`, e);
  }

  // If DB update failed OR Supabase dropped columns, save override locally so the user's edits are not lost
  if ((!dbSuccess || droppedColumns) && targetId) {
    const local = getCustomLocal(table);
    const idx = local.findIndex(x => x.id === targetId);
    if (idx === -1) {
      // Find original to merge
      let original = {};
      if (table === 'products') original = allProducts.find(x => x.id === targetId) || {};
      else if (table === 'categories') original = allCategories.find(x => x.id === targetId) || {};
      else if (table === 'product_variations') original = allVariations.find(x => x.id === targetId) || {};
      
      const newObj = { ...original, ...data, id: targetId, updated_at: new Date().toISOString() };
      local.push(newObj);
      setCustomLocal(table, local);
    } else if (droppedColumns) {
      // Already in local, but we need to ensure the dropped columns are merged since it bypassed the pre-patch merge if it was just added
      local[idx] = { ...local[idx], ...data, updated_at: new Date().toISOString() };
      setCustomLocal(table, local);
    }
  }

  if (dbSuccess && !droppedColumns) return returnedJson;
  return [data];
}

async function adminDelete(table, filter) {
  let targetId = null;
  if (filter && filter.id && filter.id.startsWith('eq.')) {
    targetId = filter.id.slice(3);
  }

  if (targetId) {
    let local = getCustomLocal(table);
    local = local.filter(x => x.id !== targetId);
    setCustomLocal(table, local);
  }

  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}?${new URLSearchParams(filter).toString()}`;
    await fetch(url, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${adminToken}` }
    });
  } catch(e) {
    console.warn(`adminDelete exception on ${table}:`, e);
  }
  return true;
}

async function uploadFileToStorage(bucket, path, file) {
  // Try PUT (upsert) first — works even if the file exists
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'PUT',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'true'
    },
    body: file
  });
  if (!res.ok) throw new Error(await res.text());
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

function adminLogout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_refresh');
  localStorage.removeItem('admin_email');
  window.location.href = 'login.html';
}
window.adminLogout = adminLogout;

// =============================================
// LOAD ALL DATA
// =============================================
async function loadAllData() {
  try {
    [allCategories, allProducts, allVariations, allOrders, allReviews] = await Promise.all([
      adminFetch('categories', { select: '*', order: 'sort_order.asc' }),
      adminFetch('products', { select: '*', order: 'sort_order.asc' }),
      adminFetch('product_variations', { select: '*', order: 'sort_order.asc' }),
      adminFetch('orders', { select: '*', order: 'created_at.desc' }),
      adminFetch('reviews', { select: '*', order: 'created_at.desc' })
    ]);
  } catch(e) {
    console.error('Load error:', e);
    allCategories = []; allProducts = []; allVariations = []; allOrders = []; allReviews = [];
  }

  renderOverview();
  renderProducts();
  renderCategories();
  renderOrders(allOrders);
  renderReviews('pending');
  renderCurrencies();
  populateCategoryFilter();
  populateProductCategorySelect();
}

// =============================================
// SECTION NAVIGATION
// =============================================
const SECTION_TITLES = {
  overview: 'Dashboard Overview', products: 'Products', categories: 'Categories',
  orders: 'Orders', reviews: 'Reviews', pages: 'Pages (CMS)', currencies: 'Currency Settings'
};

function showSection(id, btn) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sn-item').forEach(i => i.classList.remove('active'));
  const section = document.getElementById(`section-${id}`);
  if (section) section.classList.add('active');
  if (btn) btn.classList.add('active');
  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = SECTION_TITLES[id] || id;
  return false;
}
window.showSection = showSection;

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('sidebarBackdrop')?.classList.toggle('open');
}
window.toggleSidebar = toggleSidebar;

// =============================================
// OVERVIEW
// =============================================
function renderOverview() {
  const pendingOrders = allOrders.filter(o => o.status === 'Pending');
  const activeProducts = allProducts.filter(p => p.is_active);
  const totalRevenue = allOrders.filter(o => o.status !== 'Cancelled').reduce((s,o) => s + parseFloat(o.total_usd || 0), 0);
  const pendingReviews = allReviews.filter(r => !r.is_approved);

  document.getElementById('stat-orders').textContent = allOrders.length;
  document.getElementById('stat-pending').textContent = pendingOrders.length;
  document.getElementById('stat-products').textContent = activeProducts.length;
  document.getElementById('stat-revenue').textContent = `$${totalRevenue.toFixed(2)}`;

  const badge = document.getElementById('pendingBadge');
  if (badge) { badge.textContent = pendingOrders.length; badge.style.display = pendingOrders.length > 0 ? 'block' : 'none'; }

  // Recent orders
  const recentEl = document.getElementById('recentOrdersList');
  if (recentEl) {
    const recent = allOrders.slice(0, 6);
    recentEl.innerHTML = recent.length ? recent.map(o => `
      <div class="order-row-mini">
        <div>
          <div class="orm-code">${o.tracking_code}</div>
          <div class="orm-name">${o.full_name} · ${o.country}</div>
        </div>
        <div style="text-align:right;">
          <span class="status-badge ${getStatusClass(o.status)}">${o.status}</span>
          <div style="font-size:.78rem;color:#aaa;margin-top:.2rem;">$${o.total_usd}</div>
        </div>
      </div>`).join('') : '<div class="loading-rows">No orders yet</div>';
  }

  // Pending reviews
  const reviewsEl = document.getElementById('pendingReviewsList');
  if (reviewsEl) {
    const pending = allReviews.filter(r => !r.is_approved).slice(0, 5);
    reviewsEl.innerHTML = pending.length ? pending.map(r => `
      <div class="order-row-mini">
        <div>
          <div style="font-size:.88rem;font-weight:600;color:#111;">${r.reviewer_name}</div>
          <div style="font-size:.78rem;color:#888;">${(r.body||'').slice(0,50)}...</div>
        </div>
        <div style="display:flex;gap:.4rem;">
          <button class="btn-icon success" onclick="approveReview('${r.id}')">✓ Approve</button>
          <button class="btn-icon danger" onclick="deleteReview('${r.id}')">✕</button>
        </div>
      </div>`).join('') : '<div class="loading-rows">No pending reviews</div>';
  }
}

// =============================================
// PRODUCTS
// =============================================
function renderProducts() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  const filtered = getFilteredProducts();

  tbody.innerHTML = filtered.map(p => {
    const cat = allCategories.find(c => c.id === p.category_id);
    const vars = allVariations.filter(v => v.product_id === p.id);
    const img = localStorage.getItem(`admin_prod_img_${p.id}`) || (p.image_urls && p.image_urls[0]) || '../assets/images/bpc157.png';
    return `
      <tr>
        <td><img src="${img}" class="prod-thumb" alt="${p.name}" onerror="this.src='../assets/images/bpc157.png'"></td>
        <td><strong>${p.name}</strong><br><span style="font-size:.75rem;color:#aaa;">${p.slug}</span></td>
        <td>${cat ? cat.name : '—'}</td>
        <td>${vars.map(v => `<span style="font-size:.75rem;background:#f0f0f0;padding:.15rem .4rem;border-radius:4px;margin:.1rem;">${v.label} — $${v.price_usd}</span>`).join('')}</td>
        <td>${p.is_featured ? '⭐' : ''} ${p.is_bestseller ? '🔥' : ''}</td>
        <td><span class="status-badge ${p.is_active ? 'sb-active' : 'sb-hidden'}">${p.is_active ? 'Active' : 'Hidden'}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="editProduct('${p.id}')">✏️ Edit</button>
            <button class="btn-icon" onclick="toggleProductVisibility('${p.id}', ${p.is_active})">${p.is_active ? '🙈 Hide' : '👁 Show'}</button>
            <button class="btn-icon danger" onclick="deleteProduct('${p.id}')">🗑 Delete</button>
          </div>
        </td>
      </tr>`;
  }).join('') || `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#aaa;">No products found</td></tr>`;
}

function getFilteredProducts() {
  const search = document.getElementById('productSearch')?.value.toLowerCase() || '';
  const catFilter = document.getElementById('productCatFilter')?.value || '';
  return allProducts.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search);
    const matchCat = !catFilter || p.category_id === catFilter;
    return matchSearch && matchCat;
  });
}

function filterProductTable() { renderProducts(); }
window.filterProductTable = filterProductTable;

function populateCategoryFilter() {
  const el = document.getElementById('productCatFilter');
  if (!el) return;
  el.innerHTML = `<option value="">All Categories</option>` + allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function populateProductCategorySelect() {
  const el = document.getElementById('pm_category');
  if (!el) return;
  el.innerHTML = `<option value="">No Category</option>` + allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

// Product Modal
let variationRowCount = 0;
let currentProductCoas = [];

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

function renderCoaPreview() {
  const coaPreview = document.getElementById('pm_coa_existing');
  if (!coaPreview) return;
  if (!currentProductCoas.length) {
    coaPreview.innerHTML = '<span style="color:#aaa;font-size:.8rem;">No COA documents uploaded yet</span>';
    return;
  }
  coaPreview.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px;font-size:.85rem;color:#06332F;">Attached COA Documents (${currentProductCoas.length}):</div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      ${currentProductCoas.map((url, idx) => `
        <div style="display:flex;align-items:center;justify-content:space-between;background:#f9f9f9;padding:6px 10px;border-radius:6px;border:1px solid #eee;">
          <a href="${url}" target="_blank" style="color:#C8A96A;font-weight:500;text-decoration:underline;font-size:.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80%;">
            📄 COA Document ${idx + 1}
          </a>
          <button type="button" onclick="removeCoaDocument(${idx})" style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:.8rem;font-weight:600;">✕ Remove</button>
        </div>
      `).join('')}
    </div>`;
}
window.renderCoaPreview = renderCoaPreview;

function removeCoaDocument(index) {
  currentProductCoas.splice(index, 1);
  renderCoaPreview();
}
window.removeCoaDocument = removeCoaDocument;

function openProductModal(productId = null) {
  document.getElementById('editProductId').value = productId || '';
  document.getElementById('productModalTitle').textContent = productId ? 'Edit Product' : 'Add Product';
  document.getElementById('pm_name').value = '';
  document.getElementById('pm_slug').value = '';
  document.getElementById('pm_category').value = '';
  document.getElementById('pm_active').value = 'true';
  document.getElementById('pm_short_desc').value = '';
  document.getElementById('pm_desc').value = '';
  document.getElementById('pm_featured').checked = false;
  document.getElementById('pm_bestseller').checked = false;
  document.getElementById('pm_recommended').checked = false;
  document.getElementById('variationsContainer').innerHTML = '';
  variationRowCount = 0;
  pendingProductImage = null;
  currentProductCoas = [];

  const coaInput = document.getElementById('pm_coa');
  if (coaInput) coaInput.value = '';

  // Image preview
  const imgPreview = document.getElementById('pm_image_preview');
  const imgInput = document.getElementById('pm_image');
  if (imgInput) imgInput.value = '';
  if (imgPreview) {
    const existingImg = productId ? localStorage.getItem(`admin_prod_img_${productId}`) : null;
    imgPreview.innerHTML = existingImg
      ? `<img src="${existingImg}" style="max-height:100px;border-radius:8px;border:1px solid #eee;">`
      : '<span style="color:#aaa;font-size:.8rem;">No image uploaded yet</span>';
  }

  if (productId) {
    const p = allProducts.find(x => x.id === productId);
    if (p) {
      document.getElementById('pm_name').value = p.name || '';
      document.getElementById('pm_slug').value = p.slug || '';
      document.getElementById('pm_category').value = p.category_id || '';
      document.getElementById('pm_active').value = p.is_active ? 'true' : 'false';
      document.getElementById('pm_short_desc').value = p.short_description || '';
      document.getElementById('pm_desc').value = p.detailed_description || '';
      document.getElementById('pm_featured').checked = !!p.is_featured;
      document.getElementById('pm_bestseller').checked = !!p.is_bestseller;
      document.getElementById('pm_recommended').checked = !!p.is_recommended;
      
      if (p.coa_urls && Array.isArray(p.coa_urls)) {
        currentProductCoas = [...p.coa_urls];
      }

      const vars = allVariations.filter(v => v.product_id === productId);
      vars.forEach(v => addVariationRow(v.id, v.label, v.price_usd, v.is_available));
    }
  } else {
    addVariationRow();
  }

  renderCoaPreview();
  document.getElementById('productModalOverlay').classList.add('open');
}
window.openProductModal = openProductModal;

function addVariationRow(id = null, label = '', price = '', available = true) {
  variationRowCount++;
  const row = document.createElement('div');
  row.className = 'variation-row';
  row.id = `varrow-${variationRowCount}`;
  row.innerHTML = `
    <div class="form-group">
      <label>Size / Label</label>
      <input type="text" class="var-label" value="${label}" placeholder="5mg">
    </div>
    <div class="form-group">
      <label>Price (USD)</label>
      <input type="number" class="var-price" value="${price}" placeholder="45.00" step="0.01" min="0">
    </div>
    <button type="button" class="remove-var-btn" onclick="this.parentElement.remove()">✕</button>
    <input type="hidden" class="var-id" value="${id || ''}">`;
  document.getElementById('variationsContainer').appendChild(row);
}
window.addVariationRow = addVariationRow;

async function saveProduct() {
  const productId = document.getElementById('editProductId').value;
  const name = document.getElementById('pm_name').value.trim();
  const slug = document.getElementById('pm_slug').value.trim() || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  if (!name || !slug) { alert('Product name and slug are required.'); return; }

  // Handle new COA file uploads
  const coaInput = document.getElementById('pm_coa');
  if (coaInput && coaInput.files && coaInput.files.length > 0) {
    for (const file of Array.from(coaInput.files)) {
      const ext = file.name.split('.').pop();
      const coaPath = `coa/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      try {
        const coaUrl = await uploadFileToStorage('product-images', coaPath, file);
        currentProductCoas.push(coaUrl);
      } catch(coaErr) {
        console.warn('COA storage upload failed, converting to DataURL fallback:', coaErr);
        try {
          const dataUrl = await fileToDataURL(file);
          currentProductCoas.push(dataUrl);
        } catch(e) {}
      }
    }
  }

  const data = {
    name, slug,
    category_id: document.getElementById('pm_category').value || null,
    is_active: document.getElementById('pm_active').value === 'true',
    short_description: document.getElementById('pm_short_desc').value,
    detailed_description: document.getElementById('pm_desc').value,
    is_featured: document.getElementById('pm_featured').checked,
    is_bestseller: document.getElementById('pm_bestseller').checked,
    is_recommended: document.getElementById('pm_recommended').checked,
    coa_urls: currentProductCoas,
    updated_at: new Date().toISOString()
  };

  if (pendingProductImage) {
    data.image_urls = [pendingProductImage];
  }

  try {
    let pid = productId;
    if (productId) {
      await adminPatch('products', data, { 'id': `eq.${productId}` });
    } else {
      const res = await adminPost('products', data);
      pid = res[0]?.id;
    }

    if (pid) {
      // Upload product image to Supabase Storage if file chosen
      const imgInput = document.getElementById('pm_image');
      if (imgInput && imgInput.files && imgInput.files[0]) {
        const file = imgInput.files[0];
        const ext = file.name.split('.').pop();
        const path = `products/${pid}.${ext}`;
        try {
          const imgUrl = await uploadFileToStorage('product-images', path, file);
          await adminPatch('products', { image_urls: [imgUrl], updated_at: new Date().toISOString() }, { 'id': `eq.${pid}` });
          localStorage.setItem(`admin_prod_img_${pid}`, imgUrl);
        } catch(imgErr) {
          if (pendingProductImage) {
            localStorage.setItem(`admin_prod_img_${pid}`, pendingProductImage);
          }
        }
      } else if (pendingProductImage) {
        localStorage.setItem(`admin_prod_img_${pid}`, pendingProductImage);
      }
      pendingProductImage = null;

      // Handle variations
      const rows = document.querySelectorAll('.variation-row');
      for (const row of rows) {
        const vid = row.querySelector('.var-id').value;
        const varLabel = row.querySelector('.var-label').value.trim();
        const varPrice = parseFloat(row.querySelector('.var-price').value);
        if (!varLabel || isNaN(varPrice)) continue;

        if (vid) {
          await adminPatch('product_variations', { label: varLabel, price_usd: varPrice }, { 'id': `eq.${vid}` });
        } else {
          await adminPost('product_variations', { product_id: pid, label: varLabel, price_usd: varPrice, is_available: true });
        }
      }
    }

    closeModal('productModalOverlay');
    showToast('Product saved successfully!');
    await loadAllData();
  } catch(e) {
    alert('Error saving product: ' + e.message);
  }
}
window.saveProduct = saveProduct;

function editProduct(id) { openProductModal(id); }
window.editProduct = editProduct;

async function toggleProductVisibility(id, currentlyActive) {
  try {
    await adminPatch('products', { is_active: !currentlyActive, updated_at: new Date().toISOString() }, { 'id': `eq.${id}` });
    await loadAllData();
    showToast(`Product ${currentlyActive ? 'hidden' : 'shown'} successfully`);
  } catch(e) { alert('Error: ' + e.message); }
}
window.toggleProductVisibility = toggleProductVisibility;

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;
  try {
    await adminDelete('products', { 'id': `eq.${id}` });
    await loadAllData();
    showToast('Product deleted');
  } catch(e) { alert('Error: ' + e.message); }
}
window.deleteProduct = deleteProduct;

// =============================================
// CATEGORIES
// =============================================
function renderCategories() {
  const tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;

  tbody.innerHTML = allCategories.map(c => {
    const catImg = localStorage.getItem(`admin_cat_img_${c.id}`) || (c.image_url ? (c.image_url.startsWith('http') || c.image_url.startsWith('data:') ? c.image_url : `../${c.image_url}`) : null);
    return `
    <tr>
      <td>${catImg ? `<img src="${catImg}" class="prod-thumb" alt="${c.name}" onerror="this.style.opacity='0'">` : '<span style="font-size:1.5rem;display:block;text-align:center;">📂</span>'}</td>
      <td><strong>${c.name}</strong></td>
      <td><span style="font-size:.78rem;color:#aaa;">${c.slug}</span></td>
      <td><span class="status-badge ${c.is_active ? 'sb-active' : 'sb-hidden'}">${c.is_active ? 'Active' : 'Hidden'}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" onclick="editCategory('${c.id}')">✏️ Edit</button>
          <button class="btn-icon danger" onclick="deleteCategory('${c.id}')">🗑 Delete</button>
        </div>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#aaa;">No categories found</td></tr>`;
}

function openCategoryModal(id = null) {
  document.getElementById('editCategoryId').value = id || '';
  document.getElementById('categoryModalTitle').textContent = id ? 'Edit Category' : 'Add Category';
  document.getElementById('cm_name').value = '';
  document.getElementById('cm_slug').value = '';
  document.getElementById('cm_desc').value = '';
  pendingCatImage = null;

  // Image preview
  const imgPreview = document.getElementById('cm_image_preview');
  const imgInput = document.getElementById('cm_image');
  if (imgInput) imgInput.value = '';
  if (imgPreview) {
    const existingImg = id ? (localStorage.getItem(`admin_cat_img_${id}`) || allCategories.find(c => c.id === id)?.image_url) : null;
    imgPreview.innerHTML = existingImg
      ? `<img src="${existingImg}" style="max-height:100px;border-radius:8px;border:1px solid #eee;">`
      : '<span style="color:#aaa;font-size:.8rem;">No image uploaded yet</span>';
  }

  if (id) {
    const c = allCategories.find(x => x.id === id);
    if (c) {
      document.getElementById('cm_name').value = c.name;
      document.getElementById('cm_slug').value = c.slug;
      document.getElementById('cm_desc').value = c.description || '';
    }
  }
  document.getElementById('categoryModalOverlay').classList.add('open');
}
window.openCategoryModal = openCategoryModal;

async function saveCategory() {
  const id = document.getElementById('editCategoryId').value;
  const name = document.getElementById('cm_name').value.trim();
  const slug = document.getElementById('cm_slug').value.trim() || name.toLowerCase().replace(/\s+/g,'-');
  if (!name) { alert('Category name required'); return; }

  const data = { 
    name, 
    slug, 
    description: document.getElementById('cm_desc').value,
    is_active: true,
    sort_order: allCategories.length + 1
  };
  if (pendingCatImage) {
    data.image_url = pendingCatImage;
  }

  try {
    let savedId = id;
    if (id) {
      await adminPatch('categories', data, { 'id': `eq.${id}` });
    } else {
      const res = await adminPost('categories', data);
      savedId = res[0]?.id;
    }
    
    if (savedId) {
      const imgInput = document.getElementById('cm_image');
      if (imgInput && imgInput.files && imgInput.files[0]) {
        const file = imgInput.files[0];
        const ext = file.name.split('.').pop();
        const path = `categories/${savedId}.${ext}`;
        try {
          const imgUrl = await uploadFileToStorage('product-images', path, file);
          await adminPatch('categories', { image_url: imgUrl }, { 'id': `eq.${savedId}` });
          localStorage.setItem(`admin_cat_img_${savedId}`, imgUrl);
        } catch(imgErr) {
          if (pendingCatImage) {
            localStorage.setItem(`admin_cat_img_${savedId}`, pendingCatImage);
          }
        }
      } else if (pendingCatImage) {
        localStorage.setItem(`admin_cat_img_${savedId}`, pendingCatImage);
      }
      pendingCatImage = null;
    }

    closeModal('categoryModalOverlay');
    showToast('Category saved successfully!');
    await loadAllData();
  } catch(e) { alert('Error saving category: ' + e.message); }
}
window.saveCategory = saveCategory;

function editCategory(id) { openCategoryModal(id); }
window.editCategory = editCategory;

async function deleteCategory(id) {
  if (!confirm('Delete this category? This cannot be undone.')) return;
  try {
    await adminDelete('categories', { 'id': `eq.${id}` });
    localStorage.removeItem(`admin_cat_img_${id}`);
    showToast('Category deleted');
    await loadAllData();
  } catch(e) { alert('Error: ' + e.message); }
}
window.deleteCategory = deleteCategory;

// =============================================
// ORDERS
// =============================================
function renderOrders(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong style="font-family:'Cormorant Garamond',serif;color:#06332F;">${o.tracking_code}</strong></td>
      <td>${o.full_name}<br><span style="font-size:.75rem;color:#aaa;">${o.email}</span></td>
      <td>${o.country}</td>
      <td><strong>$${parseFloat(o.total_usd).toFixed(2)}</strong></td>
      <td>${o.payment_method}</td>
      <td><span class="status-badge ${getStatusClass(o.status)}">${o.status}</span></td>
      <td>${new Date(o.created_at).toLocaleDateString()}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" onclick="viewOrder('${o.id}')">👁 View</button>
          <button class="btn-icon danger" onclick="cancelOrder('${o.id}')">✖ Cancel</button>
          <button class="btn-icon danger" onclick="deleteOrder('${o.id}')">🗑 Delete</button>
        </div>
      </td>
    </tr>`).join('') || `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#aaa;">No orders found</td></tr>`;
}

function filterOrderTable() {
  const search = document.getElementById('orderSearch')?.value.toLowerCase() || '';
  const status = document.getElementById('orderStatusFilter')?.value || '';
  const filtered = allOrders.filter(o => {
    const matchSearch = !search || o.tracking_code.toLowerCase().includes(search) || o.full_name.toLowerCase().includes(search) || o.email.toLowerCase().includes(search);
    const matchStatus = !status || o.status === status;
    return matchSearch && matchStatus;
  });
  renderOrders(filtered);
}
window.filterOrderTable = filterOrderTable;

function getStatusClass(status) {
  const map = { 'Pending':'sb-pending','Approved':'sb-approved','Payment Confirmed':'sb-approved','Processing':'sb-processing','Shipped':'sb-shipped','At Port':'sb-shipped','Out For Delivery':'sb-shipped','Delivered':'sb-delivered','Cancelled':'sb-cancelled' };
  return map[status] || 'sb-pending';
}

async function viewOrder(id) {
  editingOrderId = id;
  const order = allOrders.find(o => o.id === id);
  if (!order) return;

  let items = [];
  try { items = await adminFetch('order_items', { select:'*', filter:{ 'order_id':`eq.${id}` } }); } catch(e) {}

  const body = document.getElementById('orderModalBody');
  document.getElementById('orderModalTitle').textContent = `Order ${order.tracking_code}`;

  body.innerHTML = `
    <div class="od-section">
      <h4>Customer Information</h4>
      <div class="od-row"><span>Name</span><span>${order.full_name}</span></div>
      <div class="od-row"><span>Email</span><span>${order.email}</span></div>
      <div class="od-row"><span>Phone</span><span>${order.phone || '—'}</span></div>
      <div class="od-row"><span>WhatsApp</span><span>${order.whatsapp || '—'}</span></div>
      <div class="od-row"><span>Address</span><span>${order.address}, ${order.city}, ${order.country} ${order.zip_code}</span></div>
    </div>
    <div class="od-section">
      <h4>Order Details</h4>
      <div class="od-row"><span>Payment Method</span><span>${order.payment_method}</span></div>
      <div class="od-row"><span>Research Purpose</span><span>${order.reason_for_purchase || '—'}</span></div>
      <div class="od-row"><span>Currency</span><span>${order.currency}</span></div>
      <div class="od-row"><span>Total (USD)</span><span><strong>$${order.total_usd}</strong></span></div>
      <div class="od-row"><span>Date</span><span>${new Date(order.created_at).toLocaleString()}</span></div>
      ${order.notes ? `<div class="od-row"><span>Notes</span><span>${order.notes}</span></div>` : ''}
    </div>
    ${items.length ? `
    <div class="od-section">
      <h4>Items Ordered</h4>
      ${items.map(i => `<div class="od-row"><span>${i.product_name} (${i.variation_label}) × ${i.quantity}</span><span>$${(i.price_usd * i.quantity).toFixed(2)}</span></div>`).join('')}
    </div>` : ''}
    <div class="od-section">
      <h4>Update Order Status</h4>
      <select class="od-status-select" id="orderStatusSelect">
        ${ORDER_STATUSES.map(s => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>`;

  document.getElementById('orderModalOverlay').classList.add('open');
}
window.viewOrder = viewOrder;

async function saveOrderStatus() {
  if (!editingOrderId) return;
  const status = document.getElementById('orderStatusSelect')?.value;
  try {
    await adminPatch('orders', { status, updated_at: new Date().toISOString() }, { 'id': `eq.${editingOrderId}` });
    closeModal('orderModalOverlay');
    showToast(`Order status updated to "${status}"`);
    await loadAllData();
  } catch(e) { alert('Error: ' + e.message); }
}
window.saveOrderStatus = saveOrderStatus;

async function cancelOrder(id) {
  if (!confirm('Cancel this order?')) return;
  try {
    await adminPatch('orders', { status: 'Cancelled', updated_at: new Date().toISOString() }, { 'id': `eq.${id}` });
    showToast('Order cancelled');
    await loadAllData();
  } catch(e) { alert('Error: ' + e.message); }
}
window.cancelOrder = cancelOrder;

async function deleteOrder(id) {
  if (!confirm('Permanently delete this order? This cannot be undone.')) return;
  try {
    // Delete order items first, then the order itself
    try { await adminDelete('order_items', { 'order_id': `eq.${id}` }); } catch(e) {}
    await adminDelete('orders', { 'id': `eq.${id}` });
    showToast('Order permanently deleted');
    await loadAllData();
  } catch(e) { alert('Error deleting order: ' + e.message); }
}
window.deleteOrder = deleteOrder;

function previewCatImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    pendingCatImage = e.target.result;
    const preview = document.getElementById('cm_image_preview');
    if (preview) preview.innerHTML = `<img src="${pendingCatImage}" style="max-height:100px;border-radius:8px;border:1px solid #eee;margin-top:.25rem;">`;
  };
  reader.readAsDataURL(file);
}
window.previewCatImage = previewCatImage;

function previewProductImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    pendingProductImage = e.target.result;
    const preview = document.getElementById('pm_image_preview');
    if (preview) preview.innerHTML = `<img src="${pendingProductImage}" style="max-height:100px;border-radius:8px;border:1px solid #eee;margin-top:.25rem;">`;
  };
  reader.readAsDataURL(file);
}
window.previewProductImage = previewProductImage;

// =============================================
// REVIEWS
// =============================================
function renderReviews(filter = 'pending', btn = null) {
  if (btn) {
    document.querySelectorAll('.rtab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
  }

  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;

  let reviews = allReviews;
  if (filter === 'pending') reviews = allReviews.filter(r => !r.is_approved);
  else if (filter === 'approved') reviews = allReviews.filter(r => r.is_approved);

  tbody.innerHTML = reviews.map(r => {
    const prod = allProducts.find(p => p.id === r.product_id);
    return `
      <tr>
        <td>${prod ? prod.name : '—'}</td>
        <td>${r.reviewer_name}</td>
        <td>${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</td>
        <td style="max-width:200px;"><div style="font-weight:600;font-size:.85rem;">${r.title || ''}</div><div style="font-size:.8rem;color:#888;">${(r.body||'').slice(0,80)}...</div></td>
        <td>${new Date(r.created_at).toLocaleDateString()}</td>
        <td><span class="status-badge ${r.is_approved ? 'sb-approved' : 'sb-pending-review'}">${r.is_approved ? 'Approved' : 'Pending'}</span></td>
        <td>
          <div class="action-btns">
            ${!r.is_approved ? `<button class="btn-icon success" onclick="approveReview('${r.id}')">✓ Approve</button>` : ''}
            <button class="btn-icon danger" onclick="deleteReview('${r.id}')">🗑 Delete</button>
          </div>
        </td>
      </tr>`;
  }).join('') || `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#aaa;">No reviews in this category</td></tr>`;
}
window.loadReviews = renderReviews;

async function approveReview(id) {
  try {
    await adminPatch('reviews', { is_approved: true }, { 'id': `eq.${id}` });
    showToast('Review approved!');
    await loadAllData();
  } catch(e) { alert('Error: ' + e.message); }
}
window.approveReview = approveReview;

async function deleteReview(id) {
  if (!confirm('Delete this review?')) return;
  try {
    await adminDelete('reviews', { 'id': `eq.${id}` });
    showToast('Review deleted');
    await loadAllData();
  } catch(e) { alert('Error: ' + e.message); }
}
window.deleteReview = deleteReview;

// =============================================
// PAGES (CMS) — localStorage-based
// =============================================

// Default page content sourced from the actual HTML files
const PAGE_DEFAULTS = {
  'privacy-policy': {
    title: 'Privacy Policy',
    content: `<h2>Privacy Policy</h2>
<p>Labsourced ("we", "our", "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase from us.</p>

<h3>1. Information We Collect</h3>
<p>We collect information you provide directly to us, including:</p>
<ul>
  <li>Personal identification information (name, email address, phone number)</li>
  <li>Shipping and billing information (address, city, ZIP, country)</li>
  <li>Order and purchase history</li>
  <li>Communication preferences (language, currency)</li>
  <li>Voluntarily provided research purpose information</li>
</ul>

<h3>2. How We Use Your Information</h3>
<p>We use the information we collect to process and fulfill your orders, send tracking updates, improve our website, and comply with legal obligations.</p>

<h3>3. Information Sharing</h3>
<p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent.</p>

<h3>4. Data Security</h3>
<p>We implement SSL encryption and industry-standard security practices to protect your data.</p>

<h3>5. Contact Us</h3>
<p>Email: <a href="mailto:privacy@labsourced.co">privacy@labsourced.co</a></p>`
  },
  'terms-conditions': {
    title: 'Terms & Conditions',
    content: `<h2>Terms & Conditions</h2>
<p>By accessing and using this website, you accept and agree to be bound by these Terms and Conditions.</p>

<h3>1. Research Use Only</h3>
<p>All products sold on this website are strictly for research purposes only. They are NOT intended for human or animal consumption. By purchasing, you confirm that you are a qualified researcher, 18+ years of age.</p>

<h3>2. Purchases & Orders</h3>
<p>By placing an order, you warrant that all information provided is accurate and complete. We reserve the right to refuse or cancel any order at our sole discretion.</p>

<h3>3. Pricing</h3>
<p>All prices are listed in USD. We reserve the right to change prices at any time without notice.</p>

<h3>4. Limitation of Liability</h3>
<p>Labsourced shall not be liable for any indirect, incidental, or consequential damages resulting from your use of our products.</p>

<h3>5. Contact</h3>
<p>For questions: legal@labsourced.co</p>`
  },
  'shipping-policy': {
    title: 'Shipping Policy',
    content: `<h2>Shipping Policy</h2>
<p>Labsourced ships research peptides worldwide from our secure, climate-controlled facilities.</p>

<h3>Processing Time</h3>
<p>All orders are processed within <strong>1–3 business days</strong> after payment confirmation.</p>

<h3>Shipping Options</h3>
<ul>
  <li>United States: 7–10 business days</li>
  <li>Europe & UK: 8–12 business days</li>
  <li>Canada & Australia: 10–14 business days</li>
  <li>Africa: 12–18 business days</li>
  <li>Asia & Middle East: 10–14 business days</li>
</ul>

<h3>Free Worldwide Shipping</h3>
<p>We offer <strong>free worldwide shipping on all orders over $150 USD</strong>. Applied automatically at checkout.</p>

<h3>Tracking</h3>
<p>You will receive a tracking code once your order ships. Track at any time on our Track Order page.</p>

<h3>Customs & Import Duties</h3>
<p>International orders may be subject to customs fees. These charges are the sole responsibility of the customer.</p>`
  },
  'refund-policy': {
    title: 'Refund Policy',
    content: `<h2>Refund Policy</h2>
<p>Due to the nature of our research compounds, all sales are <strong>final</strong> once an order has been processed and shipped.</p>

<h3>When We Will Issue a Refund or Replacement</h3>
<ul>
  <li>Your order arrived visibly damaged due to shipping</li>
  <li>You received the wrong product</li>
  <li>Your order was provably lost in transit</li>
  <li>A product significantly deviates from stated specifications</li>
</ul>

<h3>When Refunds Are Not Available</h3>
<ul>
  <li>Change of mind after order is placed</li>
  <li>Incorrect delivery information provided by customer</li>
  <li>Delays caused by customs or border control</li>
  <li>Orders where the product has been opened and used</li>
</ul>

<h3>Contact</h3>
<p>For refund inquiries: <a href="mailto:support@labsourced.co">support@labsourced.co</a></p>`
  }
};

function getPageData(slug) {
  const stored = localStorage.getItem(`cms_page_${slug}`);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return PAGE_DEFAULTS[slug] || { title: slug, content: '' };
}

function savePageToStorage(slug, title, content) {
  localStorage.setItem(`cms_page_${slug}`, JSON.stringify({ title, content }));
}

async function editPage(slug) {
  const page = getPageData(slug);
  document.getElementById('editPageSlug').value = slug;
  document.getElementById('pm_page_title').value = page.title;
  document.getElementById('pm_page_content').value = page.content;
  document.getElementById('pageModalTitle').textContent = `Edit: ${page.title}`;
  document.getElementById('pageModalOverlay').classList.add('open');
}
window.editPage = editPage;

async function savePage() {
  const slug = document.getElementById('editPageSlug').value;
  const title = document.getElementById('pm_page_title').value;
  const content = document.getElementById('pm_page_content').value;
  savePageToStorage(slug, title, content);
  closeModal('pageModalOverlay');
  showToast('Page saved successfully! Changes are live.');
}
window.savePage = savePage;

// =============================================
// CURRENCIES
// =============================================
async function renderCurrencies() {
  try {
    const currencies = await adminFetch('currency_settings', { select:'*', order:'code.asc' });
    const tbody = document.getElementById('currenciesTableBody');
    if (!tbody) return;
    tbody.innerHTML = currencies.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.code}</td>
        <td>${c.symbol}</td>
        <td>
          <input type="number" class="admin-search" style="width:120px;" value="${c.rate_from_usd}" step="0.000001" min="0" id="rate-${c.code}">
        </td>
        <td><span class="status-badge ${c.is_active ? 'sb-active' : 'sb-hidden'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button class="btn-icon" onclick="updateCurrencyRate('${c.code}')">💾 Save Rate</button>
        </td>
      </tr>`).join('');
  } catch(e) { console.error('Currency load error:', e); }
}

async function updateCurrencyRate(code) {
  const rate = parseFloat(document.getElementById(`rate-${code}`)?.value);
  if (isNaN(rate) || rate <= 0) { alert('Enter a valid rate'); return; }
  try {
    await adminPatch('currency_settings', { rate_from_usd: rate, updated_at: new Date().toISOString() }, { 'code': `eq.${code}` });
    showToast(`${code} rate updated to ${rate}`);
  } catch(e) { alert('Error: ' + e.message); }
}
window.updateCurrencyRate = updateCurrencyRate;

// =============================================
// MODAL HELPERS
// =============================================
function closeModal(overlayId) {
  document.getElementById(overlayId)?.classList.remove('open');
}
window.closeModal = closeModal;

// Close on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// =============================================
// TOAST
// =============================================
function showToast(msg, type = 'success') {
  const existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  toast.style.cssText = `position:fixed;bottom:2rem;right:2rem;z-index:99999;background:#06332F;color:#fff;padding:1rem 1.5rem;border-radius:12px;border-left:4px solid #C8A96A;font-family:'Inter',sans-serif;font-size:.9rem;box-shadow:0 8px 30px rgba(0,0,0,.3);transform:translateX(200%);transition:transform .35s;`;
  toast.textContent = `✓ ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.style.transform = 'translateX(0)', 10);
  setTimeout(() => { toast.style.transform = 'translateX(200%)'; setTimeout(() => toast.remove(), 400); }, 3500);
}

// =============================================
// FAQ MANAGEMENT (Stored in localStorage for now)
// =============================================
const DEFAULT_FAQS = [
  { q: "What are research peptides?", a: "Research peptides are short chains of amino acids used exclusively for scientific and laboratory research. They are not intended for human or veterinary use and are sold strictly for in vitro and in vivo research applications." },
  { q: "Are your peptides tested for purity?", a: "Yes. Every batch undergoes rigorous third-party HPLC testing and mass spectrometry analysis. A Certificate of Analysis (COA) is provided with every order, confirming purity, composition, and batch number." },
  { q: "What is the minimum purity level of your peptides?", a: "All Labsourced peptides carry a minimum purity of 98% as verified by HPLC analysis. Most batches achieve 99%+ purity. The exact figure is documented on your Certificate of Analysis." },
  { q: "How are products shipped?", a: "All orders are shipped in temperature-controlled packaging to maintain peptide stability during transit. We offer express international shipping with full tracking and discreet, professional packaging." },
  { q: "How long does shipping take?", a: "Domestic orders typically arrive within 2–4 business days. International orders take 5–10 business days depending on destination and customs clearance." },
  { q: "Do you ship internationally?", a: "Yes, we ship to most countries worldwide. It is the customer's responsibility to ensure that importing research chemicals is permitted in their jurisdiction. Please review your local regulations before ordering." },
  { q: "How should I store my peptides?", a: "Lyophilized (freeze-dried) peptides should be stored at -20°C or below, away from light and moisture. Once reconstituted, peptides should be refrigerated at 2–8°C and used within a reasonable timeframe." },
  { q: "What is the shelf life of your peptides?", a: "Lyophilized peptides stored properly at -20°C typically have a shelf life of 24 months or more. Reconstituted peptides should generally be used within 30 days when stored at 2–8°C." },
  { q: "Can I request a Certificate of Analysis for a specific batch?", a: "Yes. COA documents are available for every batch we sell. Contact our support team at support@labsourced.co with your order number and batch reference to request documentation." },
  { q: "Do you offer bulk or wholesale pricing?", a: "Yes. We offer competitive pricing for bulk and wholesale orders. Please contact us directly at support@labsourced.co to discuss your requirements and receive a customised quote." },
  { q: "What payment methods do you accept?", a: "We accept major credit cards, bank transfers, and other approved payment methods. All transactions are secured with industry-standard encryption for your protection." },
  { q: "What is your refund policy?", a: "We offer refunds or replacements for products that are damaged, defective, or do not match their Certificate of Analysis. Please review our full Refund Policy page for complete terms and conditions." },
  { q: "Can I track my order?", a: "Yes. A tracking number is provided via email as soon as your order is dispatched. You can also use our Track Order page on the website to check real-time delivery status." },
  { q: "Are your products suitable for human consumption?", a: "No. All Labsourced products are sold strictly for research purposes only and are not intended for human or animal consumption, therapeutic use, or any application outside of laboratory research." },
  { q: "How do I contact customer support?", a: "You can reach our support team at support@labsourced.co. We aim to respond to all inquiries within 24 business hours. For urgent matters, please include 'URGENT' in your subject line." }
];

let adminFaqs = [];

function loadAdminFaqs() {
  const stored = localStorage.getItem('labsourced_faqs');
  adminFaqs = stored ? JSON.parse(stored) : [...DEFAULT_FAQS];
  renderAdminFaqs();
}

function renderAdminFaqs() {
  const tbody = document.getElementById('faqAdminBody');
  if (!tbody) return;
  tbody.innerHTML = adminFaqs.map((f, i) => `
    <tr>
      <td>${i + 1}</td>
      <td style="font-weight:600">${f.q}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" onclick="openFaqModal(${i})" title="Edit">✏️</button>
          <button class="btn-icon" onclick="deleteFaq(${i})" title="Delete" style="color:#e74c3c">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openFaqModal(index) {
  document.getElementById('faqEditIndex').value = index === null ? '' : index;
  if (index !== null) {
    document.getElementById('faqQ').value = adminFaqs[index].q;
    document.getElementById('faqA').value = adminFaqs[index].a;
    document.getElementById('faqModalTitle').textContent = 'Edit FAQ';
  } else {
    document.getElementById('faqQ').value = '';
    document.getElementById('faqA').value = '';
    document.getElementById('faqModalTitle').textContent = 'Add FAQ';
  }
  document.getElementById('faqModalOverlay').classList.add('open');
}
window.openFaqModal = openFaqModal;

function saveFaq() {
  const idxStr = document.getElementById('faqEditIndex').value;
  const q = document.getElementById('faqQ').value.trim();
  const a = document.getElementById('faqA').value.trim();
  
  if (!q || !a) { alert('Question and Answer are required.'); return; }
  
  if (idxStr !== '') {
    adminFaqs[parseInt(idxStr)] = { q, a };
    showToast('FAQ updated');
  } else {
    adminFaqs.push({ q, a });
    showToast('FAQ added');
  }
  
  localStorage.setItem('labsourced_faqs', JSON.stringify(adminFaqs));
  renderAdminFaqs();
  closeModal('faqModalOverlay');
}
window.saveFaq = saveFaq;

function deleteFaq(index) {
  if (confirm('Are you sure you want to delete this FAQ?')) {
    adminFaqs.splice(index, 1);
    localStorage.setItem('labsourced_faqs', JSON.stringify(adminFaqs));
    renderAdminFaqs();
    showToast('FAQ deleted');
  }
}
window.deleteFaq = deleteFaq;


// =============================================
// BLOG MANAGEMENT (Stored in localStorage for now)
// =============================================
const DEFAULT_BLOGS = [
  {
    id: 'b1', tag: 'Research Update', title: 'BPC-157: Mechanisms of Tissue Repair in Current Research',
    excerpt: 'A review of the latest peer-reviewed findings on BPC-157\'s role in accelerating connective tissue regeneration and its implications for sports medicine research.',
    date: 'September 2026', img: null
  },
  {
    id: 'b2', tag: 'Science Brief', title: 'Semaglutide and Metabolic Research: What the Data Shows',
    excerpt: 'Our scientific team reviews the growing body of evidence around GLP-1 receptor agonism and its role in metabolic disease research applications.',
    date: 'August 2026', img: null
  },
  {
    id: 'b3', tag: 'Lab Insight', title: 'Understanding HPLC Testing: How We Verify Peptide Purity',
    excerpt: 'An inside look at the HPLC analysis process used to verify every batch of peptides before it leaves our facility — and what to look for in a Certificate of Analysis.',
    date: 'August 2026', img: null
  },
  {
    id: 'b4', tag: 'Research Update', title: 'TB-500 and Wound Healing: A Summary of Current Evidence',
    excerpt: 'We explore the most compelling research findings on Thymosin Beta-4 and its role in promoting cellular migration, angiogenesis, and tissue recovery.',
    date: 'July 2026', img: null
  },
  {
    id: 'b5', tag: 'Science Brief', title: 'CJC-1295 and Growth Hormone Research: Key Considerations',
    excerpt: 'A scientific overview of CJC-1295\'s mechanism of action, dosing considerations in research contexts, and what current studies reveal about its applications.',
    date: 'July 2026', img: null
  },
  {
    id: 'b6', tag: 'Lab Insight', title: 'Peptide Storage Best Practices for Research Facilities',
    excerpt: 'Proper storage is critical to peptide integrity. Our team shares evidence-based guidelines for maintaining peptide stability in research laboratory environments.',
    date: 'June 2026', img: null
  }
];

let adminBlogs = [];

function loadAdminBlogs() {
  const stored = localStorage.getItem('labsourced_blogs');
  adminBlogs = stored ? JSON.parse(stored) : [...DEFAULT_BLOGS];
  renderAdminBlogs();
}

function renderAdminBlogs() {
  const grid = document.getElementById('blogAdminGrid');
  if (!grid) return;
  grid.innerHTML = adminBlogs.map(b => `
    <div class="sc-card" style="margin-bottom:1rem;display:flex;gap:1rem;align-items:center;">
      ${b.img ? `<img src="${b.img}" style="width:100px;height:70px;object-fit:cover;border-radius:8px">` : `<div style="width:100px;height:70px;background:#eee;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;">🔬</div>`}
      <div style="flex:1">
        <h4 style="margin-bottom:0.25rem">${b.title}</h4>
        <div style="font-size:0.8rem;color:#666">${b.tag} | ${b.date}</div>
      </div>
      <div class="action-btns">
        <button class="btn-icon" onclick="openBlogModal('${b.id}')" title="Edit">✏️</button>
        <button class="btn-icon" onclick="deleteBlogPost('${b.id}')" title="Delete" style="color:#e74c3c">🗑️</button>
      </div>
    </div>
  `).join('');
}

function openBlogModal(id) {
  const idInput = document.getElementById('blogEditId');
  const title = document.getElementById('blogTitle');
  const tag = document.getElementById('blogTag');
  const excerpt = document.getElementById('blogExcerpt');
  const date = document.getElementById('blogDate');
  const imgData = document.getElementById('blogImgData');
  const preview = document.getElementById('blogImgPreview');
  const fileInput = document.getElementById('blogImgFile');
  
  fileInput.value = '';
  
  if (id) {
    const post = adminBlogs.find(b => b.id === id);
    idInput.value = id;
    title.value = post.title;
    tag.value = post.tag || '';
    excerpt.value = post.excerpt;
    date.value = post.date || '';
    imgData.value = post.img || '';
    if (post.img) { preview.src = post.img; preview.style.display = 'block'; } else { preview.style.display = 'none'; }
    document.getElementById('blogModalTitle').textContent = 'Edit Blog Post';
  } else {
    idInput.value = '';
    title.value = '';
    tag.value = '';
    excerpt.value = '';
    date.value = '';
    imgData.value = '';
    preview.style.display = 'none';
    document.getElementById('blogModalTitle').textContent = 'Add Blog Post';
  }
  document.getElementById('blogModalOverlay').classList.add('open');
}
window.openBlogModal = openBlogModal;

function previewBlogImg(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('blogImgData').value = e.target.result;
      document.getElementById('blogImgPreview').src = e.target.result;
      document.getElementById('blogImgPreview').style.display = 'block';
    }
    reader.readAsDataURL(input.files[0]);
  }
}
window.previewBlogImg = previewBlogImg;

function saveBlogPost() {
  const id = document.getElementById('blogEditId').value;
  const title = document.getElementById('blogTitle').value.trim();
  const tag = document.getElementById('blogTag').value.trim();
  const excerpt = document.getElementById('blogExcerpt').value.trim();
  const date = document.getElementById('blogDate').value.trim();
  const img = document.getElementById('blogImgData').value;
  
  if (!title || !excerpt) { alert('Title and Excerpt are required.'); return; }
  
  if (id) {
    const post = adminBlogs.find(b => b.id === id);
    if (post) {
      post.title = title; post.tag = tag; post.excerpt = excerpt; post.date = date; post.img = img;
    }
    showToast('Post updated');
  } else {
    adminBlogs.unshift({ id: 'b_' + Date.now(), title, tag, excerpt, date, img });
    showToast('Post added');
  }
  
  localStorage.setItem('labsourced_blogs', JSON.stringify(adminBlogs));
  renderAdminBlogs();
  closeModal('blogModalOverlay');
}
window.saveBlogPost = saveBlogPost;

function deleteBlogPost(id) {
  if (confirm('Are you sure you want to delete this blog post?')) {
    adminBlogs = adminBlogs.filter(b => b.id !== id);
    localStorage.setItem('labsourced_blogs', JSON.stringify(adminBlogs));
    renderAdminBlogs();
    showToast('Post deleted');
  }
}
window.deleteBlogPost = deleteBlogPost;

function openRlsModal() {
  document.getElementById('rlsModalOverlay')?.classList.add('open');
}
window.openRlsModal = openRlsModal;

function copyRlsSql() {
  const text = document.getElementById('rlsSqlCode')?.innerText;
  if (text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('SQL script copied to clipboard!');
    }).catch(() => {
      showToast('Copied SQL code!');
    });
  }
}
window.copyRlsSql = copyRlsSql;

// Call initializers
document.addEventListener('DOMContentLoaded', () => {
  // Add these alongside other loads in admin.js
  setTimeout(() => {
    loadAdminFaqs();
    loadAdminBlogs();
  }, 500);
});
