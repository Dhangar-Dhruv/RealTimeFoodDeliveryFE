import '../styles/global.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { parseRestaurants } from '../utils/helpers';
import { TRestaurant } from '../types/userTypes';
import { debounce } from '../utils/debounce';
import { setupNavbarAuth } from '../utils/auth';

class RestaurantListPage {
  private allRestaurants: TRestaurant[] = [];
  private filteredRestaurants: TRestaurant[] = [];
  private activeCuisine: string | null = null;
  private minRating: number = 0;
  private sortBy: string = 'rating';

  private grid = document.getElementById('restaurantGrid') as HTMLElement;
  private searchInput = document.getElementById('restaurantSearch') as HTMLInputElement;
  private noResults = document.getElementById('noResults') as HTMLElement;
  private countEl = document.getElementById('restaurantCount') as HTMLElement;

  constructor() {
    this.init();
  }

  private async init() {
    // Try API first, fall back to hardcoded constants
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/restaurants`);
      if (res.ok) {
        this.allRestaurants = await res.json();
      } else {
        throw new Error('API failed');
      }
    } catch {
      this.allRestaurants = parseRestaurants();
    }

    this.filteredRestaurants = [...this.allRestaurants];

    this.renderCuisineFilters();
    this.setupSearch();
    this.setupFilters();
    this.applyUrlParams();
    this.applyFilters();
    this.updateNavbar();
  }

  private applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const cuisine = params.get('cuisine');
    if (cuisine) {
      this.activeCuisine = cuisine;
      const cb = document.querySelector(`input[data-cuisine="${cuisine}"]`) as HTMLInputElement;
      if (cb) cb.checked = true;
    }
  }

  private renderCuisineFilters() {
    const container = document.getElementById('cuisineFilters');
    if (!container) return;

    const cuisines = new Set<string>();
    this.allRestaurants.forEach(r => r.cuisines.forEach(c => cuisines.add(c)));

    // "All" option
    const allLabel = document.createElement('label');
    allLabel.className = 'fh-custom-control fh-radio';
    allLabel.innerHTML = `<input type="radio" name="cuisine" value="" data-cuisine="" checked /> <span class="fh-check-mark"></span> All Cuisines`;
    container.appendChild(allLabel);

    cuisines.forEach(cuisine => {
      const label = document.createElement('label');
      label.className = 'fh-custom-control fh-radio';
      label.innerHTML = `<input type="radio" name="cuisine" value="${cuisine}" data-cuisine="${cuisine}" /> <span class="fh-check-mark"></span> ${cuisine}`;
      container.appendChild(label);
    });
  }

  private setupSearch() {
    const debouncedSearch = debounce(() => this.applyFilters(), 300);
    this.searchInput.addEventListener('input', () => debouncedSearch());
  }

  private setupFilters() {
    // Cuisine
    document.getElementById('cuisineFilters')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLInputElement).value;
      this.activeCuisine = val || null;
      this.applyFilters();
    });

    // Rating
    document.getElementById('ratingFilters')?.addEventListener('change', (e) => {
      this.minRating = parseFloat((e.target as HTMLInputElement).value) || 0;
      this.applyFilters();
    });

    // Sort
    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
      this.sortBy = (e.target as HTMLSelectElement).value;
      this.applyFilters();
    });
  }

  private applyFilters() {
    const query = this.searchInput.value.trim().toLowerCase();

    let results = this.allRestaurants.filter(r => {
      // Search
      if (query) {
        const matchName = r.name.toLowerCase().includes(query);
        const matchCuisine = r.cuisines.some(c => c.toLowerCase().includes(query));
        if (!matchName && !matchCuisine) return false;
      }
      // Cuisine filter
      if (this.activeCuisine && !r.cuisines.includes(this.activeCuisine)) return false;
      // Rating filter
      if (this.minRating > 0 && r.rating < this.minRating) return false;
      return true;
    });

    // Sort
    switch (this.sortBy) {
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'deliveryTime':
        results.sort((a, b) => a.deliveryTime - b.deliveryTime);
        break;
      case 'reviews':
        results.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    this.filteredRestaurants = results;
    this.render();
  }

  private render() {
    this.grid.innerHTML = '';

    if (this.filteredRestaurants.length === 0) {
      this.noResults.style.display = 'block';
      this.countEl.textContent = '0 restaurants found';
      return;
    }

    this.noResults.style.display = 'none';
    this.countEl.textContent = `${this.filteredRestaurants.length} restaurants available`;

    this.filteredRestaurants.forEach((r, i) => {
      const col = document.createElement('div');
      col.className = 'col-sm-6 col-xl-4 fade-in';
      col.style.animationDelay = `${i * 0.05}s`;

      const isOpen = r.status === 'Open';
      const rId = (r as any).id || (r as any)._id || '';
      col.innerHTML = `
        <a href="${isOpen ? `./restaurant.html?id=${rId}` : '#'}" 
           class="text-decoration-none ${!isOpen ? 'pe-none' : ''}" 
           ${!isOpen ? 'tabindex="-1"' : ''}>
          <div class="fh-card fh-restaurant-card h-100 ${!isOpen ? 'opacity-50' : ''}">
            <div class="fh-card-img-wrapper">
              <img src="${r.imageUrl}" alt="${r.name}" class="fh-card-img" loading="lazy" />
              <span class="fh-restaurant-badge ${!isOpen ? 'closed' : ''}">${r.status}</span>
              <span class="fh-delivery-time"><i class="bi bi-clock"></i> ${r.deliveryTime} min</span>
            </div>
            <div class="fh-card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="fw-bold mb-0" style="color:var(--dark);">${r.name}</h6>
                <span class="fh-rating"><i class="bi bi-star-fill"></i> ${r.rating}</span>
              </div>
              <div class="d-flex flex-wrap gap-1 mb-2">
                ${r.cuisines.map(c => `<span class="fh-cuisine-tag">${c}</span>`).join('')}
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <small style="color:var(--gray-600);">${r.reviewCount}+ reviews</small>
                <small style="color:var(--gray-600);">
                  ${r.deliveryFee === 0 ? '<span style="color:var(--success);font-weight:600;">Free Delivery</span>' : `₹${r.deliveryFee} delivery`}
                </small>
              </div>
            </div>
          </div>
        </a>`;
      this.grid.appendChild(col);
    });
  }

  private updateNavbar() {
    // Cart badge
    const badge = document.getElementById('navCartBadge') as HTMLElement;
    try {
      const cart = JSON.parse(localStorage.getItem('my-cart-items') || '{}');
      if (cart?.items?.length) {
        const qty = cart.items.reduce((s: number, i: { qty: number }) => s + i.qty, 0);
        if (qty > 0 && badge) {
          badge.textContent = String(qty);
          badge.style.display = 'flex';
        }
      }
    } catch { /* ignore */ }

    setupNavbarAuth();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RestaurantListPage();
});
