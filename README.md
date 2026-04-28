# InvoiceApps-for-AIChat

Claude などの AI チャットから請求書を生成できる、**ローカル MCP サーバー**と **Next.js Web アプリ**のセットです。

---

## 特徴

- チャット内で宛先・件名・品目を伝えるだけで、請求書 PDF を `~/Downloads/` に保存
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

> **手順が面倒な方へ：** [Claude Code に丸投げする](#claude-code-に丸投げする) セクションも用意しています。

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

> **PDF 出力について:** `npm install` 時に puppeteer が Chromium（約170MB）を自動ダウンロードします。初回のみ時間がかかりますが、以降は不要です。

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

**PDF で作成（デフォルト）**
```
請求書を作ってください。
宛先は株式会社テスト、件名は「2026年5月分 運用保守費」、
品目は「運用保守費 1式 100,000円」です。
```

**HTML で作成したい場合**
```
請求書を HTML 形式で作ってください。（以下同じ）
```

Claude が不足情報を確認しながら、すべて揃ったタイミングで自動的に `~/Downloads/` に保存します。

| 形式 | 拡張子 | 特徴 |
|---|---|---|
| **pdf**（デフォルト） | `.pdf` | そのまま送付可能。レイアウト完全固定 |
| **html** | `.html` | ブラウザで開いて内容確認・印刷も可能 |

### 指定できる項目

| 項目 | 説明 | 省略時 |
|---|---|---|
| 宛先 | 請求先の会社名・個人名 | 必須 |
| 件名 | 請求内容の件名 | 必須 |
| 品目 | 項目名・数量・単位・税抜金額（最大10件） | 必須 |
| 出力形式 | `pdf` または `html` | `pdf` |
| 請求日 | YYYY-MM-DD 形式 | 当日 |
| 支払期限 | YYYY-MM-DD 形式 | 請求日の30日後 |
| 請求書No | 任意の番号 | `YYMMDD-HHMM` 形式で自動生成 |
| 備考 | 補足説明など（改行可） | なし |

---

## Claude Code に丸投げする

[Claude Code](https://claude.ai/code) が入っていれば、セットアップ作業をほぼ全部任せられます。

### クローンから設定まで一気に頼む

リポジトリをクローンしたディレクトリで Claude Code を起動し、以下のように話しかけてください。

```
このリポジトリの MCP サーバーをセットアップしてほしい。
web/config/sender.md を自分の情報に書き換えて、
mcp/ をビルドして、Claude Desktop の設定ファイルに登録するところまでやって。
```

Claude Code が以下を自動でやってくれます：
1. `web/config/sender.md` の書き換え（発行者情報を対話形式で確認）
2. `mcp/` のビルド（`npm install && npm run build`）
3. `claude_desktop_config.json` への MCP 登録
4. 再起動を促すメッセージ

### sender.md だけ書き換えてもらう

```
web/config/sender.md の発行者情報を書き換えてほしい。
会社名は〇〇、氏名は〇〇、銀行は〇〇銀行〇〇支店、
口座番号は〇〇〇〇〇〇〇です。
```

### Claude Desktop の設定だけ頼む

ビルド済みの状態で設定だけやり直したいときは：

```
Claude Desktop の claude_desktop_config.json に
このリポジトリの MCP サーバーを登録して。
パスは自動で解決して。
```

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
Claude Code に頼む場合は「`sender.md` の消費税率を 8% に変更して」と伝えるだけです。

**Q. Claude Desktop 以外の MCP クライアントでも使えますか？**
A. stdio トランスポートを使っているため、MCP 仕様に準拠したクライアントであれば動作します。

**Q. MCP が認識されない / ハンマーアイコンが出ない。**
A. Claude Code に次のように頼むと原因を調べてくれます。
```
Claude Desktop の MCP 設定を確認して。
invoice-mcp が正しく登録されているか、
パスが間違っていないか確認して修正してほしい。
```

**Q. sender.md の書き方がわからない。**
A. Claude Code に「`web/config/sender.md` の書き方を教えて」と聞くとフォーマットを解説してくれます。そのまま「書き換えて」と頼めば対話形式で情報を集めて更新してくれます。

**Q. Node.js のバージョンを確認したい / 入れ方がわからない。**
A. Claude Code に「Node.js 18 以上が入っているか確認して、なければインストール方法を教えて」と聞いてください。

---

## 動作環境

- Node.js 18 以上
- Claude Desktop（MCP サーバーを使う場合）
- macOS / Windows / Linux
