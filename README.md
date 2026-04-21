# risyu2json

CampusSquare の保存済みページ（Android の HTML / MHTML、iOS の .webarchive）から、時間割データを `json` 形式で抽出するライブラリです。React での利用を想定しています。

## React で利用

```ts
import { extractFromAndroid, extractFromiOS } from "risyu2json";

const androidSavedData = "...履修登録ページの保存データ文字列...";
const rowsFromAndroid = extractFromAndroid(androidSavedData);

// 例: input type="file" で受け取った iOS の .webarchive ファイル
const iOSArrayBuffer = await file.arrayBuffer();
const rowsFromiOS = extractFromiOS(iOSArrayBuffer);

console.log(rowsFromAndroid, rowsFromiOS);
```

- `extractFromAndroid(savedData: string)`
	- Android 側で保存した HTML / MHTML の文字列を受け取り、`Row[]` を返します。
- `extractFromiOS(webArchiveData: Buffer | Uint8Array | ArrayBuffer)`
	- iOS の `.webarchive` バイナリデータを受け取り、`Row[]` を返します。

## セットアップ

```bash
npm install
```

## npm インストール

```bash
npm install risyu2json
```
