const excelInput = document.getElementById('excelFile');
const statusEl = document.getElementById('status');
const filtersSection = document.getElementById('filters');
const summarySection = document.getElementById('summary');
const tableSection = document.getElementById('tableSection');

const searchText = document.getElementById('searchText');
const clientFilter = document.getElementById('clientFilter');
const containerFilter = document.getElementById('containerFilter');
const lotFilter = document.getElementById('lotFilter');

const tableBody = document.getElementById('tableBody');
const rowsCount = document.getElementById('rowsCount');
const palletsTotal = document.getElementById('palletsTotal');
const boxesTotal = document.getElementById('boxesTotal');
const kilosTotal = document.getElementById('kilosTotal');

let allRows = [];

excelInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      blankrows: false,
      defval: ''
    });

    allRows = parseRows(rows);
    if (!allRows.length) {
      throw new Error('No se encontraron filas de detalle en el archivo.');
    }

    statusEl.textContent = `Archivo cargado: ${file.name}. Registros detectados: ${allRows.length}.`;
    filtersSection.hidden = false;
    summarySection.hidden = false;
    tableSection.hidden = false;
    render();
  } catch (error) {
    statusEl.textContent = `Error al procesar el archivo: ${error.message}`;
    filtersSection.hidden = true;
    summarySection.hidden = true;
    tableSection.hidden = true;
    allRows = [];
  }
});

[searchText, clientFilter, containerFilter, lotFilter].forEach((input) => {
  input.addEventListener('input', render);
});

function parseRows(grid) {
  const result = [];
  let currentClientCode = '';
  let currentClientName = '';

  for (const row of grid) {
    const colA = clean(row[0]);
    const colB = clean(row[1]);
    const colC = clean(row[2]);

    if (colA.toLowerCase().startsWith('cliente:')) {
      currentClientCode = colB;
      currentClientName = colC;
      continue;
    }

    if (!colA && colB.toLowerCase().includes('totales')) {
      continue;
    }

    const isDataRow =
      isDateLike(colA) &&
      isDateLike(colB) &&
      colC &&
      !colC.toLowerCase().includes('contenedor');

    if (!isDataRow) {
      continue;
    }

    result.push({
      clientCode: currentClientCode,
      clientName: currentClientName,
      fecCom: colA,
      fecEnt: colB,
      container: colC,
      pallets: toNumber(row[4]),
      boxes: toNumber(row[5]),
      kilos: toNumber(row[6]),
      content: clean(row[7]),
      lot: clean(row[8]),
      dua: clean(row[9]),
      expiration: clean(row[10]),
      le: clean(row[11])
    });
  }

  return result;
}

function render() {
  const filtered = applyFilters(allRows);
  tableBody.innerHTML = filtered
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.clientName)}</td>
        <td>${escapeHtml(row.clientCode)}</td>
        <td>${escapeHtml(row.fecCom)}</td>
        <td>${escapeHtml(row.fecEnt)}</td>
        <td>${escapeHtml(row.container)}</td>
        <td>${formatNumber(row.pallets)}</td>
        <td>${formatNumber(row.boxes)}</td>
        <td>${formatNumber(row.kilos)}</td>
        <td>${escapeHtml(row.content)}</td>
        <td>${escapeHtml(row.lot)}</td>
        <td>${escapeHtml(row.dua)}</td>
        <td>${escapeHtml(row.expiration)}</td>
        <td>${escapeHtml(row.le)}</td>
      </tr>`
    )
    .join('');

  rowsCount.textContent = String(filtered.length);
  palletsTotal.textContent = formatNumber(filtered.reduce((sum, r) => sum + r.pallets, 0));
  boxesTotal.textContent = formatNumber(filtered.reduce((sum, r) => sum + r.boxes, 0));
  kilosTotal.textContent = formatNumber(filtered.reduce((sum, r) => sum + r.kilos, 0));
}

function applyFilters(rows) {
  const text = clean(searchText.value).toLowerCase();
  const client = clean(clientFilter.value).toLowerCase();
  const container = clean(containerFilter.value).toLowerCase();
  const lot = clean(lotFilter.value).toLowerCase();

  return rows.filter((row) => {
    const packed = [
      row.clientName,
      row.clientCode,
      row.content,
      row.container,
      row.dua,
      row.lot,
      row.fecCom,
      row.fecEnt,
      row.expiration
    ]
      .join(' ')
      .toLowerCase();

    return (
      (!text || packed.includes(text)) &&
      (!client || `${row.clientCode} ${row.clientName}`.toLowerCase().includes(client)) &&
      (!container || row.container.toLowerCase().includes(container)) &&
      (!lot || row.lot.toLowerCase().includes(lot))
    );
  });
}

function isDateLike(value) {
  return /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(clean(value));
}

function clean(value) {
  return (value ?? '').toString().trim();
}

function toNumber(value) {
  const normalized = clean(value)
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  return value.toLocaleString('es-UY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
