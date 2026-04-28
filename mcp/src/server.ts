import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { parseSender } from "../../web/lib/parseSender.js";
import { generateInvoiceHtml } from "./generateInvoiceHtml.js";
import { generateInvoicePdf } from "./generateInvoicePdf.js";
import type { Invoice, InvoiceItem } from "../../web/types/invoice.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const defaultSenderMdPath = path.resolve(
  __dirname,
  "../../web/config/sender.md"
);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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

const ItemSchema = z.object({
  description: z.string().describe("項目名（例：運用保守費、コンサルティング費用）"),
  quantity: z.number().positive().describe("数量（例：1、2）"),
  unit: z.string().describe("単位（例：式、月、点、時間）"),
  amount: z.number().nonnegative().describe("税抜金額（円）"),
});

const server = new McpServer({
  name: "invoice-mcp",
  version: "1.0.0",
});

server.tool(
  "create_invoice",
  "請求書を生成して Downloads フォルダに保存します。" +
    "必要な情報をすべてユーザーから収集してから呼び出してください。",
  {
    client_name: z
      .string()
      .describe("宛先の会社名または個人名。「御中」は自動で付与されます（例：株式会社サンプル）"),
    subject: z.string().describe("件名（例：2026年4月分 運用保守費）"),
    items: z
      .array(ItemSchema)
      .min(1)
      .max(10)
      .describe("品目リスト（最大10件）。各品目に項目名・数量・単位・税抜金額が必要です"),
    output_format: z
      .enum(["pdf", "html"])
      .optional()
      .default("pdf")
      .describe("出力形式。pdf（デフォルト）/ html から選択"),
    invoice_date: z
      .string()
      .optional()
      .describe("請求日（YYYY-MM-DD 形式）。省略すると当日になります"),
    due_date: z
      .string()
      .optional()
      .describe("支払期限（YYYY-MM-DD 形式）。省略すると請求日から30日後になります"),
    invoice_number: z
      .string()
      .optional()
      .describe("請求書No。省略すると「YYMMDD-HHMM」形式で自動生成されます"),
    notes: z
      .string()
      .optional()
      .describe("備考（任意）。保守内容・補足説明など"),
  },
  async (args) => {
    try {
      const senderMdPath = process.env.SENDER_MD_PATH ?? defaultSenderMdPath;
      const sender = parseSender(senderMdPath);

      const invoiceDate = args.invoice_date ?? today();
      const dueDate = args.due_date ?? addDays(invoiceDate, 30);
      const invoiceNumber = args.invoice_number ?? generateInvoiceNumber();
      const outputFormat = (args.output_format ?? "pdf") as "pdf" | "html";

      const items: InvoiceItem[] = args.items.map((item, i) => ({
        id: `item-${i}`,
        no: i + 1,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.amount,
      }));

      const invoice: Invoice = {
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        client_name: args.client_name,
        subject: args.subject,
        notes: args.notes,
        items,
        sender,
      };

      // 拡張子・ファイル名を決定
      const extMap = { pdf: ".pdf", html: ".html" } as const;
      const ext = extMap[outputFormat];
      const filename = `請求書_${args.client_name}様_${invoiceNumber}${ext}`;
      const outputPath = path.join(os.homedir(), "Downloads", filename);

      // フォーマットに応じて生成・保存
      if (outputFormat === "pdf") {
        const buf = await generateInvoicePdf(invoice);
        fs.writeFileSync(outputPath, buf);
      } else {
        const html = generateInvoiceHtml(invoice);
        fs.writeFileSync(outputPath, html, "utf-8");
      }

      const subtotal = items.reduce((s, i) => s + i.unit_price, 0);
      const tax = Math.floor(subtotal * sender.tax_rate);
      const total = subtotal + tax;

      const formatLabel = { pdf: "PDF", html: "HTML" }[outputFormat];

      return {
        content: [
          {
            type: "text",
            text: [
              `✅ 請求書を生成しました（${formatLabel}）`,
              ``,
              `📄 ファイル: ${outputPath}`,
              ``,
              `【概要】`,
              `  宛先: ${args.client_name} 御中`,
              `  件名: ${args.subject}`,
              `  請求日: ${invoiceDate}`,
              `  支払期限: ${dueDate}`,
              `  請求書No: ${invoiceNumber}`,
              ``,
              `【金額】`,
              `  税抜合計: ¥${subtotal.toLocaleString()}`,
              `  消費税(${Math.round(sender.tax_rate * 100)}%): ¥${tax.toLocaleString()}`,
              `  お振込金額: ¥${total.toLocaleString()}`,
              ...(outputFormat === "html"
                ? [``, `ブラウザで開いて「印刷 → PDFに保存」で PDF 化できます。`]
                : []),
            ].join("\n"),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 請求書の生成に失敗しました: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
