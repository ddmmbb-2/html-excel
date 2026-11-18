import { CellValueType, CommandType } from '@univerjs/core';
import { greenTheme } from '@univerjs/themes';
import { createUniver, LocaleType } from '@univerjs/presets';
import { CalculationMode, UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import zhTW from '@univerjs/preset-sheets-core/locales/zh-TW';
import '@univerjs/preset-sheets-core/lib/index.css';
import './style.css';
import { applyDefinition, normalizeDefinition, normalizeDefinitions } from './functions.js';
import { createId, decodeWorkbook, download, encodeWorkbook, example, newWorkbook, workbookFilename } from './workbook.js';

const shared = new Map();
const app = {
  Formula: {
    registerDefinitions(definitions) {
      for (const [name, definition] of normalizeDefinitions(definitions)) shared.set(name, definition);
    }
  }
};
globalThis.HtmlExcel = app;

function initialize() {
  const element = (id) => document.getElementById(id);
  const listen = (id, event, action) => element(id).addEventListener(event, action);
  const nameInput = element('title');
  const dialog = element('function-dialog');
  const definitionsList = element('function-list');
  const { univerAPI } = createUniver({
    locale: LocaleType.ZH_TW,
    locales: { [LocaleType.ZH_TW]: zhTW },
    theme: greenTheme,
    presets: [UniverSheetsCorePreset({
      container: 'univer-workspace', header: true, toolbar: true,
      ribbonType: 'simple', formulaBar: true, sheets: { enableFillHandle: true },
      formula: { initialFormulaComputing: CalculationMode.FORCED }
    })]
  });
  app.univerAPI = univerAPI;

  let workbook;
  let definitions = new Map();
  let dirty = false;
  let opening = false;
  let displayedDefinition;

  function message(text, error = false, id = 'status') {
    const node = element(id);
    node.textContent = text;
    node.classList.toggle('error', error);
  }

  function setDirty(value) {
    dirty = value;
    element('dirty').hidden = !value;
  }

  function mount({snapshot, definitions: saved}) {
    const loaded = univerAPI.createWorkbook(snapshot);
    const activeDefinitions = new Map([...shared, ...saved]);
    try {
      for (const definition of activeDefinitions.values()) applyDefinition(loaded, definition);
    } catch (error) {
      univerAPI.disposeUnit(loaded.getId());
      throw error;
    }
    workbook = loaded;
    definitions = activeDefinitions;
    nameInput.value = workbook.getName();
  }

  function unload() {
    if (workbook) univerAPI.disposeUnit(workbook.getId());
    workbook = undefined;
  }

  function replace(next) {
    const backup = workbook && { snapshot: workbook.save(), definitions };
    const unsavedName = nameInput.value;
    const hadChanges = dirty;
    unload();
    try {
      mount(next);
      setDirty(false);
    } catch (error) {
      if (backup) {
        mount(backup);
        nameInput.value = unsavedName;
        setDirty(hadChanges);
      }
      throw error;
    }
  }

  const confirmOpen = () => !dirty || confirm('這份活頁簿有尚未儲存的變更，確定要開啟其他活頁簿？');
  const closeMenu = () => { element('more').open = false; };

  function save() {
    if (!workbook) return;
    const title = nameInput.value.trim() || '未命名活頁簿';
    if (workbook.getName() !== title) workbook.setName(title);
    nameInput.value = title;
    download(encodeWorkbook(workbook.save(), definitions), workbookFilename(title), 'application/json');
    setDirty(false);
    message('已開始下載「' + title + '」');
  }

  listen('title-form', 'submit', (event) => { event.preventDefault(); nameInput.blur(); });
  listen('title', 'input', () => setDirty(true));
  listen('save-book', 'click', save);
  listen('new-book', 'click', () => {
    if (!confirmOpen()) return;
    try { replace(newWorkbook()); message('已新增活頁簿'); }
    catch (error) { message(error.message, true); }
  });
  listen('example', 'click', () => {
    closeMenu();
    if (!confirmOpen()) return;
    try { replace(example()); message('已開啟範例活頁簿'); }
    catch (error) { message(error.message, true); }
  });
  listen('open-book', 'click', () => element('book-file').click());
  listen('book-file', 'change', async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file || opening) return;
    opening = true;
    try {
      if (file.size > 32 * 1024 * 1024) throw new Error('活頁簿檔案超過 32 MB。');
      const next = decodeWorkbook(await file.text(), file.name);
      if (!confirmOpen()) return;
      replace(next);
      if (next.migrated) message('已開啟舊版活頁簿。下次儲存時會轉為新版 JSON。');
      else message('已開啟「' + workbook.getName() + '」');
    } catch (error) {
      message(error.message, true);
    } finally {
      opening = false;
    }
  });

  function showDefinition(definition) {
    displayedDefinition = definition?.name;
    element('function-name').value = definition?.name ?? '';
    element('function-params').value = definition?.params.join(', ') ?? '';
    element('function-expression').value = definition?.expression ?? '';
    element('function-test').value = '';
    element('remove-function').hidden = !definition;
    message('', false, 'function-message');
  }

  function renderDefinitions() {
    definitionsList.replaceChildren();
    if (!definitions.size) {
      const empty = document.createElement('p');
      empty.textContent = '這份活頁簿還沒有自訂函式。';
      definitionsList.append(empty);
      return;
    }
    const sorted = [...definitions.values()].sort((a, b) => a.name.localeCompare(b.name));
    for (const definition of sorted) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'app-button function-entry';
      item.textContent = definition.name + '(' + definition.params.join(', ') + ')';
      item.title = item.textContent;
      item.addEventListener('click', () => showDefinition(definition));
      definitionsList.append(item);
    }
  }

  function readDefinition() {
    const params = element('function-params').value.trim();
    return normalizeDefinition({
      name: element('function-name').value,
      params: params ? params.split(',') : [],
      expression: element('function-expression').value
    });
  }

  async function testDefinition(definition, argumentsText) {
    const id = createId();
    const sheetId = 'sheet-1';
    const test = univerAPI.createWorkbook({
      id, name: '函式試算', sheetOrder: [sheetId],
      sheets: { [sheetId]: { id: sheetId, name: '試算', rowCount: 12, columnCount: 12, cellData: {} } }
    }, { makeCurrent: false });
    try {
      const effective = new Map(definitions).set(definition.name, definition);
      for (const item of effective.values()) applyDefinition(test, item);
      const cell = test.getSheetBySheetId(sheetId).getRange('A1');
      const formula = univerAPI.getFormula();
      return await new Promise((resolve, reject) => {
        const subscription = formula.calculationResultApplied((result) => {
          const data = result.unitData?.[id]?.[sheetId]?.[0]?.[0];
          if (!data) return;
          clearTimeout(timeout);
          subscription.dispose();
          const value = cell.getValue();
          resolve(data.t === CellValueType.BOOLEAN ? (value ? 'TRUE' : 'FALSE') : value);
        });
        const timeout = setTimeout(() => {
          subscription.dispose();
          reject(new Error('這個算式沒有產生結果，請確認算式和測試參數。'));
        }, 6000);
        try { cell.setFormula('=' + definition.name + '(' + argumentsText + ')'); }
        catch (error) {
          clearTimeout(timeout);
          subscription.dispose();
          reject(error);
        }
      });
    } finally {
      univerAPI.disposeUnit(id);
    }
  }

  listen('functions', 'click', () => {
    renderDefinitions();
    showDefinition();
    dialog.showModal();
  });
  listen('close-functions', 'click', () => dialog.close());
  listen('reset-function', 'click', () => {
    showDefinition();
    element('function-name').focus();
  });
  listen('test-function', 'click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    message('試算中…', false, 'function-message');
    try {
      const value = await testDefinition(readDefinition(), element('function-test').value);
      const error = typeof value === 'string' && /^#(?:N\/A|REF!|VALUE!|DIV\/0!|NUM!|NAME\?|NULL!|SPILL!|CALC!|CIRCULAR!|ERROR!)/.test(value);
      message((error ? '公式錯誤 ' : '試算結果 ') + (value === null || value === '' ? '（空白）' : String(value)), error, 'function-message');
    } catch (error) {
      message(error.message, true, 'function-message');
    } finally {
      button.disabled = false;
    }
  });
  listen('function-form', 'submit', (event) => {
    event.preventDefault();
    try {
      const definition = readDefinition();
      if (displayedDefinition !== definition.name && workbook.getDefinedName(definition.name) && !definitions.has(definition.name)) {
        throw new Error('這個名稱已由活頁簿的定義名稱使用。');
      }
      applyDefinition(workbook, definition);
      definitions.set(definition.name, definition);
      setDirty(true);
      renderDefinitions();
      showDefinition(definition);
      message('已儲存 ' + definition.name + '。', false, 'function-message');
    } catch (error) {
      message(error.message, true, 'function-message');
    }
  });
  listen('remove-function', 'click', () => {
    if (!displayedDefinition || !confirm('確定移除此活頁簿的 ' + displayedDefinition + '？')) return;
    try {
      workbook.deleteDefinedName(displayedDefinition);
      definitions.delete(displayedDefinition);
      setDirty(true);
      renderDefinitions();
      showDefinition();
    } catch (error) {
      message(error.message, true, 'function-message');
    }
  });
  listen('export-functions', 'click', () => {
    try {
      if (!definitions.size) throw new Error('請先將一個自訂函式儲存至活頁簿。');
      const source = 'window.HtmlExcel.Formula.registerDefinitions(' + JSON.stringify([...definitions.values()], null, 2) + ');\n';
      download(source, 'custom-functions.js', 'text/javascript;charset=utf-8');
      message('已開始下載共用函式檔。', false, 'function-message');
    } catch (error) {
      message(error.message, true, 'function-message');
    }
  });

  univerAPI.addEvent(univerAPI.Event.CommandExecuted, ({ id, type, params, options }) => {
    if (!workbook || params?.unitId !== workbook.getId() || type !== CommandType.MUTATION ||
        options?.fromFormula || id.startsWith('formula.')) return;
    setDirty(true);
  });

  document.addEventListener('click', (event) => {
    if (element('more').open && !event.target.closest('#more')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;
    event.preventDefault();
    if (!dialog.open) save();
  });
  window.addEventListener('beforeunload', (event) => {
    if (dirty) event.preventDefault();
  });

  mount(newWorkbook());
  setDirty(false);
  element('startup-status').hidden = true;
  message('就緒');
}

document.addEventListener('DOMContentLoaded', () => {
  try { initialize(); }
  catch (error) {
    const status = document.getElementById('startup-status');
    status.textContent = '無法啟動試算表：' + error.message;
    document.getElementById('status').textContent = '啟動失敗';
    console.error(error);
  }
});
