export interface SubdomainInfo {
  type: 'organization' | 'admin' | 'main';
  subdomain: string | null;
  isAdmin: boolean;
  isMain: boolean;
}

export function getSubdomainInfo(): SubdomainInfo {
  const hostname = window.location.hostname;

  // For localhost, check URL parameters to simulate subdomains
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const params = new URLSearchParams(window.location.search);
    const subdomain = params.get('subdomain');

    if (subdomain === 'dashboard') {
      return {
        type: 'admin',
        subdomain: 'dashboard',
        isAdmin: true,
        isMain: false,
      };
    }

    if (subdomain && subdomain !== 'www') {
      return {
        type: 'organization',
        subdomain,
        isAdmin: false,
        isMain: false,
      };
    }

    // Default localhost to main landing page
    return {
      type: 'main',
      subdomain: null,
      isAdmin: false,
      isMain: true,
    };
  }

  const parts = hostname.split('.');

  // If it's just pxpmanagement.es (2 parts), it's the main landing page
  if (parts.length === 2) {
    return {
      type: 'main',
      subdomain: null,
      isAdmin: false,
      isMain: true,
    };
  }

  // If it has 3 or more parts, check the subdomain
  if (parts.length >= 3) {
    const subdomain = parts[0];

    // www.pxpmanagement.es should be the main landing page
    if (subdomain === 'www') {
      return {
        type: 'main',
        subdomain: null,
        isAdmin: false,
        isMain: true,
      };
    }

    // dashboard.pxpmanagement.es is the PXP admin dashboard
    if (subdomain === 'dashboard') {
      return {
        type: 'admin',
        subdomain: 'dashboard',
        isAdmin: true,
        isMain: false,
      };
    }

    // Any other subdomain is an organization
    return {
      type: 'organization',
      subdomain,
      isAdmin: false,
      isMain: false,
    };
  }

  // Default to main if we can't determine
  return {
    type: 'main',
    subdomain: null,
    isAdmin: false,
    isMain: true,
  };
}
