# 新書ファインダー (Shinsho Finder)

openBD APIを使用して、日本の新書の新刊情報を自動収集し、RSSフィードとして配信するツールです。新刊検出時には[X](https://x.com/shinshofinder)にも自動投稿します。

## 概要

- 毎日自動的にopenBD APIから書籍情報を取得
- シリーズ名で新書レーベルを判定して抽出
- 発売日が当月以降の新刊のみをフィルタリング
- 新刊情報をRSSフィード形式で配信
- 新刊検出時にX（Twitter）へ自動投稿
- GitHub Actionsで完全自動化（サーバー不要）

## RSSフィードURL

```text
https://analekt.github.io/shinsho-finder/index.xml
```

お好みのRSSリーダーに登録してご利用ください。フォークして使う場合は、以下のURLになります。

```text
https://YOUR-ACCOUNT.github.io/shinsho-finder/index.xml
```

## 機能

### RSSフィード
- 新書の新刊情報をRSS 2.0形式で配信
- 各アイテムにはAmazonの商品ページへのリンクを含む
- 書籍情報（タイトル、著者、シリーズ、発売日、内容紹介など）を掲載

### X自動投稿
- 新刊が検出されると自動的にXへ投稿
- 重複投稿を防止（投稿済みISBNを記録）
- Amazonアフィリエイトリンク付き

## 新書の判定基準

以下の主要な新書レーベルをシリーズ名で判定します：

- 岩波新書
- 中公新書
- ちくま新書
- 講談社現代新書
- 文春新書
- 新潮新書
- 集英社新書
- 光文社新書
- 幻冬舎新書
- PHP新書
- 平凡社新書
- 小学館新書
- 角川新書
- SB新書
- ブルーバックス
- ちくまプリマー新書
- 中公新書ラクレ
- 講談社＋α新書
- 岩波ジュニア新書
- ベスト新書

## セットアップ手順

### 1. リポジトリのフォーク

このリポジトリを自分のGitHubアカウントにフォークします。

### 2. GitHub Pagesの有効化

1. リポジトリの `Settings` → `Pages` に移動
2. `Source` を `main` ブランチ、`/docs` フォルダーに設定
3. `Save` をクリック

### 3. GitHub Actionsの権限設定

1. リポジトリの `Settings` → `Actions` → `General` に移動
2. `Workflow permissions` で `Read and write permissions` を選択
3. `Save` をクリック

### 4. X（Twitter）APIの設定（オプション）

ご自身管理のXアカウントに自動投稿機能したい場合：

1. [X Developer Portal](https://developer.x.com/en/portal/dashboard)でアプリを作成
2. リポジトリの `Settings` → `Secrets and variables` → `Actions` に移動
3. 以下の4つのシークレットを登録：
   - `X_API_KEY` - API Key
   - `X_API_SECRET` - API Secret
   - `X_ACCESS_TOKEN` - Access Token
   - `X_ACCESS_TOKEN_SECRET` - Access Token Secret

### 5. 初回実行（手動トリガー）

1. `Actions` タブに移動
2. `Daily Shinsho Check` ワークフローを選択
3. `Run workflow` をクリックして手動実行

以降、毎日午前9時（JST）に自動実行されます。

## ローカルでの実行

```bash
# 依存関係のインストール
npm install

# 実行
npm start

# X投稿機能を有効にする場合は環境変数を設定
export X_API_KEY="your_api_key"
export X_API_SECRET="your_api_secret"
export X_ACCESS_TOKEN="your_access_token"
export X_ACCESS_TOKEN_SECRET="your_access_token_secret"
npm start
```

## プロジェクト構成

```text
shinsho-finder/
├── .github/
│   └── workflows/
│       └── daily-check.yml       # GitHub Actions設定
├── src/
│   ├── main.js                   # メインスクリプト
│   ├── fetch-coverage.js         # ISBN一覧取得
│   ├── fetch-details.js          # 書籍詳細取得
│   ├── filter-shinsho.js         # 新書フィルタリング
│   ├── generate-rss.js           # RSS生成
│   └── post-to-x.js              # X（Twitter）投稿
├── data/
│   ├── isbn-list.json            # 全ISBN（差分検出用）
│   ├── shinsho-database.json     # 発見済み新書データベース
│   └── posted-isbns.json         # X投稿済みISBN
├── docs/
│   └── index.xml                 # 生成されたRSSフィード
├── package.json
└── README.md
```

## データソース

- [openBD API](https://openbd.jp/) - 書誌情報・書影提供API

## ライセンス

MIT License

## 注意事項

- openBD APIの利用規約にしたがってご利用ください
- X APIの利用規約にしたがってご利用ください
- データは書籍の紹介・情報提供目的に限定されます
- 大量アクセスは可能ですが、適切な間隔での実行を推奨します
