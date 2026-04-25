import '../styles/global.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { setupNavbarAuth } from '../utils/auth';
import { TRestaurant } from '../types/userTypes';

class HomePage {
  private restaurants: TRestaurant[] = [];

  constructor() {
    this.loadInitialData();
  }

  private async loadInitialData() {
    this.showSpinner();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/restaurants`);
      if (!response.ok) throw new Error('Failed to fetch API data');
      this.restaurants = await response.json();
    } catch (err) {
      console.warn('Backend fetch failed, ensure backend is running:', err);
    }
    this.hideSpinner();
    this.renderCuisinePills();
    this.renderFeaturedRestaurants();
    setupNavbarAuth();
    this.updateCartBadge();
    this.setupNavbarScroll();
  }

  private showSpinner() {
    const container = document.getElementById('featuredRestaurants');
    if (container) container.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
  }

  private hideSpinner() {
    const container = document.getElementById('featuredRestaurants');
    if (container) container.innerHTML = '';
  }

  private renderCuisinePills() {
    const container = document.getElementById('cuisinePills');
    if (!container) return;

    const allCuisines = new Set<string>();
    this.restaurants.forEach(r => r.cuisines.forEach(c => allCuisines.add(c)));

    const icons: Record<string, string> = {
      'Pizza': '🍕', 'Italian': '🇮🇹', 'American': '🍔', 'Fast Food': '🍟',
      'Chinese': '🥢', 'Asian': '🍜', 'Mexican': '🌮', 'Japanese': '🍣',
      'Indian': '🍛', 'Healthy': '🥗', 'Salad': '🥬', 'Vegan': '🌱',
      'Breakfast': '🥞', 'Dessert': '🍰',
    };

    allCuisines.forEach(cuisine => {
      const pill = document.createElement('a');
      pill.href = `./menu.html?cuisine=${encodeURIComponent(cuisine)}`;
      pill.className = 'fh-cuisine-pill';
      pill.innerHTML = `${icons[cuisine] || '🍽️'} ${cuisine}`;
      container.appendChild(pill);
    });
  }

  private renderFeaturedRestaurants() {
    const container = document.getElementById('featuredRestaurants');
    if (!container) return;

    // Show top 6 by rating
    const featured = [...this.restaurants]
      .filter(r => r.status === 'Open')
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

    featured.forEach((r, index) => {
      const col = document.createElement('div');
      col.className = 'col-sm-6 col-lg-4';
      col.style.animationDelay = `${index * 0.1}s`;
      col.innerHTML = `
        <a href="./restaurant.html?id=${(r as any).id || (r as any)._id}" class="text-decoration-none">
          <div class="fh-card fh-restaurant-card h-100">
            <div class="fh-card-img-wrapper">
              <img src="${r.imageUrl}" alt="${r.name}" class="fh-card-img" loading="lazy" />
              <span class="fh-restaurant-badge">${r.status}</span>
              <span class="fh-delivery-time"><i class="bi bi-clock"></i> ${r.deliveryTime} min</span>
            </div>
            <div class="fh-card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="fw-bold mb-0" style="color: var(--dark);">${r.name}</h6>
                <span class="fh-rating"><i class="bi bi-star-fill"></i> ${r.rating}</span>
              </div>
              <div class="d-flex flex-wrap gap-1 mb-2">
                ${r.cuisines.map(c => `<span class="fh-cuisine-tag">${c}</span>`).join('')}
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <small style="color: var(--gray-600);">${r.reviewCount}+ reviews</small>
                <small style="color: var(--gray-600);">
                  ${r.deliveryFee === 0 ? '<span style="color:var(--success);font-weight:600;">Free Delivery</span>' : `₹${r.deliveryFee} delivery`}
                </small>
              </div>
            </div>
          </div>
        </a>`;
      container.appendChild(col);
    });
  }

  private updateCartBadge() {
    const badge = document.getElementById('navCartBadge') as HTMLElement;
    if (!badge) return;

    const raw = localStorage.getItem('my-cart-items');
    if (raw) {
      try {
        const cart = JSON.parse(raw);
        if (cart?.items?.length) {
          const qty = cart.items.reduce((s: number, i: { qty: number }) => s + i.qty, 0);
          if (qty > 0) {
            badge.textContent = String(qty);
            badge.style.display = 'flex';
          }
        }
      } catch { /* ignore */ }
    }
  }

  private setupNavbarScroll() {
    const navbar = document.getElementById('mainNavbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HomePage();
});