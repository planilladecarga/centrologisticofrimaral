const excelInput = document.getElementById('excelFile');
const statusEl = document.getElementById('status');
const filtersSection = document.getElementById('filters');
const summarySection = document.getElementById('summary');
const tableSection = document.getElementById('tableSection');
const containerSection = document.getElementById('containerSection');

const searchText = document.getElementById('searchText');
const clientFilter = document.getElementById('clientFilter');
const containerFilter = document.getElementById('containerFilter');
const lotFilter = document.getElementById('lotFilter');

const tableBody = document.getElementById('tableBody');
const rowsCount = document.getElementById('rowsCount');
const palletsTotal = document.getElementById('palletsTotal');
const boxesTotal = document.getElementById('boxesTotal');
const kilosTotal = document.getElementById('kilosTotal');
const containerCards = document.getElementById('containerCards');

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
    containerSection.hidden = false;
    render();
  } catch (error) {
    statusEl.textContent = `Error al procesar el archivo: ${error.message}`;
    filtersSection.hidden = true;
    summarySection.hidden = true;
    tableSection.hidden = true;
    containerSection.hidden = true;
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
  let columnMap = null;

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

    const possibleHeader = buildColumnMap(row);
    if (possibleHeader) {
      columnMap = possibleHeader;
      continue;
    }

    if (!columnMap) {
      continue;
    }

    const fecCom = clean(getCell(row, columnMap, 'fecCom'));
    const fecEnt = clean(getCell(row, columnMap, 'fecEnt'));
    const container = normalizeContainer(clean(getCell(row, columnMap, 'container')));

    const isDataRow =
      isDateLike(fecCom) &&
      isDateLike(fecEnt) &&
      container &&
      !container.toLowerCase().includes('contenedor');

    if (!isDataRow) {
      continue;
    }

    result.push({
      clientCode: currentClientCode,
      clientName: currentClientName,
      fecCom,
      fecEnt,
      container,
      pallets: toNumber(getCell(row, columnMap, 'pallets')),
      boxes: toNumber(getCell(row, columnMap, 'boxes')),
      kilos: toNumber(getCell(row, columnMap, 'kilos')),
      content: clean(getCell(row, columnMap, 'content')),
      lot: clean(getCell(row, columnMap, 'lot')),
      dua: clean(getCell(row, columnMap, 'dua')),
      expiration: clean(getCell(row, columnMap, 'expiration')),
      le: clean(getCell(row, columnMap, 'le'))
    });
  }

  return result;
}

function buildColumnMap(row) {
  const aliases = {
    feccom: 'fecCom',
    fecent: 'fecEnt',
    contenedor: 'container',
    pallets: 'pallets',
    cajas: 'boxes',
    kilos: 'kilos',
    contenido: 'content',
    nrolote: 'lot',
    dua: 'dua',
    fvenc: 'expiration',
    le: 'le'
  };

  const mapped = {};
  row.forEach((cell, index) => {
    const token = normalizeHeader(cell);
    const key = aliases[token];
    if (key) {
      mapped[key] = index;
    }
  });

  if (mapped.fecCom !== undefined && mapped.fecEnt !== undefined && mapped.container !== undefined) {
    return {
      fecCom: mapped.fecCom,
      fecEnt: mapped.fecEnt,
      container: mapped.container,
      pallets: mapped.pallets ?? 4,
      boxes: mapped.boxes ?? 5,
      kilos: mapped.kilos ?? 6,
      content: mapped.content ?? 7,
      lot: mapped.lot ?? 8,
      dua: mapped.dua ?? 9,
      expiration: mapped.expiration ?? 10,
      le: mapped.le ?? 11
    };
  }

  return null;
}

function normalizeHeader(value) {
  return clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function getCell(row, map, field) {
  const index = map[field];
  if (index === undefined) return '';
  return row[index] ?? '';
}

function normalizeContainer(value) {
  const text = clean(value);
  if (!text) return '';

  const compact = text.replace(/\s+/g, '');
  if (/^[A-Z]{4}\d{6,7}-\d$/i.test(compact)) {
    return `${compact.slice(0, 4)} ${compact.slice(4)}`.toUpperCase();
  }

  return text;
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
  renderContainerCards(filtered);
}


function renderContainerCards(rows) {
  const grouped = new Map();

  for (const row of rows) {
    const key = row.container || 'SIN CONTENEDOR';
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(row);
  }

  const cardsHtml = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([container, items]) => {
      const palletSum = items.reduce((sum, r) => sum + r.pallets, 0);
      const boxSum = items.reduce((sum, r) => sum + r.boxes, 0);
      const kiloSum = items.reduce((sum, r) => sum + r.kilos, 0);

      const itemRows = items
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.fecCom)}</td>
              <td>${escapeHtml(item.fecEnt)}</td>
              <td>${escapeHtml(item.lot)}</td>
              <td>${escapeHtml(item.dua)}</td>
              <td>${escapeHtml(item.expiration)}</td>
              <td>${formatNumber(item.pallets)}</td>
              <td>${formatNumber(item.boxes)}</td>
              <td>${formatNumber(item.kilos)}</td>
              <td>${escapeHtml(item.content)}</td>
            </tr>`
        )
        .join('');

      return `
        <details class="container-card" open>
          <summary>
            <div><strong>${escapeHtml(container)}</strong><span>${escapeHtml(items[0].clientName)} (${escapeHtml(items[0].clientCode)})</span></div>
            <div><strong>${items.length}</strong><span>Ítems</span></div>
            <div><strong>${formatNumber(palletSum)}</strong><span>Pallets</span></div>
            <div><strong>${formatNumber(boxSum)}</strong><span>Cajas</span></div>
            <div><strong>${formatNumber(kiloSum)}</strong><span>Kilos</span></div>
          </summary>
          <div class="items">
            <table>
              <thead>
                <tr>
                  <th>Fec Com</th>
                  <th>Fec Ent</th>
                  <th>Lote</th>
                  <th>DUA</th>
                  <th>F. Venc.</th>
                  <th>Pallets</th>
                  <th>Cajas</th>
                  <th>Kilos</th>
                  <th>Contenido</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
          </div>
        </details>`;
    })
    .join('');

  containerCards.innerHTML = cardsHtml || '<p>No hay contenedores para mostrar con estos filtros.</p>';
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
