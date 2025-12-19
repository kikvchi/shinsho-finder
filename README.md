# 新書ファインダー (Shinsho Finder)

openBD APIを使用して、日本の新書の新刊情報を自動収集し、RSSフィードとして配信するツールです。新刊検出時には[X](https://x.com/shinshofinder)にも自動投稿します。

## 概要

- 毎日自動的にopenBD APIから書籍情報を取得
- シリーズ名で新書レーベルを判定して抽出（29レーベル対応）
- 発売予定の新刊のみをフィルタリング
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
- 最新100件を配信

### X自動投稿
- 新刊が検出されると自動的にXへ投稿
- 重複投稿を防止（投稿済みISBNを記録）
- Amazonアフィリエイトリンク付き

## 対応している新書レーベル（29レーベル）

以下の新書レーベルをシリーズ名で判定します：

| カテゴリ | レーベル |
|---------|---------|
| 老舗・定番 | 岩波新書、中公新書、講談社現代新書、文春新書、新潮新書 |
| 総合出版社 | 集英社新書、光文社新書、幻冬舎新書、小学館新書、角川新書 |
| 専門・ビジネス | PHP新書、PHPビジネス新書、SB新書、サイエンス・アイ新書 |
| 教養・学術 | ちくま新書、ちくまプリマー新書、平凡社新書、ブルーバックス |
| ジュニア向け | 岩波ジュニア新書 |
| ラクレ・α系 | 中公新書ラクレ、講談社＋α新書、講談社+α新書 |
| 新聞社系 | 朝日新書、NHK出版新書 |
| その他 | 祥伝社新書、扶桑社新書、宝島社新書、星海社新書、ベスト新書 |

## フィルタリングロジック

### 処理の流れ

```text
1. openBD APIからISBN一覧を取得（約188万件）
      ↓
2. 前回取得したISBNリストと比較し、新規ISBNを検出
      ↓
3. 新規ISBNの書籍詳細をopenBD APIから取得（100件ずつバッチ処理）
      ↓
4. 新書レーベル判定 + 新刊判定でフィルタリング
      ↓
5. 条件を満たす書籍をデータベースに保存
      ↓
6. RSSフィード生成 & X投稿
```

### 新書レーベル判定

openBDのONIXデータ構造から、シリーズ名（`Collection.TitleDetail.TitleElement.TitleText`）を抽出し、対応レーベルのいずれかを**部分一致**で判定します。

```javascript
// 例: "岩波新書 ； 新赤版 2096" → "岩波新書" を含むのでマッチ
// 例: "中公新書ラクレ ； 831" → "中公新書ラクレ" を含むのでマッチ
```

### 新刊判定（発売予定書籍の抽出）

以下の**いずれか**の条件を満たす書籍を「新刊」として抽出します：

#### 条件1: 発売日が当月以降

```javascript
// summary.pubdate（YYYYMM形式）が現在月以降
pubdate >= 現在年月
```

#### 条件2: 発売日未定だが最近openBDに登録

```javascript
// pubdateが空 かつ hanmoto.datekoukaiが過去3ヶ月以内
pubdate === '' && datekoukai >= 3ヶ月前
```

この2段階判定により：

- 発売日が明確な近刊書籍
- 発売日未定だが近日発売予定の書籍

の両方を漏れなく検出できます。

### データ抽出項目

フィルタリングを通過した書籍から以下の情報を抽出：

| 項目 | 取得元 | 説明 |
|------|--------|------|
| ISBN-13 | `ProductIdentifier.IDValue` | 13桁ISBN |
| ISBN-10 | 計算 | ISBN-13から変換（Amazonリンク用） |
| タイトル | `TitleDetail.TitleElement.TitleText` | 書名 |
| 著者 | `Contributor.PersonName` | 著者名（A01ロールを優先） |
| 著者略歴 | `Contributor.BiographicalNote` | 著者プロフィール |
| 出版社 | `PublishingDetail.Imprint.ImprintName` | 発行元 |
| シリーズ | `Collection.TitleDetail.TitleElement.TitleText` | レーベル名 |
| 発売日 | `summary.pubdate` | YYYYMM形式 → YYYY年M月形式に変換 |
| ページ数 | `Extent.ExtentValue` | 総ページ数 |
| 内容紹介 | `TextContent.Text` (TextType=02,03) | 書籍説明 |
| 目次 | `TextContent.Text` (TextType=04) | 目次情報 |
| 表紙画像 | `SupportingResource.ResourceLink` | カバー画像URL |

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
2. アプリの権限を「Read and Write」に設定
3. リポジトリの `Settings` → `Secrets and variables` → `Actions` に移動
4. 以下の4つのシークレットを登録：
   - `X_API_KEY` - API Key (Consumer Key)
   - `X_API_SECRET` - API Secret (Consumer Secret)
   - `X_ACCESS_TOKEN` - Access Token
   - `X_ACCESS_TOKEN_SECRET` - Access Token Secret

### 5. 初回実行（手動トリガー）

1. `Actions` タブに移動
2. `Daily Shinsho Check` ワークフローを選択
3. `Run workflow` をクリックして手動実行

初回実行時はISBNリストの初期化のみ行われます。新刊検出は2回目以降の実行から開始されます。

以降、毎日3回（午前4時、午前11時、午後8時JST）に自動実行されます。

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
│       └── daily-check.yml          # GitHub Actions設定（毎日7時JST実行）
├── src/
│   ├── main.js                      # メインスクリプト（処理フロー制御）
│   ├── fetch-coverage.js            # openBD ISBN一覧取得
│   ├── fetch-details.js             # 書籍詳細取得（バッチ処理）
│   ├── filter-shinsho.js            # 新書フィルタリングロジック
│   ├── generate-rss.js              # RSS 2.0フィード生成
│   ├── post-to-x.js                 # X（Twitter）投稿（OAuth 1.0a）
│   └── find-all-shinsho-labels.js   # 新書レーベル調査スクリプト
├── data/
│   ├── isbn-list.json               # 全ISBN（約188万件、差分検出用）
│   ├── shinsho-database.json        # 発見済み新書データベース
│   ├── posted-isbns.json            # X投稿済みISBN
│   └── shinsho-labels-analysis.json # 新書レーベル分析結果
├── docs/
│   ├── index.xml                    # 生成されたRSSフィード
│   └── openbd-api.md                # openBD API仕様メモ
├── package.json
└── README.md
```

## 技術仕様

### 使用API

| API | 用途 | 認証 |
|-----|------|------|
| [openBD API](https://openbd.jp/) | 書誌情報取得 | 不要（無料） |
| [X API v2](https://developer.x.com/) | 自動投稿 | OAuth 1.0a |

### openBD APIエンドポイント

| エンドポイント | 用途 | 備考 |
|---------------|------|------|
| `GET /v1/coverage` | 全ISBN一覧取得 | 約188万件、JSON配列 |
| `GET /v1/get?isbn=...` | 書籍詳細取得 | カンマ区切りで最大1000件 |

### 制限事項・注意点

- openBDの`pubdate`フィールドが空の場合がある → `datekoukai`で代替判定
- 古い書籍が再登場する場合がある → 発売日チェックでフィルタリング
- シリーズ名の表記揺れ → 部分一致で対応（例: 全角/半角の「＋」「+」）

## データソース

- [openBD](https://openbd.jp/) - 版元ドットコム + カーリル運営の書誌情報API
  - データソース: 版元ドットコム会員社、国立国会図書館、ホワイトリスト出版社
  - 注: 2023年6月以降、JPROからのデータ配信は停止

## ライセンス

MIT License

## 注意事項

- openBD APIの利用規約にしたがってご利用ください
- X APIの利用規約にしたがってご利用ください
- データは書籍の紹介・情報提供目的に限定されます
- 大量アクセスは可能ですが、適切な間隔での実行を推奨します（本ツールは100ms間隔）
