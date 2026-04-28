export type Sender = {
  company: string;
  name: string;
  registration: string;
  zip: string;
  address_line1: string;
  address_line2?: string;
  phone?: string;
  bank_name: string;
  bank_branch: string;
  account_type: string;
  account_number: string;
  account_holder_kana: string;
  show_hanko: boolean;
  tax_rate: number;
};

export type InvoiceItem = {
  id: string;
  no: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
};

export type Invoice = {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  client_name: string;
  subject: string;
  notes?: string;
  items: InvoiceItem[];
  sender: Sender;
};
