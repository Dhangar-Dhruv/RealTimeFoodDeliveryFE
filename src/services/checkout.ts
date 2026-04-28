import '../styles/global.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { TcartTotal, TAdd, TPay } from '../types/type';

import { setupNavbarAuth, requireAuth } from '../utils/auth';
import { ValidationUI } from '../utils/validation_ui';

export class Checkout {
  private total_key = 'cart_total';
  private cart_key = 'my-cart-items';
  private address_key = 'my-address';
  private checkout_state_key = 'checkout_state';

  private yourCart!: TcartTotal;

  private currentStep = 1;
  private savedAddress: TAdd | null = null;
  private savedPayment: TPay | null = null;

  private stepAddress: HTMLElement;
  private stepPayment: HTMLElement;
  private finalConfirmation: HTMLElement;
  private progressBar: HTMLElement;
  private progressBtns: [HTMLElement, HTMLElement, HTMLElement];
  private backBtn: HTMLButtonElement;
  private continueBtn: HTMLButtonElement;
  private finalAddressEl: HTMLElement;
  private finalPaymentEl: HTMLElement;
  private saveAddressCheckbox: HTMLInputElement | null = null;

  private static instance: Checkout | null = null;

  static getInstance(): Checkout {
    if (Checkout.instance === null) Checkout.instance = new Checkout();
    return Checkout.instance;
  }

  private constructor() {
    requireAuth();
    this.stepAddress = document.getElementById('stepAddress') as HTMLElement;
    this.stepPayment = document.getElementById('stepPayment') as HTMLElement;
    this.finalConfirmation = document.getElementById('finalConfirmation') as HTMLElement;
    this.progressBar = document.querySelector('#cust-progress .progress-bar') as HTMLElement;
    this.progressBtns = [
      document.getElementById('progress-btn-1') as HTMLElement,
      document.getElementById('progress-btn-2') as HTMLElement,
      document.getElementById('progress-btn-3') as HTMLElement,
    ];
    this.backBtn = document.getElementById('checkoutBackBtn') as HTMLButtonElement;
    this.continueBtn = document.getElementById('checkoutContinueBtn') as HTMLButtonElement;
    this.finalAddressEl = document.getElementById('finalAddress') as HTMLElement;
    this.finalPaymentEl = document.getElementById('finalPayment') as HTMLElement;
    this.saveAddressCheckbox = document.getElementById('saveAddressCheckbox') as HTMLInputElement;

    this.getCartTotal();
    this.updateCartBadge();
    this.renderTotal();
    this.updateFormFromLocalStorage();
    this.setupAddressAutoSave();
    this.loadStateFromLocalStorage();
    this.showStep(this.currentStep);
    this.setupStepNavigation();
    this.setupPaymentToggles();
    this.setupCardValidation();
    this.setupEditLinks();
    this.updateNavProfile();
  }

  private getCartTotal() {
    const data = localStorage.getItem(this.total_key) || '{}';
    const parsed = data !== '{}' ? JSON.parse(data) : null;
    this.yourCart = parsed ?? { subtotal: 0, surge: 0, tax: 0, deliveryFee: 0, total: 0, cartQty: 0 };
  }

  private getAddress() {
    const data = localStorage.getItem(this.address_key);
    if (!data) { this.savedAddress = null; return; }
    try { this.savedAddress = JSON.parse(data) as TAdd; } catch { this.savedAddress = null; }
  }

  private setAddress() {
    localStorage.setItem(this.address_key, JSON.stringify(this.savedAddress));
  }

  private updateCartBadge() {
    const badge = document.getElementById('navCartBadge') as HTMLElement;
    if (badge && this.yourCart.cartQty > 0) {
      badge.textContent = String(this.yourCart.cartQty);
      badge.style.display = 'flex';
    }
  }

  private renderTotal() {
    const el = document.getElementById('cartSummarySection') as HTMLElement;
    const discountData = JSON.parse(localStorage.getItem('cart_discount') || '{"discount":0}');
    const discount = discountData.discount || 0;

    el.innerHTML = `
      <div class="d-flex justify-content-between mb-2" style="font-size:var(--fs-sm);">
        <span style="color:var(--gray-600);">Subtotal</span>
        <span class="fw-bold">₹${this.yourCart.subtotal}</span>
      </div>
      ${discount > 0 ? `<div class="d-flex justify-content-between mb-2" style="font-size:var(--fs-sm);color:var(--success);">
        <span>Discount</span><span class="fw-bold">-₹${discount}</span>
      </div>` : ''}
      ${this.yourCart.surge > 0 ? `<div class="d-flex justify-content-between mb-2" style="font-size:var(--fs-sm);">
        <span style="color:var(--gray-600);">Peak Surge</span><span class="fw-bold">₹${this.yourCart.surge}</span>
      </div>` : ''}
      <div class="d-flex justify-content-between mb-2" style="font-size:var(--fs-sm);">
        <span style="color:var(--gray-600);">Tax</span><span class="fw-bold">₹${this.yourCart.tax}</span>
      </div>
      <div class="d-flex justify-content-between mb-2" style="font-size:var(--fs-sm);">
        <span style="color:var(--gray-600);">Delivery</span>
        <span class="fw-bold">${this.yourCart.deliveryFee === 0 ? '<span style="color:var(--success);">FREE</span>' : `₹${this.yourCart.deliveryFee}`}</span>
      </div>
      <hr />
      <div class="d-flex justify-content-between" style="font-size:var(--fs-lg);">
        <span class="fw-bold">Total</span>
        <span class="fw-bold" style="color:var(--primary);">₹${this.yourCart.total}</span>
      </div>`;
  }

  private updateFormFromLocalStorage() {
    this.getAddress();
    const street = document.getElementById('addressLine1') as HTMLInputElement | null;
    const city = document.getElementById('addressCity') as HTMLInputElement | null;
    const zip = document.getElementById('addressZip') as HTMLInputElement | null;
    if (!this.savedAddress) return;
    if (street) street.value = this.savedAddress.street ?? '';
    if (city) city.value = this.savedAddress.city ?? '';
    if (zip) zip.value = this.savedAddress.zip ?? '';
    const any = this.savedAddress as unknown as { saveForLater?: boolean };
    if (this.saveAddressCheckbox && any.saveForLater) this.saveAddressCheckbox.checked = true;
  }

  private loadStateFromLocalStorage() {
    const raw = localStorage.getItem(this.checkout_state_key);
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      if (typeof state.currentStep === 'number' && state.currentStep >= 1 && state.currentStep <= 3) this.currentStep = state.currentStep;
      this.savedPayment = state.paymentMethod ?? null;

      const cn = document.getElementById('cardNumber') as HTMLInputElement | null;
      const ce = document.getElementById('cardExpiry') as HTMLInputElement | null;
      const cv = document.getElementById('cardCVV') as HTMLInputElement | null;
      if (cn && state.cardNumber) cn.value = state.cardNumber;
      if (ce && state.cardExpiry) ce.value = state.cardExpiry;
      if (cv && state.cardCVV) cv.value = state.cardCVV;

      if (this.savedPayment) {
        const radio = document.querySelector(`input[name="paymentMethod"][value="${this.savedPayment}"]`) as HTMLInputElement | null;
        if (radio) radio.checked = true;
      }
    } catch { /* ignore */ }
  }

  private persistState() {
    const cn = document.getElementById('cardNumber') as HTMLInputElement | null;
    const ce = document.getElementById('cardExpiry') as HTMLInputElement | null;
    const cv = document.getElementById('cardCVV') as HTMLInputElement | null;
    localStorage.setItem(this.checkout_state_key, JSON.stringify({
      currentStep: this.currentStep,
      paymentMethod: this.savedPayment,
      cardNumber: cn?.value ?? '',
      cardExpiry: ce?.value ?? '',
      cardCVV: cv?.value ?? '',
    }));
  }

  private setupAddressAutoSave() {
    const handler = () => this.saveAddressFromForm();
    document.getElementById('addressLine1')?.addEventListener('input', handler);
    document.getElementById('addressCity')?.addEventListener('input', handler);
    document.getElementById('addressZip')?.addEventListener('input', handler);
    this.saveAddressCheckbox?.addEventListener('change', handler);
  }

  private setupStepNavigation() {
    this.backBtn?.addEventListener('click', () => {
      if (this.currentStep > 1) {
        this.currentStep--;
        this.showStep(this.currentStep);
        this.persistState();
      }
    });

    this.continueBtn?.addEventListener('click', () => {
      if (this.currentStep === 1) {
        if (!ValidationUI.validateForm('addressForm')) return;
        this.saveAddressFromForm();
        this.currentStep = 2;
        this.showStep(2);
        this.persistState();
      } else if (this.currentStep === 2) {
        const payment = this.getSelectedPayment();
        if (!payment) return;
        if (payment === 'card' && !ValidationUI.validateForm('paymentForm')) return;
        this.savedPayment = payment;
        this.currentStep = 3;
        this.updateFinalConfirmation();
        this.showStep(3);
        this.persistState();
      } else if (this.currentStep === 3) {
        this.placeOrder();
      }
    });
  }

  private showStep(step: number) {
    this.currentStep = step;
    this.stepAddress.style.display = step === 1 ? 'block' : 'none';
    this.stepPayment.style.display = step === 2 ? 'block' : 'none';
    this.finalConfirmation.style.display = step === 3 ? 'block' : 'none';

    const pct = ((step - 1) / 2) * 100;
    this.progressBar.style.width = `${pct}%`;
    this.progressBtns.forEach((btn, i) => {
      btn.style.background = i + 1 <= step ? 'var(--primary)' : 'var(--gray-400)';
    });

    this.backBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
    this.continueBtn.innerHTML = step === 3
      ? '<i class="bi bi-check-circle"></i> Place Order'
      : 'Continue <i class="bi bi-arrow-right"></i>';
  }

  private saveAddressFromForm() {
    const saveForLater = !!this.saveAddressCheckbox?.checked;
    this.savedAddress = {
      street: (document.getElementById('addressLine1') as HTMLInputElement)?.value?.trim() ?? '',
      city: (document.getElementById('addressCity') as HTMLInputElement)?.value?.trim() ?? '',
      zip: (document.getElementById('addressZip') as HTMLInputElement)?.value?.trim() ?? '',
    } as unknown as TAdd;
    (this.savedAddress as any).saveForLater = saveForLater;
    this.setAddress();
  }

  private getSelectedPayment(): TPay | null {
    const s = document.querySelector('input[name="paymentMethod"]:checked') as HTMLInputElement;
    return (s?.value as TPay) ?? null;
  }

  private setupPaymentToggles() {
    const cardFields = document.getElementById('cardFields') as HTMLElement;
    document.querySelectorAll('input[name="paymentMethod"]').forEach(el => {
      el.addEventListener('change', () => {
        const v = (el as HTMLInputElement).value as TPay;
        this.savedPayment = v;
        cardFields.style.display = v === 'card' ? 'block' : 'none';
        this.persistState();
      });
    });
    const cr = document.querySelector('input[name="paymentMethod"][value="card"]') as HTMLInputElement;
    if (cr?.checked) cardFields.style.display = 'block';
  }

  private setupCardValidation() {
    const ce = document.getElementById('cardExpiry') as HTMLInputElement;
    const cv = document.getElementById('cardCVV') as HTMLInputElement;
    ce?.addEventListener('input', (e) => { let v = (e.target as HTMLInputElement).value.replace(/\D/g, ''); if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4); (e.target as HTMLInputElement).value = v.slice(0, 5); this.persistState(); });
    cv?.addEventListener('input', () => { cv.value = cv.value.replace(/\D/g, '').slice(0, 3); this.persistState(); });
  }

  private updateFinalConfirmation() {
    if (this.finalAddressEl && this.savedAddress) {
      this.finalAddressEl.textContent = `${this.savedAddress.street}, ${this.savedAddress.city} - ${this.savedAddress.zip}`;
    }
    if (this.finalPaymentEl && this.savedPayment) {
      const labels: Record<TPay, string> = { cash: 'Cash on Delivery', card: 'Credit/Debit Card', wallet: 'Digital Wallet' };
      this.finalPaymentEl.textContent = labels[this.savedPayment];
    }
  }

  private setupEditLinks() {
    document.getElementById('editAddressLink')?.addEventListener('click', (e) => { e.preventDefault(); this.currentStep = 1; this.showStep(1); this.persistState(); });
    document.getElementById('editPaymentLink')?.addEventListener('click', (e) => { e.preventDefault(); this.currentStep = 2; this.showStep(2); this.persistState(); });
  }

  private async placeOrder() {
    // Build the order object
    const cartData = JSON.parse(localStorage.getItem(this.cart_key) || '{"items":[]}');
    const discountData = JSON.parse(localStorage.getItem('cart_discount') || '{"discount":0,"coupon":null}');
    const restaurant = localStorage.getItem('current-restaurant') || 'FoodHub';

    const items = (cartData.items || []).map((i: any) => ({
      menuItemId: i.itemId, name: i.itemName, price: i.price, qty: i.qty,
    }));

    const now = new Date();
    const eta = new Date(now.getTime() + 35 * 60000); // 35 min
    
    // Create payload matching Mongo backend schema
    const orderPayload = {
      restaurantId: localStorage.getItem('current-restaurant-id') || '1',
      restaurantName: restaurant,
      items,
      subtotal: this.yourCart.subtotal,
      surge: this.yourCart.surge,
      tax: this.yourCart.tax,
      deliveryFee: this.yourCart.deliveryFee,
      discount: discountData.discount || 0,
      total: this.yourCart.total,
      address: {
        street: this.savedAddress?.street ?? '',
        city: this.savedAddress?.city ?? '',
        zip: this.savedAddress?.zip ?? '',
      },
      paymentMethod: this.savedPayment || 'cash',
      status: 'confirmed',
      estimatedDelivery: eta.toISOString()
    };

    try {
      this.continueBtn.disabled = true;
      this.continueBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';
      const token = localStorage.getItem('fh-auth');
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
         body: JSON.stringify(orderPayload)
      });
      
      if (!res.ok) throw new Error('Order place failed');
      const orderRes = await res.json();
      
      // Clear cart
      localStorage.removeItem(this.cart_key);
    localStorage.removeItem(this.total_key);
    localStorage.removeItem('cart_discount');
    localStorage.removeItem('applied_coupon');

    const storedAddr = localStorage.getItem(this.address_key);
    if (storedAddr) {
      try {
        const p = JSON.parse(storedAddr);
        if (!p.saveForLater) localStorage.removeItem(this.address_key);
      } catch { localStorage.removeItem(this.address_key); }
    }
    localStorage.removeItem(this.checkout_state_key);

    // Show success modal
    this.showSuccessModal(orderRes._id);
    } catch (err) {
      console.error(err);
      this.continueBtn.disabled = false;
      this.continueBtn.innerHTML = '<i class="bi bi-check-circle"></i> Place Order';
    }
  }
  private showSuccessModal(orderId: string) {
    const modal = document.getElementById('successModal') as HTMLElement;
    modal.innerHTML = `
      <div class="fh-success-modal-backdrop">
        <div class="fh-success-modal">
          <div class="fh-success-check">
            <i class="bi bi-check-lg"></i>
          </div>
          <h4 class="fw-bold mb-2">Order Placed Successfully!</h4>
          <p style="color:var(--gray-600);font-size:var(--fs-sm);">Your order <strong>${orderId}</strong> has been confirmed. You can track the delivery status in real-time.</p>
          <a href="./orders.html?id=${orderId}" class="fh-btn-primary justify-content-center w-100 mt-3">
            <i class="bi bi-truck"></i> Track My Order
          </a>
          <a href="./index.html" class="d-block mt-3" style="color:var(--gray-600);font-size:var(--fs-sm);text-decoration:none;">
            ← Back to Home
          </a>
        </div>
      </div>`;
  }

  private updateNavProfile() {
    setupNavbarAuth();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Checkout.getInstance();
});
