# openBD API 仕様メモ

このプロジェクトで使用しているopenBD APIの特徴と注意点をまとめる。

## 概要

- **運営**: openBDプロジェクト（版元ドットコム + カーリル）
- **データソース**: JPRO（日本出版インフラセンター）の書誌情報
- **公式サイト**: https://openbd.jp/
- **利用料金**: 無料、登録不要

## エンドポイント

### GET /v1/get
書誌情報を取得する。

```
https://api.openbd.jp/v1/get?isbn=9784004320968
https://api.openbd.jp/v1/get?isbn=9784004320968,9784121508553  # カンマ区切りで複数指定可
```

- 最大1000件まで一度に取得可能
- 存在しないISBNは `null` が返る

### GET /v1/coverage
登録されている全ISBNのリストを取得する。

```
https://api.openbd.jp/v1/coverage
```

- JSON配列形式で全ISBN（約188万件）を返す
- 新規ISBNの検出に使用（差分を取る）

## レスポンス構造

```json
{
  "onix": {
    "RecordReference": "9784004320968",
    "ProductIdentifier": { "IDValue": "9784004320968" },
    "DescriptiveDetail": {
      "TitleDetail": { ... },
      "Contributor": [ ... ],
      "Collection": { ... }
    },
    "PublishingDetail": {
      "Imprint": { "ImprintName": "岩波書店" },
      "PublishingDate": []
    },
    "CollateralDetail": { ... }
  },
  "hanmoto": {
    "datecreated": "2025-12-10 11:22:42",
    "datemodified": "2025-12-16 11:28:22",
    "datekoukai": "2025-12-10"
  },
  "summary": {
    "isbn": "9784004320968",
    "title": "宮本常一 : 民俗学を超えて",
    "author": "木村哲也",
    "publisher": "岩波書店",
    "pubdate": "",
    "series": "岩波新書 ； 新赤版 2096",
    "cover": "",
    "volume": ""
  }
}
```

## 重要なフィールド

### summary（簡易情報）
| フィールド | 説明 | 注意点 |
|-----------|------|--------|
| `isbn` | ISBN-13 | |
| `title` | 書名 | |
| `author` | 著者名 | |
| `publisher` | 出版社名 | |
| `pubdate` | 発売日（YYYYMMDD or YYYYMM） | **空の場合あり** |
| `series` | シリーズ名 | 新書レーベル判定に使用 |
| `cover` | 表紙画像URL | 空の場合が多い |

### hanmoto（版元情報）
| フィールド | 説明 | 用途 |
|-----------|------|------|
| `datecreated` | openBD登録日時 | |
| `datemodified` | 最終更新日時 | |
| `datekoukai` | 公開日（YYYY-MM-DD） | pubdateが空の場合の代替判定に使用 |

### onix（ONIX形式の詳細情報）
- `DescriptiveDetail.Collection.TitleDetail` - シリーズ/レーベル情報
- `DescriptiveDetail.Contributor` - 著者詳細
- `PublishingDetail.PublishingDate` - 発売日（空配列の場合あり）
- `CollateralDetail.TextContent` - 内容紹介、目次など

## 注意点・制約

### 1. pubdate（発売日）が空のケース
- JPROのデータ更新タイミングにより、発売日が未入力のまま登録されることがある
- 対処: `hanmoto.datekoukai`（openBD公開日）を代替として使用

### 2. 古い書籍データの再登場
- JPROでデータが更新されると、過去に発売済みの書籍が「新規ISBN」として検出される場合がある
- 対処: `pubdate`が当月以降かどうかをチェックしてフィルタリング

### 3. PublishingDateの形式
- `onix.PublishingDetail.PublishingDate`は配列形式だが、空配列`[]`の場合が多い
- `summary.pubdate`の方が取得しやすい

### 4. シリーズ名の表記揺れ
- 「岩波新書 ； 新赤版 2096」のように番号が含まれる
- 部分一致で判定する必要がある

### 5. APIレート制限
- 明示的なレート制限の記載はないが、大量リクエスト時は適度な間隔を空けることを推奨
- coverageエンドポイントは1日1回程度の利用を想定

## books.or.jpとの違い

books.or.jp（日本出版インフラセンター運営）には「発売予定日」フィールドがあるが、openBD APIでは取得できない。

| 項目 | openBD | books.or.jp |
|------|--------|-------------|
| 発売予定日 | なし | あり |
| API提供 | あり（無料） | なし |
| データソース | JPRO | JPRO |

## 参考リンク

- openBD 公式: https://openbd.jp/
- openBD GitHub: https://github.com/openBD
- JPRO: https://jpro2.jpo.or.jp/
