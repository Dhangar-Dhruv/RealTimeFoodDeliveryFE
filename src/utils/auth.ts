import { TUserProfile } from '../types/userTypes';
import { getInitials } from './helpers';

export const AUTH_KEY = 'fh-auth';
export const PROFILE_KEY = 'fh-user-profile';
export const PHOTO_KEY = 'fh-user-photo';

export function isLoggedIn(): boolean {
  const token = localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY);
  return token !== null && token !== undefined && token !== '';
}

export function requireAuth() {
  if (!isLoggedIn()) {
    const currentUrl = window.location.pathname + window.location.search;
    window.location.href = `./login.html?redirect=${encodeURIComponent(currentUrl)}`;
  }
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(PHOTO_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(PROFILE_KEY);
  window.location.href = './index.html';
}

export function login(user: TUserProfile, token: string = 'true', rememberMe: boolean = true) {
  if (rememberMe) {
    localStorage.setItem(AUTH_KEY, token);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
  } else {
    sessionStorage.setItem(AUTH_KEY, token);
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(user));
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(PROFILE_KEY);
  }
  
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect') || './index.html';
  window.location.href = redirect;
}

export function setupNavbarAuth() {
  const isAuth = isLoggedIn();
  
  const navAvatar = document.getElementById('navAvatar') as HTMLElement;
  const navLoginBtn = document.getElementById('navLoginBtn') as HTMLElement;
  const navLogoutBtn = document.getElementById('navLogoutBtn') as HTMLElement;

  if (isAuth) {
    if (navAvatar) navAvatar.style.display = 'flex';
    if (navLoginBtn) navLoginBtn.style.display = 'none';
    if (navLogoutBtn) navLogoutBtn.style.display = 'block';

    navLogoutBtn?.addEventListener('click', () => logout());

    // Setup photo/initials
    const photo = localStorage.getItem(PHOTO_KEY);
    if (photo && navAvatar) {
      navAvatar.innerHTML = `<img src="${photo}" alt="Profile" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
    } else {
      const iconEl = navAvatar?.querySelector('#navAvatarIcon');
      try {
        const userStr = localStorage.getItem(PROFILE_KEY) || sessionStorage.getItem(PROFILE_KEY);
        const user: TUserProfile = JSON.parse(userStr || '{}');
        if (user.name && iconEl) {
          iconEl.className = '';
          iconEl.textContent = getInitials(user.name);
        }
      } catch { /* ignore */ }
    }
  } else {
    if (navAvatar) navAvatar.style.display = 'none';
    if (navLoginBtn) navLoginBtn.style.display = 'block';
    if (navLogoutBtn) navLogoutBtn.style.display = 'none';
  }
}
