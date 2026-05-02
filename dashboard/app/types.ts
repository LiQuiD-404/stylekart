export type RiskLevel = 'green' | 'amber' | 'red';

export interface InventoryItem {
  sku: string;
  name: string;
  warehouse: number | null;
  effectiveWarehouse: number | null;
  shopify: number | null;
  myntra: number | null;
  ajio: number | null;
  delta: number;
  worstPlatform: string | null;
  worstDelta: number;          // signed: +ve = oversell risk, -ve = undersell
  platformDeltas: Record<string, number>;
  risk: RiskLevel;
  lastSync: string | null;
  mappingStatus: 'Mapped' | 'Partial' | 'Unmapped' | 'Unknown';
  whCode: string | null;
  myntraCode: string | null;
  discontinued: boolean;
}

export interface MappingEntry {
  skCode: string;
  whCode: string | null;
  myntraCode: string | null;
  ajioCode: string | null;
  productName: string;
  status: 'Mapped' | 'Partial' | 'Unmapped';
}

export interface SalesPoint {
  month: string;
  shopifyRevenue: number;
  myntraRevenue: number;
  ajioRevenue: number;
  totalRevenue: number;
  shopifyOrders: number;
  myntraOrders: number;
  ajioOrders: number;
  totalOrders: number;
  avgOrderValue: number;
}

export interface ReturnItem {
  sku: string;
  name: string;
  returnCount: number;
  sellableCount: number;
  nonSellableCount: number;
  unknownCount: number;
  sellablePct: number;
  nonSellablePct: number;
  returnRate: number;
  band: RiskLevel;
  topReason: string;
  platforms: Record<string, number>;
  refundTotal: number;
}
