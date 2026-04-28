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
        this.orders = apiOrders.map((o: any) => {
          let currentStatus = this.mapStatus(o.status);
          const placedAt = o.createdAt || new Date().toISOString();
          const elapsed = Date.now() - new Date(placedAt).getTime();
          
          if (currentStatus !== 'delivered') {
            let expectedStatus: TDeliveryStatus = currentStatus;
            if (elapsed >= 45000) expectedStatus = 'delivered';
            else if (elapsed >= 30000) expectedStatus = 'out-for-delivery';
            else if (elapsed >= 15000) expectedStatus = 'preparing';
            else expectedStatus = 'confirmed';

            const currentIdx = STATUS_ORDER.indexOf(currentStatus);
            const expectedIdx = STATUS_ORDER.indexOf(expectedStatus);
            if (expectedIdx > currentIdx) {
              currentStatus = expectedStatus;
              
              // update backend fire and forget
              fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders/${o._id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: currentStatus })
              }).catch(() => {});
            }
          }

          return {
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
            status: currentStatus,
            restaurantName: o.restaurantName,
            placedAt: placedAt,
            estimatedDelivery: o.estimatedDelivery || new Date(Date.now() + 35 * 60000).toISOString(),
            deliveryPerson: getRandomDeliveryPerson(),
          };
        });
      }
    } catch {
      this.orders = [];
    }
  }

  private mapStatus(status: string): TDeliveryStatus {
    if (STATUS_ORDER.includes(status as any)) return status as TDeliveryStatus;
    const map: Record<string, TDeliveryStatus> = {
      'on-the-way': 'out-for-delivery',
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
    historyContainer.innerHTML = '<h5 class="fw-bold mb-3 d-flex align-items-center gap-2"><i class="bi bi-clock-history text-primary"></i> Order History</h5>';
    this.orders.forEach((order, i) => {
      const card = document.createElement('div');
      card.className = 'fh-order-card mb-3 fade-in';
      card.style.animationDelay = `${i * 0.05}s`;

      const cfg = STATUS_CONFIG[order.status];
      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
          <div class="d-flex align-items-center gap-3">
            <div class="fh-avatar-sm" style="width: 45px; height: 45px; background: rgba(255,107,53,0.1); color: var(--primary); font-size: 1.2rem;">
              <i class="bi bi-shop"></i>
            </div>
            <div>
              <h6 class="fw-bold mb-0">${order.restaurantName}</h6>
              <small style="color:var(--gray-600); font-weight: 500;">
                ${timeAgo(order.placedAt)} • ₹${order.total}
              </small>
            </div>
          </div>
          <span class="fh-status-badge ${cfg.class}">${cfg.label}</span>
        </div>

        <div class="d-flex justify-content-between align-items-end">
          <div>
            <p class="mb-1" style="font-size:var(--fs-sm);color:var(--dark); font-weight: 500;">
              ${(() => {
                const text = order.items.map(i => `${i.qty} x ${i.itemName}`).join(', ');
                return text.length > 50 ? text.substring(0, 50) + '...' : text;
              })()}
            </p>
            <p class="mb-0" style="font-size: 0.7rem; color:var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px;">
              Order #${order.orderId.substring(0, 8)}
            </p>
          </div>
          <button class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold" data-order-toggle="${order.orderId}" style="font-size:var(--fs-xs);">
            Details <i class="bi bi-chevron-down ms-1"></i>
          </button>
        </div>

        <div id="detail-${order.orderId}" class="fh-order-item-list slide-up" style="display:none;">
          <h6 class="fw-bold mb-2" style="font-size: 0.8rem; color: var(--gray-600); text-transform: uppercase;">Items</h6>
          <div class="mb-3">
            ${order.items.map(i => `
              <div class="d-flex justify-content-between mb-1" style="font-size: var(--fs-sm);">
                <span><span class="fw-bold text-dark">${i.qty}x</span> ${i.itemName}</span>
                <span class="fw-bold">₹${i.price * i.qty}</span>
              </div>
            `).join('')}
          </div>
          <hr class="my-2 border-secondary opacity-25" />
          <div class="d-flex justify-content-between" style="font-size:var(--fs-xs);">
            <span class="text-secondary">Subtotal</span><span class="fw-bold">₹${order.subtotal}</span>
          </div>
          ${order.discount > 0 ? `<div class="d-flex justify-content-between" style="font-size:var(--fs-xs);color:var(--success);">
            <span>Discount</span><span>-₹${order.discount}</span>
          </div>` : ''}
          <div class="d-flex justify-content-between" style="font-size:var(--fs-xs);">
            <span class="text-secondary">Tax & Delivery</span><span>₹${order.tax + order.deliveryFee}</span>
          </div>
          <div class="d-flex justify-content-between mt-2 pt-2 border-top" style="font-size:var(--fs-sm);">
            <span class="fw-bold">Total Paid</span><span class="fw-bold text-primary">₹${order.total}</span>
          </div>
          <div class="mt-3 pt-3 border-top" style="font-size:0.75rem; color:var(--gray-600); line-height: 1.5;">
            <i class="bi bi-geo-alt-fill text-primary"></i> ${order.address.street}, ${order.address.city} - ${order.address.zip}<br />
            <i class="bi bi-credit-card-fill text-primary mt-1"></i> Paid via ${order.paymentMethod}
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
    const container = document.getElementById('trackingStepsContainer') as HTMLElement;
    const currentIdx = STATUS_ORDER.indexOf(currentStatus);

    const steps = [
      { status: 'confirmed', label: 'Confirmed', icon: 'bi-check-lg' },
      { status: 'preparing', label: 'Preparing', icon: 'bi-fire' },
      { status: 'out-for-delivery', label: 'On the Way', icon: 'bi-truck' },
      { status: 'delivered', label: 'Delivered', icon: 'bi-house-check-fill' },
    ];

    const progressPct = currentIdx === 0 ? 0 : currentIdx === 1 ? 33 : currentIdx === 2 ? 66 : 100;

    container.innerHTML = `
      <div class="fh-timeline-wrapper">
        <div class="fh-timeline-bg"></div>
        <div class="fh-timeline-fill" style="width: ${progressPct}%"></div>
        ${steps.map((step, i) => {
          const isCompleted = i <= currentIdx;
          const isActive = i === currentIdx;
          let cls = isCompleted ? 'completed' : '';
          if (isActive && i < steps.length - 1) cls = 'active';
          
          return `
            <div class="fh-timeline-step ${cls}">
              <div class="fh-timeline-icon"><i class="bi ${step.icon}"></i></div>
              <span class="fh-timeline-label">${step.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
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
    this.simulationInterval = window.setInterval(async () => {
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
        
        // Persist status to backend
        try {
          const token = localStorage.getItem('fh-auth') || sessionStorage.getItem('fh-auth');
          await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders/${order.orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: order.status })
          });
        } catch (e) {
          console.error('Failed to update status', e);
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
