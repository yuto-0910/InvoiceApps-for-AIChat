import puppeteer from "puppeteer";
import { generateInvoiceHtml } from "./generateInvoiceHtml.js";
import type { Invoice } from "../../web/types/invoice.js";

export async function generateInvoicePdf(invoice: Invoice): Promise<Buffer> {
  const html = generateInvoiceHtml(invoice);
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
