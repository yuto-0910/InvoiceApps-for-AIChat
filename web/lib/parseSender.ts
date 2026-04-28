import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Sender } from "@/types/invoice";

export function parseSender(mdPath?: string): Sender {
  const filePath =
    mdPath ??
    process.env.SENDER_MD_PATH ??
    path.join(process.cwd(), "config", "sender.md");

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(fileContent);

  return {
    company: data.company ?? "",
    name: data.name ?? "",
    registration: data.registration ?? "",
    zip: data.zip ?? "",
    address_line1: data.address_line1 ?? "",
    address_line2: data.address_line2,
    phone: data.phone,
    bank_name: data.bank_name ?? "",
    bank_branch: data.bank_branch ?? "",
    account_type: data.account_type ?? "",
    account_number: String(data.account_number ?? ""),
    account_holder_kana: data.account_holder_kana ?? "",
    show_hanko: data.show_hanko === true,
    tax_rate: typeof data.tax_rate === "number" ? data.tax_rate : 0.1,
  };
}
