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
