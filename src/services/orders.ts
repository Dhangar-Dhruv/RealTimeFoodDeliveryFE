import '../styles/global.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { TOrder, TDeliveryStatus } from '../types/userTypes';
import { timeAgo, getRandomDeliveryPerson } from '../utils/helpers';
import { setupNavbarAuth, requireAuth } from '../utils/auth';

const STATUS_CONFIG: Record<TDeliveryStatus, { label: string; icon: string; class: string }> = {
  'confirmed': { label: 'Order Confirmed', icon: 'bi-check-circle', class: 'confirmed' },
  'preparing': { label: 'Preparing', icon: 'bi-fire', class: 'preparing' },
  'out-for-delivery': { label: 'Out for Delivery', icon: 'bi-truck', class: 'out-for-delivery' },
  'delivered': { label: 'Delivered', icon: 'bi-house-check', class: 'delivered' },
};

const STATUS_ORDER: TDeliveryStatus[] = ['confirmed', 'preparing', 'out-for-delivery', 'delivered'];

class OrdersPage {
  private orders: TOrder[] = [];
  private activeOrderId: string | null = null;
  private timerInterval: number | null = null;
  private simulationInterval: number | null = null;

  constructor() {
    requireAuth();
    this.init();
  }

  private async init() {
    await this.loadOrders();
    this.activeOrderId = new URLSearchParams(window.location.search).get('id');

    if (!this.activeOrderId && this.orders.length > 0) {
      const active = this.orders.find(o => o.status !== 'delivered');
      if (active) this.activeOrderId = active.orderId;
    }

    this.render();
    this.updateNavbar();
  }

  private async loadOrders() {
    try {
      const token = localStorage.getItem('fh-auth');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const apiOrders = await res.json();
        // Map API response to TOrder shape
        this.orders = apiOrders.map((o: any) => ({
          orderId: o._id,
          items: (o.items || []).map((i: any) => ({
            itemId: i.menuItemId,
            itemName: i.name,
            price: i.price,
            qty: i.qty,
          })),
          subtotal: o.subtotal,
          surge: o.surge || 0,
          tax: o.tax,
          deliveryFee: o.deliveryFee,
          discount: o.discount || 0,
          total: o.total,
          address: o.address || { street: '', city: '', zip: '' },
          paymentMethod: o.paymentMethod,
          status: this.mapStatus(o.status),
          restaurantName: o.restaurantName,
          placedAt: o.createdAt || new Date().toISOString(),
          estimatedDelivery: o.estimatedDelivery || new Date(Date.now() + 35 * 60000).toISOString(),
          deliveryPerson: getRandomDeliveryPerson(),
        }));
      }
    } catch {
      this.orders = [];
    }
  }

  private mapStatus(status: string): TDeliveryStatus {
    const map: Record<string, TDeliveryStatus> = {
      'preparing': 'preparing',
      'on-the-way': 'out-for-delivery',
      'delivered': 'delivered',
    };
    return map[status] || 'confirmed';
  }

  private render() {
    const subtitle = document.getElementById('ordersSubtitle') as HTMLElement;
    const noOrders = document.getElementById('noOrders') as HTMLElement;
    const historyContainer = document.getElementById('orderHistory') as HTMLElement;

    if (this.orders.length === 0) {
      subtitle.textContent = 'No orders yet';
      noOrders.style.display = 'block';
      return;
    }

    subtitle.textContent = `${this.orders.length} order${this.orders.length > 1 ? 's' : ''} placed`;
    noOrders.style.display = 'none';

    // Active order tracking
    if (this.activeOrderId) {
      const active = this.orders.find(o => o.orderId === this.activeOrderId);
      if (active && active.status !== 'delivered') {
        this.renderActiveOrder(active);
        this.startStatusSimulation(active);
      }
    }

    // History
    historyContainer.innerHTML = '<h5 class="fw-bold mb-3">Order History</h5>';
    this.orders.forEach((order, i) => {
      const card = document.createElement('div');
      card.className = 'fh-card p-3 mb-3 fade-in';
      card.style.animationDelay = `${i * 0.05}s`;

      const cfg = STATUS_CONFIG[order.status];
      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="fw-bold" style="font-size:var(--fs-sm);">${order.orderId.substring(0, 10)}...</span>
              <span class="fh-status-badge ${cfg.class}">${cfg.label}</span>
            </div>
            <p class="mb-1" style="font-size:var(--fs-sm);color:var(--gray-600);">
              <i class="bi bi-shop"></i> ${order.restaurantName} · ${order.items.length} item${order.items.length > 1 ? 's' : ''}
            </p>
            <small style="color:var(--gray-600);">${timeAgo(order.placedAt)}</small>
          </div>
          <div class="text-end">
            <p class="fw-bold mb-1" style="color:var(--primary);">₹${order.total}</p>
            <button class="btn btn-sm btn-outline-dark rounded-pill" data-order-toggle="${order.orderId}" style="font-size:var(--fs-xs);">
              Details <i class="bi bi-chevron-down"></i>
            </button>
          </div>
        </div>
        <div id="detail-${order.orderId}" class="mt-3" style="display:none;">
          <div class="p-3 rounded-3" style="background:var(--gray-100);">
            <table class="table table-sm table-borderless mb-2" style="font-size:var(--fs-xs);">
              <thead><tr><th>Item</th><th>Qty</th><th class="text-end">Price</th></tr></thead>
              <tbody>
                ${order.items.map(i => `<tr><td>${i.itemName}</td><td>${i.qty}</td><td class="text-end">₹${i.price * i.qty}</td></tr>`).join('')}
              </tbody>
            </table>
            <hr class="my-2" />
            <div class="d-flex justify-content-between" style="font-size:var(--fs-xs);">
              <span>Subtotal</span><span class="fw-bold">₹${order.subtotal}</span>
            </div>
            ${order.discount > 0 ? `<div class="d-flex justify-content-between" style="font-size:var(--fs-xs);color:var(--success);">
              <span>Discount</span><span>-₹${order.discount}</span>
            </div>` : ''}
            <div class="d-flex justify-content-between" style="font-size:var(--fs-xs);">
              <span>Tax + Delivery</span><span>₹${order.tax + order.deliveryFee}</span>
            </div>
            <div class="d-flex justify-content-between mt-1" style="font-size:var(--fs-sm);">
              <span class="fw-bold">Total</span><span class="fw-bold" style="color:var(--primary);">₹${order.total}</span>
            </div>
            <hr class="my-2" />
            <div style="font-size:var(--fs-xs);color:var(--gray-600);">
              <i class="bi bi-geo-alt"></i> ${order.address.street}, ${order.address.city} - ${order.address.zip}<br />
              <i class="bi bi-credit-card"></i> ${order.paymentMethod}
            </div>
          </div>
        </div>`;
      historyContainer.appendChild(card);

      // Toggle details
      card.querySelector(`[data-order-toggle="${order.orderId}"]`)?.addEventListener('click', (e) => {
        const detail = document.getElementById(`detail-${order.orderId}`);
        const btn = e.currentTarget as HTMLButtonElement;
        if (detail) {
          const isOpen = detail.style.display !== 'none';
          detail.style.display = isOpen ? 'none' : 'block';
          btn.innerHTML = isOpen ? 'Details <i class="bi bi-chevron-down"></i>' : 'Hide <i class="bi bi-chevron-up"></i>';
        }
      });
    });
  }

  private renderActiveOrder(order: TOrder) {
    const section = document.getElementById('activeOrderSection') as HTMLElement;
    section.style.display = 'block';

    (document.getElementById('activeOrderId') as HTMLElement).textContent = order.orderId.substring(0, 10) + '...';

    const cfg = STATUS_CONFIG[order.status];
    const statusEl = document.getElementById('activeOrderStatus') as HTMLElement;
    statusEl.className = `fh-status-badge ${cfg.class}`;
    statusEl.textContent = cfg.label;

    // Delivery person
    (document.getElementById('deliveryPerson') as HTMLElement).textContent = order.deliveryPerson.name;
    (document.getElementById('deliveryPhone') as HTMLElement).textContent = order.deliveryPerson.phone;

    // Tracking steps
    this.renderTrackingSteps(order.status);

    // ETA countdown
    this.startEtaCountdown(order.estimatedDelivery);
  }

  private renderTrackingSteps(currentStatus: TDeliveryStatus) {
    const container = document.getElementById('trackingSteps') as HTMLElement;
    const currentIdx = STATUS_ORDER.indexOf(currentStatus);

    const steps = [
      { status: 'confirmed', label: 'Order Confirmed', desc: 'Your order has been placed and confirmed', icon: 'bi-check-circle' },
      { status: 'preparing', label: 'Preparing Food', desc: 'The restaurant is preparing your food', icon: 'bi-fire' },
      { status: 'out-for-delivery', label: 'Out for Delivery', desc: 'Your order is on the way', icon: 'bi-truck' },
      { status: 'delivered', label: 'Delivered', desc: 'Enjoy your meal!', icon: 'bi-house-check' },
    ];

    container.innerHTML = steps.map((step, i) => {
      const isCompleted = i < currentIdx;
      const isActive = i === currentIdx;
      const cls = isCompleted ? 'completed' : (isActive ? 'active' : '');
      return `
        <div class="fh-tracking-step ${cls}">
          <div class="fh-tracking-dot"><i class="bi ${step.icon}"></i></div>
          <div>
            <p class="fw-bold mb-0" style="font-size:var(--fs-sm);">${step.label}</p>
            <small style="color:var(--gray-600);">${step.desc}</small>
          </div>
        </div>`;
    }).join('');
  }

  private startEtaCountdown(etaStr: string) {
    const etaEl = document.getElementById('etaCountdown') as HTMLElement;
    const update = () => {
      const diff = new Date(etaStr).getTime() - Date.now();
      if (diff <= 0) {
        etaEl.textContent = 'Arriving now!';
        if (this.timerInterval) clearInterval(this.timerInterval);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      etaEl.textContent = `${mins}m ${secs}s remaining`;
    };
    update();
    this.timerInterval = window.setInterval(update, 1000);
  }

  private startStatusSimulation(order: TOrder) {
    // Simulate order status progression every 15 seconds
    this.simulationInterval = window.setInterval(() => {
      const idx = STATUS_ORDER.indexOf(order.status);
      if (idx < STATUS_ORDER.length - 1) {
        order.status = STATUS_ORDER[idx + 1];
        this.renderActiveOrder(order);

        // Update in history too
        const historyBadge = document.querySelector(`[data-order-toggle="${order.orderId}"]`)?.closest('.fh-card')?.querySelector('.fh-status-badge');
        if (historyBadge) {
          const cfg = STATUS_CONFIG[order.status];
          historyBadge.className = `fh-status-badge ${cfg.class}`;
          historyBadge.textContent = cfg.label;
        }

        if (order.status === 'delivered') {
          if (this.simulationInterval) clearInterval(this.simulationInterval);
          if (this.timerInterval) clearInterval(this.timerInterval);
          const etaEl = document.getElementById('etaCountdown') as HTMLElement;
          if (etaEl) etaEl.textContent = 'Delivered! 🎉';
        }
      }
    }, 15000);
  }

  private updateNavbar() {
    // Keep cart badge update
    const badge = document.getElementById('navCartBadge') as HTMLElement;
    try {
      const cart = JSON.parse(localStorage.getItem('my-cart-items') || '{}');
      if (cart?.items?.length) {
        const qty = cart.items.reduce((s: number, i: { qty: number }) => s + i.qty, 0);
        if (qty > 0 && badge) { badge.textContent = String(qty); badge.style.display = 'flex'; }
      }
    } catch { /* ignore */ }

    setupNavbarAuth();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OrdersPage();
});
