# risyu2json

CampusSquare の保存済みページ（HTML / MHTML / iOS の .webarchive）から、時間割データを `sample.json` 形式で抽出するスクリプトです。

## 関数として利用

```ts
import { extractTimetableFromSavedData } from "./dist/extract";

const savedData = "...履修登録ページの保存データ文字列...";
const rows = extractTimetableFromSavedData(savedData);
console.log(rows);
```

`extractTimetableFromSavedData` は、引数に保存済み履修データ文字列を受け取り、戻り値として JSON データ（`Row[]`）を返します。

`.webarchive` を入力する場合は、CLI または `extractTimetableFromFile` を利用してください。

```ts
import { extractTimetableFromFile } from "./dist/extract";

const rowsFromWebarchive = extractTimetableFromFile("./input.webarchive");
const rowsFromMhtml = extractTimetableFromFile("./input.mhtml");
```

## セットアップ

```bash
npm install
```

## 実行

```bash
npm run extract -- "C:\\path\\to\\履修登録・参照 [CampusSquare]" sample.json
```

第2引数（出力先）を省略すると `sample.json` に出力します。

## npm インストール

```bash
npm install risyu2json
```

## リリース手順

このパッケージは `v*` 形式のタグを push することで npm に自動公開されます。  
**CI（ビルド）が通っていることを確認してからタグを作成してください。**

```bash
# バージョンを上げてタグを作成・push する
npm version patch   # または minor / major
git push origin main --tags
```

- タグ push をトリガーに GitHub Actions の `Publish to npm` ワークフローが起動します。
- ビルド成果物（`dist/`）の存在確認後、`npm publish` が実行されます。
- 公開には リポジトリ Secrets `NPM_TOKEN` の設定が必要です（Settings → Secrets → `NPM_TOKEN`）。
- 同一バージョンの重複公開はエラーになります。その場合は `npm version` で版数を上げてから再タグしてください。

### ロールバック

npm は一度公開したバージョンの削除を原則禁止しています（公開後 72 時間以内のみ `npm unpublish` 可）。  
問題が発生した場合はパッチバージョンを上げて修正版を公開するか、`npm deprecate` で非推奨マークを付けてください。
