
import { BondItem, AutoTriggerRule, SpecialistStat, DailyStat } from './types';

export const INITIAL_DATA: BondItem[] = [
  { id: '1', isin: 'USY0606WCE85', issuer: 'Bangkok Bank PCL/Hong Kong (BBLTB)', amount: 200000, currency: '$', status: 'scraped', type: 'Reg S', listingTrigger: '', time: '19:59:18', date: '19.11.2025', minSize: '200k x 1k' },
  { id: '2', isin: 'XS3239976163', issuer: 'EP Infrastructure AS (ENAPHO)', amount: 100000, currency: '€', status: 'scraped', type: 'Reg S', listingTrigger: '', time: '18:03:53', date: '20.11.2025', minSize: '100k' },
  { id: '3', isin: 'XS3221808705', issuer: 'China Three Gorges International Ltd (YANTZE)', amount: 100000, currency: '€', status: 'triggered', type: 'Reg S', listingTrigger: 'MANUAL', time: '17:30:54', date: '20.11.2025', minSize: '100k' },
  { id: '4', isin: 'SE0020845592', issuer: 'Betsson AB (BETSBS)', amount: 100000, currency: '€', status: 'triggered', type: 'Reg S', listingTrigger: 'MANUAL', time: '17:55:09', date: '20.11.2025', minSize: '100k' },
  { id: '5', isin: 'XS3239889788', issuer: 'Colombia Government International Bond', amount: 100000, currency: '€', status: 'triggered', type: '', listingTrigger: 'AUTO', time: '18:18:44', date: '20.11.2025', minSize: '100k' },
  { id: '6', isin: 'XS3239172565', issuer: 'Ardagh Metal Packaging Finance USA LLC', amount: 100000, currency: '€', status: 'triggered', type: '', listingTrigger: 'AUTO', time: '18:49:30', date: '20.11.2025', minSize: '100k' },
  { id: '7', isin: 'USP46756BQ76', issuer: 'Genneia SA (GNNEIA)', amount: 1000, currency: '$', status: 'triggered', type: 'Reg S', listingTrigger: 'MANUAL', time: '21:11:26', date: '20.11.2025', minSize: '1k' },
  { id: '8', isin: 'XS3239891339', issuer: 'Colombia Government International Bond', amount: 100000, currency: '€', status: 'submitted', type: '', listingTrigger: 'MANUAL', time: '18:18:44', date: '20.11.2025', minSize: '100k', submissionPlace: '2', turnaroundTime: '04:21:19' },
  { id: '9', isin: 'XS3239891503', issuer: 'Colombia Government International Bond', amount: 100000, currency: '€', status: 'submitted', type: '', listingTrigger: 'AUTO', time: '18:18:44', date: '20.11.2025', minSize: '100k', submissionPlace: '4', turnaroundTime: '05:01:19' },
  { id: '10', isin: 'XS3195078251', issuer: 'Eroski S Coop (EROSKI)', amount: 100000, currency: '€', status: 'passed', type: 'Reg S', listingTrigger: 'passed', time: '16:30:09', date: '19.11.2025', minSize: '100k' },
  { id: '11', isin: 'SE0026842221', issuer: 'Betsson AB (BETSBS)', amount: 100000, currency: '€', status: 'passed', type: 'Reg S', listingTrigger: 'passed', time: '17:55:09', date: '20.11.2025', minSize: '100k' },
  { id: '12', isin: 'USP3063DAC67', issuer: 'Compañía General de Combustibles S.A.', amount: 1000, currency: '$', status: 'passed', type: 'Reg S', listingTrigger: 'passed', time: '21:24:04', date: '20.11.2025', minSize: '1k' },
  { id: '13', isin: 'US12527GAL77', issuer: 'CF Industries Inc (CF)', amount: 2000, currency: '$', status: 'too_late', type: '', listingTrigger: 'MANUAL', time: '18:18:08', date: '20.11.2025', minSize: '2k' },
  { id: '14', isin: 'XS3239211132', issuer: 'Banca Transilvania SA (TVLRO)', amount: 200000, currency: '€', status: 'too_late', type: '', listingTrigger: 'AUTO', time: '17:11:28', date: '20.11.2025', minSize: '200k' },
];

export const INITIAL_RULES: AutoTriggerRule[] = [
    { id: 'r1', currency: '€ (EUR)', maxSize: 99000 },
    { id: 'r2', currency: '$ (USD)', maxSize: 49000 },
];

export const INITIAL_ISSUERS: string[] = ['BMW', 'Carfour', 'Facebook', 'Transilvania'];

export const MOCK_SPECIALIST_STATS: SpecialistStat[] = [
    { id: 's1', name: 'BAADER BANK AG', usd: 69, eur: 92, aud: 14, chf: 3, gbp: 1, nok: 0, sek: 0, totalBot: 179, totalListed: 961 },
    { id: 's2', name: 'BANKHAUS SCHEICH WERTPAPIERSPEZ. AG', usd: 22, eur: 148, aud: 2, chf: 2, gbp: 0, nok: 0, sek: 0, totalBot: 174, totalListed: 187 },
    { id: 's3', name: 'ICF BANK AG WERTPAPIERHANDELSBANK', usd: 74, eur: 193, aud: 3, chf: 15, gbp: 10, nok: 2, sek: 2, totalBot: 299, totalListed: 851 },
    { id: 's4', name: 'ODDO BHF SE', usd: 181, eur: 231, aud: 0, chf: 4, gbp: 0, nok: 0, sek: 0, totalBot: 416, totalListed: 606 },
    { id: 's5', name: 'WALTER LUDWIG GMBH', usd: 186, eur: 284, aud: 10, chf: 2, gbp: 8, nok: 0, sek: 0, totalBot: 490, totalListed: 933 },
    { id: 's6', name: 'WOLFGANG STEUBING AG', usd: 317, eur: 633, aud: 1, chf: 1, gbp: 50, nok: 4, sek: 2, totalBot: 1008, totalListed: 1747 },
];

const generateMockDailyStats = (): DailyStat[] => {
    const stats: DailyStat[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const base = isWeekend ? 0 : 15;
        const count = Math.max(0, base + Math.floor(Math.random() * 40));
        stats.push({
            date: d.toLocaleDateString('de-DE'),
            count
        });
    }
    return stats;
};

export const MOCK_DAILY_STATS = generateMockDailyStats();

// Keeping this for the backup update logic
export const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbxhYV14r-KZzP64VapIZVUezMlSFUa_5LfMGmU-g7iUV1fbIuzBoHVusk7OzOJQGBrOfQ/exec';
export const N8N_WEBHOOK_URL = 'https://n8n.cloudgetlisted.xyz/webhook/man_trigger';

// SUPABASE CONFIGURATION
export const SUPABASE_URL = 'https://qcanxkylsuumoblztyuv.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYW54a3lsc3V1bW9ibHp0eXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMzU4ODUsImV4cCI6MjA3OTYxMTg4NX0.tsgTRTwcLm4_STGJLkgKn2piWtb0pjW6Gupl8A0pIb4';
