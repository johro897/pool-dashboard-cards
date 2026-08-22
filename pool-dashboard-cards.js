/**
 * pool-picture-card.js  v3
 * ─────────────────────────────────────────────────────────────────
 * Spara som: /config/www/pool-picture-card.js
 * Registrera: Settings → Dashboards → Resources → JavaScript Module
 *
 * Fixes i v3:
 *  - Positioner sparas stabilt via config-changed + localStorage fallback
 *  - Visuell editor med live-förhandsvisning och drag i HA:s korteditor
 *  - Drag fungerar på touch + mus
 */

const STORAGE_KEY = 'pool-picture-card-positions';

function escHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ═══════════════════════════════════════════════════════════════
   TRANSLATIONS — bundled inline (not fetched) since HACS's "plugin"
   category only distributes the single file named in hacs.json.
═══════════════════════════════════════════════════════════════ */
const DEFAULT_LANG = 'en';
const TRANSLATIONS = {
  en: {
    edit_hint: 'Drag the chips — positions are saved in the configuration',
    cancel: 'Cancel',
    save: 'Save',
    edit_positions: 'Edit positions',
    chip_clock: 'Clock',
    chip_airtemp: 'Air temp',
    chip_rpm: 'RPM',
    chip_flow: 'Flow',
    chip_water: 'Water temp',
    chip_hp: 'Heat pump',
    chip_energy: 'Energy',
    chip_aria: '{name} — move with arrow keys while editing is active',
    inlet: 'Inlet',
    outlet: 'Outlet',
    now: 'Now',
    today: 'Today',
    target: 'Target',
    mode_manual: 'Manual',
    mode_eco: 'Eco mode',
    mode_normal: 'Normal mode',
    mode_max: 'Max mode',
    mode_pump_off: 'Pump off',
    heating: 'Heating',
    standby: 'Standby',
    background_image: 'Background image',
    image_path: 'Image path (URL)',
    entities: 'Entities',
    ent_clock: 'Clock',
    ent_date: 'Date',
    ent_airtemp: 'Air temp',
    ent_water_in: 'Water temp in',
    ent_water_out: 'Water temp out',
    ent_rpm: 'Pump RPM',
    ent_pump_power: 'Pump on/off',
    ent_flow: 'Flow',
    ent_hp_power: 'Heat pump on/off',
    ent_hp_target: 'Heat pump target temp',
    ent_energy_today: 'Energy today',
    ent_watt: 'Power (W)',
    chip_positions: 'Chip positions',
    pos_hint: 'Press the ✏️ button directly on the card preview above to drag the chips into place, then save.',
    reset_positions: 'Reset default positions',
    sensors: 'Sensors',
    water_temp: 'Water temperature',
    water_flow: 'Water flow',
    pump_power: 'Pump power',
    energy_today: 'Energy today',
    heat_pump: 'Heat pump',
    heat_pump_cop: 'Heat pump COP',
    circulation: 'Circulation / day',
    unit_times: 'x',
    ed_water_temp: 'Water temp inlet',
    ed_flow: 'Flow (L/h)',
    ed_pump_watt: 'Pump power (W)',
    ed_energy_today: 'Energy today (kWh)',
    ed_hp_power: 'Heat pump on/off',
    ed_cop: 'COP sensor (optional)',
    ed_circulation: 'Circulation/day',
  },
  sv: {
    edit_hint: 'Dra chipsen — positioner sparas i konfigurationen',
    cancel: 'Avbryt',
    save: 'Spara',
    edit_positions: 'Redigera positioner',
    chip_clock: 'Klocka',
    chip_airtemp: 'Lufttemp',
    chip_rpm: 'RPM',
    chip_flow: 'Flöde',
    chip_water: 'Vattentemp',
    chip_hp: 'Värmepump',
    chip_energy: 'Energi',
    chip_aria: '{name} — flytta med piltangenterna när redigering är aktiv',
    inlet: 'Inlopp',
    outlet: 'Utlopp',
    now: 'Nu',
    today: 'Idag',
    target: 'Mål',
    mode_manual: 'Manuellt',
    mode_eco: 'Eco-läge',
    mode_normal: 'Normal-läge',
    mode_max: 'Max-läge',
    mode_pump_off: 'Pump av',
    heating: 'Värmer',
    standby: 'Standby',
    background_image: 'Bakgrundsbild',
    image_path: 'Bildväg (URL)',
    entities: 'Entiteter',
    ent_clock: 'Klocka',
    ent_date: 'Datum',
    ent_airtemp: 'Lufttemp',
    ent_water_in: 'Vattentemp in',
    ent_water_out: 'Vattentemp ut',
    ent_rpm: 'Pump RPM',
    ent_pump_power: 'Pump på/av',
    ent_flow: 'Flöde',
    ent_hp_power: 'VP på/av',
    ent_hp_target: 'VP måltemp',
    ent_energy_today: 'Energi idag',
    ent_watt: 'Effekt (W)',
    chip_positions: 'Chippositioner',
    pos_hint: 'Tryck på ✏️-knappen direkt på kortförhandsvisningen ovan för att dra chipsen till önskad plats och sedan spara.',
    reset_positions: 'Återställ standardpositioner',
    sensors: 'Sensorer',
    water_temp: 'Vattentemperatur',
    water_flow: 'Vattenflöde',
    pump_power: 'Pump effekt',
    energy_today: 'Energi idag',
    heat_pump: 'Värmepump',
    heat_pump_cop: 'Värmepump COP',
    circulation: 'Cirkulation / dygn',
    unit_times: 'ggr',
    ed_water_temp: 'Vattentemp inlopp',
    ed_flow: 'Flöde (L/h)',
    ed_pump_watt: 'Pump effekt (W)',
    ed_energy_today: 'Energi idag (kWh)',
    ed_hp_power: 'Värmepump på/av',
    ed_cop: 'COP-sensor (valfri)',
    ed_circulation: 'Cirkulation/dygn',
  },
};

/** Resolves the language to format dates/numbers with — HA-configured language, falling back to the browser default. */
function locale(hass) {
  return hass?.locale?.language || hass?.language || undefined;
}

/** Resolves the HA-configured language to one of our translated languages, falling back to English. */
function lang(hass) {
  const raw = (hass?.locale?.language || hass?.language || DEFAULT_LANG).toLowerCase();
  const primary = raw.split('-')[0];
  return TRANSLATIONS[primary] ? primary : DEFAULT_LANG;
}

/** Looks up a UI string in the current language, with {placeholder} substitution. */
function t(hass, key, replacements) {
  const dict = TRANSLATIONS[lang(hass)] || TRANSLATIONS[DEFAULT_LANG];
  const raw = dict[key] ?? TRANSLATIONS[DEFAULT_LANG][key] ?? key;
  if (!replacements) return raw;
  return raw.replace(/\{([^}]+)\}/g, (m, k) =>
    Object.prototype.hasOwnProperty.call(replacements, k) ? replacements[k] : m
  );
}

/* ═══════════════════════════════════════════════════════════════
   HUVUD-KORT
═══════════════════════════════════════════════════════════════ */
class PoolPictureCard extends HTMLElement {

  /* ── Lovelace hooks ─────────────────────────────────────────── */
  set hass(hass) {
    const prevHass = this._hass;
    this._hass = hass;
    if (!this._built) { this._build(); this._built = true; this._update(); return; }
    if (this._isDirty(prevHass, hass)) this._update();
  }

  /** Entity IDs configured under `entities` — the only ones _update() reads. */
  _watchedEntities() {
    return Object.values(this._config?.entities || {}).filter(Boolean);
  }

  /** Relies on HA's guarantee that hass.states[id] keeps the same reference unless that entity actually changed. */
  _isDirty(prevHass, hass) {
    if (!prevHass) return true;
    for (const id of this._watchedEntities()) {
      if (prevHass.states?.[id] !== hass.states?.[id]) return true;
    }
    return false;
  }

  setConfig(config) {
    const prev = this._config;
    this._config = config;

    if (this._built) {
      // Uppdatera bild om den ändrats
      if (!prev || prev.image !== config.image) {
        const img = this.shadowRoot.getElementById('bg');
        if (img) img.src = config.image || '/local/pool_v2.png';
      }
      // Applicera positioner från ny config
      this._applyPositions();
      this._update();
    }
  }

  getCardSize() { return 5; }

  static getConfigElement() {
    return document.createElement('pool-picture-card-editor');
  }

  static getStubConfig() {
    return {
      image: '/local/pool_v2.png',
      entities: {
        time:          'sensor.time',
        date:          'sensor.date',
        air_temp:      'sensor.smhi_temperatur',
        water_in:      'sensor.poolvarme_inlet_water_temp_t02',
        water_out:     'sensor.poolvarme_outlet_water_temp_t03',
        rpm:           'sensor.pump_rpm_regulator_pool_pump_rpm',
        pump_power:    'switch.pump_rpm_regulator_pool_pump_power',
        flow:          'sensor.pool_flode_aktuellt',
        hp_power:      'binary_sensor.poolvarme_power',
        hp_target:     'sensor.poolvarme_heating_set_r02',
        energy_today:  'sensor.pool_pumpen_energy_2_daily',
        watt:          'sensor.poolpump_energi_template',
      }
    };
  }

  /* ── Standardpositioner ─────────────────────────────────────── */
  _defaults() {
    return {
      clock:   { top: 5,   left: 72 },
      airtemp: { top: 5,   left: 86 },
      rpm:     { top: 68,  left: 7  },
      flow:    { top: 55,  left: 40 },
      water:   { top: 58,  left: 68 },
      hp:      { top: 74,  left: 68 },
      energy:  { top: 75,  left: 7  },
    };
  }

  /* Giltig form: ett vanligt objekt där varje post är { top: finit tal, left: finit tal }. */
  _isValidPositions(pos) {
    if (!pos || typeof pos !== 'object' || Array.isArray(pos)) return false;
    return Object.values(pos).every(p =>
      p && typeof p === 'object' && !Array.isArray(p) &&
      Number.isFinite(p.top) && Number.isFinite(p.left)
    );
  }

  /* Läs positioner: config → localStorage → defaults. Ett felformat värde
     (t.ex. handredigerad YAML eller korrupt localStorage) faller igenom
     till nästa källa istället för att krascha _applyPositions() eller
     skjuta chips utanför synligt område. */
  _readPositions() {
    if (this._config && this._config.positions && this._isValidPositions(this._config.positions)) {
      return this._config.positions;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (this._isValidPositions(parsed)) return parsed;
      }
    } catch(e) {}
    return this._defaults();
  }

  /* ── Build DOM ─────────────────────────────────────────────── */
  _build() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
<style>
  :host { display: block; width: 100%; }
  .root {
    position: relative;
    width: 100%;
    padding-top: 56.25%;
    overflow: hidden;
    border-radius: 16px;
    background: #111;
    container-type: inline-size;
  }
  .bg {
    position: absolute;
    inset: 0; width: 100%; height: 100%;
    object-fit: cover; border-radius: 16px;
    user-select: none; -webkit-user-drag: none; pointer-events: none;
  }

  /* ── Glassmorfism chip ───────────────────────────────────── */
  .chip {
    position: absolute;
    background: rgba(15,20,30,0.58);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    padding: 7px 12px;
    color: #fff;
    font-family: var(--primary-font-family,'Roboto',sans-serif);
    line-height: 1.3;
    box-shadow: 0 4px 16px rgba(0,0,0,0.35);
    white-space: nowrap;
    user-select: none;
    touch-action: none;
    cursor: default;
    z-index: 10;
  }

  /* ── Edit mode styling ───────────────────────────────────── */
  .chip.editable {
    cursor: grab;
    border-color: rgba(0,188,212,0.6);
    box-shadow: 0 0 0 1px rgba(0,188,212,0.4), 0 4px 16px rgba(0,0,0,0.35);
  }
  .chip.editable:hover {
    border-color: #00bcd4;
    box-shadow: 0 0 0 2px #00bcd4, 0 4px 20px rgba(0,0,0,0.4);
  }
  .chip.dragging {
    cursor: grabbing !important;
    border-color: #00bcd4;
    box-shadow: 0 0 0 2px #00bcd4, 0 12px 32px rgba(0,0,0,0.5);
    z-index: 100;
    opacity: 0.92;
    transition: none !important;
  }

  /* Chip-namnlabel i edit mode */
  .chip-id {
    display: none;
    position: absolute;
    top: -20px; left: 0;
    font-size: 10px;
    font-weight: 600;
    color: #00bcd4;
    white-space: nowrap;
    background: rgba(0,0,0,0.7);
    padding: 2px 6px;
    border-radius: 4px;
    pointer-events: none;
  }
  .chip.editable .chip-id { display: block; }

  /* Textstorlek skalad med container */
  .val  { font-size: 1.6cqw; font-weight: 700; letter-spacing: -0.02em; }
  .lbl  { font-size: 1.0cqw; color: rgba(255,255,255,0.6); margin-top: 1px; }
  .row  { display: flex; align-items: center; gap: 6px; }
  .icon { font-size: 1.3cqw; }
  .dot  {
    display: inline-block;
    width: max(6px, 0.6cqw); height: max(6px, 0.6cqw);
    border-radius: 50%; flex-shrink: 0;
  }
  .dot.heat { background:#ff9800; box-shadow:0 0 6px #ff9800; }
  .dot.off  { background:#555; }
  .cold { color: #64b5f6; }
  .warm { color: #ff8a65; }
  .flow-zero { color: #ef5350; }

  /* ── Edit bar (top) ──────────────────────────────────────── */
  .edit-bar {
    display: none;
    position: absolute;
    top: 0; left: 0; right: 0;
    padding: 8px 14px;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(8px);
    color: #fff;
    font-family: var(--primary-font-family,'Roboto',sans-serif);
    font-size: max(11px, 1.1cqw);
    align-items: center;
    justify-content: space-between;
    z-index: 50;
    border-radius: 16px 16px 0 0;
  }
  .edit-bar.active { display: flex; }

  .btn {
    border: none; border-radius: 8px;
    font-family: inherit; font-size: max(11px,1.0cqw);
    padding: 5px 14px; cursor: pointer; color: #fff;
  }
  .btn-save   { background: #00bcd4; }
  .btn-cancel { background: rgba(255,255,255,0.18); }
  .btn-save:hover   { background: #0097a7; }
  .btn-cancel:hover { background: rgba(255,255,255,0.28); }

  /* ── Grid overlay ────────────────────────────────────────── */
  .grid-overlay {
    display: none;
    position: absolute; inset: 0;
    pointer-events: none; z-index: 5;
  }
  .grid-overlay.active { display: block; }
  .grid-overlay svg { width:100%; height:100%; }

  /* ── Edit toggle button (pencil) ─────────────────────────── */
  .edit-toggle {
    position: absolute;
    bottom: max(6px,0.8cqw); right: max(6px,0.8cqw);
    width: max(28px,2.4cqw); height: max(28px,2.4cqw);
    border-radius: 50%;
    background: rgba(0,0,0,0.52);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 40;
    font-size: max(12px,1.1cqw);
    transition: background 0.2s, transform 0.15s;
  }
  .edit-toggle:hover { background: rgba(0,188,212,0.45); transform: scale(1.08); }
</style>

<div class="root" id="root">
  <img class="bg" id="bg" draggable="false" alt=""/>

  <div class="grid-overlay" id="grid-overlay">
    <svg viewBox="0 0 100 56.25" preserveAspectRatio="none">
      ${Array.from({length:9},(_,i)=>`<line x1="${(i+1)*10}" y1="0" x2="${(i+1)*10}" y2="100" stroke="rgba(0,188,212,0.4)" stroke-width="0.15"/>`).join('')}
      ${Array.from({length:8},(_,i)=>`<line x1="0" y1="${(i+1)*7}" x2="100" y2="${(i+1)*7}" stroke="rgba(0,188,212,0.4)" stroke-width="0.15"/>`).join('')}
    </svg>
  </div>

  <div class="edit-bar" id="edit-bar">
    <span>✏️ ${t(this._hass, 'edit_hint')}</span>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-cancel" id="btn-cancel">${t(this._hass, 'cancel')}</button>
      <button class="btn btn-save"   id="btn-save">💾 ${t(this._hass, 'save')}</button>
    </div>
  </div>

  <!-- Chips -->
  <div class="chip" id="chip-clock" data-chip="clock" aria-label="${escHtml(t(this._hass, 'chip_aria', { name: t(this._hass, 'chip_clock') }))}">
    <div class="chip-id">${t(this._hass, 'chip_clock')}</div>
    <div class="val" id="v-time">--:--</div>
    <div class="lbl" id="v-date">--- -- ---</div>
  </div>

  <div class="chip" id="chip-airtemp" data-chip="airtemp" aria-label="${escHtml(t(this._hass, 'chip_aria', { name: t(this._hass, 'chip_airtemp') }))}">
    <div class="chip-id">${t(this._hass, 'chip_airtemp')}</div>
    <div class="row">
      <span class="icon">🌤️</span>
      <div>
        <div class="val" id="v-airtemp">--°C</div>
        <div class="lbl">${t(this._hass, 'chip_airtemp')}</div>
      </div>
    </div>
  </div>

  <div class="chip" id="chip-rpm" data-chip="rpm" aria-label="${escHtml(t(this._hass, 'chip_aria', { name: t(this._hass, 'chip_rpm') }))}">
    <div class="chip-id">${t(this._hass, 'chip_rpm')}</div>
    <div class="val" id="v-rpm">---- RPM</div>
    <div class="lbl" id="v-rpmmode">---</div>
  </div>

  <div class="chip" id="chip-flow" data-chip="flow" aria-label="${escHtml(t(this._hass, 'chip_aria', { name: t(this._hass, 'chip_flow') }))}">
    <div class="chip-id">${t(this._hass, 'chip_flow')}</div>
    <div class="row">
      <span class="icon">💧</span>
      <div>
        <div class="val" id="v-flow">---- L/h</div>
        <div class="lbl">${t(this._hass, 'chip_flow')}</div>
      </div>
    </div>
  </div>

  <div class="chip" id="chip-water" data-chip="water" aria-label="${escHtml(t(this._hass, 'chip_aria', { name: t(this._hass, 'chip_water') }))}">
    <div class="chip-id">${t(this._hass, 'chip_water')}</div>
    <div class="row" style="gap:10px;">
      <div>
        <div class="row">
          <span style="color:#64b5f6;font-size:max(10px,1.1cqw);">↓</span>
          <span class="val cold" id="v-water-in">--°C</span>
        </div>
        <div class="lbl">${t(this._hass, 'inlet')}</div>
      </div>
      <div style="width:1px;background:rgba(255,255,255,0.2);align-self:stretch;"></div>
      <div>
        <div class="row">
          <span style="color:#ff8a65;font-size:max(10px,1.1cqw);">↑</span>
          <span class="val warm" id="v-water-out">--°C</span>
        </div>
        <div class="lbl">${t(this._hass, 'outlet')}</div>
      </div>
    </div>
  </div>

  <div class="chip" id="chip-hp" data-chip="hp" aria-label="${escHtml(t(this._hass, 'chip_aria', { name: t(this._hass, 'chip_hp') }))}">
    <div class="chip-id">${t(this._hass, 'chip_hp')}</div>
    <div class="row">
      <span class="dot off" id="dot-hp"></span>
      <div>
        <div class="val" id="v-hp-status">--</div>
        <div class="lbl" id="v-hp-target">${t(this._hass, 'target')}: --°C</div>
      </div>
    </div>
  </div>

  <div class="chip" id="chip-energy" data-chip="energy" aria-label="${escHtml(t(this._hass, 'chip_aria', { name: t(this._hass, 'chip_energy') }))}">
    <div class="chip-id">${t(this._hass, 'chip_energy')}</div>
    <div class="row" style="gap:12px;">
      <div>
        <div class="val" id="v-watt">-- W</div>
        <div class="lbl">${t(this._hass, 'now')}</div>
      </div>
      <div style="width:1px;background:rgba(255,255,255,0.2);align-self:stretch;"></div>
      <div>
        <div class="val" id="v-energy-today">-- kWh</div>
        <div class="lbl">${t(this._hass, 'today')}</div>
      </div>
    </div>
  </div>

  <div class="edit-toggle" id="edit-toggle" title="${escHtml(t(this._hass, 'edit_positions'))}">✏️</div>
</div>`;

    const img = this.shadowRoot.getElementById('bg');
    img.src = (this._config && this._config.image) || '/local/pool_v2.png';

    this._applyPositions();
    this._setupDrag();
  }

  /* ── Apply positions ────────────────────────────────────────── */
  _applyPositions() {
    if (!this.shadowRoot) return;
    const pos = this._readPositions();
    Object.keys(pos).forEach(key => {
      const el = this.shadowRoot.getElementById('chip-' + key);
      if (!el) return;
      const p = pos[key];
      // Alltid top+left, aldrig right/bottom — undviker flip-problem
      el.style.top    = (p.top  ?? 10) + '%';
      el.style.left   = (p.left ?? 10) + '%';
      el.style.bottom = '';
      el.style.right  = '';
    });
  }

  /* ── Drag logic ─────────────────────────────────────────────── */
  _setupDrag() {
    const root      = this.shadowRoot.getElementById('root');
    const editBar   = this.shadowRoot.getElementById('edit-bar');
    const gridOvl   = this.shadowRoot.getElementById('grid-overlay');
    const toggleBtn = this.shadowRoot.getElementById('edit-toggle');
    const saveBtn   = this.shadowRoot.getElementById('btn-save');
    const cancelBtn = this.shadowRoot.getElementById('btn-cancel');
    const chips     = Array.from(this.shadowRoot.querySelectorAll('.chip'));

    let editMode = false;
    let snapshot = {};   // positioner vid enter-edit
    let dragging = null;
    let dragStartX, dragStartY, dragStartLeft, dragStartTop;

    /* Enter / exit edit */
    const enterEdit = () => {
      editMode = true;
      snapshot = this._snapshotPositions();
      editBar.classList.add('active');
      gridOvl.classList.add('active');
      toggleBtn.style.display = 'none';
      chips.forEach(c => { c.classList.add('editable'); c.tabIndex = 0; });
    };

    const exitEdit = (save) => {
      editMode = false;
      editBar.classList.remove('active');
      gridOvl.classList.remove('active');
      toggleBtn.style.display = '';
      chips.forEach(c => { c.classList.remove('editable', 'dragging'); c.tabIndex = -1; });
      dragging = null;

      if (save) {
        const newPos = this._snapshotPositions();
        // Spara i localStorage som omedelbar backup
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newPos)); } catch(e) {}
        // Skicka config-changed så HA sparar i YAML
        const newConfig = { ...this._config, positions: newPos };
        this._config = newConfig;
        this.dispatchEvent(new CustomEvent('config-changed', {
          detail: { config: newConfig }, bubbles: true, composed: true
        }));
      } else {
        // Återställ snapshot
        chips.forEach(c => {
          const key = c.dataset.chip;
          if (snapshot[key]) {
            c.style.top  = snapshot[key].top  + '%';
            c.style.left = snapshot[key].left + '%';
          }
        });
      }
    };

    toggleBtn.addEventListener('click', enterEdit);
    saveBtn.addEventListener('click',   () => exitEdit(true));
    cancelBtn.addEventListener('click', () => exitEdit(false));

    /* Pointer events för drag */
    chips.forEach(chip => {
      chip.addEventListener('pointerdown', (e) => {
        if (!editMode) return;
        e.preventDefault();
        e.stopPropagation();

        dragging = chip;
        chip.classList.add('dragging');
        chip.setPointerCapture(e.pointerId);

        const rootRect  = root.getBoundingClientRect();
        const chipRect  = chip.getBoundingClientRect();
        dragStartLeft   = ((chipRect.left - rootRect.left) / rootRect.width)  * 100;
        dragStartTop    = ((chipRect.top  - rootRect.top)  / rootRect.height) * 100;
        dragStartX      = e.clientX;
        dragStartY      = e.clientY;

        chip.style.left   = dragStartLeft + '%';
        chip.style.top    = dragStartTop  + '%';
        chip.style.right  = '';
        chip.style.bottom = '';
      });

      chip.addEventListener('pointermove', (e) => {
        if (!dragging || dragging !== chip) return;
        e.preventDefault();
        const rootRect = root.getBoundingClientRect();
        const dx = ((e.clientX - dragStartX) / rootRect.width)  * 100;
        const dy = ((e.clientY - dragStartY) / rootRect.height) * 100;
        const newLeft = Math.max(0, Math.min(88, dragStartLeft + dx));
        const newTop  = Math.max(0, Math.min(85, dragStartTop  + dy));
        chip.style.left = newLeft + '%';
        chip.style.top  = newTop  + '%';
      });

      chip.addEventListener('pointerup', (e) => {
        if (dragging === chip) {
          chip.classList.remove('dragging');
          dragging = null;
        }
      });

      // Keyboard equivalent of dragging: arrow keys nudge the chip, Shift
      // for a bigger step. Only active while edit mode is on (chip.tabIndex
      // is 0 then, -1 otherwise, so this can't fire outside edit mode).
      chip.addEventListener('keydown', (e) => {
        if (!editMode) return;
        const steps = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        const step = steps[e.key];
        if (!step) return;
        e.preventDefault();
        const amount = e.shiftKey ? 5 : 1;
        const rootRect = root.getBoundingClientRect();
        const chipRect = chip.getBoundingClientRect();
        const curLeft = ((chipRect.left - rootRect.left) / rootRect.width)  * 100;
        const curTop  = ((chipRect.top  - rootRect.top)  / rootRect.height) * 100;
        const newLeft = Math.max(0, Math.min(88, curLeft + step[0] * amount));
        const newTop  = Math.max(0, Math.min(85, curTop  + step[1] * amount));
        chip.style.left   = newLeft + '%';
        chip.style.top    = newTop  + '%';
        chip.style.right  = '';
        chip.style.bottom = '';
      });
    });
  }

  /* Snapshot: läs aktuella pixel-positioner → konvertera till % */
  _snapshotPositions() {
    const root = this.shadowRoot.getElementById('root');
    if (!root) return {};
    const rootRect = root.getBoundingClientRect();
    const pos = {};
    this.shadowRoot.querySelectorAll('.chip').forEach(chip => {
      const r = chip.getBoundingClientRect();
      pos[chip.dataset.chip] = {
        top:  +( ((r.top  - rootRect.top)  / rootRect.height * 100).toFixed(2) ),
        left: +( ((r.left - rootRect.left) / rootRect.width  * 100).toFixed(2) ),
      };
    });
    return pos;
  }

  /* ── Update HA values ───────────────────────────────────────── */
  _update() {
    if (!this._hass || !this._config) return;
    const h = this._hass;
    const e = this._config.entities || {};
    const s = id => { if (!id) return null; const st = h.states[id]; return st ? st.state : null; };

    this._setText('v-time', s(e.time) || new Date().toLocaleTimeString(locale(h),{hour:'2-digit',minute:'2-digit'}));
    this._setText('v-date', s(e.date) || new Date().toLocaleDateString(locale(h),{weekday:'short',day:'numeric',month:'short'}));

    const at = s(e.air_temp);
    this._setText('v-airtemp', at ? `${parseFloat(at).toFixed(1)}°C` : '--°C');

    const rpm = s(e.rpm);
    const rpmN = rpm ? Math.round(parseFloat(rpm)) : null;
    this._setText('v-rpm', rpmN ? `${rpmN.toLocaleString(locale(h))} RPM` : '-- RPM');
    let mode = t(h, 'mode_manual');
    if (rpmN) { mode = rpmN<=1350 ? t(h, 'mode_eco') : rpmN<=1900 ? t(h, 'mode_normal') : t(h, 'mode_max'); }
    if (s(e.pump_power) === 'off') mode = t(h, 'mode_pump_off');
    this._setText('v-rpmmode', mode);

    const fl = s(e.flow);
    this._setText('v-flow', fl ? `${Math.round(parseFloat(fl)).toLocaleString(locale(h))} L/h` : '-- L/h');
    // Zero flow while there's a real reading likely means the pump isn't
    // circulating — flag it, same idea as the circulation warning colors in
    // pool-sensors-card. Not attempting a "low/ok/good" scale here since a
    // sensible non-zero threshold depends on pump/pipe specs this card has
    // no way to know.
    const flowEl = this.shadowRoot.getElementById('v-flow');
    if (flowEl) flowEl.classList.toggle('flow-zero', fl !== null && parseFloat(fl) === 0);

    this._setText('v-water-in',  s(e.water_in)  ? `${parseFloat(s(e.water_in)).toFixed(1)}°C`  : '--°C');
    this._setText('v-water-out', s(e.water_out) ? `${parseFloat(s(e.water_out)).toFixed(1)}°C` : '--°C');

    const hpOn = s(e.hp_power) === 'on';
    this._setText('v-hp-status', hpOn ? t(h, 'heating') : t(h, 'standby'));
    this._setText('v-hp-target', s(e.hp_target) ? `${t(h, 'target')}: ${parseFloat(s(e.hp_target)).toFixed(1)}°C` : `${t(h, 'target')}: --°C`);
    const dot = this.shadowRoot.getElementById('dot-hp');
    if (dot) dot.className = 'dot ' + (hpOn ? 'heat' : 'off');

    this._setText('v-watt',         s(e.watt)         ? `${Math.round(parseFloat(s(e.watt)))} W`           : '-- W');
    this._setText('v-energy-today', s(e.energy_today) ? `${parseFloat(s(e.energy_today)).toFixed(2)} kWh`  : '-- kWh');
  }

  _setText(id, val) {
    const el = this.shadowRoot.getElementById(id);
    if (el && el.textContent !== val) el.textContent = val;
  }
}

customElements.define('pool-picture-card', PoolPictureCard);


/* ═══════════════════════════════════════════════════════════════
   VISUELL EDITOR  — visas i HA:s korteditor
═══════════════════════════════════════════════════════════════ */
class PoolPictureCardEditor extends HTMLElement {

  set hass(hass) {
    this._hass = hass;
    if (this._preview) this._preview.hass = hass;
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  _render() {
    if (!this._config) return;
    const c  = this._config;
    const e  = c.entities || {};

    this.innerHTML = `
<style>
  .ed { display: flex; flex-direction: column; gap: 0; }

  /* Live preview */
  .preview-wrap {
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 16px;
    border: 1px solid var(--divider-color);
  }

  /* Sections */
  .section {
    padding: 12px 16px 8px;
    border-bottom: 1px solid var(--divider-color);
  }
  .section:last-child { border-bottom: none; }
  .section-title {
    font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--secondary-text-color);
    margin-bottom: 10px;
  }
  .field { display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px; }
  .field:last-child { margin-bottom: 0; }
  label { font-size: 13px; color: var(--primary-text-color); }
  input {
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px; padding: 8px 10px;
    color: var(--primary-text-color); font-size: 14px;
    font-family: var(--primary-font-family,'Roboto',sans-serif);
    outline: none; transition: border-color 0.15s;
  }
  input:focus { border-color: var(--primary-color); }

  /* Positions hint + reset */
  .pos-hint {
    font-size: 12px; color: var(--secondary-text-color);
    font-style: italic; margin-bottom: 8px; line-height: 1.5;
  }
  .reset-btn {
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 8px; padding: 8px 14px;
    color: var(--primary-text-color); cursor: pointer;
    font-size: 13px; font-family: var(--primary-font-family,'Roboto',sans-serif);
    transition: border-color 0.15s;
  }
  .reset-btn:hover { border-color: var(--primary-color); }

  /* Two-column entity grid */
  .entity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
</style>

<div class="ed">

  <!-- Live preview av kortet -->
  <div class="preview-wrap" id="preview-wrap"></div>

  <!-- Bild -->
  <div class="section">
    <div class="section-title">${t(this._hass, 'background_image')}</div>
    <div class="field">
      <label>${t(this._hass, 'image_path')}</label>
      <input id="inp-image" type="text" value="${escHtml(c.image || '/local/pool_v2.png')}" placeholder="/local/pool_v2.png"/>
    </div>
  </div>

  <!-- Entiteter -->
  <div class="section">
    <div class="section-title">${t(this._hass, 'entities')}</div>
    <div class="entity-grid">
      <div class="field">
        <label>🕐 ${t(this._hass, 'ent_clock')}</label>
        <input data-ent="time" value="${escHtml(e.time||'')}" placeholder="sensor.time"/>
      </div>
      <div class="field">
        <label>📅 ${t(this._hass, 'ent_date')}</label>
        <input data-ent="date" value="${escHtml(e.date||'')}" placeholder="sensor.date"/>
      </div>
      <div class="field">
        <label>🌤️ ${t(this._hass, 'ent_airtemp')}</label>
        <input data-ent="air_temp" value="${escHtml(e.air_temp||'')}" placeholder="sensor..."/>
      </div>
      <div class="field">
        <label>💧 ${t(this._hass, 'ent_water_in')}</label>
        <input data-ent="water_in" value="${escHtml(e.water_in||'')}" placeholder="sensor..."/>
      </div>
      <div class="field">
        <label>🌡️ ${t(this._hass, 'ent_water_out')}</label>
        <input data-ent="water_out" value="${escHtml(e.water_out||'')}" placeholder="sensor..."/>
      </div>
      <div class="field">
        <label>⚙️ ${t(this._hass, 'ent_rpm')}</label>
        <input data-ent="rpm" value="${escHtml(e.rpm||'')}" placeholder="sensor..."/>
      </div>
      <div class="field">
        <label>🔌 ${t(this._hass, 'ent_pump_power')}</label>
        <input data-ent="pump_power" value="${escHtml(e.pump_power||'')}" placeholder="switch..."/>
      </div>
      <div class="field">
        <label>🔄 ${t(this._hass, 'ent_flow')}</label>
        <input data-ent="flow" value="${escHtml(e.flow||'')}" placeholder="sensor..."/>
      </div>
      <div class="field">
        <label>🔥 ${t(this._hass, 'ent_hp_power')}</label>
        <input data-ent="hp_power" value="${escHtml(e.hp_power||'')}" placeholder="binary_sensor..."/>
      </div>
      <div class="field">
        <label>🎯 ${t(this._hass, 'ent_hp_target')}</label>
        <input data-ent="hp_target" value="${escHtml(e.hp_target||'')}" placeholder="sensor..."/>
      </div>
      <div class="field">
        <label>📊 ${t(this._hass, 'ent_energy_today')}</label>
        <input data-ent="energy_today" value="${escHtml(e.energy_today||'')}" placeholder="sensor..."/>
      </div>
      <div class="field">
        <label>💡 ${t(this._hass, 'ent_watt')}</label>
        <input data-ent="watt" value="${escHtml(e.watt||'')}" placeholder="sensor..."/>
      </div>
    </div>
  </div>

  <!-- Positioner -->
  <div class="section">
    <div class="section-title">${t(this._hass, 'chip_positions')}</div>
    <p class="pos-hint">${t(this._hass, 'pos_hint')}</p>
    <button class="reset-btn" id="btn-reset">🔄 ${t(this._hass, 'reset_positions')}</button>
  </div>

</div>`;

    /* Bygg live-preview */
    const wrap = this.querySelector('#preview-wrap');
    if (wrap) {
      this._preview = document.createElement('pool-picture-card');
      try { this._preview.setConfig(this._config); } catch(ex) {}
      if (this._hass) this._preview.hass = this._hass;
      wrap.appendChild(this._preview);
    }

    /* Lyssna på ändringar i inputs */
    this.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => this._fireChange());
    });

    /* Reset-positioner */
    this.querySelector('#btn-reset').addEventListener('click', () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch(ex) {}
      const nc = { ...this._config };
      delete nc.positions;
      this._fireConfigChanged(nc);
    });

    /* Lyssna på config-changed från preview (drag-to-save) */
    wrap && wrap.addEventListener('config-changed', (e) => {
      e.stopPropagation();
      this._config = e.detail.config;
      this._fireConfigChanged(this._config);
    });
  }

  _fireChange() {
    const entities = {};
    this.querySelectorAll('input[data-ent]').forEach(inp => {
      if (inp.value.trim()) entities[inp.dataset.ent] = inp.value.trim();
    });
    const image = (this.querySelector('#inp-image') || {}).value || '/local/pool_v2.png';
    const nc = { ...this._config, image, entities };
    this._fireConfigChanged(nc);
  }

  _fireConfigChanged(config) {
    this._config = config;
    // Uppdatera preview
    if (this._preview) {
      try { this._preview.setConfig(config); } catch(ex) {}
      if (this._hass) this._preview.hass = this._hass;
    }
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config }, bubbles: true, composed: true
    }));
  }
}

customElements.define('pool-picture-card-editor', PoolPictureCardEditor);

/* Registrera */
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'pool-picture-card',
  name: 'Pool Picture Card',
  description: 'Background image with drag-to-position glassmorphism chips and a live editor',
  preview: true,
});
/**
 * pool-sensors-card.js
 * ─────────────────────────────────────────────────────────────────
 * Spara som: /config/www/pool-sensors-card.js
 * Registrera: Settings → Dashboards → Resources → JavaScript Module
 *
 * YAML:
 *   type: custom:pool-sensors-card
 *   entities:
 *     water_temp:    sensor.poolvarme_inlet_water_temp_t02
 *     flow:          sensor.pool_flode_aktuellt
 *     pump_watt:     sensor.poolpump_energi_template
 *     energy_today:  sensor.pool_pumpen_energy_2_daily
 *     circulation:   sensor.pool_cirkulation_per_dygn
 *     hp_power:      binary_sensor.poolvarme_power        (på/av)
 *     water_in:      sensor.poolvarme_inlet_water_temp_t02
 *     water_out:     sensor.poolvarme_outlet_water_temp_t03
 */

class PoolSensorsCard extends HTMLElement {

  set hass(hass) {
    const prevHass = this._hass;
    this._hass = hass;
    if (!this._built) { this._build(); this._built = true; this._update(); return; }
    if (this._isDirty(prevHass, hass)) this._update();
  }

  /** Entity IDs configured under `entities` — the only ones _update() reads. */
  _watchedEntities() {
    return Object.values(this._config?.entities || {}).filter(Boolean);
  }

  /** Relies on HA's guarantee that hass.states[id] keeps the same reference unless that entity actually changed. */
  _isDirty(prevHass, hass) {
    if (!prevHass) return true;
    for (const id of this._watchedEntities()) {
      if (prevHass.states?.[id] !== hass.states?.[id]) return true;
    }
    return false;
  }

  setConfig(config) {
    this._config = config;
    if (this._built) this._update();
  }

  getCardSize() { return 4; }

  static getConfigElement() {
    return document.createElement('pool-sensors-card-editor');
  }

  static getStubConfig() {
    return {
      entities: {
        water_temp:   'sensor.poolvarme_inlet_water_temp_t02',
        water_out:    'sensor.poolvarme_outlet_water_temp_t03',
        flow:         'sensor.pool_flode_aktuellt',
        pump_watt:    'sensor.poolpump_energi_template',
        energy_today: 'sensor.pool_pumpen_energy_2_daily',
        circulation:  'sensor.pool_cirkulation_per_dygn',
        hp_power:     'binary_sensor.poolvarme_power',
      }
    };
  }

  _build() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
<style>
  :host { display: block; }

  .card {
    background: var(--ha-card-background, var(--card-background-color, #1c1c1e));
    border-radius: 16px;
    padding: 16px 20px 12px;
    box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.3));
    font-family: var(--primary-font-family, 'Roboto', sans-serif);
  }

  .header {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--secondary-text-color, #888);
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .row {
    display: flex;
    align-items: center;
    padding: 9px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    gap: 12px;
    transition: background 0.15s;
    border-radius: 6px;
    margin: 0 -4px;
    padding-left: 4px;
    padding-right: 4px;
  }
  .row:last-child { border-bottom: none; }
  .row:hover { background: rgba(255,255,255,0.04); }

  .icon-wrap {
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    font-size: 16px;
  }

  .name {
    flex: 1;
    font-size: 14px;
    color: var(--primary-text-color, #fff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .value {
    font-size: 14px;
    font-weight: 600;
    color: var(--primary-text-color, #fff);
    white-space: nowrap;
    text-align: right;
  }

  .value .unit {
    font-size: 12px;
    font-weight: 400;
    color: var(--secondary-text-color, #888);
    margin-left: 2px;
  }

  /* Status dot för värmepump */
  .status-dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    margin-right: 5px;
    vertical-align: middle;
  }
  .dot-on  { background: #ff9800; box-shadow: 0 0 5px #ff9800; }
  .dot-off { background: #555; }

  /* Icon background colors */
  .ic-blue   { background: rgba(100,181,246,0.15); }
  .ic-cyan   { background: rgba(0,188,212,0.15); }
  .ic-orange { background: rgba(255,152,0,0.15); }
  .ic-green  { background: rgba(76,175,80,0.15); }
  .ic-yellow { background: rgba(255,235,59,0.15); }
  .ic-red    { background: rgba(244,67,54,0.15); }
  .ic-purple { background: rgba(156,39,176,0.15); }

  /* Färgade värden */
  .v-blue   { color: #64b5f6; }
  .v-cyan   { color: #00bcd4; }
  .v-orange { color: #ff9800; }
  .v-green  { color: #66bb6a; }
  .v-yellow { color: #fff176; }
  .v-red    { color: #ef5350; }

  /* COP special */
  .cop-good { color: #66bb6a; }
  .cop-ok   { color: #fff176; }
  .cop-bad  { color: #ef5350; }
</style>

<div class="card">
  <div class="header">${t(this._hass, 'sensors')}</div>

  <!-- Vattentemperatur -->
  <div class="row">
    <div class="icon-wrap ic-blue">🌡️</div>
    <div class="name">${t(this._hass, 'water_temp')}</div>
    <div class="value v-blue" id="v-water-temp">--<span class="unit">°C</span></div>
  </div>

  <!-- Flöde -->
  <div class="row">
    <div class="icon-wrap ic-cyan">💧</div>
    <div class="name">${t(this._hass, 'water_flow')}</div>
    <div class="value" id="v-flow">--<span class="unit">L/h</span></div>
  </div>

  <!-- Pump effekt -->
  <div class="row">
    <div class="icon-wrap ic-yellow">⚡</div>
    <div class="name">${t(this._hass, 'pump_power')}</div>
    <div class="value v-yellow" id="v-pump-watt">--<span class="unit">W</span></div>
  </div>

  <!-- Energi idag -->
  <div class="row">
    <div class="icon-wrap ic-orange">📊</div>
    <div class="name">${t(this._hass, 'energy_today')}</div>
    <div class="value v-orange" id="v-energy">--<span class="unit">kWh</span></div>
  </div>

  <!-- Värmepump -->
  <div class="row">
    <div class="icon-wrap ic-orange">🔥</div>
    <div class="name">${t(this._hass, 'heat_pump')}</div>
    <div class="value" id="v-hp">--</div>
  </div>

  <!-- COP (beräknad om möjligt) -->
  <div class="row" id="row-cop">
    <div class="icon-wrap ic-green">📈</div>
    <div class="name">${t(this._hass, 'heat_pump_cop')}</div>
    <div class="value" id="v-cop">--</div>
  </div>

  <!-- Cirkulation -->
  <div class="row">
    <div class="icon-wrap ic-purple">🔄</div>
    <div class="name">${t(this._hass, 'circulation')}</div>
    <div class="value" id="v-circ">--<span class="unit">${t(this._hass, 'unit_times')}</span></div>
  </div>

</div>`;
  }

  _update() {
    if (!this._hass || !this._config) return;
    const h = this._hass;
    const e = this._config.entities || {};
    const s = (id) => { if (!id) return null; const st = h.states[id]; return st ? st.state : null; };
    const f = (id, dec=1) => { const v = s(id); return v && !isNaN(v) ? parseFloat(v).toFixed(dec) : null; };

    // Vattentemp
    const wt = f(e.water_temp);
    this._setHTML('v-water-temp', wt ? `${wt}<span class="unit">°C</span>` : '--');

    // Flöde — samma noll-flöde-varning som pool-picture-card; ingen
    // låg/ok/bra-skala här eftersom en rimlig icke-noll-gräns beror på
    // pump-/rörspecifikationer det här kortet inte känner till.
    const flow = f(e.flow, 0);
    const flowColor = flow !== null && parseFloat(flow) === 0 ? 'v-red' : 'v-cyan';
    this._setHTML('v-flow', flow ? `<span class="${flowColor}">${parseInt(flow).toLocaleString(locale(h))}</span><span class="unit"> L/h</span>` : '--');

    // Pump watt
    const watt = f(e.pump_watt, 0);
    this._setHTML('v-pump-watt', watt ? `${watt}<span class="unit"> W</span>` : '--');

    // Energi idag
    const energy = f(e.energy_today, 2);
    this._setHTML('v-energy', energy ? `${energy}<span class="unit"> kWh</span>` : '--');

    // Värmepump på/av
    const hpState = s(e.hp_power);
    const hpOn = hpState === 'on';
    const dotClass = hpOn ? 'status-dot dot-on' : 'status-dot dot-off';
    const hpText = hpOn ? t(h, 'heating') : t(h, 'standby');
    const hpColor = hpOn ? 'v-orange' : '';
    this._setHTML('v-hp',
      `<span class="${dotClass}"></span><span class="${hpColor}">${hpText}</span>`
    );

    // COP — beräkna om vi har watt-sensor och vattentemp in+ut
    // Enkel uppskattning: COP visas som "-- " om ej tillgänglig
    // Om du har en dedikerad COP-sensor, lägg till entity: cop i config
    const copVal = f(e.cop);
    if (copVal) {
      const cop = parseFloat(copVal);
      const cls = cop >= 4 ? 'cop-good' : cop >= 2.5 ? 'cop-ok' : 'cop-bad';
      this._setHTML('v-cop', `<span class="${cls}">${cop.toFixed(1)}</span>`);
    } else {
      // Dölj COP-raden om ingen sensor
      const row = this.shadowRoot.getElementById('row-cop');
      if (row) row.style.display = 'none';
    }

    // Cirkulation
    const circ = f(e.circulation, 2);
    if (circ !== null) {
      const circNum = parseFloat(circ);
      const color = circNum < 1.5 ? 'v-red' : circNum < 3 ? 'v-yellow' : 'v-green';
      this._setHTML('v-circ',
        `<span class="${color}">${circ}</span><span class="unit"> ${t(h, 'unit_times')}</span>`
      );
    }
  }

  _setHTML(id, html) {
    const el = this.shadowRoot.getElementById(id);
    if (el && el.innerHTML !== html) el.innerHTML = html;
  }
}

customElements.define('pool-sensors-card', PoolSensorsCard);

/* ── Visuell editor ─────────────────────────────────────────────── */
class PoolSensorsCardEditor extends HTMLElement {
  set hass(h) { this._hass = h; }
  setConfig(c) { this._config = c; this._render(); }

  _render() {
    const e = (this._config && this._config.entities) || {};
    const fields = [
      { key: 'water_temp',   label: `🌡️ ${t(this._hass, 'ed_water_temp')}` },
      { key: 'flow',         label: `💧 ${t(this._hass, 'ed_flow')}` },
      { key: 'pump_watt',    label: `⚡ ${t(this._hass, 'ed_pump_watt')}` },
      { key: 'energy_today', label: `📊 ${t(this._hass, 'ed_energy_today')}` },
      { key: 'hp_power',     label: `🔥 ${t(this._hass, 'ed_hp_power')}` },
      { key: 'cop',          label: `📈 ${t(this._hass, 'ed_cop')}` },
      { key: 'circulation',  label: `🔄 ${t(this._hass, 'ed_circulation')}` },
    ];
    this.innerHTML = `
      <style>
        .ed { padding:16px; display:flex; flex-direction:column; gap:10px; }
        .field { display:flex; flex-direction:column; gap:4px; }
        label { font-size:13px; color:var(--primary-text-color); }
        input {
          background:var(--secondary-background-color);
          border:1px solid var(--divider-color);
          border-radius:8px; padding:8px 10px;
          color:var(--primary-text-color); font-size:14px;
          font-family:var(--primary-font-family); outline:none;
        }
        input:focus { border-color:var(--primary-color); }
      </style>
      <div class="ed">
        ${fields.map(f => `
          <div class="field">
            <label>${f.label}</label>
            <input data-key="${f.key}" value="${escHtml(e[f.key]||'')}" placeholder="entity_id"/>
          </div>`).join('')}
      </div>`;

    this.querySelectorAll('input').forEach(i =>
      i.addEventListener('change', () => {
        const entities = {};
        this.querySelectorAll('input').forEach(inp => {
          if (inp.value.trim()) entities[inp.dataset.key] = inp.value.trim();
        });
        this.dispatchEvent(new CustomEvent('config-changed',
          { detail:{ config:{ ...this._config, entities } }, bubbles:true, composed:true }
        ));
      })
    );
  }
}
customElements.define('pool-sensors-card-editor', PoolSensorsCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'pool-sensors-card',
  name: 'Pool Sensors Card',
  description: 'Sensor list in reference style — icon + name + value',
  preview: true,
});

/* ── HACS bundle registration ─────────────────────────────── */
window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'pool-picture-card'))
  window.customCards.push({ type:'pool-picture-card', name:'Pool Picture Card', description:'Background image with glassmorphism chips and drag-to-position', preview:true });
if (!window.customCards.find(c => c.type === 'pool-sensors-card'))
  window.customCards.push({ type:'pool-sensors-card', name:'Pool Sensors Card', description:'Sensor list — icon + name + value', preview:true });
