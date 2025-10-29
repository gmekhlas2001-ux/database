import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { getSubdomainInfo } from '../lib/subdomain';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  email: string;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  legal_pages_enabled: boolean;
  privacy_policy: string | null;
  terms_of_service: string | null;
  cookie_policy: string | null;
}

interface OrganizationContextType {
  organization: Organization | null;
  loading: boolean;
  subdomainInfo: ReturnType<typeof getSubdomainInfo>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const subdomainInfo = getSubdomainInfo();

  useEffect(() => {
    async function loadOrganization() {
      // If it's the main site (www.pxpmanagement.es or pxpmanagement.es), don't load organization
      if (subdomainInfo.type === 'main') {
        setLoading(false);
        return;
      }

      // If it's the admin dashboard, don't load organization
      if (subdomainInfo.type === 'admin') {
        setLoading(false);
        return;
      }

      // For organization subdomains, load the organization data
      if (!subdomainInfo.subdomain) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('subdomain', subdomainInfo.subdomain)
          .eq('status', 'active')
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setOrganization(data);

          // Set SEO metadata
          if (data.seo_title) {
            document.title = data.seo_title;
          }

          if (data.seo_description) {
            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) {
              metaDescription = document.createElement('meta');
              metaDescription.setAttribute('name', 'description');
              document.head.appendChild(metaDescription);
            }
            metaDescription.setAttribute('content', data.seo_description);
          }

          if (data.seo_keywords) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
              metaKeywords = document.createElement('meta');
              metaKeywords.setAttribute('name', 'keywords');
              document.head.appendChild(metaKeywords);
            }
            metaKeywords.setAttribute('content', data.seo_keywords);
          }

          // Set custom branding colors
          if (data.primary_color) {
            document.documentElement.style.setProperty('--color-primary', data.primary_color);
          }
        }
      } catch (error) {
        console.error('Error loading organization:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, [subdomainInfo.subdomain, subdomainInfo.type]);

  return (
    <OrganizationContext.Provider value={{ organization, loading, subdomainInfo }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
