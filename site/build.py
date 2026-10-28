"""Build the Pangolin Design System site.

Inputs (all in this repo):
  data/tokens.json        token values, synced from the app repo (the only place they are edited)
  data/*Catalog.kt       catalog sources, for component state labels
  data/shots/*.png        screenshots of the real Compose components, light, dark and private
  data/manifest.json      which app commit and CI run produced them
  site/*                  page template, brand copy, component docs, icons
Output: _site/index.html plus _site/shots/, ready for GitHub Pages.

Usage: python3 site/build.py [OUT_DIR]   (default _site). Python 3.8+, standard library only,
plus Pillow if present to trim tall menu screenshots.
"""
import json, re, sys, os, shutil
S = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(S)
DATA = os.path.join(ROOT, 'data')
OUT_DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '_site')
tpl = open(os.path.join(S, 'template.html')).read()
tpl = re.sub(r'\bds\b', 'pgn', tpl)

def rep(old, new, count=1):
    global tpl
    assert old in tpl, 'missing: ' + old[:80]
    tpl = tpl.replace(old, new, count)

def between(start, end, new):
    global tpl
    i = tpl.index(start); j = tpl.index(end, i)
    tpl = tpl[:i] + new + tpl[j:]

# Inputs: the repo's design/tokens.json (only source of token values) and the published catalog
# screenshots (design-screenshots branch). Usage: build.py OUT.html REPO SHOTS_DIR
SHOTS = os.path.join(DATA, 'shots')
T = json.load(open(os.path.join(DATA, 'tokens.json')))
icons = json.load(open(os.path.join(S, 'icons.json')))
logo = json.load(open(os.path.join(S, 'logo.json')))

# ---------- Semantic tokens with per mode refs ----------
NOTES = {
    'bg/page': 'Screen background behind content',
    'bg/container-lowest': 'Deepest container',
    'bg/container-low': 'Address bar and toolbar in private mode, bottom sheets',
    'bg/container': 'Address bar and toolbar in normal mode, menus',
    'bg/container-high': 'Tab tiles, pill track, list cards, dialogs',
    'bg/container-highest': 'Address field, search field, progress track',
    'bg/accent': 'Filled button, progress indicator',
    'bg/accent-container': 'Pill highlight, New tab button, letter badges',
    'bg/error-container': 'Error banner',
    'bg/inverse': 'Snackbar',
    'bg/scrim-tile': 'Behind the close button on a tile',
    'bg/private-marker': 'Private marker color (the chip was removed in D14)',
    'text/primary': 'Body text and icons',
    'text/secondary': 'Hosts, supporting text, passive symbols',
    'text/disabled': 'Disabled text and icons',
    'text/accent': 'Text buttons, selected icons',
    'text/on-accent': 'Text on bg/accent',
    'text/on-accent-container': 'Text on bg/accent-container',
    'text/error': 'Errors, destructive actions',
    'text/on-error-container': 'Text on bg/error-container',
    'text/inverse': 'Snackbar message',
    'text/inverse-accent': 'Snackbar action (Undo)',
    'text/on-scrim': 'Close symbol on bg/scrim-tile',
    'text/on-private-marker': 'Private marker text (unused since D14)',
    'border/outline': 'Outlined button, field outlines',
    'border/outline-variant': 'Dividers, preview canvas dots',
    'border/selected': 'Selected tile border',
    'border/focus': 'Keyboard focus ring',
}
ORDER = ['bg/page', 'bg/container-lowest', 'bg/container-low', 'bg/container', 'bg/container-high', 'bg/container-highest',
         'bg/accent', 'bg/accent-container', 'bg/error-container', 'bg/inverse', 'bg/scrim-tile', 'bg/private-marker',
         'text/primary', 'text/secondary', 'text/disabled', 'text/accent', 'text/on-accent', 'text/on-accent-container',
         'text/error', 'text/on-error-container', 'text/inverse', 'text/inverse-accent', 'text/on-scrim', 'text/on-private-marker',
         'border/outline', 'border/outline-variant', 'border/selected', 'border/focus']
P = T['primitives']
MODES = T['colors']['modes']
def hexof(ref):
    if ref == 'white': return '#FFFFFF'
    if ref == 'black': return '#000000'
    if ref.startswith('#'): return ref
    f, t = ref.split('/'); return P[f]['tones'][t]
def rgba(hx, a): return f"rgb({int(hx[1:3],16)} {int(hx[3:5],16)} {int(hx[5:7],16)} / {a})"
def site_ref(v):
    return rgba(hexof(v['ref']), v['alpha']) if isinstance(v, dict) else v
sem = []
for n, per_mode in T['colors']['values'].items():
    vals = {m: site_ref(per_mode[m]) for m in MODES}
    ref = vals[MODES[0]] if len(set(map(str, vals.values()))) == 1 else vals
    sem.append([n, ref, '', NOTES.get(n, '')])
prims = {f: {'label': fam['label'], **fam['tones']} for f, fam in P.items()}
kebab = lambda k: re.sub(r'([A-Z])', lambda m: '-' + m.group(1).lower(), k)
scales = {
    '__SPACE__': json.dumps(T['spacing']),
    '__RADIUS__': json.dumps({**T['radius'], 'full': 999}),
    '__TYPE__': json.dumps([[kebab(k), v['size'], v['line'], v['weight'], v['use']] for k, v in T['type'].items()]),
    '__BARS__': json.dumps([[k, (f"{v['dp']}dp" if 'dp' in v else f"{v['int']} ms" if 'int' in v else f"{round(v['float'] * 100)}%"), v['doc']] for k, v in T['bars'].items()]),
    '__LAYOUT__': json.dumps([[kebab(k).lstrip('-').lower().replace('_', '-'), (f"{v['dp']}dp" if 'dp' in v else f"{v['int']}dp"), ''] for k, v in T['layout'].items()]),
}

logos = [
    {'name': 'App icon (adaptive, full color)', 'bg': '#2F6F5E', 'svg': logo['ic_launcher_foreground'].replace('<svg ', '<svg width="132" height="132" ')},
    {'name': 'Themed icon (monochrome) on light', 'bg': 'bg/page', 'svg': logo['ic_launcher_monochrome'].replace('fill="#000000"', 'fill="currentColor"').replace('<svg ', '<svg width="132" height="132" style="color:var(--pgn-text-accent)" ')},
    {'name': 'Themed icon on private', 'bg': 'bg/page', 'mode': 'private', 'svg': logo['ic_launcher_monochrome'].replace('fill="#000000"', 'fill="currentColor"').replace('<svg ', '<svg width="132" height="132" style="color:var(--pgn-text-accent)" ')},
]

brand = open(os.path.join(S, 'brand.js')).read()
brand = brand.replace('__PRIMS__', json.dumps(prims, indent=1)).replace('__SEM__', json.dumps(sem, indent=0)).replace('__LOGOS__', json.dumps(logos))
for k, v in scales.items(): brand = brand.replace(k, v)

# Real component screenshots: labels from the catalog source, files from the screenshots branch.
cat_src = '\n'.join(open(os.path.join(DATA, f)).read() for f in sorted(os.listdir(DATA)) if f.endswith('Catalog.kt'))
shots = {}
manifest = {}
if SHOTS:
    manifest = json.load(open(os.path.join(DATA, 'manifest.json')))
    files = set(os.listdir(SHOTS))
    for m in re.finditer(r'CatalogEntry\("([a-z0-9-]+)", "([^"]+)", CatalogGroup\.(\w+), listOf\((.*?)\n        \)\),', cat_src, re.S):
        eid, body = m.group(1), m.group(4)
        states = []
        for st in re.finditer(r'\b\w*State\(\s*"([a-z0-9-]+)",\s*"([^"]+)"', body):
            sid, label = st.group(1), st.group(2)
            per = {mode: f'shots/{eid}__{sid}__{mode}.png' for mode in MODES if f'{eid}__{sid}__{mode}.png' in files}
            if per: states.append({'id': sid, 'label': label, 'files': per})
        if states: shots[eid] = states
brand += '\nwindow.DS_SHOTS = ' + json.dumps(shots) + ';\nwindow.DS_SHOTS_META = ' + json.dumps(manifest) + ';\n'
comps = open(os.path.join(S, 'components.js')).read().replace('__ICONS__', json.dumps(icons))
css = open(os.path.join(S, 'comp.css')).read()

# ---------- Replace template blocks ----------
between('<!doctype html>', '<!-- Product tokens.', '<title>Pangolin Design System</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,400;8..144,500;8..144,600;8..144,700&family=Roboto+Mono:wght@400;500&display=swap">\n\n')
between('<style id="pgn-comp">', '</style>', '<style id="pgn-comp">\n' + css)
rep('</head>\n<body>\n', '')
rep('</body>\n</html>', '')
between('/* =====================================================================\n   BRAND + TOKENS', '</script>', brand)
between('/* =====================================================================\n   COMPONENTS.', '</script>', comps)

# ---------- Docs chrome: Pangolin palette ----------
rep("--accent: #2c5fd9; --accent-soft: #eef2fc;", "--accent: #7F571E; --accent-soft: #FBEBDD;")
rep("--t-tag: #2c5fd9; --t-attr: #8a4fbf; --t-str: #1f7a4d; --t-com: #8b8e96;", "--t-tag: #7F571E; --t-attr: #1F6B4F; --t-str: #2F6F5E; --t-com: #817365;")
rep("--ui: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif; --mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;",
    "--ui: 'Roboto Flex', Roboto, system-ui, sans-serif; --mono: 'Roboto Mono', ui-monospace, Menlo, monospace;")
for _ in range(2):
    rep("--accent: #8aaaf5; --accent-soft: #1d2741;", "--accent: #EBBF8A; --accent-soft: #2D2419;")
    rep("--t-tag: #8aaaf5; --t-attr: #c9a0f0; --t-str: #8fd1a8;", "--t-tag: #EBBF8A; --t-attr: #8CD5B3; --t-str: #B5F0D3;")

# Extra chrome CSS: mode switch, previews follow the product mode, icon grid fills
EXTRA = """
.modes { display: inline-flex; padding: 3px; gap: 2px; border: 1px solid var(--line); border-radius: 999px; background: var(--panel); }
.modes button { border: 0; padding: 4px 10px; border-radius: 999px; background: transparent; color: var(--muted); font: 500 12px var(--ui); cursor: pointer; white-space: nowrap; }
.modes button[aria-pressed="true"] { background: var(--accent-soft); color: var(--accent); }
@media (max-width: 640px) { .modes button { padding: 4px 7px; font-size: 11px; } .modes .long { display: none; } }
.canvas, .gallery { background-color: var(--pgn-bg-page); background-image: radial-gradient(var(--pgn-border-outline-variant) 1px, transparent 1px); color-scheme: normal; }
.icon-grid svg { fill: currentColor; stroke: none; }
.mode-cols td.sw-cell { width: 44px; padding-right: 4px; }
.phase { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 999px; background: var(--accent-soft); color: var(--accent); font: 500 12px var(--ui); }
.phases { display: grid; gap: 16px; }
.phases article { padding: 18px 20px; border: 1px solid var(--line); border-radius: 12px; }
.phases h3 { margin: 0 0 8px; font-size: 17px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.phases ul { margin: 0; padding-left: 20px; }
.motion-demo { position: relative; height: 28px; border-radius: 999px; background: var(--panel); overflow: hidden; }
.motion-demo i { position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; border-radius: 50%; background: var(--accent); }
.motion-demo.go i { left: calc(100% - 24px); }
@media (max-width: 520px) { #brand-name { display: none; } .top { gap: 8px; } .search { min-width: 0; } }
.tonal { display: grid; place-items: center; width: 120px; height: 88px; border-radius: 16px; font: 12px var(--mono); color: var(--pgn-text-primary); }
"""
tpl = tpl.replace('.t-tag { color: var(--t-tag); }', EXTRA + '.t-tag { color: var(--t-tag); }', 1)

# Top bar: product mode switch instead of the Figma link
rep('<a class="tbtn hide-sm" id="figma-link" target="_blank" rel="noopener">Figma ↗</a>',
    '<div class="modes" role="group" aria-label="Preview mode"><button data-mode="light" aria-pressed="true">Light</button><button data-mode="dark" aria-pressed="false">Dark</button><button data-mode="private" aria-pressed="false">Private</button></div>')

# ---------- Engine patches ----------
E = """const refHex = r => r === 'white' ? '#ffffff' : r === 'black' ? '#000000' : r.startsWith('#') ? r : (P[r.split('/')[0]] || {})[r.split('/')[1]] || r;
const refCSS = r => r === 'white' ? '#ffffff' : r === 'black' ? '#000000' : r.startsWith('#') ? r : `var(${primVar(...r.split('/'))})`;"""
rep(E, """const MODES = BR.modes.map(m => m.id);
const modeRef = (r, m) => typeof r === 'object' ? r[m] : r;
const refHex = r => r === 'white' ? '#ffffff' : r === 'black' ? '#000000' : r.startsWith('#') || r.startsWith('rgb') ? r : (P[r.split('/')[0]] || {})[r.split('/')[1]] || r;
const refCSS = r => r === 'white' ? '#ffffff' : r === 'black' ? '#000000' : r.startsWith('#') || r.startsWith('rgb') ? r : `var(${primVar(...r.split('/'))})`;
const hex8 = c => { if (c.startsWith('#')) return '0xFF' + c.slice(1).toUpperCase(); const m = c.match(/rgb\\((\\d+) (\\d+) (\\d+) \\/ ([\\d.]+)\\)/); return '0x' + [Math.round(+m[4] * 255), +m[1], +m[2], +m[3]].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase(); };""")
rep("  for (const [n, r] of SEM) L.push(`  ${semVar(n)}: ${refCSS(r)};`);",
    "  for (const [n, r] of SEM) L.push(`  ${semVar(n)}: ${refCSS(modeRef(r, MODES[0]))};`);")
rep("  L.push('}'); return L.join('\\n');\n}",
    "  L.push('}');\n  for (const m of MODES.slice(1)) { L.push(`[data-pgn-mode=\"${m}\"] {`); for (const [n, r] of SEM) if (typeof r === 'object') L.push(`  ${semVar(n)}: ${refCSS(r[m])};`); L.push('}'); }\n  L.push(`[data-pgn-mode=\"${MODES[0]}\"] {`); for (const [n, r] of SEM) if (typeof r === 'object') L.push(`  ${semVar(n)}: ${refCSS(r[MODES[0]])};`); L.push('}');\n  return L.join('\\n');\n}")
rep("  for (const [n, r, st, note] of SEM) o.semantic[n] = { $value: r.includes('/') ? `{color.${r.replace('/', '.')}}` : refHex(r), $type: 'color', ...(st ? { $extensions: { status: st, ...(note ? { note } : {}) } } : {}) };",
    "  const jv = r => r.includes('/') && !r.startsWith('rgb') ? `{color.${r.replace('/', '.')}}` : refHex(r);\n  for (const [n, r, st, note] of SEM) o.semantic[n] = { $value: typeof r === 'object' ? jv(r[MODES[0]]) : jv(r), $type: 'color', ...(typeof r === 'object' ? { $extensions: { modes: Object.fromEntries(MODES.map(m => [m, jv(r[m])])) } } : {}) };")
# Kotlin export
rep("const TOKENS_CSS = buildCSS();", r"""function buildKotlin() {
  const camel = n => n.replace(/[\/-](\w)/g, (m, c) => c.toUpperCase());
  const L = ['package design.darrin.pangolin.core.designsystem', '', '// Generated from the Pangolin design system site. Edit the site, then regenerate.', '', 'import androidx.compose.foundation.shape.RoundedCornerShape', 'import androidx.compose.runtime.Immutable', 'import androidx.compose.ui.graphics.Color', 'import androidx.compose.ui.unit.dp', ''];
  L.push('@Immutable', 'data class PangolinColors(', ...SEM.map(([n]) => `    val ${camel(n)}: Color,`), ')', '');
  for (const m of BR.modes) {
    L.push(`val ${m.id[0].toUpperCase() + m.id.slice(1)}Colors = PangolinColors(`);
    for (const [n, r] of SEM) L.push(`    ${camel(n)} = Color(${hex8(refHex(modeRef(r, m.id)))}),`);
    L.push(')', '');
  }
  L.push('object PangolinSpacing {', ...SC.space.map(v => `    val Space${v} = ${v}.dp`), '}', '');
  L.push('object PangolinShapes {', ...Object.entries(SC.radius).filter(([k]) => k !== 'full').map(([k, v]) => `    val ${k[0].toUpperCase() + k.slice(1)} = RoundedCornerShape(${v}.dp)`), '    val Full = RoundedCornerShape(percent = 50)', '}');
  return L.join('\n');
}
const TOKENS_CSS = buildCSS();""")
# Colors page: three swatch columns
rep("<tr><th style=\"width:52px\"></th><th>Token</th><th>CSS</th><th>Points to</th></tr></thead><tbody>${list.map(([n, r, st, note]) => `<tr><td><span class=\"sw\" style=\"background:var(${semVar(n)})\"></span></td><td><code>${esc(n)}</code> ${st ? badge(st) : ''}${note ? `<div class=\"muted\" style=\"font-size:13px\">${esc(note)}</div>` : ''}</td><td><code>${semVar(n)}</code></td><td><code>${esc(r)}</code> <span class=\"muted\" style=\"font-size:12px\">${esc(refHex(r))}</span></td></tr>`).join('')}",
    "<tr>${MODES.map(m => `<th style=\"width:44px\" title=\"${esc(BR.modes.find(x => x.id === m).name)}\">${esc(BR.modes.find(x => x.id === m).name.replace('Normal ', ''))}</th>`).join('')}<th>Token</th><th>CSS</th><th>Points to (light · dark · private)</th></tr></thead><tbody>${list.map(([n, r, st, note]) => `<tr>${MODES.map(m => `<td class=\"sw-cell\" data-pgn-mode=\"${m}\"><span class=\"sw\" style=\"background:var(${semVar(n)})\" title=\"${esc(refHex(modeRef(r, m)))}\"></span></td>`).join('')}<td><code>${esc(n)}</code> ${st ? badge(st) : ''}${note ? `<div class=\"muted\" style=\"font-size:13px\">${esc(note)}</div>` : ''}</td><td><code>${semVar(n)}</code></td><td>${(typeof r === 'object' ? MODES.map(m => r[m]) : [r]).map(x => `<code>${esc(x)}</code> <span class=\"muted\" style=\"font-size:12px\">${esc(refHex(x))}</span>`).join('<br>')}</td></tr>`).join('')}")
rep("const dark = parseInt(k) >= 500;", "const dark = parseInt(k) < 55;")
rep("<p class=\"lede\">Use semantic tokens in components. Primitives exist so semantic tokens have something to point at.</p>",
    "<p class=\"lede\">Use semantic tokens in components. Each one has a value for normal light, normal dark and private. Primitives are Material tonal ramps, keyed by tone, so the semantic tokens have something to point at.</p>")
# Typography: usage column
rep("<th>Token</th><th>Size / line</th><th>Weight</th><th>Sample</th></tr></thead><tbody>${SC.type.map(([n, s, lh, w]) => `<tr><td><code>--pgn-type-${n}</code></td><td>${s} / ${lh}</td><td>${w}</td><td class=\"pgn\" style=\"font:var(--pgn-type-${n})\">The quick brown fox</td></tr>`).join('')}",
    "<th>Token</th><th>Size / line (sp)</th><th>Weight</th><th>Used for</th><th>Sample</th></tr></thead><tbody>${SC.type.map(([n, s, lh, w, u]) => `<tr><td><code>--pgn-type-${n}</code></td><td>${s} / ${lh}</td><td>${w}</td><td>${esc(u || '')}</td><td class=\"pgn\" style=\"font:var(--pgn-type-${n})\">Search privately</td></tr>`).join('')}")
rep(">Font-size scale</h2>", ">Type scale</h2><p class=\"muted\">The Material 3 scale, assigned to app roles so screens pick a role, not a size. Text always scales with the system font size; layouts must hold at 200%.</p>")
rep("`.title { font: var(--pgn-type-heading-md); }\\n.body  { font: var(--pgn-type-body); color: var(--pgn-text-secondary); }`",
    "`Text(\"Bookmarks\", style = PangolinTheme.type.headlineSm)\\nText(host, style = PangolinTheme.type.bodySm, color = PangolinTheme.colors.textSecondary)`")
rep(">CSS</h2><div class=\"code-wrap\"", ">Compose</h2><div class=\"code-wrap\"")
# Spacing page: dp labels, tonal levels, layout table
rep("<header class=\"page-head\"><p class=\"eyebrow\">Foundations</p><h1>Spacing, radius &amp; elevation</h1></header>",
    "<header class=\"page-head\"><p class=\"eyebrow\">Foundations</p><h1>Spacing, radius &amp; elevation</h1><p class=\"lede\">Values are dp in the app. A 4dp grid, a soft corner scale, and depth from tone rather than shadow.</p></header>")
rep("<section class=\"sec\"><h2>Elevation</h2><div class=\"tiles\">",
    "<section class=\"sec\"><h2>Tonal levels</h2><p class=\"muted\">Follows the preview mode in the top bar.</p><div class=\"tiles\">${['page', 'container-low', 'container', 'container-high', 'container-highest'].map(k => `<div class=\"tonal\" style=\"background:var(--pgn-bg-${k})\">bg/${k}</div>`).join('')}</div></section>\n    <section class=\"sec\"><h2>Layout</h2><div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Token</th><th>Value</th><th>Used for</th></tr></thead><tbody>${SC.layout.map(([n, v, u]) => `<tr><td><code>${n}</code></td><td>${v}</td><td>${esc(u)}</td></tr>`).join('')}</tbody></table></div></section>\n    <section class=\"sec\"><h2>Overlay shadows</h2><p class=\"muted\">Only menus, snackbars, dialogs and sheets cast a shadow.</p><div class=\"tiles\">")
# New foundation pages
rep("['icons', 'Icons'], ['logos', 'Logos'], ['tokens', 'Tokens for code']];",
    "['motion', 'Motion & haptics'], ['bars', 'Browser bars & glass'], ['icons', 'Icons'], ['logos', 'App icon'], ['tokens', 'Tokens for code'], ['roadmap', 'Phases']];")
rep("  tokens: () =>", r"""  motion: () => `<header class="page-head"><p class="eyebrow">Foundations</p><h1>Motion &amp; haptics</h1><p class="lede">Springs without bounce for anything that moves, short fades for anything that appears. Nothing runs longer than 400ms, everything is skipped when the system removes animations, and locking is never animated.</p></header>
    <section class="sec"><h2>Motion tokens</h2><p class="muted">Tap a row to play it.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Token</th><th>Compose spec</th><th>Used for</th><th style="width:30%">Demo</th></tr></thead><tbody>${SC.motion.map(([n, spec, use, kind, a, b]) => `<tr><td><code>${n}</code></td><td><code>${esc(spec)}</code></td><td>${esc(use)}</td><td><button class="motion-btn" data-motion="${n}" aria-label="Play ${n}" style="all:unset;display:block;cursor:pointer"><div class="motion-demo"><i style="transition:left ${kind === 'spring' ? (b > 1000 ? 220 : 380) : a}ms ${kind === 'spring' ? 'cubic-bezier(.2,.9,.3,1)' : b}"></i></div></button></td></tr>`).join('')}</tbody></table></div></section>
    <section class="sec"><h2>Haptics</h2><p class="muted">Every screen goes through one <code>PangolinHaptics</code> helper so the same moment always feels the same. All of it respects the system touch feedback setting.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Moment</th><th>When</th><th>Feedback</th></tr></thead><tbody>${SC.haptics.map(([m, w, f]) => `<tr><td><strong>${esc(m)}</strong></td><td>${esc(w)}</td><td><code>${esc(f)}</code></td></tr>`).join('')}</tbody></table></div></section>`,

  bars: () => `<header class="page-head"><p class="eyebrow">Foundations</p><h1>Browser bars &amp; glass</h1><p class="lede">The address bar and bottom toolbar float over the page as translucent, blurred bars (D10). They are the only glass in Pangolin: menus, snackbars, dialogs and sheets stay solid with a shadow, even over a page (D11).</p></header>
    <section class="sec"><h2>Normal and private</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Normal mode</th><th>Private mode</th></tr></thead><tbody>
      <tr><td><strong>Tint</strong></td><td>The site’s header color (top bar) and footer color (bottom bar), else <code>bg/container</code></td><td>Always <code>bg/container-low</code> of the private palette. Site colors are never read</td></tr>
      <tr><td><strong>Blur</strong></td><td>24dp behind both bars</td><td>Same</td></tr>
      <tr><td><strong>Opacity</strong></td><td>80% over a blurred page, 92% without blur, raised further when needed for contrast</td><td>Same</td></tr>
      <tr><td><strong>Change</strong></td><td>Short fade (<code>motion-bar-tint</code>); the last color stays until the next page reports its own</td><td>Instant with the mode, never animated</td></tr>
    </tbody></table></div></section>
    <section class="sec"><h2>Rules</h2><ul class="notes">
      <li><strong>Readable on any color.</strong> Icons, URL text and the tab counter take the first of the theme text color, the light or dark text color, black or white that reaches 4.5:1 against every surface the bar can show, over white and black page content alike. If none passes, the tint gets more opaque.</li>
      <li><strong>Field follows the tint.</strong> The address field is the tint moved 6% toward black on a light bar or 10% toward white on a dark one, so a white site gets a light bar and a dark site a dark bar.</li>
      <li><strong>One surface with the system bars.</strong> The tints reach behind the status and navigation bars, whose icons switch light or dark to match.</li>
      <li><strong>Nothing private shows through.</strong> The lock screen and empty state cover the page area opaquely, under the bars too, without animation.</li>
      <li><strong>Glass stops at the bars (D11).</strong> Anything else that floats is solid: menus on <code>bg/container</code>, snackbars on <code>bg/inverse</code>, dialogs and sheets on <code>bg/container-high</code>, each with a shadow.</li></ul></section>
    <section class="sec"><h2>Bar tokens</h2><p class="muted"><code>PangolinBars</code> in <code>:core:designsystem</code>; color choice in <code>BarColors</code>, covered by unit tests.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Token</th><th>Value</th><th>Used for</th></tr></thead><tbody>${SC.bars.map(([n, v, u]) => `<tr><td><code>${n}</code></td><td>${v}</td><td>${esc(u)}</td></tr>`).join('')}</tbody></table></div></section>`,

  roadmap: () => `<header class="page-head"><p class="eyebrow">Foundations</p><h1>Phases</h1><p class="lede">The system ships in four phases. Phase 1 is live on this site; later components are scaffolded with their planned API and anatomy and marked ${badge('tbd')}.</p></header>
    <section class="sec phases">${(window.DS_PHASES || []).map(p => { const list = COMPS.filter(c => c.phase === p.n); return `<article><h3><span class="phase">Phase ${p.n}</span>${esc(p.name)} <span class="muted" style="font-size:13px;font-weight:400">${esc(p.status)}</span></h3><ul>${p.items.map(i => `<li>${i}</li>`).join('')}</ul>${list.length ? `<p class="muted" style="margin:10px 0 0;font-size:13px">${list.map(c => `<a href="#${c.id}">${esc(c.name)}</a>`).join(' · ')}</p>` : ''}</article>`; }).join('')}</section>`,

  tokens: () =>""")
rep("<button role=\"tab\" data-tok=\"css\" aria-selected=\"true\">CSS</button>", "<button role=\"tab\" data-tok=\"kt\" aria-selected=\"true\">Compose</button><button role=\"tab\" data-tok=\"css\" aria-selected=\"false\">CSS</button>")
rep("<p class=\"lede\">Paste the CSS into your global stylesheet. JSON follows the W3C design tokens format for Style Dictionary and similar tools.</p>",
    "<p class=\"lede\">Compose is the source for <code>:core:designsystem</code>: the color classes for all three modes, spacing and shapes. CSS and W3C JSON are here for the site and for tools.</p>")
rep("const code = m === 'css' ? TOKENS_CSS : m === 'json' ? buildJSON() : $('#pgn-comp').textContent.trim();",
    "const code = m === 'kt' ? buildKotlin() : m === 'css' ? TOKENS_CSS : m === 'json' ? buildJSON() : $('#pgn-comp').textContent.trim();")
rep("if (id === 'tokens') setTok('css');", "if (id === 'tokens') setTok('kt');")
rep("let tokMode = 'css';", "let tokMode = 'kt';")
# Logos page uses data-pgn-mode where given
rep("<div class=\"lg\" style=\"background:${bgOf(l.bg)}\">", "<div class=\"lg\"${l.mode ? ` data-pgn-mode=\"${l.mode}\"` : ''} style=\"background:${bgOf(l.bg)}\">")
rep("${BR.logos.length ? '' : '<p class=\"lede\">Placeholder marks. Replace with the brand’s logo SVGs in DS_BRAND.logos.</p>'}",
    "<p class=\"lede\">The adaptive launcher icon: a curled pangolin in bronze on green teal, the same two hues as normal and private mode. The themed icon is the monochrome layer Android tints to the wallpaper.</p>")
rep("FOUNDATIONS.find(f => f[0] === id) || ['', 'Overview']", "FOUNDATIONS.find(f => f[0] === id) || ['', 'Overview']")
# Component page: Compose tab, phase meta, parameter header
rep("data-code=\"jsx\" aria-selected=\"${codeMode === 'jsx'}\">React</button>", "data-code=\"jsx\" aria-selected=\"${codeMode === 'jsx'}\">Compose</button>")
rep("<div class=\"meta\">${c.variants ? `<span>${c.variants} variant${c.variants === 1 ? '' : 's'}</span>` : ''}",
    "<div class=\"meta\"><span class=\"phase\">Phase ${c.phase}</span>${c.variants ? `<span>${c.variants} variant${c.variants === 1 ? '' : 's'}</span>` : ''}${c.status === 'tbd' ? '<span>Scaffold: planned API and anatomy, not built yet</span>' : ''}")
rep("<th>Figma property</th><th>Kind</th><th>Values / default</th>", "<th>Parameter</th><th>Kind</th><th>Values / default</th>")
rep("if (c.props) h +=", "if (c.props?.length) h +=")
# Overview copy
rep("<h1>${esc(BR.name)} components for developers</h1><p class=\"lede\">Tokens, foundations and every component with live states, Figma properties and code you can copy.</p>",
    "<h1>${esc(BR.name)} design system</h1><p class=\"lede\">Tokens, foundations and components for the Pangolin Android browser, with live states in normal and private mode and Compose code you can copy.</p>")
rep("<li><strong>Add the tokens.</strong> Copy the CSS custom properties from <a href=\"#tokens\">Tokens for code</a>. Semantic tokens point at primitives, so a palette change only touches one place.</li>",
    "<li><strong>Use the tokens.</strong> <a href=\"#tokens\">Tokens for code</a> generates the Compose color classes for all three modes. Semantic tokens point at primitives, so a palette change only touches one place.</li>")
rep("<li><strong>Match the Figma contract.</strong> Component props use the same names and values as the Figma properties, so a design spec maps one to one to code.</li>",
    "<li><strong>Private stays private.</strong> No component takes an image of page content. Nothing private shows while locked, and private mode never asks a site permission.</li>")
rep("<li><strong>Check states.</strong> Step through every state in the Controls panel before you ship, and compare with the Figma reference on each page.</li>",
    "<li><strong>Check every mode.</strong> Switch Light, Dark and Private in the top bar and step through each state in Controls before you ship. See <a href=\"#roadmap\">Phases</a> for what is built.</li>")
rep("<li><strong>Previews</strong> sit on a light canvas in both site themes, so colors match the product exactly.</li>",
    "<li><strong>Previews</strong> follow the product mode chosen in the top bar, independent of this site’s own light or dark theme.</li>")
rep("Badges mark tokens and components that are ${badge('new')} ${badge('tbd')} or ${badge('deprecated')}. Deprecated tokens list their replacement.",
    "Components marked ${badge('tbd')} are scaffolds for phases 2 to 4.")
rep("<a href=\"#colors\"><strong>Foundations</strong><span>Colors, type, spacing, icons, logos, tokens</span></a>",
    "<a href=\"#colors\"><strong>Foundations</strong><span>Colors, type, spacing, motion, haptics, icons, tokens</span></a>")
# Product mode switch behavior
rep("/* ---------- Boot ---------- */", r"""/* ---------- Product preview mode ---------- */
let pmode = 'light';
try { const m = localStorage.getItem('pgn-preview-mode'); if (MODES.includes(m)) pmode = m; } catch {}
function setMode(m) { pmode = m; $('#main').dataset.pgnMode = m; document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m)); try { localStorage.setItem('pgn-preview-mode', m); } catch {} }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-mode]'); if (b) return setMode(b.dataset.mode);
  const d = e.target.closest('[data-motion]'); if (d) { const box = d.querySelector('.motion-demo'); box.classList.toggle('go'); }
});

/* ---------- Boot ---------- */""")
rep("const fig = $('#figma-link'); if (BR.figmaUrl) fig.href = BR.figmaUrl; else fig.hidden = true;", "setMode(pmode);")


# ---------- Real component screenshots replace the HTML previews ----------
rep("  if (c.live) h += `<section class=\"sec playground\">",
    """  const sh = (window.DS_SHOTS || {})[c.id];
  if (sh) {
    const meta = window.DS_SHOTS_META || {};
    const defaults = Object.fromEntries((c.live?.controls || []).map(k => [k.k, k.d]));
    h += `<section class="sec"><h2>Real component</h2><p class="muted">Rendered from the Compose code in <code>:core:designsystem</code> by CI${meta.sha ? `, commit <code>${esc(String(meta.sha).slice(0, 7))}</code> (${esc(meta.ref || '')}, run ${esc(String(meta.run || ''))})` : ''}. Switch Light, Dark and Private in the top bar. These are the same states the app’s Design system screen shows live.</p><div class="shots">${sh.map(s => `<figure class="shot"><figcaption>${esc(s.label)}</figcaption>${BR.modes.map(m => s.files[m.id] ? `<img data-shot-mode="${m.id}" src="${esc(s.files[m.id])}" alt="${esc(c.name)}: ${esc(s.label)}, ${esc(m.name)}" loading="lazy">` : '').join('')}</figure>`).join('')}</div></section>`;
    if (c.live?.jsx) { const code = c.live.jsx(defaults); h += `<section class="sec"><h2>Compose</h2><div class="code-wrap" style="border-top:1px solid var(--line);border-radius:12px"><pre class="code"><code>${hl(code)}</code></pre></div></section>`; }
  }
  if (c.live && !sh) h += `<section class="sec playground">""")
rep("  if (c.live?.gallery) h +=", "  if (c.live?.gallery && !sh) h +=")
rep("  if (c?.live) refresh(c);", "  if (c?.live && !(window.DS_SHOTS || {})[c.id]) refresh(c);")
rep(".tonal { display: grid;", """.shots { display: grid; gap: 20px; }
.shot { margin: 0; display: grid; gap: 8px; }
.shot figcaption { font-size: 14px; color: var(--muted); }
.shot img { display: none; max-width: 100%; height: auto; border: 1px solid var(--line); border-radius: 12px; }
#main[data-pgn-mode="light"] .shot img[data-shot-mode="light"], #main[data-pgn-mode="dark"] .shot img[data-shot-mode="dark"], #main[data-pgn-mode="private"] .shot img[data-shot-mode="private"] { display: block; }
@media (min-width: 900px) { .shot img { max-width: 480px; } }
.tonal { display: grid;""")
rep("<li><strong>Previews</strong> follow the product mode chosen in the top bar, independent of this site’s own light or dark theme.</li>",
    "<li><strong>Component images are the real thing.</strong> Built components are screenshots of the Compose code, rendered by CI in light, dark and private. Token values come from <code>design/tokens.json</code>, the only place they live. Nothing here is drawn by hand except the Phase 3 and 4 scaffolds.</li>")

# ---------- Write a standalone page and its images ----------
os.makedirs(os.path.join(OUT_DIR, 'shots'), exist_ok=True)
page = tpl.replace('<title>Pangolin Design System</title>', '').lstrip()
html = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Pangolin Design System</title>\n'
        '<link rel="icon" href="data:,">\n<style>[hidden]{display:none!important}</style>\n' + page + '\n</body>\n</html>\n')
open(os.path.join(OUT_DIR, 'index.html'), 'w').write(html)
try:
    from PIL import Image
except ImportError:
    Image = None
for f in os.listdir(SHOTS):
    if not f.endswith('.png'):
        continue
    src, dst = os.path.join(SHOTS, f), os.path.join(OUT_DIR, 'shots', f)
    if Image is None:
        shutil.copyfile(src, dst); continue
    im = Image.open(src).convert('RGB')
    if im.height > 1200:  # full window capture (open menus): trim the empty area
        bg = im.getpixel((im.width - 1, im.height - 1)); w, h = im.size; px = im.load()
        bottom = max((y for y in range(h) for x in range(0, w, 8) if px[x, y] != bg), default=h - 1)
        right = max((x for x in range(w) for y in range(0, bottom, 8) if px[x, y] != bg), default=w - 1)
        im = im.crop((0, 0, min(w, right + 48), min(h, bottom + 48)))
    im.save(dst, optimize=True)
open(os.path.join(OUT_DIR, '.nojekyll'), 'w').close()
print('wrote', OUT_DIR, len(html), 'bytes,', len(os.listdir(os.path.join(OUT_DIR, 'shots'))), 'images')
