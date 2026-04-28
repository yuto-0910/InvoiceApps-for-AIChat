"use client";

import { useState, useEffect } from "react";
import type { InvoiceItem } from "@/types/invoice";

type Props = {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
};

function newItem(no: number): InvoiceItem {
  return {
    id: crypto.randomUUID(),
    no,
    description: "",
    quantity: 1,
    unit: "式",
    unit_price: 0,
  };
}

// 数値フィールド用の入力コンポーネント（スピナーなし）
function NumericInput({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const [text, setText] = useState(value === 0 ? "" : String(value));

  // 親の value が外部から変わったとき（復元時など）に同期
  useEffect(() => {
    setText(value === 0 ? "" : String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.]/g, "");
        setText(raw);
        const parsed = parseFloat(raw);
        onChange(isNaN(parsed) ? 0 : parsed);
      }}
      onBlur={() => {
        // フォーカスが外れたとき 0 なら空表示、それ以外は数値表示
        setText(value === 0 ? "" : String(value));
      }}
      className={className}
    />
  );
}

export default function ItemTable({ items, onChange }: Props) {
  const addRow = () => {
    if (items.length >= 10) return;
    onChange([...items, newItem(items.length + 1)]);
  };

  const removeRow = (id: string) => {
    const next = items
      .filter((item) => item.id !== id)
      .map((item, i) => ({ ...item, no: i + 1 }));
    onChange(next);
  };

  const updateRow = (id: string, field: keyof InvoiceItem, value: string | number) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1 w-10">No</th>
              <th className="border border-gray-300 px-2 py-1">項目</th>
              <th className="border border-gray-300 px-2 py-1 w-20">数量</th>
              <th className="border border-gray-300 px-2 py-1 w-20">単位</th>
              <th className="border border-gray-300 px-2 py-1 w-36">税抜金額</th>
              <th className="border border-gray-300 px-2 py-1 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              return (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-2 py-1 text-center text-gray-500">
                    {item.no}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateRow(item.id, "description", e.target.value)}
                      className="w-full outline-none"
                      placeholder="項目名"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <NumericInput
                      value={item.quantity}
                      onChange={(v) => updateRow(item.id, "quantity", v)}
                      className="w-full text-right outline-none"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateRow(item.id, "unit", e.target.value)}
                      className="w-full outline-none"
                      placeholder="式"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <NumericInput
                      value={item.unit_price}
                      onChange={(v) => updateRow(item.id, "unit_price", v)}
                      className="w-full text-right outline-none"
                    />
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(item.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        disabled={items.length >= 10}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
      >
        + 行を追加（{items.length}/10）
      </button>
    </div>
  );
}
