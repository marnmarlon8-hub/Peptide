// =============================================
// LABSOURCED — SUPABASE CONFIGURATION
// =============================================
const SUPABASE_URL = 'https://qlqkawvxlkkqbqkhoufp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscWthd3Z4bGtrcWJxa2hvdWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0OTUzOTcsImV4cCI6MjEwNjA3MTM5N30.aX5OPRxdKslk9sTVFXuYK5JWmfm_PAjq1AstQ2WMjm0';

// =============================================
// SUPABASE API WRAPPER
// =============================================
const db = {
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },

  async query(table, params = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const qp = new URLSearchParams();
    if (params.select) qp.set('select', params.select);
    if (params.filter) Object.entries(params.filter).forEach(([k, v]) => qp.set(k, v));
    if (params.order) qp.set('order', params.order);
    if (params.limit) qp.set('limit', params.limit);
    if (params.offset) qp.set('offset', params.offset);
    const qs = qp.toString();
    if (qs) url += '?' + qs;

    let dbData = [];
    try {
      const res = await fetch(url, { headers: this.headers });
      if (res.ok) dbData = await res.json();
    } catch(e) {
      console.warn('Supabase fetch warning:', e);
    }

    // Merge with custom items from localStorage
    const localItems = LS.get('custom_' + table) || [];
    if (localItems.length > 0) {
      const map = new Map();
      (dbData || []).forEach(item => map.set(item.id, item));
      localItems.forEach(item => map.set(item.id, item));
      let merged = Array.from(map.values());
      // Apply basic filtering if params.filter is provided
      if (params.filter) {
        merged = merged.filter(item => {
          for (const [k, v] of Object.entries(params.filter)) {
            if (typeof v === 'string' && v.startsWith('eq.')) {
              const val = v.slice(3);
              if (val === 'true') { if (!item[k]) return false; }
              else if (val === 'false') { if (item[k]) return false; }
              else if (String(item[k]) !== val) return false;
            } else if (typeof v === 'string' && v.startsWith('in.(')) {
              const vals = v.slice(4, -1).split(',').map(s => s.trim());
              if (!vals.includes(String(item[k]))) return false;
            }
          }
          return true;
        });
      }
      return merged;
    }

    return dbData || [];
  },

  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...this.headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(table, data, filter) {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const qp = new URLSearchParams(filter);
    url += '?' + qp.toString();
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { ...this.headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete(table, filter) {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const qp = new URLSearchParams(filter);
    url += '?' + qp.toString();
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.headers
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  },

  // Auth methods
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.message || 'Login failed');
    return data;
  },

  async getUser(token) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return res.json();
  },

  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
    });
  },

  // Authenticated query (for admin)
  authHeaders(token) {
    return {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`
    };
  },

  async authQuery(table, params = {}, token) {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const qp = new URLSearchParams();
    if (params.select) qp.set('select', params.select);
    if (params.filter) Object.entries(params.filter).forEach(([k, v]) => qp.set(k, v));
    if (params.order) qp.set('order', params.order);
    if (params.limit) qp.set('limit', params.limit);
    const qs = qp.toString();
    if (qs) url += '?' + qs;
    const res = await fetch(url, { headers: this.authHeaders(token) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async authInsert(table, data, token) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...this.authHeaders(token), 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async authUpdate(table, data, filter, token) {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const qp = new URLSearchParams(filter);
    url += '?' + qp.toString();
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { ...this.authHeaders(token), 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async authDelete(table, filter, token) {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const qp = new URLSearchParams(filter);
    url += '?' + qp.toString();
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.authHeaders(token)
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  },

  // Storage upload
  async uploadFile(bucket, path, file, token) {
    const formData = new FormData();
    formData.append('', file);
    const authTok = token || SUPABASE_ANON_KEY;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${authTok}`
      },
      body: formData
    });
    if (!res.ok) {
      // Try upsert
      const res2 = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
        method: 'PUT',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${authTok}` },
        body: file
      });
      if (!res2.ok) throw new Error(await res2.text());
      return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  },

  getPublicUrl(bucket, path) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }
};

// =============================================
// GLOBAL STATE
// =============================================
const LS = {
  get: (key) => { try { return JSON.parse(localStorage.getItem('ls_' + key)); } catch(e) { return null; } },
  set: (key, val) => localStorage.setItem('ls_' + key, JSON.stringify(val)),
  remove: (key) => localStorage.removeItem('ls_' + key)
};

// Cart
const Cart = {
  getItems() { return LS.get('cart') || []; },
  addItem(item) {
    const items = this.getItems();
    const existing = items.find(i => i.variation_id === item.variation_id);
    if (existing) { existing.quantity += item.quantity; }
    else { items.push(item); }
    LS.set('cart', items);
    this.updateCount();
    return items;
  },
  removeItem(variationId) {
    const items = this.getItems().filter(i => i.variation_id !== variationId);
    LS.set('cart', items);
    this.updateCount();
    return items;
  },
  updateQuantity(variationId, qty) {
    const items = this.getItems();
    const item = items.find(i => i.variation_id === variationId);
    if (item) { item.quantity = qty; }
    LS.set('cart', items);
    this.updateCount();
    return items;
  },
  clear() { LS.remove('cart'); this.updateCount(); },
  getTotal() { return this.getItems().reduce((t, i) => t + (i.price_usd * i.quantity), 0); },
  getCount() { return this.getItems().reduce((t, i) => t + i.quantity, 0); },
  updateCount() {
    document.querySelectorAll('.cart-count').forEach(el => {
      const c = this.getCount();
      el.textContent = c;
      el.style.display = c > 0 ? 'flex' : 'none';
    });
  }
};

// Language / Currency
const Prefs = {
  getLang() { return LS.get('lang') || 'en'; },
  getCurrency() { return LS.get('currency') || 'USD'; },
  getCountry() { return LS.get('country') || ''; },
  getCurrencyRate() { return parseFloat(LS.get('currency_rate')) || 1; },
  getCurrencySymbol() { return LS.get('currency_symbol') || '$'; },
  set(lang, currency, country, rate, symbol) {
    LS.set('lang', lang);
    LS.set('currency', currency);
    LS.set('country', country);
    LS.set('currency_rate', rate);
    LS.set('currency_symbol', symbol);
  }
};

// Format price
function formatPrice(usdAmount) {
  const rate = Prefs.getCurrencyRate();
  const symbol = Prefs.getCurrencySymbol();
  const converted = (usdAmount * rate).toFixed(2);
  return `${symbol}${converted}`;
}

// Translations
const TRANSLATIONS = {
  en: {
    shop: 'Shop', peptides: 'Peptides', stacks: 'Stacks', learning: 'Learning Hub',
    about: 'About', cart: 'Cart', account: 'Account', search: 'Search',
    add_to_cart: 'Add to Cart', view_details: 'View Details', track_order: 'Track Order',
    checkout: 'Checkout', subtotal: 'Subtotal', total: 'Total', quantity: 'Quantity',
    shop_by_category: 'Shop by Category', most_trusted: 'Most Trusted Peptides',
    featured: 'Featured Products', reviews: 'Reviews', related: 'Related Products',
    privacy: 'Privacy Policy', terms: 'Terms & Conditions', shipping_policy: 'Shipping Policy',
    refund: 'Refund Policy', free_shipping: 'Free Worldwide Shipping on Orders Over',
    select_variation: 'Select Size', write_review: 'Write a Review', submit: 'Submit',
    name: 'Full Name', email: 'Email Address', country: 'Country', city: 'City',
    address: 'Address', zip: 'ZIP Code', whatsapp: 'WhatsApp Number', phone: 'Phone Number',
    reason: 'Reason for Purchase', payment_method: 'Payment Method', confirm_order: 'Confirm Order',
    order_placed: 'Order Placed Successfully!', tracking_number: 'Your Tracking Number',
    continue_shopping: 'Continue Shopping', remove: 'Remove', empty_cart: 'Your cart is empty'
  },
  fr: {
    shop: 'Boutique', peptides: 'Peptides', stacks: 'Piles', learning: 'Centre d\'apprentissage',
    about: 'À propos', cart: 'Panier', account: 'Compte', search: 'Rechercher',
    add_to_cart: 'Ajouter au panier', view_details: 'Voir les détails', track_order: 'Suivre la commande',
    checkout: 'Passer la commande', subtotal: 'Sous-total', total: 'Total', quantity: 'Quantité',
    shop_by_category: 'Acheter par catégorie', most_trusted: 'Peptides les plus fiables',
    featured: 'Produits en vedette', reviews: 'Avis', related: 'Produits similaires',
    privacy: 'Politique de confidentialité', terms: 'Conditions générales', shipping_policy: 'Politique d\'expédition',
    refund: 'Politique de remboursement', free_shipping: 'Livraison mondiale gratuite pour les commandes supérieures à',
    select_variation: 'Choisir la taille', write_review: 'Écrire un avis', submit: 'Soumettre',
    name: 'Nom complet', email: 'Adresse e-mail', country: 'Pays', city: 'Ville',
    address: 'Adresse', zip: 'Code postal', whatsapp: 'Numéro WhatsApp', phone: 'Numéro de téléphone',
    reason: 'Raison d\'achat', payment_method: 'Méthode de paiement', confirm_order: 'Confirmer la commande',
    order_placed: 'Commande passée avec succès!', tracking_number: 'Votre numéro de suivi',
    continue_shopping: 'Continuer les achats', remove: 'Supprimer', empty_cart: 'Votre panier est vide'
  },
  es: {
    shop: 'Tienda', peptides: 'Péptidos', stacks: 'Pilas', learning: 'Centro de aprendizaje',
    about: 'Acerca de', cart: 'Carrito', account: 'Cuenta', search: 'Buscar',
    add_to_cart: 'Agregar al carrito', view_details: 'Ver detalles', track_order: 'Rastrear pedido',
    checkout: 'Finalizar compra', subtotal: 'Subtotal', total: 'Total', quantity: 'Cantidad',
    shop_by_category: 'Comprar por categoría', most_trusted: 'Péptidos más confiables',
    featured: 'Productos destacados', reviews: 'Reseñas', related: 'Productos relacionados',
    privacy: 'Política de privacidad', terms: 'Términos y condiciones', shipping_policy: 'Política de envío',
    refund: 'Política de reembolso', free_shipping: 'Envío mundial gratuito en pedidos superiores a',
    select_variation: 'Seleccionar tamaño', write_review: 'Escribir una reseña', submit: 'Enviar',
    name: 'Nombre completo', email: 'Correo electrónico', country: 'País', city: 'Ciudad',
    address: 'Dirección', zip: 'Código postal', whatsapp: 'Número de WhatsApp', phone: 'Número de teléfono',
    reason: 'Razón de compra', payment_method: 'Método de pago', confirm_order: 'Confirmar pedido',
    order_placed: '¡Pedido realizado con éxito!', tracking_number: 'Tu número de seguimiento',
    continue_shopping: 'Continuar comprando', remove: 'Eliminar', empty_cart: 'Tu carrito está vacío'
  },
  de: {
    shop: 'Shop', peptides: 'Peptide', stacks: 'Stapel', learning: 'Lernzentrum',
    about: 'Über uns', cart: 'Warenkorb', account: 'Konto', search: 'Suchen',
    add_to_cart: 'In den Warenkorb', view_details: 'Details anzeigen', track_order: 'Bestellung verfolgen',
    checkout: 'Zur Kasse', subtotal: 'Zwischensumme', total: 'Gesamt', quantity: 'Menge',
    shop_by_category: 'Nach Kategorie einkaufen', most_trusted: 'Vertrauenswürdigste Peptide',
    featured: 'Ausgewählte Produkte', reviews: 'Bewertungen', related: 'Ähnliche Produkte',
    privacy: 'Datenschutzrichtlinie', terms: 'AGB', shipping_policy: 'Versandpolitik',
    refund: 'Rückgaberecht', free_shipping: 'Kostenloser weltweiter Versand ab',
    select_variation: 'Größe wählen', write_review: 'Bewertung schreiben', submit: 'Einreichen',
    name: 'Vollständiger Name', email: 'E-Mail-Adresse', country: 'Land', city: 'Stadt',
    address: 'Adresse', zip: 'Postleitzahl', whatsapp: 'WhatsApp-Nummer', phone: 'Telefonnummer',
    reason: 'Kaufgrund', payment_method: 'Zahlungsmethode', confirm_order: 'Bestellung bestätigen',
    order_placed: 'Bestellung erfolgreich aufgegeben!', tracking_number: 'Ihre Tracking-Nummer',
    continue_shopping: 'Weiter einkaufen', remove: 'Entfernen', empty_cart: 'Ihr Warenkorb ist leer'
  },
  it: {
    shop: 'Negozio', peptides: 'Peptidi', stacks: 'Stack', learning: 'Centro di apprendimento',
    about: 'Chi siamo', cart: 'Carrello', account: 'Account', search: 'Cerca',
    add_to_cart: 'Aggiungi al carrello', view_details: 'Visualizza dettagli', track_order: 'Traccia ordine',
    checkout: 'Procedi al pagamento', subtotal: 'Subtotale', total: 'Totale', quantity: 'Quantità',
    shop_by_category: 'Acquista per categoria', most_trusted: 'Peptidi più affidabili',
    featured: 'Prodotti in evidenza', reviews: 'Recensioni', related: 'Prodotti correlati',
    privacy: 'Informativa sulla privacy', terms: 'Termini e condizioni', shipping_policy: 'Politica di spedizione',
    refund: 'Politica di rimborso', free_shipping: 'Spedizione mondiale gratuita per ordini superiori a',
    select_variation: 'Seleziona dimensione', write_review: 'Scrivi una recensione', submit: 'Invia',
    name: 'Nome completo', email: 'Indirizzo email', country: 'Paese', city: 'Città',
    address: 'Indirizzo', zip: 'Codice postale', whatsapp: 'Numero WhatsApp', phone: 'Numero di telefono',
    reason: 'Motivo dell\'acquisto', payment_method: 'Metodo di pagamento', confirm_order: 'Conferma ordine',
    order_placed: 'Ordine effettuato con successo!', tracking_number: 'Il tuo numero di tracciamento',
    continue_shopping: 'Continua gli acquisti', remove: 'Rimuovi', empty_cart: 'Il tuo carrello è vuoto'
  }
};

function t(key) {
  const lang = Prefs.getLang();
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS['en'][key] || key;
}

// Apply translations to elements with data-t attribute
function applyTranslations() {
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    el.textContent = t(key);
  });
}

// Generate tracking code
function generateTrackingCode() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `LS-${year}${rand}`;
}

// Toast notification
function showToast(message, type = 'success') {
  const existing = document.querySelector('.ls-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `ls-toast ls-toast--${type}`;
  toast.innerHTML = `
    <div class="ls-toast-inner">
      <span class="ls-toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span>${message}</span>
    </div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
}

// Initialize cart count on load
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateCount();
});
