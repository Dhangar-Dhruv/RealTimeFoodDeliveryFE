export class ValidationUI {
  static validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static showError(inputOrId: string | HTMLInputElement | HTMLSelectElement, message?: string) {
    const input = typeof inputOrId === 'string' ? document.getElementById(inputOrId) as HTMLInputElement : inputOrId;
    if (!input) return;
    
    input.classList.add('is-invalid');
    const feedback = input.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback') && message) {
      feedback.textContent = message;
    }
  }

  static clearError(inputOrId: string | HTMLInputElement | HTMLSelectElement) {
    const input = typeof inputOrId === 'string' ? document.getElementById(inputOrId) as HTMLInputElement : inputOrId;
    if (!input) return;
    
    input.classList.remove('is-invalid');
  }

  static clearAllErrors(formOrId: string | HTMLFormElement) {
    const form = typeof formOrId === 'string' ? document.getElementById(formOrId) as HTMLFormElement : formOrId;
    if (!form) return;
    const inputs = form.querySelectorAll('.is-invalid');
    inputs.forEach(i => i.classList.remove('is-invalid'));
  }

  static validateForm(formOrId: string | HTMLFormElement): boolean {
    const form = typeof formOrId === 'string' ? document.getElementById(formOrId) as HTMLFormElement : formOrId;
    if (!form) return false;

    let isValid = true;
    this.clearAllErrors(form);

    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((el) => {
      const input = el as HTMLInputElement | HTMLSelectElement;
      
      // Skip hidden inputs
      if (input.closest('[style*="display: none"]') || input.closest('[style*="display:none"]')) return;

      const isRequired = input.getAttribute('data-required') === 'true';
      const minLength = parseInt(input.getAttribute('data-minlength') || '0', 10);
      const exactLength = parseInt(input.getAttribute('data-exactlength') || '0', 10);
      const type = input.getAttribute('data-type');
      const val = input.value.trim();

      if (isRequired && !val) {
        this.showError(input, input.getAttribute('data-error-required') || 'This field is required.');
        isValid = false;
        return;
      }

      if (val && type === 'email' && !this.validateEmail(val)) {
        this.showError(input, input.getAttribute('data-error-email') || 'Please enter a valid email address.');
        isValid = false;
        return;
      }

      if (val && minLength > 0 && val.length < minLength) {
        this.showError(input, input.getAttribute('data-error-minlength') || `Minimum ${minLength} characters required.`);
        isValid = false;
        return;
      }
      
      if (val && exactLength > 0 && val.length !== exactLength) {
        this.showError(input, input.getAttribute('data-error-exact') || `Exactly ${exactLength} characters required.`);
        isValid = false;
        return;
      }

      if (val && type === 'numeric' && !/^\d+$/.test(val)) {
        this.showError(input, input.getAttribute('data-error-numeric') || 'Please enter numbers only.');
        isValid = false;
        return;
      }

    });

    return isValid;
  }
}
