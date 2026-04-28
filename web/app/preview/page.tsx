"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import type { Invoice } from "@/types/invoice";
import InvoicePreview from "@/components/InvoicePreview";

function PreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dataParam = searchParams.get("data");

  if (!dataParam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">請求書データがありません</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            フォームに戻る
          </button>
        </div>
      </div>
    );
  }

  let invoice: Invoice;
  try {
    invoice = JSON.parse(decodeURIComponent(dataParam)) as Invoice;
  } catch {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">データの読み込みに失敗しました</p>
      </div>
    );
  }

  const handlePrint = () => {
    const filename = `請求書_${invoice.client_name}様_${invoice.invoice_number}`;
    const original = document.title;
    document.title = filename;
    window.print();
    document.title = original;
  };

  return (
    <div>
      {/* 印刷時は非表示 */}
      <div className="print:hidden bg-gray-100 py-3 px-6 flex justify-between items-center sticky top-0 z-10 shadow">
        <button
          onClick={() => router.push("/form")}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← フォームに戻る
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          印刷 / PDF保存
        </button>
      </div>

      <div className="print:p-0 py-6 px-4 bg-gray-200 min-h-screen">
        <InvoicePreview invoice={invoice} />
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p>読み込み中...</p>
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
