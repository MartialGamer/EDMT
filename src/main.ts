import "./style.css";

type Site = {
  id: string;
  system: string;
  body: string;
  bodyType: string;
  material: string;
  latitude: number;
  longitude: number;
  rigs: number | null;
  depleted: boolean;
  notes: string;
};

const bodyTypes = [
  "High Metal Content World",
  "Metal Rich Body",
  "Rocky Body",
  "Rocky Ice World",
  "Icy Body",
];
const materialCompatibility: Record<string, string[]> = {
  Helium: [
    "High Metal Content World",
    "Metal Rich Body",
    "Rocky Body",
    "Rocky Ice World",
  ],
  "Helium-3": ["Icy Body"],
  Tritium: ["Icy Body"],
  Water: ["Rocky Ice World", "Icy Body"],
  Iridium: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Platinum: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Palladium: [
    "High Metal Content World",
    "Metal Rich Body",
    "Rocky Body",
    "Rocky Ice World",
  ],
  Gold: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Osmium: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Silver: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Samarium: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Tantalum: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Thorium: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Uranium: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Titanium: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Lithium: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Copper: [
    "High Metal Content World",
    "Metal Rich Body",
    "Rocky Body",
    "Rocky Ice World",
  ],
  Thortveitite: ["Rocky Body"],
  "Periclase Dunite": ["Rocky Body"],
  Monazite: ["Rocky Body"],
  Rhodplumsite: ["High Metal Content World", "Rocky Body"],
  Diamond: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Alexandrite: ["Rocky Body"],
  Sapphire: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Ruby: ["High Metal Content World", "Metal Rich Body", "Rocky Body"],
  Grandidierite: ["Rocky Body"],
  Serendibite: ["Rocky Body"],
  Bastnasite: ["Rocky Body"],
  "Low Temp Diamonds": ["Rocky Body", "Rocky Ice World", "Icy Body"],
  "Quartz Pyroxenite": ["Rocky Body"],
  Deuterium: ["Rocky Body", "Rocky Ice World", "Icy Body"],
  Magnesite: ["Rocky Body"],
  Olivine: ["Rocky Body", "Rocky Ice World"],
  Jadeite: ["Rocky Body"],
  Uraninite: ["Rocky Body"],
  Haematite: [
    "High Metal Content World",
    "Metal Rich Body",
    "Rocky Body",
    "Rocky Ice World",
  ],
  "Methanol Crystals": ["Rocky Ice World", "Icy Body"],
};
const materials = Object.keys(materialCompatibility);
const storageKey = "edmt-sites-v1";
const lastBackupKey = "edmt-last-backup-v1";
let sites: Site[] = loadSites();
let editingId: string | null = null;

function loadSites(): Site[] {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : (parsed.sites ?? []);
  } catch {
    return [];
  }
}
function persist() {
  localStorage.setItem(storageKey, JSON.stringify(sites));
}
function exportDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${month}-${day}-${year}`;
}
function lastBackupLabel() {
  const savedAt = localStorage.getItem(lastBackupKey);
  if (!savedAt) return "NEVER";
  const elapsedDays = Math.floor((Date.now() - Number(savedAt)) / 86400000);
  if (elapsedDays <= 0) return "TODAY";
  return `${elapsedDays} DAY${elapsedDays === 1 ? "" : "S"} AGO`;
}
function markBackup() {
  localStorage.setItem(lastBackupKey, String(Date.now()));
}
function escapeHtml(value: string | number) {
  return String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ] ?? character,
  );
}
function uniqueValues(key: "system" | "bodyType" | "material") {
  return [...new Set(sites.map((site) => site[key]))].sort((a, b) =>
    a.localeCompare(b),
  );
}
function optionList(values: string[], selected = "") {
  return values
    .map(
      (value) =>
        `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`,
    )
    .join("");
}
function materialsForBodyType(bodyType: string) {
  return materials.filter((material) =>
    materialCompatibility[material]?.includes(bodyType),
  );
}
function siteJson(site: Site) {
  return JSON.stringify({ version: 1, sites: [site] }, null, 2);
}
async function downloadJson(name: string, records: Site[]) {
  const date = exportDate();
  const datedName = `${name.replace(/\.json$/i, "")}-${date}.json`;
  const blob = new Blob(
    [JSON.stringify({ version: 1, exportDate: date, sites: records }, null, 2)],
    { type: "application/json" },
  );
  const savePicker = (
    window as Window & {
      showSaveFilePicker?: (options: unknown) => Promise<{
        createWritable: () => Promise<{
          write: (data: Blob) => Promise<void>;
          close: () => Promise<void>;
        }>;
      }>;
    }
  ).showSaveFilePicker;
  if (savePicker) {
    try {
      const handle = await savePicker({
        suggestedName: datedName,
        types: [
          {
            description: "JSON files",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      markBackup();
      render();
    } catch (error) {
      if ((error as DOMException).name !== "AbortError")
        showToast("Could not save the JSON backup");
    }
    return;
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = datedName;
  link.click();
  URL.revokeObjectURL(link.href);
  markBackup();
  render();
}
function showToast(message: string) {
  const toast = document.querySelector<HTMLDivElement>("#toast")!;
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2400);
}

function render() {
  const systemFilter =
    document.querySelector<HTMLSelectElement>("#system-filter")?.value ?? "";
  const bodyTypeFilter =
    document.querySelector<HTMLSelectElement>("#body-filter")?.value ?? "";
  const materialFilter =
    document.querySelector<HTMLSelectElement>("#material-filter")?.value ?? "";
  const query =
    document.querySelector<HTMLInputElement>("#search")?.value.toLowerCase() ??
    "";
  const compatibleFilterMaterials = bodyTypeFilter
    ? materialsForBodyType(bodyTypeFilter)
    : materials;
  const effectiveMaterialFilter = compatibleFilterMaterials.includes(
    materialFilter,
  )
    ? materialFilter
    : "";
  const filtered = sites.filter(
    (site) =>
      (!systemFilter || site.system === systemFilter) &&
      (!bodyTypeFilter || site.bodyType === bodyTypeFilter) &&
      (!effectiveMaterialFilter || site.material === effectiveMaterialFilter) &&
      (!query ||
        `${site.system} ${site.body} ${site.material}`
          .toLowerCase()
          .includes(query)),
  );
  const systems = new Set(sites.map((site) => site.system)).size;
  const active = sites.filter((site) => !site.depleted).length;
  const materialsFound = new Set(sites.map((site) => site.material)).size;
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <header class="topbar"><div class="brand"><span class="brand-mark" aria-hidden="true"><i></i></span><div><strong>EDMT</strong><span>ELITE DANGEROUS MINING TRACKER</span></div></div><div class="top-actions"><button class="button button-quiet" id="import-button">Import JSON</button><input id="import-file" type="file" accept="application/json" hidden><button class="button button-accent" id="export-all">Export all</button><button class="button button-danger" id="clear-all">Clear all</button></div></header>
    <main><section class="intro"><div><p class="eyebrow">SURFACE MINING / FIELD LOG</p><h1>Your mining sites, <em>charted.</em></h1><p class="lede">Keep a reliable record of every surface deposit worth returning to.</p></div><button class="button button-primary" id="add-site"><span>+</span> Log a site</button></section>
    <section class="stats"><div><span>KNOWN SYSTEMS</span><strong>${systems}</strong></div><div><span>ACTIVE SITES</span><strong>${active}</strong></div><div><span>MATERIALS FOUND</span><strong>${materialsFound}</strong></div><div class="stats-note"><span>DATA STORAGE</span><strong><i></i> LOCAL ONLY</strong><small>LAST BACKUP: ${lastBackupLabel()}</small></div></section>
    <section class="toolbar"><div class="search-wrap"><span>⌕</span><input id="search" placeholder="Search systems, bodies, materials" value="${escapeHtml(query)}"></div><select id="system-filter"><option value="">All systems</option>${optionList(uniqueValues("system"), systemFilter)}</select><select id="body-filter"><option value="">All body types</option>${optionList(bodyTypes, bodyTypeFilter)}</select><select id="material-filter"><option value="">All materials</option>${optionList(bodyTypeFilter ? compatibleFilterMaterials : uniqueValues("material"), effectiveMaterialFilter)}</select><button class="button button-outline" id="clear-filters">Clear filters</button></section>
    <section class="table-shell"><div class="table-head"><div><p class="eyebrow">SITE REGISTER</p><h2>${filtered.length} <span>sites recorded</span></h2></div><span class="table-meta">${filtered.filter((site) => site.depleted).length} depleted</span></div><div class="site-list">${filtered.length ? filtered.map(renderSite).join("") : '<div class="empty">No sites match the current filters.</div>'}</div></section></main>
    <dialog id="site-dialog"><form method="dialog" id="site-form"><div class="dialog-head"><div><p class="eyebrow">FIELD ENTRY</p><h2 id="dialog-title">Log a mining site</h2></div><button class="icon-button" value="cancel" formnovalidate aria-label="Close">×</button></div><div class="form-grid"><label>System<input name="system" required placeholder="e.g. HR 5458"></label><label>Body<input name="body" required placeholder="e.g. 1 A"></label><label>Body type<select name="bodyType" required>${optionList(bodyTypes)}</select></label><label>Material<select name="material" required>${optionList(materialsForBodyType(bodyTypes[0]))}</select></label><label>Latitude<input name="latitude" type="number" step="any" required placeholder="-49.4563"></label><label>Longitude<input name="longitude" type="number" step="any" required placeholder="-125.0399"></label><label>Rig Potential<input name="rigs" type="number" min="0" placeholder="Unknown"></label><label class="check-label"><input name="depleted" type="checkbox"> Depleted site</label><label class="full">Notes<textarea name="notes" rows="3" placeholder="Survey details, landmarks, confidence..."></textarea></label></div><div class="dialog-actions"><button class="button button-quiet" value="cancel" formnovalidate>Cancel</button><button class="button button-primary" value="default">Save site</button></div></form></dialog><div id="toast" role="status"></div>`;
  bindEvents();
}

function renderSite(site: Site) {
  const sameBody = sites.filter(
    (item) => item.system === site.system && item.body === site.body,
  );
  const sameSystem = sites.filter((item) => item.system === site.system);
  return `<article class="site-row ${site.depleted ? "is-depleted" : ""}"><div class="site-main"><div class="material-dot material-${site.material.toLowerCase()}"></div><div><div class="site-title"><strong>${escapeHtml(site.material)}</strong><button class="status status-toggle ${site.depleted ? "depleted" : ""}" data-action="toggle-depleted" data-id="${site.id}" aria-label="Mark ${escapeHtml(site.material)} site as ${site.depleted ? "active" : "depleted"}" title="Mark site as ${site.depleted ? "active" : "depleted"}">${site.depleted ? "DEPLETED" : "ACTIVE"}</button></div><p>${escapeHtml(site.system)} <b>/</b> Body ${escapeHtml(site.body)} <span class="type">${escapeHtml(site.bodyType)}</span></p></div></div><div class="coordinates"><div><span>${site.latitude.toFixed(4)}°, ${site.longitude.toFixed(4)}°</span><button class="copy-coordinate" data-action="copy-coordinates" data-id="${site.id}" aria-label="Copy coordinates" title="Copy coordinates">⧉</button></div><small>LAT, LONG</small></div><div class="rigs"><strong>${site.rigs ?? "—"}</strong><small>RIG POTENTIAL</small></div><div class="row-actions"><button data-action="copy-site" data-id="${site.id}" title="Copy this site JSON">Site</button><button data-action="export-body" data-system="${escapeHtml(site.system)}" data-body="${escapeHtml(site.body)}" title="Export this body JSON">Body</button><button data-action="export-system" data-system="${escapeHtml(site.system)}" title="Export this system JSON">System</button><button data-action="edit" data-id="${site.id}" aria-label="Edit site">✎</button><button data-action="delete" data-id="${site.id}" aria-label="Delete site">×</button></div>${site.notes ? `<p class="notes">${escapeHtml(site.notes)}</p>` : ""}<span class="row-count">${sameBody.length} site${sameBody.length === 1 ? "" : "s"} on body · ${sameSystem.length} in system</span></article>`;
}

function bindEvents() {
  document
    .querySelectorAll<HTMLSelectElement>(
      "#system-filter, #body-filter, #material-filter",
    )
    .forEach((element) => element.addEventListener("change", render));
  document
    .querySelector<HTMLInputElement>("#search")
    ?.addEventListener("input", render);
  document.querySelector("#clear-filters")?.addEventListener("click", () => {
    document.querySelector<HTMLInputElement>("#search")!.value = "";
    document.querySelector<HTMLSelectElement>("#system-filter")!.value = "";
    document.querySelector<HTMLSelectElement>("#body-filter")!.value = "";
    document.querySelector<HTMLSelectElement>("#material-filter")!.value = "";
    render();
  });
  document
    .querySelector("#add-site")
    ?.addEventListener("click", () => openDialog());
  document
    .querySelector("#export-all")
    ?.addEventListener("click", () => downloadJson("edmt-sites.json", sites));
  document.querySelector("#clear-all")?.addEventListener("click", () => {
    if (!sites.length) return;
    if (!confirm("Clear all recorded mining sites? This cannot be undone."))
      return;
    sites = [];
    persist();
    render();
  });
  document
    .querySelector("#import-button")
    ?.addEventListener("click", () =>
      document.querySelector<HTMLInputElement>("#import-file")?.click(),
    );
  document
    .querySelector<HTMLInputElement>("#import-file")
    ?.addEventListener("change", handleImport);
  document
    .querySelectorAll<HTMLButtonElement>("[data-action]")
    .forEach((button) =>
      button.addEventListener("click", () => handleAction(button)),
    );
  document
    .querySelector<HTMLSelectElement>('#site-form select[name="bodyType"]')
    ?.addEventListener("change", (event) =>
      updateEntryMaterials((event.target as HTMLSelectElement).value),
    );
  document
    .querySelector<HTMLDialogElement>("#site-dialog")
    ?.addEventListener("close", () => {
      editingId = null;
    });
}
function updateEntryMaterials(bodyType: string, selectedMaterial?: string) {
  const materialField = document.querySelector<HTMLSelectElement>(
    '#site-form select[name="material"]',
  );
  if (!materialField) return;
  const availableMaterials = materialsForBodyType(bodyType);
  materialField.innerHTML = optionList(
    availableMaterials,
    selectedMaterial && availableMaterials.includes(selectedMaterial)
      ? selectedMaterial
      : "",
  );
}
function openDialog(site?: Site) {
  editingId = site?.id ?? null;
  const dialog = document.querySelector<HTMLDialogElement>("#site-dialog")!;
  const form = document.querySelector<HTMLFormElement>("#site-form")!;
  form.reset();
  document.querySelector("#dialog-title")!.textContent = site
    ? "Edit mining site"
    : "Log a mining site";
  if (site)
    Object.entries(site).forEach(([key, value]) => {
      const field = form.elements.namedItem(key) as
        | HTMLInputElement
        | HTMLSelectElement
        | null;
      if (field)
        field.type === "checkbox"
          ? (field.checked = Boolean(value))
          : (field.value = String(value ?? ""));
    });
  updateEntryMaterials(
    String((form.elements.namedItem("bodyType") as HTMLSelectElement).value),
    site?.material,
  );
  dialog.showModal();
  form.onsubmit = (event) => {
    event.preventDefault();
    const submitter = (event as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    if (submitter?.value === "cancel") {
      dialog.close();
      return;
    }
    if (!form.reportValidity()) return;
    saveSite(new FormData(form));
    dialog.close();
    render();
  };
}
function saveSite(data: FormData) {
  const site: Site = {
    id: editingId ?? crypto.randomUUID(),
    system: String(data.get("system")),
    body: String(data.get("body")),
    bodyType: String(data.get("bodyType")),
    material: String(data.get("material")),
    latitude: Number(data.get("latitude")),
    longitude: Number(data.get("longitude")),
    rigs: data.get("rigs") ? Number(data.get("rigs")) : null,
    depleted: data.get("depleted") === "on",
    notes: String(data.get("notes") ?? ""),
  };
  sites = editingId
    ? sites.map((item) => (item.id === editingId ? site : item))
    : [site, ...sites];
  persist();
}
async function handleAction(button: HTMLButtonElement) {
  const action = button.dataset.action;
  if (action === "edit")
    openDialog(sites.find((site) => site.id === button.dataset.id));
  if (action === "toggle-depleted" && button.dataset.id) {
    sites = sites.map((site) =>
      site.id === button.dataset.id
        ? { ...site, depleted: !site.depleted }
        : site,
    );
    persist();
    render();
  }
  if (action === "copy-coordinates" && button.dataset.id) {
    const site = sites.find((item) => item.id === button.dataset.id);
    if (site) {
      await navigator.clipboard.writeText(`${site.latitude},${site.longitude}`);
      showToast("Coordinates copied to clipboard");
    }
  }
  if (
    action === "delete" &&
    button.dataset.id &&
    confirm("Delete this mining site?")
  ) {
    sites = sites.filter((site) => site.id !== button.dataset.id);
    persist();
    render();
  }
  if (action === "copy-site") {
    await navigator.clipboard.writeText(
      siteJson(sites.find((site) => site.id === button.dataset.id)!),
    );
    showToast("Site JSON copied to clipboard");
  }
  if (action === "export-body")
    downloadJson(
      `${button.dataset.system}-${button.dataset.body}-sites.json`,
      sites.filter(
        (site) =>
          site.system === button.dataset.system &&
          site.body === button.dataset.body,
      ),
    );
  if (action === "export-system")
    downloadJson(
      `${button.dataset.system}-sites.json`,
      sites.filter((site) => site.system === button.dataset.system),
    );
}
function handleImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const imported = Array.isArray(parsed) ? parsed : parsed.sites;
      if (!Array.isArray(imported)) throw new Error();
      sites = [...imported, ...sites];
      persist();
      render();
      showToast(
        `${imported.length} site${imported.length === 1 ? "" : "s"} imported`,
      );
    } catch {
      showToast("Could not read that JSON file");
    }
  };
  reader.readAsText(file);
}
render();
