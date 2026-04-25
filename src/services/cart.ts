import '../styles/global.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { cartItem, Tcart, TcartTotal } from '../types/type';
import { MENU_ITEMS, GENERIC_ITEMS, VALID_COUPONS } from '../assets/foodDeliveryConstants';
import { calculateDeliveryFee, isPeakHour } from '../utils/pricing';
import type { MenuItem } from '../types/type';
import { setupNavbarAuth } from '../utils/auth';

export class Cart {
  private yourBag!: Tcart;
  private cart_key = 'my-cart-items';
  private total_key = 'cart_total';
  private coupon_key = 'applied_coupon';
  private cartQty = 0;
  private appliedCoupon: string | null = null;
  private discountAmount = 0;
  private menuItemMap = new Map<string, MenuItem>();

  private cartContent = document.getElementById('cartContent') as HTMLElement;

  private static instance: Cart | null = null;

  static getInstance(): Cart {
    if (Cart.instance === null) Cart.instance = new Cart();
    return Cart.instance;
  }

  private constructor() {
    this.buildMenuMap();
    this.loadCoupon();
    this.getCart();
    this.renderRestaurantBanner();
    this.render();
    this.setupCoupon();
    this.setupCouponChips();
    this.updateNavbar();
  }

  private buildMenuMap() {
    // Build a flat lookup of itemId -> MenuItem for image URLs
    for (const items of Object.values(MENU_ITEMS)) {
      items.forEach(item => this.menuItemMap.set(item.id, item));
    }
    GENERIC_ITEMS.forEach(item => this.menuItemMap.set(item.id, item));
  }

  private getCart() {
    const data = localStorage.getItem(this.cart_key) || '{}';
    const parsed = data !== '{}' ? JSON.parse(data) : null;
    this.yourBag = parsed ?? { items: [], createdAt: new Date() };
  }

  private changeData(data: cartItem[]) {
    localStorage.setItem(this.cart_key, JSON.stringify({ items: data, createdAt: new Date() }));
  }

  private updateCart(id: string) {
    const filtered = this.yourBag.items.filter(d => d.itemId !== id);
    this.changeData(filtered);
    this.yourBag.items = filtered;
    this.render(filtered);
  }

  private updateItemQty(id: string, delta: number) {
    const item = this.yourBag.items.find(i => i.itemId === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      this.updateCart(id);
      return;
    }
    this.changeData(this.yourBag.items);
    this.render();
  }

  private saveCartTotal(data: TcartTotal) {
    localStorage.setItem(this.total_key, JSON.stringify(data));
  }

  private renderRestaurantBanner() {
    const banner = document.getElementById('restaurantBanner') as HTMLElement;
    const nameEl = document.getElementById('cartRestaurantName') as HTMLElement;
    const restaurant = localStorage.getItem('current-restaurant');
    if (restaurant && banner && nameEl) {
      banner.style.display = 'flex';
      nameEl.textContent = restaurant;
    }
  }

  private render(data: cartItem[] = this.yourBag.items) {
    this.cartContent.textContent = '';

    // Update subtitle
    const subtitle = document.getElementById('cartSubtitle') as HTMLElement;

    if (data.length === 0) {
      if (subtitle) subtitle.textContent = 'Your cart is empty';
      // Hide restaurant banner when empty
      const banner = document.getElementById('restaurantBanner') as HTMLElement;
      if (banner) banner.style.display = 'none';

      this.cartContent.innerHTML = `
        <div class="fh-empty-state">
          <i class="bi bi-bag-x d-block"></i>
          <h4>Your Cart is Empty</h4>
          <p>Looks like you haven't added any items yet.</p>
          <a href="./menu.html" class="fh-btn-primary mt-2" style="display:inline-flex;">
            <i class="bi bi-search"></i> Browse Restaurants
          </a>
        </div>`;
      this.renderTotal(data);
      return;
    }

    const totalQty = data.reduce((s, i) => s + i.qty, 0);
    if (subtitle) subtitle.textContent = `${totalQty} item${totalQty > 1 ? 's' : ''} in your cart`;

    data.forEach((element, idx) => {
      const menuItem = this.menuItemMap.get(element.itemId);
      const imgUrl = menuItem?.imageUrl || '';

      const row = document.createElement('div');
      row.id = `cartItem-${element.itemId}`;
      row.className = 'fh-cart-item fade-in';
      row.style.animationDelay = `${idx * 0.05}s`;

      row.innerHTML = `
        ${imgUrl ? `<img src="${imgUrl}" alt="${element.itemName}" class="fh-cart-item-img" loading="lazy" />` : ''}
        <div class="fh-cart-item-info">
          <h6>${element.itemName}</h6>
          <small>₹${element.price} each</small>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div class="fh-qty-stepper">
            <button id="dec-${element.itemId}" aria-label="Decrease">&ndash;</button>
            <span>${element.qty}</span>
            <button id="inc-${element.itemId}" aria-label="Increase">+</button>
          </div>
          <span class="fh-cart-item-price">₹${element.price * element.qty}</span>
          <button class="fh-cart-remove" id="remove-${element.itemId}" aria-label="Remove ${element.itemName}">
            <i class="bi bi-trash3"></i>
          </button>
        </div>`;

      this.cartContent.appendChild(row);

      // Event listeners
      document.getElementById(`remove-${element.itemId}`)?.addEventListener('click', () => {
        this.updateCart(element.itemId);
      });
      document.getElementById(`inc-${element.itemId}`)?.addEventListener('click', () => {
        this.updateItemQty(element.itemId, 1);
      });
      document.getElementById(`dec-${element.itemId}`)?.addEventListener('click', () => {
        this.updateItemQty(element.itemId, -1);
      });
    });

    this.renderTotal(data);
  }

  private renderTotal(data: cartItem[] = this.yourBag.items) {
    this.cartQty = data.reduce((c, i) => c + i.qty, 0);

    // Update nav badge
    const badge = document.getElementById('navCartBadge') as HTMLElement;
    if (badge) {
      if (this.cartQty > 0) {
        badge.textContent = String(this.cartQty);
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }

    const totals = this.recalculateCartTotals(data);

    const grandTotal: TcartTotal = {
      subtotal: totals.subtotal,
      surge: totals.surge,
      tax: totals.tax,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      cartQty: this.cartQty,
    };
    this.saveCartTotal(grandTotal);

    // Also save discount info
    localStorage.setItem('cart_discount', JSON.stringify({ discount: this.discountAmount, coupon: this.appliedCoupon }));

    const summaryEl = document.getElementById('cartSummarySection') as HTMLElement;
    summaryEl.innerHTML = `
      <div class="d-flex justify-content-between mb-2" style="font-size:var(--fs-sm);">
        <span style="color:var(--gray-600);">Subtotal (${this.cartQty} items)</span>
        <span class="fw-bold">₹${totals.subtotal}</span>
      </div>
      ${this.discountAmount > 0 ? `
        <div class="d-flex justify-content-between mb-2" style="font-size:var(--fs-sm); color:var(--success);">
          <span><i class="bi bi-tag-fill"></i> ${this.appliedCoupon}</span>
          <span class="fw-bold">-₹${this.discountAmount}</span>
        </div>` : ''}
      ${totals.surge > 0 ? `
        <div class="d-flex justify-content-between mb-2" style="font-size:var(--fs-sm);">
          <span style="color:var(--gray-600);">Peak Hour Surge (15%)</span>
          <span class="fw-bold">₹${totals.surge}</span>
        </div>` : ''}
      <div class="d-flex justify-content-between mb-2" style="font-size:var(--fs-sm);">
        <span style="color:var(--gray-600);">Taxes (5%)</span>
        <span class="fw-bold">₹${totals.tax}</span>
      </div>
      <div class="d-flex justify-content-between mb-2" style="font-size:var(--fs-sm);">
        <span style="color:var(--gray-600);">Delivery Fee</span>
        <span class="fw-bold">${totals.deliveryFee === 0 ? '<span style="color:var(--success);">FREE</span>' : `₹${totals.deliveryFee}`}</span>
      </div>
      <hr />
      <div class="d-flex justify-content-between" style="font-size:var(--fs-lg);">
        <span class="fw-bold">Total</span>
        <span class="fw-bold" style="color:var(--primary);">₹${totals.total}</span>
      </div>
      ${totals.subtotal > 0 && this.discountAmount === 0 ? `
        <div class="mt-2 p-2 rounded-3 text-center" style="background:#fff3e0;font-size:var(--fs-xs);color:#e65100;">
          <i class="bi bi-lightbulb"></i> Apply a coupon to save up to 50%!
        </div>` : ''}`;

    const checkoutBtn = document.getElementById('checkoutBtn') as HTMLButtonElement;
    if (this.cartQty > 0) {
      checkoutBtn.style.display = 'flex';
      checkoutBtn.onclick = () => window.location.href = 'checkout.html';
    } else {
      checkoutBtn.style.display = 'none';
    }
  }

  private recalculateCartTotals(cartData: cartItem[]) {
    let subtotal = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);
    let afterDiscount = subtotal - this.discountAmount;
    if (afterDiscount < 0) afterDiscount = 0;

    let surge = 0;
    if (isPeakHour()) surge = Math.round(afterDiscount * 0.15);

    let withSurge = afterDiscount + surge;
    let tax = Math.round(withSurge * 0.05);
    let deliveryFee = calculateDeliveryFee(15);
    let total = withSurge + tax + deliveryFee;

    if (cartData.length === 0) return { subtotal: 0, surge: 0, tax: 0, deliveryFee: 0, total: 0 };
    return { subtotal, surge, tax, deliveryFee, total };
  }

  // Coupon management
  private loadCoupon() {
    const saved = localStorage.getItem(this.coupon_key);
    if (saved) this.appliedCoupon = saved;
  }

  private setupCoupon() {
    document.getElementById('applyCouponBtn')?.addEventListener('click', () => this.applyCoupon());
    document.getElementById('couponInput')?.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') this.applyCoupon();
    });
    document.getElementById('removeCouponBtn')?.addEventListener('click', () => this.removeCoupon());

    if (this.appliedCoupon) {
      this.calculateDiscount();
      this.showAppliedCoupon();
    }
  }

  private setupCouponChips() {
    document.querySelectorAll('[data-coupon]').forEach(chip => {
      chip.addEventListener('click', () => {
        const code = (chip as HTMLElement).dataset.coupon || '';
        const input = document.getElementById('couponInput') as HTMLInputElement;
        if (input) { input.value = code; }
        this.applyCoupon();
      });
    });
  }

  private applyCoupon() {
    const input = document.getElementById('couponInput') as HTMLInputElement;
    const errorEl = document.getElementById('couponError') as HTMLElement;
    const code = input.value.trim().toUpperCase();

    errorEl.style.display = 'none';

    if (!code) {
      errorEl.textContent = 'Please enter a coupon code.';
      errorEl.style.display = 'block';
      return;
    }

    const coupon = VALID_COUPONS[code];
    if (!coupon) {
      errorEl.textContent = 'Invalid coupon code. Try SAVE10, ZEN50, or FIRSTORDER.';
      errorEl.style.display = 'block';
      return;
    }

    const subtotal = this.yourBag.items.reduce((s, i) => s + i.price * i.qty, 0);
    if (subtotal < coupon.minAmount) {
      errorEl.textContent = `Minimum order of ₹${coupon.minAmount} required for this coupon.`;
      errorEl.style.display = 'block';
      return;
    }

    this.appliedCoupon = code;
    localStorage.setItem(this.coupon_key, code);
    this.calculateDiscount();
    this.showAppliedCoupon();
    this.render();
  }

  private calculateDiscount() {
    if (!this.appliedCoupon) { this.discountAmount = 0; return; }
    const coupon = VALID_COUPONS[this.appliedCoupon];
    if (!coupon) { this.discountAmount = 0; return; }
    const subtotal = this.yourBag.items.reduce((s, i) => s + i.price * i.qty, 0);
    this.discountAmount = Math.round(subtotal * coupon.discountPercent / 100);
  }

  private removeCoupon() {
    this.appliedCoupon = null;
    this.discountAmount = 0;
    localStorage.removeItem(this.coupon_key);
    this.hideAppliedCoupon();
    this.render();
  }

  private showAppliedCoupon() {
    const input = document.getElementById('couponInput') as HTMLInputElement;
    const applyBtn = document.getElementById('applyCouponBtn') as HTMLElement;
    const applied = document.getElementById('couponApplied') as HTMLElement;
    const codeEl = document.getElementById('couponCode') as HTMLElement;
    const chips = document.getElementById('couponChips') as HTMLElement;

    input.style.display = 'none';
    applyBtn.style.display = 'none';
    applied.style.display = 'flex';
    codeEl.textContent = this.appliedCoupon || '';
    if (chips) chips.style.display = 'none';
  }

  private hideAppliedCoupon() {
    const input = document.getElementById('couponInput') as HTMLInputElement;
    const applyBtn = document.getElementById('applyCouponBtn') as HTMLElement;
    const applied = document.getElementById('couponApplied') as HTMLElement;
    const chips = document.getElementById('couponChips') as HTMLElement;

    input.style.display = 'block';
    input.value = '';
    applyBtn.style.display = 'block';
    applied.style.display = 'none';
    if (chips) chips.style.display = 'flex';
    (document.getElementById('couponError') as HTMLElement).style.display = 'none';
  }

  private updateNavbar() {
    setupNavbarAuth();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Cart.getInstance();
});
