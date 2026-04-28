import '../styles/global.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { TUserProfile, TOrder } from '../types/userTypes';
import { getInitials, timeAgo } from '../utils/helpers';
import { setupNavbarAuth, requireAuth } from '../utils/auth';
import { ValidationUI } from '../utils/validation_ui';

type SavedAddress = {
  id: string;
  street: string;
  city: string;
  zip: string;
};

class ProfilePage {
  private photoKey = 'fh-user-photo';

  private user: TUserProfile = { name: '', email: '', phone: '' };
  private addresses: SavedAddress[] = [];
  private orders: TOrder[] = [];

  constructor() {
    requireAuth();
    this.init();
  }

  private async init() {
    await this.loadData();
    this.renderProfile();
    this.loadProfilePhoto();
    this.renderAddresses();
    this.renderRecentOrders();
    this.setupEvents();
    this.setupPhotoUpload();
    this.updateNavbar();
  }

  private async loadData() {
    try {
      const token = localStorage.getItem('fh-auth');
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/me`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const u = await res.json();
        this.user = u;
        this.addresses = u.savedAddresses || [];
      }
      
      const ordersRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders/me`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ordersRes.ok) {
        this.orders = await ordersRes.json();
      }
    } catch { /* ignore */ }
  }

  private renderProfile() {
    const avatar = document.getElementById('profileAvatar') as HTMLElement;
    const nameEl = document.getElementById('profileName') as HTMLElement;
    const emailEl = document.getElementById('profileEmail') as HTMLElement;
    const nameInput = document.getElementById('inputName') as HTMLInputElement;
    const emailInput = document.getElementById('inputEmail') as HTMLInputElement;
    const phoneInput = document.getElementById('inputPhone') as HTMLInputElement;
    const totalOrders = document.getElementById('totalOrders') as HTMLElement;
    const totalAddr = document.getElementById('totalAddresses') as HTMLElement;

    if (this.user.name) {
      avatar.textContent = getInitials(this.user.name);
      nameEl.textContent = this.user.name;
      emailEl.textContent = this.user.email || 'No email set';
    }

    nameInput.value = this.user.name || '';
    emailInput.value = this.user.email || '';
    phoneInput.value = this.user.phone || '';

    totalOrders.textContent = String(this.orders.length);
    totalAddr.textContent = String(this.addresses.length);
  }

  /* ========== Profile Photo Upload ========== */
  private loadProfilePhoto() {
    const photoData = localStorage.getItem(this.photoKey);
    if (photoData) {
      this.showProfilePhoto(photoData);
    }
  }

  private setupPhotoUpload() {
    const uploadArea = document.getElementById('avatarUploadArea');
    const overlay = document.getElementById('avatarOverlay');
    const fileInput = document.getElementById('photoUpload') as HTMLInputElement;

    // Clicking the avatar area or overlay triggers file picker
    uploadArea?.addEventListener('click', () => fileInput?.click());
    overlay?.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput?.click();
    });

    // Handle file selection
    fileInput?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, etc.)');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be under 2MB. Please choose a smaller image.');
        return;
      }

      // Read and store as base64
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (!dataUrl) return;

        // Resize before storing to save localStorage space
        this.resizeImage(dataUrl, 200, (resizedUrl) => {
          localStorage.setItem(this.photoKey, resizedUrl);
          this.showProfilePhoto(resizedUrl);
          this.updateNavbar();
        });
      };
      reader.readAsDataURL(file);
    });
  }

  private resizeImage(dataUrl: string, maxSize: number, callback: (url: string) => void) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;

      if (w > h) {
        if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
      } else {
        if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; }
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = dataUrl;
  }

  private showProfilePhoto(dataUrl: string) {
    const photoEl = document.getElementById('profilePhoto') as HTMLImageElement;
    const avatarEl = document.getElementById('profileAvatar') as HTMLElement;

    if (photoEl && dataUrl) {
      photoEl.src = dataUrl;
      photoEl.style.display = 'block';
      avatarEl.style.opacity = '0'; // Hide initials behind photo
    }
  }

  /* ========== Addresses ========== */
  private renderAddresses() {
    const list = document.getElementById('addressList') as HTMLElement;
    const noAddr = document.getElementById('noAddresses') as HTMLElement;

    list.innerHTML = '';

    if (this.addresses.length === 0) {
      noAddr.style.display = 'block';
      return;
    }

    noAddr.style.display = 'none';

    this.addresses.forEach(addr => {
      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-center p-3 rounded-3 mb-2 fade-in';
      row.style.background = 'var(--gray-100)';
      row.innerHTML = `
        <div>
          <p class="fw-bold mb-0" style="font-size:var(--fs-sm);"><i class="bi bi-geo-alt" style="color:var(--primary);"></i> ${addr.street}</p>
          <small style="color:var(--gray-600);">${addr.city} - ${addr.zip}</small>
        </div>
        <button class="fh-cart-remove" data-delete-addr="${addr.id}" aria-label="Delete address">
          <i class="bi bi-trash3"></i>
        </button>`;
      list.appendChild(row);

      row.querySelector(`[data-delete-addr="${addr.id}"]`)?.addEventListener('click', async () => {
        this.addresses = this.addresses.filter(a => a.id !== addr.id);
        const token = localStorage.getItem('fh-auth');
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/me`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ savedAddresses: this.addresses })
        });
        
        this.renderAddresses();
        (document.getElementById('totalAddresses') as HTMLElement).textContent = String(this.addresses.length);
      });
    });
  }

  /* ========== Recent Orders ========== */
  private renderRecentOrders() {
    const container = document.getElementById('recentOrders') as HTMLElement;
    const noOrders = document.getElementById('noRecentOrders') as HTMLElement;

    if (this.orders.length === 0) {
      noOrders.style.display = 'block';
      return;
    }

    noOrders.style.display = 'none';
    const recent = this.orders.slice(0, 5);

    recent.forEach(order => {
      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-center p-3 rounded-3 mb-2 fade-in';
      row.style.background = 'var(--gray-100)';
      row.style.cursor = 'pointer';
      row.style.transition = 'all 150ms ease';
      row.innerHTML = `
        <div>
          <p class="fw-bold mb-0" style="font-size:var(--fs-sm);">${order.restaurantName}</p>
          <small style="color:var(--gray-600);">${order.items.length} items · ${timeAgo(order.placedAt)}</small>
        </div>
        <div class="text-end">
          <span class="fw-bold" style="color:var(--primary);font-size:var(--fs-sm);">₹${order.total}</span>
          <i class="bi bi-chevron-right ms-2" style="color:var(--gray-400);"></i>
        </div>`;
      row.addEventListener('mouseenter', () => { row.style.background = 'var(--gray-200)'; });
      row.addEventListener('mouseleave', () => { row.style.background = 'var(--gray-100)'; });
      row.addEventListener('click', () => {
        window.location.href = `orders.html?id=${order.orderId}`;
      });
      container.appendChild(row);
    });
  }

  /* ========== Events ========== */
  private setupEvents() {
    // Save profile
    document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const form = document.getElementById('profileForm') as HTMLFormElement;
      if (!ValidationUI.validateForm(form)) return;

      const name = (document.getElementById('inputName') as HTMLInputElement).value.trim();
      const phone = (document.getElementById('inputPhone') as HTMLInputElement).value.trim();

      const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      const oldText = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

      try {
        const token = localStorage.getItem('fh-auth');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/me`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name, phone })
        });
        if (res.ok) {
           const u = await res.json();
           this.user = u;
        }
      } catch {}

      btn.innerHTML = oldText;

      // Update UI
      this.renderProfile();
      this.updateNavbar();

      // Show saved message
      const msg = document.getElementById('profileSaveMsg') as HTMLElement;
      msg.style.display = 'inline';
      setTimeout(() => msg.style.display = 'none', 2000);
    });

    // Add address toggle
    document.getElementById('addAddressBtn')?.addEventListener('click', () => {
      const form = document.getElementById('addAddressForm') as HTMLElement;
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('cancelNewAddress')?.addEventListener('click', () => {
      (document.getElementById('addAddressForm') as HTMLElement).style.display = 'none';
    });

    document.getElementById('saveNewAddress')?.addEventListener('click', (e) => {
      e.preventDefault();

      const form = document.getElementById('addAddressForm') as HTMLFormElement;
      if (!ValidationUI.validateForm(form)) return;

      const street = (document.getElementById('newStreet') as HTMLInputElement).value.trim();
      const city = (document.getElementById('newCity') as HTMLInputElement).value.trim();
      const zip = (document.getElementById('newZip') as HTMLInputElement).value.trim();

      const addr: SavedAddress = {
        id: 'addr-' + Date.now(),
        street, city, zip,
      };
      this.addresses.push(addr);
      
      const token = localStorage.getItem('fh-auth');
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/me`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ savedAddresses: this.addresses })
      });

      // Clear form
      (document.getElementById('newStreet') as HTMLInputElement).value = '';
      (document.getElementById('newCity') as HTMLInputElement).value = '';
      (document.getElementById('newZip') as HTMLInputElement).value = '';
      (document.getElementById('addAddressForm') as HTMLElement).style.display = 'none';

      this.renderAddresses();
      (document.getElementById('totalAddresses') as HTMLElement).textContent = String(this.addresses.length);
    });
  }

  /* ========== Navbar ========== */
  private updateNavbar() {
    setupNavbarAuth();

    const badge = document.getElementById('navCartBadge') as HTMLElement;
    try {
      const cart = JSON.parse(localStorage.getItem('my-cart-items') || '{}');
      if (cart?.items?.length) {
        const qty = cart.items.reduce((s: number, i: { qty: number }) => s + i.qty, 0);
        if (qty > 0 && badge) { badge.textContent = String(qty); badge.style.display = 'flex'; }
      }
    } catch { /* ignore */ }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ProfilePage();
});
