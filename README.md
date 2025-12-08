# 新書ファインダー (Shinsho Finder)

openBD APIを使用して、日本の新書の新刊情報を自動収集し、RSSフィードとして配信するツールです。

## 概要

- 毎日自動的にopenBD APIから書籍情報を取得
- シリーズ名で新書レーベルを判定して抽出
- 新刊情報をRSSフィード形式で配信
- GitHub Actionsで完全自動化（サーバー不要）

## RSSフィードURL

```text
https://analekt.github.io/shinsho-finder/index.xml
```

お好みのRSSリーダーに登録してご利用ください。

## 新書の判定基準

以下の主要な新書レーベルをシリーズ名で判定します：

**教養新書**:

- 岩波新書、中公新書、ちくま新書、講談社現代新書

**実用新書**:

- 文春新書、新潮新書、集英社新書、光文社新書、幻冬舎新書
- PHP新書、平凡社新書、小学館新書、角川新書、SB新書

**その他**:

- ブルーバックス、ちくまプリマー新書、中公新書ラクレ
- 講談社＋α新書、岩波ジュニア新書、ベスト新書

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

### 4. 初回実行（手動トリガー）

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
│   └── generate-rss.js           # RSS生成
├── data/
│   ├── isbn-list.json            # 全ISBN（差分検出用）
│   └── shinsho-database.json     # 発見済み新書データベース
├── docs/
│   └── index.xml                 # 生成されたRSSフィード
├── package.json
└── README.md
```

## データソース

- [openBD API](https://openbd.jp/) - 書誌情報・書影提供API
- [Cコード一覧表](https://www.asahi-net.or.jp/~ax2s-kmtn/ref/ccode.html)

## ライセンス

MIT License

## 注意事項

- openBD APIの利用規約にしたがってご利用ください
- データは書籍の紹介・情報提供目的に限定されます
- 大量アクセスは可能ですが、適切な間隔での実行を推奨します
