import { CellValueType } from '@univerjs/core';
import { normalizeDefinitions } from './functions.js';

const oldRows = 5000;
const oldCols = 100;
const validKey = (key) => typeof key === 'string' && !!key && !['__proto__', 'prototype', 'constructor'].includes(key);
const isObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
export const createId = () => globalThis.crypto?.randomUUID?.() ?? 'book-' + Math.random().toString(36).slice(2);
const emptySheet = (id, name, cellData = {}) => ({ id, name, rowCount: oldRows, columnCount: oldCols, cellData });

export function newWorkbook(name = '未命名活頁簿') {
  const id = 'sheet-1';
  return {
    snapshot: { id: createId(), name, sheetOrder: [id], sheets: { [id]: emptySheet(id, '工作表1') } },
    definitions: new Map()
  };
}

function cellPosition(address) {
  const parts = /^([A-Z]{1,3})([1-9]\d*)$/.exec(address);
  if (!parts) return null;
  let column = 0;
  for (const char of parts[1]) column = column * 26 + char.charCodeAt(0) - 64;
  const row = Number(parts[2]);
  if (row > oldRows || column > oldCols) return null;
  return { row: row - 1, column: column - 1 };
}

function migrateCell(cell) {
  if (cell?.kind === 'number' && Number.isFinite(cell.input)) {
    return { v: cell.input, t: CellValueType.NUMBER };
  }
  if (cell?.kind === 'boolean' && typeof cell.input === 'boolean') {
    return { v: Number(cell.input), t: CellValueType.BOOLEAN };
  }
  if (cell?.kind === 'text' && typeof cell.input === 'string') {
    return { v: cell.input, t: CellValueType.FORCE_STRING };
  }
  if (cell?.kind === 'formula' && typeof cell.input === 'string' && cell.input.startsWith('=')) {
    return { f: cell.input };
  }
  throw new Error('舊活頁簿含有無效的儲存格內容。');
}

function migrateLegacy(data, title) {
  if (!Array.isArray(data.sheets) || !data.sheets.length) throw new Error('舊活頁簿缺少分頁。');
  const sheetOrder = [];
  const names = new Set();
  const sheets = {};
  for (const tab of data.sheets) {
    if (!validKey(tab?.id) || typeof tab.name !== 'string' || !tab.name.trim() ||
        Object.hasOwn(sheets, tab.id) || names.has(tab.name.toUpperCase()) || !isObject(tab.cells)) {
      throw new Error('舊活頁簿含有無效或重複的分頁。');
    }
    const cells = {};
    for (const [address, cell] of Object.entries(tab.cells)) {
      const spot = cellPosition(address);
      if (!spot) throw new Error('無效的儲存格座標 ' + address + '。');
      cells[spot.row] ??= {};
      cells[spot.row][spot.column] = migrateCell(cell);
    }
    names.add(tab.name.toUpperCase());
    sheetOrder.push(tab.id);
    sheets[tab.id] = emptySheet(tab.id, tab.name, cells);
  }
  return {
    snapshot: { id: createId(), name: title, sheetOrder, sheets },
    definitions: normalizeDefinitions(data.customFunctions)
  };
}

function checkSnapshot(snapshot) {
  if (!isObject(snapshot) || !validKey(snapshot.id) || typeof snapshot.name !== 'string' ||
      !Array.isArray(snapshot.sheetOrder) || !snapshot.sheetOrder.length || !isObject(snapshot.sheets)) {
    throw new Error('活頁簿缺少有效的工作簿或分頁資料。');
  }
  const unique = new Set();
  for (const id of snapshot.sheetOrder) {
    const tab = validKey(id) && Object.hasOwn(snapshot.sheets, id) ? snapshot.sheets[id] : null;
    if (!tab || unique.has(id) || tab.id !== id || typeof tab.name !== 'string' ||
        !Number.isSafeInteger(tab.rowCount) || tab.rowCount < 1 ||
        !Number.isSafeInteger(tab.columnCount) || tab.columnCount < 1 || !isObject(tab.cellData)) {
      throw new Error('活頁簿包含無效的分頁。');
    }
    unique.add(id);
  }
  return snapshot;
}

export function decodeWorkbook(contents, filename) {
  let data;
  try { data = JSON.parse(contents); }
  catch { throw new Error('這個檔案不是可讀的活頁簿 JSON。'); }
  const title = filename.replace(/(?:\.htmlsheet)?\.json$/i,'').trim() || '未命名活頁簿';
  if (data?.formatVersion === 1) return { ...migrateLegacy(data, title), migrated: true };
  if (data?.formatVersion !== 2) throw new Error('這個活頁簿版本無法開啟。');
  return { snapshot: checkSnapshot(data.workbook), definitions: normalizeDefinitions(data.customFunctions) };
}

export function encodeWorkbook(snapshot, definitions) {
  return JSON.stringify({ formatVersion: 2, workbook: snapshot, customFunctions: [...definitions.values()] }) + '\n';
}

export function download(content, file, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = file;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function workbookFilename(title) {
  const clean = title.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').replace(/[. ]+$/,'');
  return (clean.slice(0, 100) || '未命名活頁簿') + '.htmlsheet.json';
}

export function example() {
  const rowsToCells = (rows) => Object.fromEntries(rows.map((row, r) => [r,
    Object.fromEntries(row.flatMap((value, c) => value === null ? [] : [[c,
      typeof value === 'number' ? { v: value, t: CellValueType.NUMBER } :
        value.startsWith('=') ? { f: value } : { v: value, t: CellValueType.FORCE_STRING }
    ]]))
  ]));
  const pages = [
    ['summary', '統計', [
      ['數字 1', '數字 2／結果', '加法結果', '代碼', '品項', '金額'],
      [1, 2, '=A2+B2', "=SORT('明細'!A2:C5,3,-1)"],
      ['SUM', '=SUM(A2:B2)'],
      ['XLOOKUP', "=XLOOKUP(\"V03\",'明細'!A2:A5,'明細'!C2:C5,\"查無品項\")"],
      ['HLOOKUP', "=HLOOKUP(\"分院\",'費率'!A1:C2,2,FALSE)"],
      ['NET（85 折）', '=NET(B4,0.15)']
    ]],
    ['details', '明細', [
      ['代碼', '品項', '金額'], ['V01', '掛號', 120], ['V02', '檢驗', 900],
      ['V03', '疫苗', 650], ['V04', '診察', 350]
    ]],
    ['rates', '費率', [['院區', '本院', '分院'], ['倍率', 1, 1.25]]]
  ];
  return {
    snapshot: {
      id: createId(),
      name: '門診統計範例',
      sheetOrder: pages.map(([id]) => id),
      sheets: Object.fromEntries(pages.map(([id, name, rows]) => [id, emptySheet(id, name, rowsToCells(rows))]))
    },
    definitions: normalizeDefinitions([{ name: 'NET', params: ['price', 'rate'], expression: 'ROUND(price*(1-rate),0)' }])
  };
}
