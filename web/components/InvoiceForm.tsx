"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Invoice, InvoiceItem, Sender } from "@/types/invoice";
import ItemTable from "@/components/ItemTable";
import { SENDER_SESSION_KEY } from "@/components/SenderForm";

const SESSION_KEY = "invoice_form_draft";

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${yy}${mm}${dd}-${hh}${min}`;
}

function defaultItems(): InvoiceItem[] {
  return [{ id: crypto.randomUUID(), no: 1, description: "", quantity: 1, unit: "式", unit_price: 0 }];
}

function loadDraft() {
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function InvoiceForm() {
  const router = useRouter();
  const today = formatDate(new Date());

  // sessionStorage から直接初期値を取得（useEffect による上書き競合を回避）
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => {
    const d = loadDraft();
    return d?.invoiceNumber ?? generateInvoiceNumber();
  });
  const [invoiceDate, setInvoiceDate] = useState<string>(() => {
    const d = loadDraft();
    return d?.invoiceDate ?? today;
  });
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = loadDraft();
    return d?.dueDate ?? addDays(today, 30);
  });
  const [dueDateManual, setDueDateManual] = useState<boolean>(() => {
    return loadDraft()?.dueDate != null;
  });
  const [clientName, setClientName] = useState<string>(() => loadDraft()?.clientName ?? "");
  const [subject, setSubject] = useState<string>(() => loadDraft()?.subject ?? "");
  const [notes, setNotes] = useState<string>(() => loadDraft()?.notes ?? "");
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    const d = loadDraft();
    return d?.items?.length ? d.items : defaultItems();
  });

  const [sender, setSender] = useState<Sender | null>(() => {
    // SenderForm で sessionStorage に保存した発行者情報を読み込む
    if (typeof window === "undefined") return null;
    try {
      const saved = sessionStorage.getItem(SENDER_SESSION_KEY);
      return saved ? (JSON.parse(saved) as Sender) : null;
    } catch {
      return null;
    }
  });

  // 請求日変更時、手動上書きしていなければ支払期限を自動更新
  useEffect(() => {
    if (!dueDateManual) {
      setDueDate(addDays(invoiceDate, 30));
    }
  }, [invoiceDate, dueDateManual]);

  // 状態が変わるたびに sessionStorage へ保存
  useEffect(() => {
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ invoiceNumber, invoiceDate, dueDate, clientName, subject, notes, items })
      );
    } catch {
      // ignore
    }
  }, [invoiceNumber, invoiceDate, dueDate, clientName, subject, notes, items]);

  const taxRate = sender?.tax_rate ?? 0.1;
  const subtotal = items.reduce((sum, item) => sum + item.unit_price, 0);
  const tax = Math.floor(subtotal * taxRate);
  const total = subtotal + tax;

  const handlePreview = () => {
    if (!sender) return;
    const invoice: Invoice = {
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      client_name: clientName,
      subject,
      notes: notes || undefined,
      items,
      sender,
    };
    const encoded = encodeURIComponent(JSON.stringify(invoice));
    router.push(`/preview?data=${encoded}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
        >
          ← 発行者情報に戻る
        </button>
        <p className="text-xs text-gray-500 mb-1">ステップ 2 / 2</p>
        <h1 className="text-2xl font-bold text-gray-800">請求書作成</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-5">
        {/* 請求書番号・日付 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">請求書No</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">請求日</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => { setInvoiceDate(e.target.value); setDueDateManual(false); }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">支払期限</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => { setDueDate(e.target.value); setDueDateManual(true); }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* 宛先・件名 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">宛先（御中）</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="株式会社〇〇"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">件名</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="〇〇業務委託費"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* 品目テーブル */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">品目</label>
          <ItemTable items={items} onChange={setItems} />
        </div>

        {/* 合計 */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ご請求金額（税抜）</span>
              <span>¥{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">消費税（{Math.round(taxRate * 100)}%）</span>
              <span>¥{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-1">
              <span>お振込金額</span>
              <span>¥{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 備考 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">備考（任意）</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="保守内容・補足説明など"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={handlePreview}
          disabled={!sender}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {sender ? "請求書プレビューへ" : "発行者情報読み込み中..."}
        </button>
      </div>
    </div>
  );
}
