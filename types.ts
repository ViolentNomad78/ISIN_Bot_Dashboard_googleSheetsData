

export type Status = 'scraped' | 'triggered' | 'submitted' | 'passed' | 'too_late';

export interface BondItem {
  id: string;
  isin: string;
  issuer: string;
  amount: number;
  currency: '€' | '$';
  status: Status;
  type: string;          // e.g. 'Reg S'
  listingTrigger: string; // e.g. 'MANUAL', 'AUTO'
  time: string;          // Email time
  date: string;          // Email date
  triggeredDate?: string;
  triggeredTime?: string;
  submittedDate?: string;
  submittedTime?: string;
  minSize: string;
  submissionPlace?: string; // e.g. '2', '4'
  turnaroundTime?: string;  // e.g. '04:21:19'
}

export interface AutoTriggerRule {
    id: string;
    currency: string;
    maxSize: number;
}

export interface SpecialistStat {
    id: string;
    name: string;
    usd: number;
    eur: number;
    aud: number;
    chf: number;
    gbp: number;
    nok: number;
    sek: number;
    totalBot: number;
    totalListed: number;
}

export interface DailyStat {
    date: string;
    count: number;
}

export interface BookrunnerStat {
    id: string;
    name: string;
    dealCount: number;
    marketShare: number; // percentage (0-100)
    lastActive: string | null; // ISO date string of last deal
    deals: {
        isin: string;
        date: string;
        issuer: string;
        currency: string;
    }[];
}

export interface T7Instrument {
    isin: string;
    instrumentName: string;
    wkn: string;
    productStatus: string;
    instrumentStatus: string;
    issueDate: string | null;
    maturityDate: string | null;
    minTradableUnit: number;
    specialistId: string;
    specialistName: string;
    currency: string;
    firstTradingDate: string | null;
    lastTradingDate: string | null;
    updatedAt: string;
}