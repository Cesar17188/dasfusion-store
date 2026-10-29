export interface BeneficiaryData {
  accountHolder: string;
  identification: string;
  identificationType: string;
  phone: string;
  email: string;
}

export interface BankAccountItem {
  id: string;
  bankName: string;
  badge: string;
  accountType: string;
  accountNumber: string;
  note?: string;
  badgeColorClass: string;
}

export type BankAccount = BankAccountItem;

export const BENEFICIARY_INFO: BeneficiaryData = {
  accountHolder: 'Omar David Santillán Fernández',
  identification: '1715593388',
  identificationType: 'Cédula / Identificación',
  phone: '0987148786',
  email: 'pagos@dasfusion.ec'
};

export const BANK_ACCOUNTS: BankAccountItem[] = [
  {
    id: 'internacional',
    bankName: 'Banco Internacional',
    badge: 'Banco Internacional',
    accountType: 'Cuenta de Ahorros',
    accountNumber: '808083672',
    badgeColorClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
  },
  {
    id: 'peigo',
    bankName: 'Banco Guayaquil',
    badge: 'Banco Guayaquil',
    accountType: 'Cuenta de Ahorros (Peigo)',
    accountNumber: '0061661586',
    note: 'Cuenta Peigo',
    badgeColorClass: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30'
  },
  {
    id: 'produbanco',
    bankName: 'Produbanco',
    badge: 'Produbanco',
    accountType: 'Cuenta Digital',
    accountNumber: '20002218923',
    badgeColorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'bgr',
    bankName: 'Banco General Rumiñahui',
    badge: 'BGR (Banco Rumiñahui)',
    accountType: 'Cuenta de Ahorro',
    accountNumber: '8687596500',
    badgeColorClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  }
];

export const PAYMENT_WHATSAPP_PHONE = '593987148786';
export const PAYMENT_WHATSAPP_DISPLAY = '0987148786';
