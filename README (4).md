# 🏊 Pool Dashboard Cards

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/johro897/pool-dashboard-cards.svg)](https://github.com/johro897/pool-dashboard-cards/releases)

Custom Lovelace cards för att bygga ett snyggt pool-dashboard i Home Assistant med glassmorfism-design.

![Pool Dashboard Preview](https://raw.githubusercontent.com/johro897/pool-dashboard-cards/main/docs/preview.png)

---

## Kort som ingår

### `pool-picture-card`
Bakgrundsbild med draggbara glassmorfism-chips för live-data.

**Funktioner:**
- Glassmorfism-chips med backdrop-blur
- Drag-to-position via ✏️-knappen — sparas direkt i YAML-konfigurationen
- Visuell editor med live-förhandsvisning i HA:s korteditor
- Stöd för mus och touch
- Skalbar med `cqw`-enheter (fungerar på alla skärmstorlekar)

### `pool-sensors-card`
Sensorlista med ikon + namn + högerställt värde, inspirerad av professionella pool-UI:n.

**Funktioner:**
- Färgkodade värden (röd/gul/grön för cirkulation)
- Statusdot för värmepump (orange = värmer, grå = standby)
- Valfri COP-sensor (döljs automatiskt om ej konfigurerad)
- Visuell editor

---

## Installation via HACS

1. Gå till **HACS → Frontend**
2. Tryck på **⋮ → Custom repositories**
3. Lägg till: `https://github.com/johro897/pool-dashboard-cards`  
   Kategori: **Lovelace**
4. Sök efter **Pool Dashboard Cards** och installera
5. Ladda om Home Assistant

---

## Installation manuellt

1. Ladda ner `pool-dashboard-cards.js` från [senaste release](https://github.com/johro897/pool-dashboard-cards/releases/latest)
2. Kopiera till `/config/www/pool-dashboard-cards.js`
3. Gå till **Settings → Dashboards → Resources** → Lägg till:
   - URL: `/local/pool-dashboard-cards.js`
   - Typ: `JavaScript Module`
4. Ladda om Home Assistant

---

## Konfiguration

### pool-picture-card

```yaml
type: custom:pool-picture-card
image: /local/pool_v2.png
entities:
  time:          sensor.time
  date:          sensor.date
  air_temp:      sensor.smhi_temperatur
  water_in:      sensor.poolvarme_inlet_water_temp_t02
  water_out:     sensor.poolvarme_outlet_water_temp_t03
  rpm:           sensor.pump_rpm_regulator_pool_pump_rpm
  pump_power:    switch.pump_rpm_regulator_pool_pump_power
  flow:          sensor.pool_flode_aktuellt
  hp_power:      binary_sensor.poolvarme_power
  hp_target:     sensor.poolvarme_heating_set_r02
  energy_today:  sensor.pool_pumpen_energy_2_daily
  watt:          sensor.poolpump_energi_template
```

| Alternativ | Typ | Beskrivning |
|------------|-----|-------------|
| `image` | string | Sökväg till bakgrundsbild (ex. `/local/pool_v2.png`) |
| `entities.time` | entity_id | Klocka (sensor.time) |
| `entities.date` | entity_id | Datum (sensor.date) |
| `entities.air_temp` | entity_id | Lufttemperatur |
| `entities.water_in` | entity_id | Vattentemperatur inlopp |
| `entities.water_out` | entity_id | Vattentemperatur utlopp |
| `entities.rpm` | entity_id | Pump RPM |
| `entities.pump_power` | entity_id | Pump på/av (switch) |
| `entities.flow` | entity_id | Vattenflöde (L/h) |
| `entities.hp_power` | entity_id | Värmepump på/av (binary_sensor) |
| `entities.hp_target` | entity_id | Värmepump måltemperatur |
| `entities.energy_today` | entity_id | Energi idag (kWh) |
| `entities.watt` | entity_id | Aktuell effekt (W) |
| `positions` | object | Auto-genereras av drag-to-position (redigera ej manuellt) |

#### Flytta chips
Tryck på **✏️**-knappen (nere till höger på kortet) för att aktivera redigeringsläge.  
Dra chips till önskad position → **💾 Spara**.

---

### pool-sensors-card

```yaml
type: custom:pool-sensors-card
entities:
  water_temp:    sensor.poolvarme_inlet_water_temp_t02
  flow:          sensor.pool_flode_aktuellt
  pump_watt:     sensor.poolpump_energi_template
  energy_today:  sensor.pool_pumpen_energy_2_daily
  hp_power:      binary_sensor.poolvarme_power
  cop:           sensor.din_cop_sensor        # Valfri
  circulation:   sensor.pool_cirkulation_per_dygn
```

| Alternativ | Typ | Beskrivning |
|------------|-----|-------------|
| `entities.water_temp` | entity_id | Vattentemperatur (inlopp) |
| `entities.flow` | entity_id | Vattenflöde (L/h) |
| `entities.pump_watt` | entity_id | Pump effekt (W) |
| `entities.energy_today` | entity_id | Energi idag (kWh) |
| `entities.hp_power` | entity_id | Värmepump på/av (binary_sensor) |
| `entities.cop` | entity_id | COP-sensor (valfri — döljs om ej angiven) |
| `entities.circulation` | entity_id | Cirkulation per dygn |

---

## Cirkulationsfärger

Cirkulationsvärdet färgkodas automatiskt:

| Värde | Färg | Innebör |
|-------|------|---------|
| < 1.5 ggr | 🔴 Röd | För låg cirkulation |
| 1.5–3 ggr | 🟡 Gul | Godkänd |
| > 3 ggr | 🟢 Grön | Bra cirkulation |

---

## Krav

- Home Assistant 2023.9+
- Inga beroenden av andra custom cards

---

## Changelog

### v1.0.0
- Initial release
- pool-picture-card med drag-to-position och visuell editor
- pool-sensors-card med färgkodade värden

---

## Licens

MIT License — se [LICENSE](LICENSE)
