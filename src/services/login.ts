import '../styles/global.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { login, isLoggedIn } from '../utils/auth';
import { ValidationUI } from '../utils/validation_ui';

class AuthPage {
  private isLoginMode = true;
  private tabLogin = document.getElementById('tabLogin') as HTMLElement;
  private tabRegister = document.getElementById('tabRegister') as HTMLElement;
  private form = document.getElementById('authForm') as HTMLFormElement;
  private nameGroup = document.getElementById('nameGroup') as HTMLElement;
  private submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
  private inputName = document.getElementById('inputName') as HTMLInputElement;
  private inputEmail = document.getElementById('inputEmail') as HTMLInputElement;
  private inputPassword = document.getElementById('inputPassword') as HTMLInputElement;

  constructor() {
    if (isLoggedIn()) {
      window.location.href = './index.html'; // already logged in
      return;
    }

    this.setupTabs();
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  private setupTabs() {
    this.tabLogin.addEventListener('click', () => {
      this.isLoginMode = true;
      this.tabLogin.className = 'cursor-pointer';
      this.tabLogin.style.color = 'var(--primary)';
      this.tabLogin.style.borderBottom = '2px solid var(--primary)';
      this.tabRegister.className = 'cursor-pointer text-muted';
      this.tabRegister.style.borderBottom = 'none';
      
      this.nameGroup.style.display = 'none';
      this.inputName.required = false;
      this.submitBtn.textContent = 'Sign In';
    });

    this.tabRegister.addEventListener('click', () => {
      this.isLoginMode = false;
      this.tabRegister.className = 'cursor-pointer';
      this.tabRegister.style.color = 'var(--primary)';
      this.tabRegister.style.borderBottom = '2px solid var(--primary)';
      this.tabLogin.className = 'cursor-pointer text-muted';
      this.tabLogin.style.borderBottom = 'none';
      
      this.nameGroup.style.display = 'block';
      this.inputName.required = true;
      this.submitBtn.textContent = 'Create Account';
    });
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();

    const alertMsg = document.getElementById('alertMsg');
    if (alertMsg) alertMsg.style.display = 'none';

    if (!ValidationUI.validateForm(this.form)) return;

    const email = this.inputEmail.value.trim();
    const password = this.inputPassword.value.trim();
    
    const submitBtn = this.form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

    try {
      if (this.isLoginMode) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        
        login(data.user, data.token);
      } else {
        const name = this.inputName.value.trim();
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        
        login(data.user, data.token);
      }
    } catch (err: any) {
      const alertMsg = document.getElementById('alertMsg');
      if (alertMsg) {
        alertMsg.textContent = err.message;
        alertMsg.style.display = 'block';
      } else {
        ValidationUI.showError(this.inputEmail, err.message);
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = this.isLoginMode ? 'Sign In' : 'Create Account';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AuthPage();
});
