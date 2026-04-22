import { parse } from "@plist/plist";

export type Cell =
  | { type: "empty"; raw: "空き" }
  | { type: "same"; raw: "上記と同じ" }
  | { type: "class"; subject: string; teacher: string; room: string };

export type Row = {
  name: string;
  cells: Cell[];
};

export type IOSWebArchiveData = Uint8Array | ArrayBuffer;

type WebArchiveMainResource = {
  WebResourceData?: Uint8Array | string;
  WebResourceMIMEType?: string;
};

type WebArchiveRoot = {
  WebMainResource?: WebArchiveMainResource;
  WebSubresources?: WebArchiveMainResource[];
  WebSubframeArchives?: WebArchiveRoot[];
};

type HtmlCandidate = {
  text: string;
  score: number;
  length: number;
};

function parseHtmlDocument(html: string): Document {
  if (typeof DOMParser === "undefined") {
    throw new Error("DOMParser is not available in this runtime.");
  }
  return new DOMParser().parseFromString(html, "text/html");
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  const copied = new Uint8Array(data.byteLength);
  copied.set(data);
  return copied.buffer;
}

function parseWebArchiveBuffer(data: Uint8Array): WebArchiveRoot[] {
  const parsed = parse(toArrayBuffer(data)) as unknown;
  if (Array.isArray(parsed)) {
    return parsed as WebArchiveRoot[];
  }
  return [parsed as WebArchiveRoot];
}

function toHalfWidthDigits(text: string): string {
  return text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, "")
    .trim();
}

function normalizeText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\r?\n/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

function extractHtml(raw: string): string {
  const doctypeIndex = raw.indexOf("<!DOCTYPE");
  const htmlIndex = raw.indexOf("<html");
  const start = doctypeIndex >= 0 ? doctypeIndex : htmlIndex;

  if (start < 0) {
    throw new Error("HTML本体が見つかりませんでした。");
  }

  const end = raw.lastIndexOf("</html>");
  if (end < 0 || end <= start) {
    return raw.slice(start);
  }
  return raw.slice(start, end + "</html>".length);
}

function parseCell(cellElement: Element): Cell {
  const lines = Array.from(cellElement.querySelectorAll("table.rishu-koma tr > td"))
    .map((td) => normalizeText(td.textContent ?? ""))
    .filter((line) => line.length > 0)
    .filter((line) => line !== "(学生変更不可)")
    .filter((line) => line !== "削除")
    .filter((line) => line !== "登録");

  if (lines[0] === "上記と同じ") {
    return { type: "same", raw: "上記と同じ" };
  }

  if (lines.length === 0) {
    return { type: "empty", raw: "空き" };
  }

  return {
    type: "class",
    subject: lines[0] ?? "",
    teacher: lines[1] ?? "",
    room: lines[2] ?? "",
  };
}

function parseRows(html: string): Row[] {
  const document = parseHtmlDocument(html);

  const rows = Array.from(document.querySelectorAll("tr"));
  const result: Row[] = [];

  for (const tr of rows) {
    const periodParts = Array.from(
      tr.querySelectorAll("th.rishu-koma-head-jigen"),
    ).map((th) => toHalfWidthDigits(normalizeText(th.textContent ?? "")));

    if (periodParts.length !== 2) {
      continue;
    }

    const [a, b] = periodParts;
    if (!/^\d+$/.test(a) || !/^\d+$/.test(b)) {
      continue;
    }

    const name = `${a}・${b}`;
    const tds = Array.from(tr.children).filter(
      (child): child is HTMLTableCellElement => child.tagName === "TD",
    );
    if (tds.length < 5) {
      continue;
    }

    const cells = tds.slice(0, 5).map((td) => parseCell(td));
    result.push({ name, cells });
  }

  return result;
}

function decodeResourceData(data: Uint8Array | string): string {
  if (typeof data === "string") {
    return data;
  }
  return new TextDecoder("utf-8").decode(data);
}

function scoreHtmlCandidate(text: string): number {
  const markers = [
    "rishu-koma-head-jigen",
    "class=\"rishu-koma\"",
    "campussquare.do",
    "1・2",
    "3・4",
  ];
  return markers.reduce((score, marker) => {
    return score + (text.includes(marker) ? 1 : 0);
  }, 0);
}

function collectHtmlCandidates(node: WebArchiveRoot, output: HtmlCandidate[]): void {
  const visitResource = (resource?: WebArchiveMainResource): void => {
    if (!resource?.WebResourceData) {
      return;
    }

    const text = decodeResourceData(resource.WebResourceData);
    const mimeType = (resource.WebResourceMIMEType ?? "").toLowerCase();
    const looksLikeHtml =
      mimeType.includes("text/html") ||
      text.includes("<html") ||
      text.includes("<!DOCTYPE");

    if (!looksLikeHtml) {
      return;
    }

    output.push({
      text,
      score: scoreHtmlCandidate(text),
      length: text.length,
    });
  };

  visitResource(node.WebMainResource);
  (node.WebSubresources ?? []).forEach((resource) => visitResource(resource));
  (node.WebSubframeArchives ?? []).forEach((frame) =>
    collectHtmlCandidates(frame, output),
  );
}

function toBuffer(data: IOSWebArchiveData): Uint8Array {
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  return data;
}

function extractHtmlFromWebArchive(webArchiveData: IOSWebArchiveData): string {
  const parsed = parseWebArchiveBuffer(toBuffer(webArchiveData));
  if (parsed.length === 0) {
    throw new Error("webarchive の内容を読み取れませんでした。");
  }

  const candidates: HtmlCandidate[] = [];
  collectHtmlCandidates(parsed[0], candidates);
  if (candidates.length === 0) {
    throw new Error("webarchive 内でHTML候補が見つかりませんでした。");
  }

  candidates.sort((a, b) => b.score - a.score || b.length - a.length);
  return extractHtml(candidates[0].text);
}

export function extractFromAndroid(savedData: string): Row[] {
  const html = extractHtml(savedData);
  return parseRows(html);
}

export function extractFromiOS(webArchiveData: IOSWebArchiveData): Row[] {
  const html = extractHtmlFromWebArchive(webArchiveData);
  return parseRows(html);
}
