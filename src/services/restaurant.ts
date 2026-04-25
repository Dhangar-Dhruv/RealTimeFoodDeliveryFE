import '../styles/global.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { MenuItem, cartItem, Tcart } from '../types/type';
import { TRestaurant } from '../types/userTypes';
import { debounce } from '../utils/debounce';
import { setupNavbarAuth } from '../utils/auth';

class RestaurantPage {
  private restaurant!: TRestaurant;
  private menuItems: MenuItem[] = [];
  private categories = new Set<string>();
  private cartItems: cartItem[] = [];
  private cartQty = 0;
  private cartPrice = 0;
  private CART_KEY = 'my-cart-items';
  private RESTAURANT_KEY = 'current-restaurant';
  private RESTAURANT_ID_KEY = 'current-restaurant-id';

  private itemsContainer = document.getElementById('itemsContainer') as HTMLElement;
  private categoriesList = document.getElementById('categoriesList') as HTMLElement;
  private searchInput = document.getElementById('itemSearch') as HTMLInputElement;

  constructor() {
    this.init();
  }

  private async init() {
    await this.loadRestaurant();
    
    localStorage.setItem(this.RESTAURANT_KEY, this.restaurant.name);
    localStorage.setItem(this.RESTAURANT_ID_KEY, (this.restaurant as any).id || '1');

    this.menuItems = (this.restaurant as any).menu || [];
    this.menuItems.forEach(item => this.categories.add(item.category));

    this.loadCartFromStorage();
    this.renderHeader();
    this.renderCategories();
    this.render(this.menuItems);
    this.setupSearch();
    this.updateNavbar();
    this.updateFloatingCart();
  }

  private async loadRestaurant() {
    const params = new URLSearchParams(window.location.search);
    const restaurantId = params.get('id');
    const restaurantName = params.get('name');

    if (!restaurantId && !restaurantName) {
      window.location.href = './index.html';
      return;
    }

    try {
      let url: string;
      if (restaurantId) {
        url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/restaurants/${restaurantId}`;
      } else {
        url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/restaurants/by-name/${encodeURIComponent(restaurantName!)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Backend failed');
      this.restaurant = await res.json();
    } catch {
      window.location.href = './index.html';
    }
  }

  private loadCartFromStorage() {
    try {
      const data = localStorage.getItem(this.CART_KEY);
      if (data) {
        const parsed: Tcart = JSON.parse(data);
        if (parsed?.items?.length) {
          this.cartItems = parsed.items;
          this.cartQty = parsed.items.reduce((s, i) => s + i.qty, 0);
          this.cartPrice = parsed.items.reduce((s, i) => s + i.price * i.qty, 0);
        }
      }
    } catch { /* ignore */ }
  }

  private renderHeader() {
    document.title = `${this.restaurant.name} — FoodHub`;
    const img = document.getElementById('headerImage') as HTMLImageElement;
    img.src = this.restaurant.imageUrl;
    img.alt = this.restaurant.name;
    (document.getElementById('restaurantName') as HTMLElement).textContent = this.restaurant.name;
    (document.getElementById('restaurantRating') as HTMLElement).innerHTML = `<i class="bi bi-star-fill"></i> ${this.restaurant.rating}`;
    (document.getElementById('restaurantReviews') as HTMLElement).textContent = `${this.restaurant.reviewCount}+ reviews`;
    (document.getElementById('restaurantCuisines') as HTMLElement).textContent = this.restaurant.cuisines.join(', ');
    (document.getElementById('restaurantTime') as HTMLElement).textContent = String(this.restaurant.deliveryTime);
  }

  private renderCategories() {
    // All button
    const allBtn = document.createElement('button');
    allBtn.className = 'btn btn-sm btn-dark text-start rounded-3 mb-1';
    allBtn.textContent = 'All Items';
    allBtn.addEventListener('click', () => {
      this.searchInput.value = '';
      this.render(this.menuItems);
    });
    this.categoriesList.appendChild(allBtn);

    this.categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-dark text-start rounded-3 mb-1';
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        this.searchInput.value = '';
        this.render(this.menuItems.filter(i => i.category === cat));
      });
      this.categoriesList.appendChild(btn);
    });
  }

  private setupSearch() {
    const debouncedSearch = debounce(() => {
      const q = this.searchInput.value.trim().toLowerCase();
      if (!q) {
        this.render(this.menuItems);
        return;
      }
      const filtered = this.menuItems.filter(i =>
        i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
      );
      this.render(filtered);
    }, 300);
    this.searchInput.addEventListener('input', () => debouncedSearch());
  }

  private getQty(id: string): number {
    return this.cartItems.find(i => i.itemId === id)?.qty ?? 0;
  }

  private render(items: MenuItem[]) {
    this.itemsContainer.innerHTML = '';

    if (items.length === 0) {
      this.itemsContainer.innerHTML = `<div class="fh-empty-state col-12"><i class="bi bi-search d-block"></i><h4>No items found</h4></div>`;
      return;
    }

    let prevCat = '';
    items.forEach((item, i) => {
      if (item.category !== prevCat) {
        prevCat = item.category;
        const heading = document.createElement('div');
        heading.className = 'col-12 mt-3';
        heading.innerHTML = `<h5 class="fw-bold" style="color:var(--dark);">${item.category}</h5>`;
        this.itemsContainer.appendChild(heading);
      }

      const col = document.createElement('div');
      col.className = 'col-sm-6 col-xl-4 fade-in';
      col.style.animationDelay = `${i * 0.03}s`;

      const qty = this.getQty(item.id);

      col.innerHTML = `
        <div class="fh-card fh-menu-card h-100" id="menu-card-${item.id}">
          <div class="fh-card-img-wrapper">
            <img src="${item.imageUrl}" alt="${item.name}" class="fh-card-img" loading="lazy" />
          </div>
          <div class="fh-card-body d-flex flex-column flex-grow-1">
            <div class="d-flex justify-content-between align-items-start mb-1">
              <h6 class="fw-bold mb-0" style="font-size:var(--fs-sm);">${item.name}</h6>
              <span class="fw-bold" style="color:var(--dark);white-space:nowrap;">₹${item.price}</span>
            </div>
            <p class="mb-2" style="font-size:var(--fs-xs); color:var(--gray-600); flex-grow:1;">${item.description}</p>
            <div class="fh-menu-badge-group mb-2">
              ${item.vegetarian
                ? '<span class="fh-veg-badge"><i class="bi bi-leaf"></i> VEG</span>'
                : '<span class="fh-nonveg-badge"><i class="bi bi-caret-down-square"></i> NON-VEG</span>'}
              ${item.spicy > 0
                ? `<span class="fh-spicy-badge" style="background:color-mix(in oklab, #a71e14 ${item.spicy * 25}%, #ffe0e0); color:#a71e14;"><i class="bi bi-fire"></i> ${item.spicy}/5</span>`
                : ''}
              <span class="fh-cuisine-tag"><i class="bi bi-star-fill" style="color:#f39c12;font-size:0.6rem;"></i> ${item.rating}</span>
            </div>
            <div class="mt-auto d-flex justify-content-end" id="action-${item.id}">
              ${qty > 0 ? this.qtyButtonsHtml(item.id, qty) : this.addButtonHtml(item.id)}
            </div>
          </div>
        </div>`;
      this.itemsContainer.appendChild(col);

      // Attach events
      if (qty > 0) {
        this.attachQtyEvents(item.id, item.price, item.name);
      } else {
        this.attachAddEvent(item.id, item.price, item.name);
      }
    });
  }

  private addButtonHtml(id: string): string {
    return `<button class="fh-btn-dark" style="padding:0.4rem 1.2rem;font-size:var(--fs-sm);border-radius:var(--radius-sm);" id="add-${id}">ADD</button>`;
  }

  private qtyButtonsHtml(id: string, qty: number): string {
    return `<div class="btn-group btn-group-sm">
      <button class="btn btn-dark" id="dec-${id}">&ndash;</button>
      <button class="btn btn-light" disabled id="qty-${id}">${qty}</button>
      <button class="btn btn-dark" id="inc-${id}">+</button>
    </div>`;
  }

  private attachAddEvent(id: string, price: number, name: string) {
    document.getElementById(`add-${id}`)?.addEventListener('click', () => {
      this.cartItems.push({ itemId: id, itemName: name, price, qty: 1 });
      this.cartQty += 1;
      this.cartPrice += price;
      this.persistCart();

      const actionDiv = document.getElementById(`action-${id}`) as HTMLElement;
      actionDiv.innerHTML = this.qtyButtonsHtml(id, 1);
      this.attachQtyEvents(id, price, name);
      this.updateFloatingCart();
    });
  }

  private attachQtyEvents(id: string, price: number, name: string) {
    document.getElementById(`inc-${id}`)?.addEventListener('click', () => {
      const item = this.cartItems.find(i => i.itemId === id);
      if (item) {
        item.qty += 1;
        this.cartQty += 1;
        this.cartPrice += price;
        const qtyEl = document.getElementById(`qty-${id}`);
        if (qtyEl) qtyEl.textContent = String(item.qty);
        this.persistCart();
        this.updateFloatingCart();
      }
    });

    document.getElementById(`dec-${id}`)?.addEventListener('click', () => {
      const idx = this.cartItems.findIndex(i => i.itemId === id);
      if (idx === -1) return;
      const item = this.cartItems[idx];
      item.qty -= 1;
      this.cartQty -= 1;
      this.cartPrice -= price;

      if (item.qty <= 0) {
        this.cartItems.splice(idx, 1);
        const actionDiv = document.getElementById(`action-${id}`) as HTMLElement;
        actionDiv.innerHTML = this.addButtonHtml(id);
        this.attachAddEvent(id, price, name);
      } else {
        const qtyEl = document.getElementById(`qty-${id}`);
        if (qtyEl) qtyEl.textContent = String(item.qty);
      }
      this.persistCart();
      this.updateFloatingCart();
    });
  }

  private persistCart() {
    localStorage.setItem(this.CART_KEY, JSON.stringify({ items: this.cartItems, createdAt: new Date() }));
  }

  private updateFloatingCart() {
    const el = document.getElementById('floatingCart') as HTMLElement;
    const countEl = document.getElementById('floatingCartCount') as HTMLElement;
    const totalEl = document.getElementById('floatingCartTotal') as HTMLElement;

    if (this.cartQty > 0) {
      el.style.display = 'flex';
      countEl.textContent = String(this.cartQty);
      totalEl.textContent = String(this.cartPrice);
    } else {
      el.style.display = 'none';
    }

    // Also update nav badge
    const badge = document.getElementById('navCartBadge') as HTMLElement;
    if (badge) {
      if (this.cartQty > 0) {
        badge.textContent = String(this.cartQty);
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  private updateNavbar() {
    setupNavbarAuth();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RestaurantPage();
});
