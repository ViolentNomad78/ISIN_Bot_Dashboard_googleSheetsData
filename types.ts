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