/*
 * NASMOST Planning (web) — page d'administration : statistiques de fréquentation.
 * Chargée seulement sur #/admin. Données : feeds/stats.json, préparé toutes les 3 h par l'action
 * GitHub à partir de GoatCounter (comptage sans cookies ni données personnelles).
 * Carte : D3 + TopoJSON (frontières du monde, world-atlas), chargés à la demande.
 */
"use strict";

// ISO 3166-1 : code à deux lettres (GoatCounter) -> code numérique (carte world-atlas).
const ISO_NUMERIC = Object.fromEntries(("AF004 AL008 DZ012 AS016 AD020 AO024 AI660 AQ010 AG028 AR032 AM051 AW533 AU036 AT040 AZ031 BS044 BH048 BD050 BB052 BY112 BE056 BZ084 BJ204 BM060 BT064 BO068 BA070 BW072 BR076 BN096 BG100 BF854 BI108 CV132 KH116 CM120 CA124 KY136 CF140 TD148 CL152 CN156 CO170 KM174 CG178 CD180 CK184 CR188 CI384 HR191 CU192 CW531 CY196 CZ203 DK208 DJ262 DM212 DO214 EC218 EG818 SV222 GQ226 ER232 EE233 SZ748 ET231 FK238 FO234 FJ242 FI246 FR250 GF254 PF258 TF260 GA266 GM270 GE268 DE276 GH288 GI292 GR300 GL304 GD308 GP312 GU316 GT320 GG831 GN324 GW624 GY328 HT332 HN340 HK344 HU348 IS352 IN356 ID360 IR364 IQ368 IE372 IM833 IL376 IT380 JM388 JP392 JE832 JO400 KZ398 KE404 KI296 KP408 KR410 KW414 KG417 LA418 LV428 LB422 LS426 LR430 LY434 LI438 LT440 LU442 MO446 MG450 MW454 MY458 MV462 ML466 MT470 MH584 MQ474 MR478 MU480 YT175 MX484 FM583 MD498 MC492 MN496 ME499 MS500 MA504 MZ508 MM104 NA516 NR520 NP524 NL528 NC540 NZ554 NI558 NE562 NG566 MK807 NO578 OM512 PK586 PW585 PS275 PA591 PG598 PY600 PE604 PH608 PL616 PT620 PR630 QA634 RE638 RO642 RU643 RW646 KN659 LC662 VC670 WS882 SM674 ST678 SA682 SN686 RS688 SC690 SL694 SG702 SK703 SI705 SB090 SO706 ZA710 SS728 ES724 LK144 SD729 SR740 SE752 CH756 SY760 TW158 TJ762 TZ834 TH764 TL626 TG768 TO776 TT780 TN788 TR792 TM795 TC796 TV798 UG800 UA804 AE784 GB826 US840 UY858 UZ860 VU548 VE862 VN704 VG092 VI850 EH732 YE887 ZM894 ZW716 XK-99")
  .split(" ").map((c) => [c.slice(0, 2), c.slice(2)]));

// Échelle séquentielle (une teinte, du clair au foncé) : bleu marin de l'application ; gris sable = aucune visite.
const RAMP = ["#D6E6EE", "#A9CBDA", "#6FA6C2", "#2F7BA3", "#0B3954"];
const NO_DATA = "#E9E4DB";

const ADMIN_TEXTS = {
  fr: {
    title: "Statistiques", note: "Visites de la version web, comptées sans cookies ni données personnelles (GoatCounter). Mises à jour toutes les 3 heures.",
    last30: "30 derniers jours", all: "Depuis le lancement", visits: "Visites", countries: "Pays", topCountry: "Premier pays",
    map: "Visites par pays", daily: "Visites par jour", byCountry: "Pays", pages: "Pages les plus vues", browsers: "Navigateurs",
    systems: "Systèmes", sizes: "Tailles d'écran", share: "Part", none: "Aucune visite sur cette période.",
    missing: "Les statistiques ne sont pas encore disponibles : le comptage commence à la mise en ligne du site (compte GoatCounter et clé d'API à configurer, voir le guide).",
    noVisits: "aucune visite", visit: (n) => `${n.toLocaleString("fr-FR")} visite${n > 1 ? "s" : ""}`, updated: (d) => `Mis à jour le ${d}`,
    mapError: "La carte n'a pas pu être chargée (connexion ?) : le tableau ci-dessous donne les mêmes chiffres.",
  },
  en: {
    title: "Statistics", note: "Visits to the web version, counted without cookies or personal data (GoatCounter). Updated every 3 hours.",
    last30: "Last 30 days", all: "Since launch", visits: "Visits", countries: "Countries", topCountry: "Top country",
    map: "Visits by country", daily: "Visits per day", byCountry: "Country", pages: "Most viewed pages", browsers: "Browsers",
    systems: "Operating systems", sizes: "Screen sizes", share: "Share", none: "No visits in this period.",
    missing: "Statistics are not available yet: counting starts when the site goes live (GoatCounter account and API key to be configured, see the guide).",
    noVisits: "no visits", visit: (n) => `${n.toLocaleString("en-GB")} visit${n > 1 ? "s" : ""}`, updated: (d) => `Updated ${d}`,
    mapError: "The map could not be loaded (connection?): the table below gives the same figures.",
  },
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script"); s.src = src; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
  });
}

window.renderAdmin = async function renderAdmin(main, lang, periodKey) {
  const t = ADMIN_TEXTS[lang] || ADMIN_TEXTS.fr, esc = window.nasmostEscape;
  main.innerHTML = `<div class="empty">…</div>`;
  let stats = null;
  try { const r = await fetch("feeds/stats.json", { cache: "no-cache" }); if (r.ok) stats = await r.json(); } catch { /* pas encore de statistiques */ }
  if (!stats) { main.innerHTML = `<div class="card"><h2>${esc(t.title)}</h2><div class="text">${esc(t.missing)}</div></div>`; return; }
  const period = stats[periodKey] || stats.last30;
  const regionName = (() => { try { const dn = new Intl.DisplayNames([lang], { type: "region" }); return (c) => { try { return dn.of(c); } catch { return c; } }; } catch { return (c) => c; } })();
  const countries = (period.locations || []).filter((l) => l.count > 0 && l.id && l.id.length === 2)
    .map((l) => ({ code: l.id.toUpperCase(), name: regionName(l.id.toUpperCase()) || l.name, count: l.count })).sort((a, b) => b.count - a.count);
  const total = period.total || 0, max = countries.length ? countries[0].count : 0;
  const breaks = max ? [...new Set([1, 2, 3, 4].map((k) => Math.max(1, Math.round(Math.pow(max, k / 5)))))] : [];
  const colorOf = (n) => { if (!n) return NO_DATA; let i = 0; while (i < breaks.length && n > breaks[i]) i++; return RAMP[Math.min(i, RAMP.length - 1)]; };
  const pct = (n) => (!total ? "–" : (100 * n) / total < 1 ? "< 1 %" : `${Math.round((100 * n) / total)} %`);
  const table = (title, list, nameOf = (r) => r.name) => list && list.length ? `<div class="card"><h2>${esc(title)}</h2><table class="stats-table"><tbody>` +
    list.slice(0, 12).map((r) => `<tr><td>${esc(nameOf(r))}</td><td class="num">${r.count.toLocaleString()}</td><td class="num muted">${pct(r.count)}</td></tr>`).join("") + `</tbody></table></div>` : "";
  const updated = new Date(stats.generated).toLocaleString(lang === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" });

  main.innerHTML =
    `<div class="chips">` + [["last30", t.last30], ["all", t.all]].map(([k, l]) => `<button class="chip ${k === (stats[periodKey] ? periodKey : "last30") ? "selected" : ""}" data-period="${k}">${esc(l)}</button>`).join("") + `</div>` +
    `<div class="kpis"><div class="kpi"><div class="value">${total.toLocaleString()}</div><div class="label">${esc(t.visits)}</div></div>` +
    `<div class="kpi"><div class="value">${countries.length}</div><div class="label">${esc(t.countries)}</div></div>` +
    `<div class="kpi"><div class="value small-value">${esc(countries[0] ? countries[0].name : "–")}</div><div class="label">${esc(t.topCountry)}</div></div></div>` +
    `<div class="card"><h2>${esc(t.map)}</h2><div id="worldMap" class="world-map"></div><div class="map-legend">` +
    `<span><i style="background:${NO_DATA}"></i>0</span>` + RAMP.slice(0, breaks.length + 1).map((c, i) => {
      const lo = i === 0 ? 1 : breaks[i - 1] + 1, hi = i < breaks.length ? breaks[i] : max;
      return `<span><i style="background:${c}"></i>${lo === hi ? lo : `${lo}–${hi}`}</span>`;
    }).join("") + `</div></div>` +
    `<div class="card"><h2>${esc(t.daily)}</h2><div id="dailyChart"></div></div>` +
    (countries.length ? table(t.byCountry, countries) : `<div class="card"><div class="text">${esc(t.none)}</div></div>`) +
    table(t.pages, period.pages) + table(t.browsers, period.browsers) + table(t.systems, period.systems) + table(t.sizes, period.sizes) +
    `<p class="small center">${esc(t.note)}<br>${esc(t.updated(updated))}</p><div id="statsTip" class="stats-tip" hidden></div>`;
  main.querySelectorAll("[data-period]").forEach((b) => b.onclick = () => window.go(`#/admin/${b.dataset.period}`));

  const tip = document.getElementById("statsTip");
  const showTip = (ev, html) => { tip.innerHTML = html; tip.hidden = false; const x = Math.min(ev.clientX + 12, innerWidth - tip.offsetWidth - 8); tip.style.left = x + "px"; tip.style.top = (ev.clientY - tip.offsetHeight - 12) + "px"; };
  const hideTip = () => (tip.hidden = true);

  // ---- histogramme des visites par jour (une série : pas de légende, le titre la nomme)
  const days = period.days || [], chart = document.getElementById("dailyChart");
  if (days.length) {
    const w = 640, h = 220, pad = { l: 52, r: 6, t: 12, b: 34 }, peak = Math.max(1, ...days.map((d) => d.count));
    const bw = (w - pad.l - pad.r) / days.length, y = (v) => pad.t + (h - pad.t - pad.b) * (1 - v / peak);
    const ticks = [0, Math.ceil(peak / 2), peak];
    let s = `<svg viewBox="0 0 ${w} ${h}" class="daily-svg" role="img" aria-label="${esc(t.daily)}">`;
    s += ticks.map((v) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pad.l - 6}" y="${y(v) + 7}" class="axis" text-anchor="end">${v}</text>`).join("");
    days.forEach((d, i) => {
      const x = pad.l + i * bw + 1, bh = Math.max(0, h - pad.b - y(d.count));
      s += `<rect class="bar" x="${x}" y="${h - pad.b - bh}" width="${Math.max(1, bw - 2)}" height="${bh}" rx="${Math.min(4, bw / 3)}" data-day="${d.day}" data-count="${d.count}"/>`;
      s += `<rect class="hit" x="${pad.l + i * bw}" y="${pad.t}" width="${bw}" height="${h - pad.t - pad.b}" data-day="${d.day}" data-count="${d.count}"/>`;
    });
    const label = (d) => new Date(d + "T12:00:00").toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "short" });
    s += `<text x="${pad.l}" y="${h - 8}" class="axis">${esc(label(days[0].day))}</text><text x="${w - pad.r}" y="${h - 8}" class="axis" text-anchor="end">${esc(label(days[days.length - 1].day))}</text></svg>`;
    chart.innerHTML = s;
    chart.querySelectorAll(".hit").forEach((r) => {
      const show = (ev) => showTip(ev, `<strong>${esc(label(r.dataset.day))}</strong><br>${esc(t.visit(+r.dataset.count))}`);
      r.addEventListener("pointermove", show); r.addEventListener("pointerdown", show); r.addEventListener("pointerleave", hideTip);
    });
  } else chart.innerHTML = `<div class="small">${esc(t.none)}</div>`;

  // ---- carte du monde (choroplèthe)
  const mapEl = document.getElementById("worldMap");
  try {
    await loadScript("https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js");
    await loadScript("https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js");
    if (!window.worldAtlas) window.worldAtlas = await (await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json")).json();
    const byNumeric = Object.fromEntries(countries.map((c) => [ISO_NUMERIC[c.code], c]));
    const land = topojson.feature(window.worldAtlas, window.worldAtlas.objects.countries).features.filter((f) => f.id !== "010"); // sans l'Antarctique
    const w = 640, h = 330, projection = d3.geoNaturalEarth1().fitSize([w, h], { type: "FeatureCollection", features: land });
    const path = d3.geoPath(projection);
    const svgEl = d3.select(mapEl).append("svg").attr("viewBox", `0 0 ${w} ${h}`).attr("class", "map-svg").attr("role", "img").attr("aria-label", t.map);
    svgEl.selectAll("path").data(land).join("path").attr("d", path)
      .attr("fill", (f) => colorOf(byNumeric[f.id] ? byNumeric[f.id].count : 0)).attr("class", "country")
      .on("pointermove pointerdown", (ev, f) => {
        const c = byNumeric[f.id], name = c ? c.name : (f.properties && f.properties.name) || "";
        showTip(ev, `<strong>${esc(name)}</strong><br>${esc(c ? t.visit(c.count) + " · " + pct(c.count) : t.noVisits)}`);
      })
      .on("pointerleave", hideTip);
  } catch {
    mapEl.innerHTML = `<div class="small">${esc(t.mapError)}</div>`;
  }
};
