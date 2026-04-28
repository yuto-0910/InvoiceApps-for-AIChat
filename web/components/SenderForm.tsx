"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Sender } from "@/types/invoice";

export const SENDER_SESSION_KEY = "invoice_sender_session";

function Field({
  label,
  value,
  onChange,
  placeholder,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {optional && <span className="ml-1 text-xs text-gray-400">（任意）</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      />
    </div>
  );
}

export default function SenderForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [registration, setRegistration] = useState("");
  const [zip, setZip] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [accountType, setAccountType] = useState("普通");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderKana, setAccountHolderKana] = useState("");
  const [showHanko, setShowHanko] = useState(false);
  const [taxRate, setTaxRate] = useState("10");

  useEffect(() => {
    // sessionStorage に今セッションの入力があればそちらを優先、なければ sender.md のデフォルトを使用
    try {
      const saved = sessionStorage.getItem(SENDER_SESSION_KEY);
      if (saved) {
        const data: Sender = JSON.parse(saved);
        applyData(data);
        setLoading(false);
        return;
      }
    } catch {
      // ignore
    }

    fetch("/api/sender")
      .then((res) => res.json())
      .then((data: Sender) => {
        applyData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function applyData(data: Sender) {
    setCompany(data.company ?? "");
    setName(data.name ?? "");
    setRegistration(data.registration ?? "");
    setZip(data.zip ?? "");
    setAddressLine1(data.address_line1 ?? "");
    setAddressLine2(data.address_line2 ?? "");
    setPhone(data.phone ?? "");
    setBankName(data.bank_name ?? "");
    setBankBranch(data.bank_branch ?? "");
    setAccountType(data.account_type ?? "普通");
    setAccountNumber(data.account_number ?? "");
    setAccountHolderKana(data.account_holder_kana ?? "");
    setShowHanko(data.show_hanko ?? false);
    setTaxRate(String(Math.round((data.tax_rate ?? 0.1) * 100)));
  }

  function buildSender(): Sender {
    return {
      company,
      name,
      registration,
      zip,
      address_line1: addressLine1,
      address_line2: addressLine2 || undefined,
      phone: phone || undefined,
      bank_name: bankName,
      bank_branch: bankBranch,
      account_type: accountType,
      account_number: accountNumber,
      account_holder_kana: accountHolderKana,
      show_hanko: showHanko,
      tax_rate: parseFloat(taxRate) / 100 || 0.1,
    };
  }

  const handleNext = () => {
    // sender.md は変更しない。セッション中だけ sessionStorage に保持する。
    try {
      sessionStorage.setItem(SENDER_SESSION_KEY, JSON.stringify(buildSender()));
    } catch {
      // ignore
    }
    router.push("/form");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-1">ステップ 1 / 2</p>
        <h1 className="text-2xl font-bold text-gray-800">発行者情報</h1>
        <p className="text-sm text-gray-500 mt-1">
          内容を確認・編集して「次へ」を押してください。入力内容はタブを閉じるとリセットされます。
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* 基本情報 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">基本情報</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="屋号・会社名" value={company} onChange={setCompany} placeholder="株式会社サンプル" />
            <Field label="氏名" value={name} onChange={setName} placeholder="山田 太郎" />
          </div>
          <div className="mt-4">
            <Field label="インボイス登録番号" value={registration} onChange={setRegistration} placeholder="T0000000000000" optional />
          </div>
        </div>

        {/* 住所 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">住所</h2>
          <div className="space-y-3">
            <Field label="郵便番号" value={zip} onChange={setZip} placeholder="〒000-0000" />
            <Field label="住所（番地まで）" value={addressLine1} onChange={setAddressLine1} placeholder="東京都渋谷区〇〇1-2-3" />
            <Field label="建物名・部屋番号" value={addressLine2} onChange={setAddressLine2} placeholder="〇〇ビル 101号室" optional />
          </div>
        </div>

        {/* 連絡先 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">連絡先</h2>
          <Field label="電話番号" value={phone} onChange={setPhone} placeholder="000-0000-0000" optional />
        </div>

        {/* 銀行口座 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">銀行口座</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="金融機関名" value={bankName} onChange={setBankName} placeholder="〇〇銀行" />
            <Field label="支店名" value={bankBranch} onChange={setBankBranch} placeholder="〇〇支店" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">口座種別</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option>普通</option>
                <option>当座</option>
              </select>
            </div>
            <Field label="口座番号" value={accountNumber} onChange={setAccountNumber} placeholder="0000000" />
            <Field label="口座名義（カナ）" value={accountHolderKana} onChange={setAccountHolderKana} placeholder="ヤマダ タロウ" />
          </div>
        </div>

        {/* オプション */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">オプション</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input
                id="show_hanko"
                type="checkbox"
                checked={showHanko}
                onChange={(e) => setShowHanko(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="show_hanko" className="text-sm text-gray-700">印を表示する</label>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">消費税率</label>
              <input
                type="text"
                inputMode="numeric"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value.replace(/[^\d]/g, ""))}
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right"
              />
              <span className="text-sm text-gray-700">%</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          次へ（請求書を作成）→
        </button>
      </div>
    </div>
  );
}
