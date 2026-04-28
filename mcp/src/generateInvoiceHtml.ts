import type { Invoice } from "../../web/types/invoice.js";

function formatJapaneseDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function generateInvoiceHtml(invoice: Invoice): string {
  const { sender, items } = invoice;
  const taxRate = sender.tax_rate;
  const subtotal = items.reduce((sum, item) => sum + item.unit_price, 0);
  const tax = Math.floor(subtotal * taxRate);
  const total = subtotal + tax;

  const itemRows = items
    .map(
      (item, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f9f9f9"}">
      <td style="border:1px solid #ccc;padding:4px 8px;text-align:center">${item.no}</td>
      <td style="border:1px solid #ccc;padding:4px 8px">${item.description}</td>
      <td style="border:1px solid #ccc;padding:4px 8px;text-align:right">${item.quantity}</td>
      <td style="border:1px solid #ccc;padding:4px 8px;text-align:center">${item.unit}</td>
      <td style="border:1px solid #ccc;padding:4px 8px;text-align:right">${
        item.unit_price > 0 ? `¥${item.unit_price.toLocaleString()}` : ""
      }</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>請求書_${invoice.client_name}様_${invoice.invoice_number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", serif; font-size: 13px; color: #111; background: #fff; }
  @page { size: A4; margin: 15mm; }
  @media print { body { padding: 0; } }
  .page { width: 210mm; min-height: 297mm; padding: 15mm; margin: 0 auto; }
  h1 { font-size: 22px; font-weight: bold; letter-spacing: 0.3em; }
  table { border-collapse: collapse; width: 100%; }
  th { background: #1f2937; color: #fff; padding: 5px 8px; border: 1px solid #4b5563; font-size: 12px; }
</style>
</head>
<body>
<div class="page">

  <!-- ヘッダー -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
    <h1>御　請　求　書</h1>
    <div style="text-align:right;font-size:11px;line-height:1.8">
      <div>請求書No: ${invoice.invoice_number}</div>
      <div>請求日: ${formatJapaneseDate(invoice.invoice_date)}</div>
    </div>
  </div>

  <!-- 宛先・発行者 -->
  <div style="display:flex;justify-content:space-between;margin-bottom:24px">
    <div style="width:48%">
      <div style="font-size:16px;font-weight:bold;border-bottom:2px solid #111;padding-bottom:4px;margin-bottom:8px">
        ${invoice.client_name}　御中
      </div>
      <div style="margin-bottom:16px"><span style="font-weight:bold">件名：</span>${invoice.subject}</div>
      <div style="border:1px solid #111;text-align:center;padding:12px;width:200px">
        <div style="font-size:11px;color:#666;margin-bottom:4px">お振込金額</div>
        <div style="font-size:20px;font-weight:bold">¥${total.toLocaleString()}</div>
      </div>
    </div>
    <div style="width:46%;font-size:11px;line-height:2">
      <div>${sender.zip}</div>
      <div>${sender.address_line1}</div>
      ${sender.address_line2 ? `<div>${sender.address_line2}</div>` : ""}
      ${sender.phone ? `<div>TEL: ${sender.phone}</div>` : ""}
      <div style="font-weight:bold">${sender.company}</div>
      <div style="font-weight:bold">${sender.name}${sender.show_hanko ? "　　印" : ""}</div>
      <div style="color:#555">登録番号: ${sender.registration}</div>
    </div>
  </div>

  <!-- 品目テーブル -->
  <table style="margin-bottom:16px;font-size:11px">
    <thead>
      <tr>
        <th style="width:32px">No</th>
        <th>項目</th>
        <th style="width:48px">数量</th>
        <th style="width:40px">単位</th>
        <th style="width:88px">税抜金額</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <!-- 合計 -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
    <table style="width:220px;font-size:11px">
      <tr>
        <td style="border:1px solid #ccc;padding:4px 12px;background:#f3f4f6">ご請求金額（税抜）</td>
        <td style="border:1px solid #ccc;padding:4px 12px;text-align:right">¥${subtotal.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:4px 12px;background:#f3f4f6">消費税（${Math.round(taxRate * 100)}%）</td>
        <td style="border:1px solid #ccc;padding:4px 12px;text-align:right">¥${tax.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc;padding:4px 12px;background:#e5e7eb;font-weight:bold">お振込金額</td>
        <td style="border:1px solid #ccc;padding:4px 12px;text-align:right;font-weight:bold">¥${total.toLocaleString()}</td>
      </tr>
    </table>
  </div>

  ${
    invoice.notes
      ? `<div style="border:1px solid #ccc;padding:12px;margin-bottom:16px;font-size:11px">
    <div style="font-weight:bold;margin-bottom:4px">備考：</div>
    <div style="white-space:pre-wrap">${invoice.notes.replace(/\\n/g, "\n")}</div>
  </div>`
      : ""
  }

  <!-- フッター -->
  <div style="text-align:center;font-size:11px;color:#555;margin-bottom:16px;line-height:2">
    <div>${formatJapaneseDate(invoice.due_date)} までにお振込みをお願いいたします。</div>
    <div>振込手数料はご負担いただきますようお願いいたします。</div>
  </div>

  <!-- 振込先 -->
  <table style="font-size:11px">
    <thead>
      <tr>
        <th>金融機関名</th>
        <th>支店名</th>
        <th>口座種別</th>
        <th>口座番号</th>
        <th>口座名義</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid #ccc;padding:4px 8px;text-align:center">${sender.bank_name}</td>
        <td style="border:1px solid #ccc;padding:4px 8px;text-align:center">${sender.bank_branch}</td>
        <td style="border:1px solid #ccc;padding:4px 8px;text-align:center">${sender.account_type}</td>
        <td style="border:1px solid #ccc;padding:4px 8px;text-align:center">${sender.account_number}</td>
        <td style="border:1px solid #ccc;padding:4px 8px;text-align:center">${sender.account_holder_kana}</td>
      </tr>
    </tbody>
  </table>

</div>
</body>
</html>`;
}
