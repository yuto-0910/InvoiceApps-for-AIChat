# InvoiceApps-for-AIChat

Claude などの AI チャットから請求書を生成できる、**ローカル MCP サーバー**と **Next.js Web アプリ**のセットです。

---

## 特徴

- チャット内で宛先・件名・品目を伝えるだけで、請求書 HTML を `~/Downloads/` に保存
- 消費税（10%）の自動計算、請求書 No. の自動採番
- 振込先・発行者情報は手元の Markdown ファイルで管理（クラウドに送信されません）
- Web アプリでも同じ請求書を作成・印刷（PDF 保存）可能

---

## ディレクトリ構成

```
InvoiceApps-for-AIChat/
├── web/                      # Next.js Web アプリ（任意）
│   ├── config/sender.md      # 発行者情報（要編集）
│   ├── types/invoice.ts      # 型定義
│   └── lib/parseSender.ts    # sender.md パーサー
└── mcp/                      # ローカル MCP サーバー
    ├── src/server.ts
    └── dist/server.js        # ビルド済みバンドル（npm run build で生成）
```

---

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/YOUR_USERNAME/InvoiceApps-for-AIChat.git
cd InvoiceApps-for-AIChat
```

### 2. 発行者情報を設定する

`web/config/sender.md` をテキストエディタで開き、ご自身の情報に書き換えてください。

```yaml
---
company: '株式会社サンプル'       # 会社名（個人の場合は空白のまま可）
name: 山田　太郎                  # 氏名
registration: T0000000000000     # インボイス登録番号
zip: 〒150-0001                  # 郵便番号
address_line1: 東京都渋谷区神宮前1-1-1
address_line2: ''                 # ビル名など（不要なら空白）
phone: 03-0000-0000              # 電話番号（不要なら空白）
bank_name: 〇〇銀行
bank_branch: 〇〇支店
account_type: 普通
account_number: '1234567'
account_holder_kana: ヤマダ タロウ
show_hanko: false                # true にすると氏名の横に「印」が表示されます
tax_rate: 0.1                    # 消費税率（10% = 0.1）
---
```

### 3. MCP サーバーをビルドする

```bash
cd mcp
npm install
npm run build
```

ビルドが成功すると `mcp/dist/server.js` が生成されます。

### 4. Claude Desktop に登録する

`~/Library/Application Support/Claude/claude_desktop_config.json` を開き、以下を追記してください。

> **Windows の場合:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "invoice-mcp": {
      "command": "node",
      "args": ["/絶対パス/InvoiceApps-for-AIChat/mcp/dist/server.js"],
      "env": {
        "SENDER_MD_PATH": "/絶対パス/InvoiceApps-for-AIChat/web/config/sender.md"
      }
    }
  }
}
```

**`/絶対パス/` の部分はご自身の環境に合わせて書き換えてください。**

macOS でパスを確認するには、ターミナルでリポジトリのルートに移動して `pwd` を実行してください。

```bash
cd InvoiceApps-for-AIChat
pwd
# 例: /Users/yamada/Git/InvoiceApps-for-AIChat
```

設定例（上記の場合）:

```json
{
  "mcpServers": {
    "invoice-mcp": {
      "command": "node",
      "args": ["/Users/yamada/Git/InvoiceApps-for-AIChat/mcp/dist/server.js"],
      "env": {
        "SENDER_MD_PATH": "/Users/yamada/Git/InvoiceApps-for-AIChat/web/config/sender.md"
      }
    }
  }
}
```

### 5. Claude Desktop を再起動する

設定ファイルを保存したら、Claude Desktop を完全に終了して再起動してください。

チャット画面の左下にハンマーアイコン（🔨）が表示されれば、MCP の接続成功です。

---

## 使い方（Claude チャット）

接続後は、Claude に話しかけるだけで請求書が作れます。

```
請求書を作ってください。
宛先は株式会社テスト、件名は「2026年5月分 運用保守費」、
品目は「運用保守費 1式 100,000円」です。
```

Claude が不足情報を確認しながら、すべて揃ったタイミングで自動的に請求書 HTML を `~/Downloads/` に保存します。

生成されたファイルをブラウザで開き、**印刷 → PDF に保存** で PDF 化できます。

### 指定できる項目

| 項目 | 説明 | 省略時 |
|---|---|---|
| 宛先 | 請求先の会社名・個人名 | 必須 |
| 件名 | 請求内容の件名 | 必須 |
| 品目 | 項目名・数量・単位・税抜金額（最大10件） | 必須 |
| 請求日 | YYYY-MM-DD 形式 | 当日 |
| 支払期限 | YYYY-MM-DD 形式 | 請求日の30日後 |
| 請求書No | 任意の番号 | `YYMMDD-HHMM` 形式で自動生成 |
| 備考 | 補足説明など | なし |

---

## Web アプリ（オプション）

ブラウザから GUI で請求書を作成したい場合は、`web/` ディレクトリで Next.js アプリを起動できます。

```bash
cd web
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

---

## よくある質問

**Q. 入力した情報はどこかに送られますか？**
A. いいえ。`sender.md` はローカルのファイルを読むだけで、クラウドには送信されません。請求書ファイルも `~/Downloads/` に保存されるだけです。

**Q. 消費税率を変えたいです。**
A. `sender.md` の `tax_rate` を変更してください（例: 8% → `0.08`）。

**Q. Claude Desktop 以外の MCP クライアントでも使えますか？**
A. stdio トランスポートを使っているため、MCP 仕様に準拠したクライアントであれば動作します。

---

## 動作環境

- Node.js 18 以上
- Claude Desktop（MCP サーバーを使う場合）
- macOS / Windows / Linux
