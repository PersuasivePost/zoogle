// Simple vanilla JS client for Zoogle
// Usage: include this script and instantiate `new ZoogleClient({ authURL, onSuccess })`

class ZoogleClient {
  constructor(options = {}) {
    this.authURL = options.authURL || '/auth/google/login';
    this.onSuccess = options.onSuccess || this.defaultSuccess;
  }

  // Auto-inject a simple login button into the DOM element with id = elementId
  renderButton(elementId) {
    const container = document.getElementById(elementId);
    if (!container) {
      console.warn(`ZoogleClient: element with id "${elementId}" not found`);
      return;
    }

    const button = document.createElement('button');
    button.textContent = '🔐 Login with Google';
    button.onclick = () => this.login();
    container.appendChild(button);
  }

  // Redirect to the authURL to start OAuth
  login() {
    window.location.href = this.authURL;
  }

  // Should be called on the callback page to process ?token=... in the URL
  handleCallback() {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (token) {
        localStorage.setItem('auth_token', token);
        // Remove token from URL (clean up)
        if (window.history && window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          window.history.replaceState({}, document.title, url.toString());
        }
        this.onSuccess(token);
      }
    } catch (err) {
      console.error('ZoogleClient.handleCallback error', err);
    }
  }

  // Default success handler
  defaultSuccess(token) {
    console.log('ZoogleClient: logged in, token:', token);
  }

  // Convenience: get stored token
  getToken() {
    return localStorage.getItem('auth_token');
  }

  // Convenience: clear stored token
  clearToken() {
    localStorage.removeItem('auth_token');
  }

  // Fetch wrapper that injects Authorization header when token exists
  async fetch(url, options = {}) {
    const token = this.getToken();
    const headers = Object.assign({}, options.headers || {});
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, Object.assign({}, options, { headers }));
    return res;
  }
}

// Export for module consumers
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { ZoogleClient };
} else {
  // Attach to window for direct <script> usage
  window.ZoogleClient = ZoogleClient;
}
