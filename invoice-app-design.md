# 請求書Webアプリ プロジェクト設計書

## 概要

発行者情報をMarkdownファイルで管理し、フォーム入力から日本標準フォーマットの請求書HTMLを生成するWebアプリ。
将来的にMCP化（ツール化）することを前提とした設計とする。

---

## 技術スタック

| 要素 | 採用技術 | 備考 |
|------|----------|------|
| フレームワーク | Next.js (App Router) | MCP化時に `/api` ルートを流用 |
| 言語 | TypeScript | |
| スタイリング | Tailwind CSS | |
| 設定ファイルパース | `gray-matter` | Markdownフロントマター読み込み |
| PDF出力 | ブラウザ印刷（`window.print()`） | 初期実装。後で`@react-pdf`に切替可 |

---

## ディレクトリ構成

```
invoice-app/
├── config/
│   └── sender.md          # 発行者情報（テンプレート）
├── src/
│   ├── app/
│   │   ├── page.tsx       # 入力フォーム画面
│   │   ├── preview/
│   │   │   └── page.tsx   # 請求書プレビュー画面
│   │   └── api/
│   │       └── sender/
│   │           └── route.ts  # sender.md読み込みAPI（MCP化の起点）
│   ├── components/
│   │   ├── InvoiceForm.tsx    # 入力フォーム
│   │   ├── InvoicePreview.tsx # 請求書レイアウト
│   │   └── ItemTable.tsx      # 品目テーブル（動的行追加）
│   ├── types/
│   │   └── invoice.ts         # 型定義
│   └── lib/
│       └── parseSender.ts     # sender.mdパース処理
├── public/
│   └── hanko.png              # 印鑑画像（オプション）
└── package.json
```

---

## 設定ファイル仕様

### `config/sender.md`

```markdown
---
# 基本情報
company: TerrAS
name: 青木 悠斗
registration: T1810110764599

# 住所
zip: 〒430-0000
address_line1: 静岡県浜松市中央区三方原町912-2
address_line2: ルミエール三方原2 203号室

# 連絡先
phone: 090-7316-0648

# 銀行口座
bank_name: 楽天銀行
bank_branch: アリア支支店
account_type: 普通
account_number: "5018828"
account_holder_kana: アオキ ユウト

# オプション
show_hanko: true        # 印鑑画像を表示するか
tax_rate: 0.10          # 消費税率（デフォルト10%）
---

※ このファイルを編集することで請求書の発行者情報が更新されます。
```

---

## 型定義

### `src/types/invoice.ts`

```typescript
// 発行者情報
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

// 品目行
export type InvoiceItem = {
  id: string;           // UUID（行管理用）
  no: number;
  description: string;  // 項目
  quantity: number;     // 数量
  unit: string;         // 単位（点、式、月 など）
  unit_price: number;   // 税抜単価
};

// 請求書全体
export type Invoice = {
  invoice_number: string;   // 請求書No
  invoice_date: string;     // 請求日
  due_date: string;         // 支払期限
  client_name: string;      // 宛先（〇〇御中）
  subject: string;          // 件名
  notes?: string;           // 備考（保守内容・補足など）
  items: InvoiceItem[];
  sender: Sender;
};
```

---

## 画面仕様

### 1. 入力フォーム画面（`/`）

**入力項目：**

| フィールド | 備考 |
|-----------|------|
| 宛先（クライアント名） | 「御中」は自動付与 |
| 件名 | |
| 請求日 | デフォルト：当日 |
| 支払期限 | デフォルト：請求日から+30日で自動セット。手動上書き可 |
| 請求書No | デフォルト：起動時刻から自動生成（`YYMMDD-HHMM`形式）。手動上書き可 |
| 品目テーブル | 動的追加・削除。最大10行（印刷レイアウト固定のため） |
| 備考 | 任意。複数行テキストエリア。保守内容・補足説明など |

**品目テーブル列：**

| No | 項目 | 数量 | 単位 | 税抜単価 | 税抜金額（自動計算） |
|----|------|------|------|----------|---------------------|

**合計エリア（自動計算）：**
- ご請求金額（税抜合計）
- 消費税（tax_rate適用）
- お振込金額（税込合計）

---

### 2. 請求書プレビュー画面（`/preview`）

現行テンプレートに準拠したレイアウト：

```
【ヘッダー】
　御 請 求 書　　　　　　請求書No: ___
　　　　　　　　　　　　請求日: ____/__/__

【左列】                  【右列：発行者情報】
〇〇〇〇　御中            住所
　　　　　　　　　　　　電話番号
件名：___________         屋号
　　　　　　　　　　　　氏名　　[印鑑]
お振込金額 | ¥000,000      登録番号

【品目テーブル】
No | 項目 | 数量 | 単位 | 税抜単価 | 税抜金額
（最大10行、空行はブランク表示）

　　　　　　　　　　ご請求金額 | ¥000,000
　　　　　　　　　　消費税(10%) | ¥000,000
　　　　　　　　　　お振込金額 | ¥000,000

【備考欄】（notes が存在する場合のみ表示）
備考：
___________________________________________

【フッター】
○○○○年○月○日 までにお振込みをお願いいたします。
振込手数料はご負担いただきますようお願いいたします。

【振込先テーブル】
金融機関名 / 支店名 / 口座種別 / 口座番号 / 口座名義（カナ）
```

**印刷対応：**
- `@media print` でフォーム非表示、プレビューのみ印刷
- 「印刷/PDF保存」ボタンで`window.print()`実行

---

## データフロー

```
sender.md
　↓ gray-matter でパース（サーバーサイド）
　↓ /api/sender で返却
　↓
InvoiceForm（ユーザー入力）
　↓ stateに保持
　↓ URLクエリ or Context経由でプレビューへ渡す
　↓
InvoicePreview（レンダリング）
　↓
window.print() → PDF保存
```

---

## MCP化の設計方針（将来フェーズ）

Webアプリ完成後、以下の対応でMCPツール化する：

### 公開するMCPツール

| ツール名 | 処理 |
|---------|------|
| `get_sender_info` | sender.mdを読み込んで発行者情報を返す |
| `create_invoice` | 宛先・件名・品目リストを受け取りHTML文字列を返す |
| `save_invoice` | 生成HTMLをファイル保存（オプション） |

### `/api/sender/route.ts` の役割

WebアプリのAPIルートをそのままMCPのハンドラーとして流用できる設計にしておく。
`create_invoice` ツールへの入力スキーマ ＝ `Invoice` 型をそのまま使用。

---

## 開発フェーズ

| フェーズ | 内容 |
|---------|------|
| Phase 1 | sender.md設計 + パース処理 + 型定義 |
| Phase 2 | 入力フォーム実装（品目動的追加・備考欄含む） |
| Phase 3 | 請求書プレビューレイアウト実装 |
| Phase 4 | 印刷/PDF出力対応 |
| Phase 5 | MCP化（ツール定義・ハンドラー実装） |

---

## 備考・決定事項

- **印鑑**：`show_hanko: true/false` フラグで制御。画像ファイルは `public/hanko.png` に配置。
- **品目行数**：印刷レイアウト固定のため最大10行。空行はブランクで表示。
- **消費税**：sender.mdの`tax_rate`で管理。デフォルト10%。
- **請求書No**：起動時に自動生成。フォーマットは `YYMMDD-HHMM`（例：`260428-0945`）。手動上書き可。
- **Claude API不使用**：テンプレート描画のみ。AIは使わない。
- **支払期限**：デフォルトは請求日（当日）から+30日で自動セット。手動上書き可。
- **備考欄**：`notes?: string`（任意項目）。入力フォームは複数行テキストエリア。プレビューはnotesが空の場合は非表示。保守内容・補足説明の記載を想定。
