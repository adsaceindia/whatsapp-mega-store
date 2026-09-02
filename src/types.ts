export type Role = 'SUPER_ADMIN' | 'STORE_ADMIN' | 'STORE_STAFF';

export interface User {
  id: string;
  email: string;
  role: Role;
  storeId?: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  mfaEnabled: boolean;
}

export interface Store {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string | null;
  domainStatus: 'PENDING' | 'VERIFIED' | 'ACTIVE' | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'PAST_DUE';
  themeSettings: Record<string, any>;
  integrationSettings: {
    ga4Id?: string;
    metaPixelId?: string;
  };
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  gatewayProductId?: string;
  features: {
    maxProducts: number | 'unlimited';
    maxOrders: number | 'unlimited';
    maxStaffSeats: number | 'unlimited';
    maxBanners: number | 'unlimited';
    whatsappNumbers: number;
    customDomain: boolean;
    analytics: boolean;
    removableBranding: boolean;
  };
}

export interface Subscription {
  id: string;
  storeId: string;
  planId: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  currentPeriodEnd: string;
  gatewaySubscriptionId?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  storeId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  details: Record<string, any>;
  createdAt: string;
}
