"use client";

import type { Invoice } from "@/types/invoice";

type Props = {
  invoice: Invoice;
};

function formatJapaneseDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function InvoicePreview({ invoice }: Props) {
  const { sender, items } = invoice;
  const taxRate = sender.tax_rate;
  const subtotal = items.reduce((sum, item) => sum + item.unit_price, 0);
  const tax = Math.floor(subtotal * taxRate);
  const total = subtotal + tax;


  return (
    <div
      id="invoice-print"
      className="bg-white mx-auto text-sm"
      style={{ width: "210mm", minHeight: "297mm", padding: "15mm", fontFamily: "serif" }}
    >
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold tracking-widest">御　請　求　書</h1>
        <div className="text-right text-xs space-y-1">
          <div>請求書No: {invoice.invoice_number}</div>
          <div>請求日: {formatJapaneseDate(invoice.invoice_date)}</div>
        </div>
      </div>

      {/* 宛先・発行者 2カラム */}
      <div className="flex justify-between mb-6">
        {/* 左：宛先 */}
        <div className="space-y-2" style={{ width: "48%" }}>
          <div className="text-lg font-bold border-b-2 border-black pb-1">
            {invoice.client_name}　御中
          </div>
          <div className="text-sm">
            <span className="font-medium">件名：</span>{invoice.subject}
          </div>
          <div
            className="mt-4 border border-black text-center py-3"
            style={{ width: "200px" }}
          >
            <div className="text-xs text-gray-500 mb-1">お振込金額</div>
            <div className="text-xl font-bold">¥{total.toLocaleString()}</div>
          </div>
        </div>

        {/* 右：発行者情報 */}
        <div className="text-xs space-y-1" style={{ width: "46%" }}>
          <div>{sender.zip}</div>
          <div>{sender.address_line1}</div>
          {sender.address_line2 && <div>{sender.address_line2}</div>}
          {sender.phone && <div>TEL: {sender.phone}</div>}
          <div className="font-bold">{sender.company}</div>
          <div className="flex items-center gap-2">
            <span className="font-bold">{sender.name}</span>
            {sender.show_hanko && <span className="ml-3">印</span>}
          </div>
          <div className="text-gray-600">登録番号: {sender.registration}</div>
        </div>
      </div>

      {/* 品目テーブル */}
      <table className="w-full border-collapse text-xs mb-4">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="border border-gray-600 px-2 py-1 w-8">No</th>
            <th className="border border-gray-600 px-2 py-1">項目</th>
            <th className="border border-gray-600 px-2 py-1 w-16">数量</th>
            <th className="border border-gray-600 px-2 py-1 w-12">単位</th>
            <th className="border border-gray-600 px-2 py-1 w-24">税抜金額</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            return (
              <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 px-2 py-1 text-center">{item.no}</td>
                <td className="border border-gray-300 px-2 py-1">{item.description}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{item.quantity}</td>
                <td className="border border-gray-300 px-2 py-1 text-center">{item.unit}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">
                  {item.unit_price > 0 ? `¥${item.unit_price.toLocaleString()}` : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 合計エリア */}
      <div className="flex justify-end mb-4">
        <table className="text-xs border-collapse" style={{ width: "240px" }}>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-1 bg-gray-100">ご請求金額（税抜）</td>
              <td className="border border-gray-300 px-3 py-1 text-right">
                ¥{subtotal.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-1 bg-gray-100">
                消費税（{Math.round(taxRate * 100)}%）
              </td>
              <td className="border border-gray-300 px-3 py-1 text-right">
                ¥{tax.toLocaleString()}
              </td>
            </tr>
            <tr className="font-bold">
              <td className="border border-gray-300 px-3 py-1 bg-gray-200">お振込金額</td>
              <td className="border border-gray-300 px-3 py-1 text-right">
                ¥{total.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 備考欄 */}
      {invoice.notes && (
        <div className="mb-4 border border-gray-300 p-3">
          <div className="text-xs font-bold mb-1">備考：</div>
          <div className="text-xs whitespace-pre-wrap">{invoice.notes}</div>
        </div>
      )}

      {/* フッター */}
      <div className="text-xs text-center mb-4 space-y-1 text-gray-600">
        <div>{formatJapaneseDate(invoice.due_date)} までにお振込みをお願いいたします。</div>
        <div>振込手数料はご負担いただきますようお願いいたします。</div>
      </div>

      {/* 振込先テーブル */}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="border border-gray-600 px-2 py-1">金融機関名</th>
            <th className="border border-gray-600 px-2 py-1">支店名</th>
            <th className="border border-gray-600 px-2 py-1">口座種別</th>
            <th className="border border-gray-600 px-2 py-1">口座番号</th>
            <th className="border border-gray-600 px-2 py-1">口座名義</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-2 py-1 text-center">{sender.bank_name}</td>
            <td className="border border-gray-300 px-2 py-1 text-center">{sender.bank_branch}</td>
            <td className="border border-gray-300 px-2 py-1 text-center">{sender.account_type}</td>
            <td className="border border-gray-300 px-2 py-1 text-center">{sender.account_number}</td>
            <td className="border border-gray-300 px-2 py-1 text-center">
              {sender.account_holder_kana}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
