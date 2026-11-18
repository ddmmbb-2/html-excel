import { ALL_IMPLEMENTED_FUNCTIONS_SET } from '@univerjs/engine-formula';

const symbolName = /^[A-Z_][A-Z0-9_.]{0,39}$/i;
const cellAddress = /^(?:[A-Z]{1,3}[1-9]\d*|R\d+C\d+|R|C)$/i;
const validName = (name) => symbolName.test(name) && !cellAddress.test(name) &&
  name !== 'TRUE' && name !== 'FALSE';

export function normalizeDefinition(raw) {
  if (!raw || typeof raw.name !== 'string' || !Array.isArray(raw.params) ||
      raw.params.some((param) => typeof param !== 'string') || typeof raw.expression !== 'string') {
    throw new Error('自訂函式格式有誤。');
  }
  const name = raw.name.trim().toUpperCase();
  const params = raw.params.map((parameter) => parameter.trim().toLowerCase());
  const expression = raw.expression.trim().replace(/^=/, '').trim();
  if (!validName(name) || ALL_IMPLEMENTED_FUNCTIONS_SET.has(name)) {
    throw new Error('請使用有效且未由 Univer 使用的函式名稱。');
  }
  if (params.length > 32 || params.some((param) => !validName(param.toUpperCase())) ||
      new Set(params).size !== params.length) throw new Error('參數須為互異的英文名稱。');
  if (!expression || expression.length > 12000) throw new Error('請填寫有效的計算式。');
  return { name, params, expression };
}

export function normalizeDefinitions(list) {
  if (!Array.isArray(list)) throw new Error('活頁簿的自訂函式格式有誤。');
  const entries = new Map();
  for (const item of list) {
    const definition = normalizeDefinition(item);
    if (entries.has(definition.name)) throw new Error('重複的自訂函式 ' + definition.name + '。');
    entries.set(definition.name, definition);
  }
  return entries;
}

export function lambda(definition) {
  return '=LAMBDA(' + [...definition.params, definition.expression].join(',') + ')';
}

export function applyDefinition(workbook, definition) {
  const reference = lambda(definition);
  const current = workbook.getDefinedName(definition.name);
  if (!current) workbook.insertDefinedName(definition.name, reference);
  else if (current.getFormulaOrRefString() !== reference) current.setRef(reference);
}
