/* =====================================================================
   COMPONENTS for Pangolin. Phase 1 atoms are live; phases 2 to 4 are
   scaffolded (status TBD) with their planned API and anatomy.
   ===================================================================== */
window.DS_ICONS = __ICONS__;
const DSH = {
  esc: s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
  low: s => String(s).toLowerCase(),
  // Material Symbols drawables use a 960 unit viewport and a single filled path.
  icon: (n, size = 24) => `<svg class="i" data-icon="${n}" viewBox="0 0 960 960" width="${size}" height="${size}" style="width:${size}px;height:${size}px" aria-hidden="true">${window.DS_ICONS[n] || ''}</svg>`,
  uid: (() => { let n = 0; return p => `${p}-${++n}`; })(),
  // Parameter rows for the Properties table
  V: (n, ...v) => ({ n, t: 'Enum', v: `${v.join(', ')} (default ${v[0]})` }),
  B: (n, d) => ({ n, t: 'Boolean', v: `default ${d}` }),
  T: (n, d) => ({ n, t: 'String', v: `default “${d}”` }),
  S: (n, d) => ({ n, t: 'Slot or lambda', v: d }),
  sel: (k, label, o, d) => ({ k, label, t: 'select', o, d: d ?? o[0] }),
  txt: (k, label, d = '') => ({ k, label, t: 'text', d }),
  bool: (k, label, d = false) => ({ k, label, t: 'bool', d }),
  // Compose call builder: kt('PangolinButton', { text: '"Unlock"', onClick: '{ }' })
  kt(name, args = {}) {
    const a = Object.entries(args).filter(([, v]) => v !== '' && v != null && v !== false);
    if (!a.length) return `${name}()`;
    return `${name}(\n${a.map(([k, v]) => `    ${k} = ${v},`).join('\n')}\n)`;
  },
  q: s => `"${String(s).replace(/"/g, '\\"')}"`,
};
const pascal = s => s.replace(/(^|\s)(\w)/g, (m, a, b) => b.toUpperCase());

/* ---------- Atom renderers. Each is the single source of truth for preview, gallery and HTML. ---------- */
function iconHTML(p) {
  return `<span class="pgn-icon pgn-icon--${DSH.low(p.tint)}">${DSH.icon(p.icon, +p.size)}</span>`;
}
function iconBtnHTML(p) {
  const on = p.selected && p.type === 'Toggle';
  const name = on && p.icon === 'star' ? 'star_filled' : p.icon;
  const cls = `pgn-iconbtn${on ? ' is-selected' : ''}${p.state === 'Pressed' ? ' is-pressed' : ''}`;
  const pressed = p.type === 'Toggle' ? ` aria-pressed="${on}"` : '';
  return `<button class="${cls}" aria-label="${DSH.esc(p.label)}"${pressed}${p.state === 'Disabled' ? ' disabled' : ''}>${DSH.icon(name)}</button>`;
}
function btnHTML(p) {
  const cls = `pgn-btn pgn-btn--${DSH.low(p.type)} pgn-btn--${DSH.low(p.size)}${p.state === 'Pressed' ? ' is-pressed' : ''}`;
  return `<button class="${cls}"${p.state === 'Disabled' ? ' disabled' : ''}>${p.icon && p.icon !== 'None' ? DSH.icon(p.icon, 18) : ''}<span>${DSH.esc(p.label)}</span></button>`;
}
function badgeLetter(src) { const m = String(src).match(/[\p{L}\p{N}]/u); return m ? m[0].toUpperCase() : '•'; }
function badgeHTML(p) {
  return `<span class="pgn-badge pgn-badge--${DSH.low(p.size)}" aria-hidden="true">${DSH.esc(badgeLetter(p.source))}</span>`;
}
function chipHTML() { return `<span class="pgn-chip" role="img" aria-label="Private mode">Private</span>`; }
function counterHTML(p) {
  const n = Math.max(0, parseInt(p.count, 10) || 0); const label = n > 99 ? '99+' : String(n);
  const aria = p.locked ? 'Tabs, private tabs locked' : `Tabs, ${n} open`;
  return `<button class="pgn-iconbtn" aria-label="${aria}">${p.locked ? DSH.icon('lock') : `<span class="pgn-counter${n > 99 ? ' pgn-counter--many' : ''}">${label}</span>`}</button>`;
}
function closeHTML(p) {
  return `<button class="pgn-close pgn-close--${DSH.low(p.size)}${p.state === 'Pressed' ? ' is-pressed' : ''}" aria-label="${DSH.esc(p.label)}">${DSH.icon('close')}</button>`;
}
function onTile(inner, compact) { return `<div class="pgn-demo-tile${compact ? ' pgn-demo-tile--s' : ''}">${inner}</div>`; }
function fabHTML(p) {
  return `<button class="pgn-fab${p.state === 'Pressed' ? ' is-pressed' : ''}" aria-label="New tab"${p.closeAll ? ' aria-haspopup="menu"' : ''}>${DSH.icon('add')}</button>`;
}
function progressHTML(p) {
  const v = Math.min(100, Math.max(0, parseInt(p.value, 10) || 0));
  return `<div class="pgn-progress" role="progressbar" aria-label="Page loading" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v}"><span style="width:${v}%"></span></div>`;
}


/* ---------- Molecule renderers ---------- */
function pillHTML(labels, pos) {
  const n = labels.length, sel = Math.round(pos);
  return `<div class="pgn-pill" role="tablist" style="--n:${n};--pos:${pos}"><span class="pgn-pill__hi"></span>${labels.map((l, i) => `<button role="tab" aria-selected="${i === sel}" class="pgn-pill__seg${i === sel ? ' is-on' : ''}">${DSH.esc(l)}</button>`).join('')}</div>`;
}
function searchHTML(p) {
  const id = DSH.uid('search');
  return `<div class="pgn-search${p.focus ? ' is-focus' : ''}"><label class="pgn-sr" for="${id}">${DSH.esc(p.ph || 'Search')}</label>${DSH.icon('search')}<input id="${id}" type="search" value="${DSH.esc(p.q)}" placeholder="${DSH.esc(p.ph)}">${p.q ? `<button class="pgn-iconbtn" aria-label="Clear search">${DSH.icon('close')}</button>` : ''}</div>`;
}
function sectionHTML(t) { return `<div class="pgn-section">${DSH.esc(t)}</div>`; }
function rowHTML(p) {
  const card = p.style === 'Card';
  const badge = p.badge ? badgeHTML({ source: (p.sub || p.title).replace(/^[\d: APM]+/, ''), size: p.small ? 'M' : 'L' }) : '';
  const trail = p.menu ? `<button class="pgn-iconbtn" aria-label="More actions for ${DSH.esc(p.title)}">${DSH.icon('more_vert')}</button>` : p.del ? `<button class="pgn-btn pgn-btn--text">Delete</button>` : '';
  return `<div class="pgn-row${card ? ' pgn-row--card' : ''}${trail ? ' has-trail' : ''}" tabindex="0">${badge}<div class="pgn-row__text"><div class="pgn-row__title">${DSH.esc(p.title)}</div>${p.sub ? `<div class="pgn-row__sub">${DSH.esc(p.sub)}</div>` : ''}</div>${trail}</div>`;
}
function menuHTML(p) {
  const items = p.supporting ? [['Wikipedia', 'wikipedia.org'], ['Pangolin on GitHub', 'github.com'], ['Forward', '']] : [['Open'], ['Open in new tab'], ['Edit'], ['Copy link'], ['Delete']];
  return `<div class="pgn-menu" role="menu">${items.map(([t, s], i) => `<div role="menuitem" tabindex="-1" class="pgn-menu__item${!p.supporting && p.destructive && i === items.length - 1 ? ' is-danger' : ''}">${t === 'Forward' ? DSH.icon('chevron_right') : ''}<span><span>${DSH.esc(t)}</span>${s ? `<small>${DSH.esc(s)}</small>` : ''}</span></div>`).join('')}</div>`;
}
function snackHTML(p) {
  return `<div class="pgn-snack" role="status"><span>${DSH.esc(p.msg)}</span>${p.act ? `<button class="pgn-snack__act">${DSH.esc(p.act)}</button>` : ''}</div>`;
}
function bannerHTML(p) {
  const err = p.tone === 'Error';
  return `<div class="pgn-banner${err ? ' pgn-banner--error' : ''}" role="status"><div class="pgn-banner__row">${DSH.icon(err ? 'error' : 'info')}<p>${DSH.esc(p.msg)}</p>${p.dismiss ? `<button class="pgn-iconbtn" aria-label="Dismiss">${DSH.icon('close')}</button>` : ''}</div>${p.act ? `<div class="pgn-banner__act"><button class="pgn-btn pgn-btn--text">${DSH.esc(p.act)}</button></div>` : ''}</div>`;
}
function emptyHTML(kind) {
  const k = { 'No bookmarks': ['star', 'No bookmarks', 'Tap the star next to the address bar to save a page in normal browsing.', ''], 'Private locked': ['lock', 'Private tabs are locked', '', 'Unlock'], 'No matches': ['search_off', 'No matches', 'No bookmarks match "pangolin".', ''] }[kind];
  return `<div class="pgn-empty">${DSH.icon(k[0], 40)}<div class="pgn-empty__title">${k[1]}</div>${k[2] ? `<div class="pgn-empty__body">${DSH.esc(k[2])}</div>` : ''}${k[3] ? btnHTML({ type: 'Filled', size: 'M', state: 'Default', label: k[3], icon: 'None' }) : ''}</div>`;
}
function blockedHTML(kind) {
  const m = { Location: 'location_off', Camera: 'videocam_off', Microphone: 'mic_off', Notifications: 'notifications_off' }[kind];
  return `<button class="pgn-iconbtn" aria-label="${kind} blocked in private mode">${DSH.icon(m)}</button>`;
}
function choiceHTML(p) {
  const radio = p.control === 'Radio';
  const ctl = radio ? `<span class="pgn-radio${p.on ? ' is-on' : ''}"></span>` : `<span class="pgn-switch${p.on ? ' is-on' : ''}"><i></i></span>`;
  return `<div class="pgn-choice" role="${radio ? 'radio' : 'switch'}" aria-checked="${!!p.on}" tabindex="0">${radio ? ctl : ''}<span class="pgn-choice__label">${DSH.esc(p.label)}</span>${radio ? '' : ctl}</div>`;
}

window.DS_GROUPS = [
  { id: 'atoms', name: 'Atoms · Phase 1' },
  { id: 'molecules', name: 'Molecules · Phase 2' },
  { id: 'organisms', name: 'Organisms · Phase 3' },
  { id: 'features', name: 'Feature patterns · Phase 4' },
];

const PRIVATE_RULE = 'Never takes an image, favicon or thumbnail parameter, so nothing from a private page can be captured as an image.';
const T = 'tbd';

window.DS_COMPONENTS = [
/* ================= Phase 1: atoms (live) ================= */
{ id: 'icon', name: 'Icon', group: 'atoms', phase: 1, variants: 0,
  desc: 'A Material Symbol drawn from its vector drawable. Every icon in Pangolin goes through this one composable so size and tint stay consistent.',
  usage: { do: ['Use 24dp everywhere; 40dp only for the symbol in an empty or lock state.', 'Tint from a text token so the icon follows the mode.'], dont: ['Don’t draw custom icons, use text glyphs or emoji as icons.', 'Don’t use a filled symbol unless it shows an active state.'] },
  props: [DSH.S('symbol', '@DrawableRes Int (ic_symbol_<name>)'), DSH.V('size', '24dp', '40dp'), DSH.V('tint', 'Primary', 'Secondary', 'Accent', 'Disabled')],
  live: {
    controls: [DSH.sel('icon', 'Symbol', ['lock', 'star', 'star_filled', 'link', 'refresh', 'more_vert', 'search', 'location_off']), DSH.sel('size', 'Size', ['24', '40']), DSH.sel('tint', 'Tint', ['Primary', 'Secondary', 'Accent', 'Disabled'])],
    render: p => iconHTML(p),
    jsx: p => DSH.kt('SymbolIcon', { symbol: `R.drawable.ic_symbol_${p.icon}`, size: p.size === '24' ? '' : `${p.size}.dp`, tint: p.tint === 'Primary' ? '' : `PangolinTheme.colors.text${p.tint === 'Disabled' ? 'Disabled' : p.tint}` }),
    gallery: () => ['lock', 'star', 'star_filled', 'link', 'refresh', 'chevron_left', 'more_vert', 'add', 'close', 'location_off', 'mic_off', 'notifications_off'].map(i => iconHTML({ icon: i, size: '24', tint: 'Primary' })).join('') + iconHTML({ icon: 'lock', size: '40', tint: 'Secondary' }) },
  anatomy: [['Glyph', 'size', '24dp (40dp in empty and lock states)'], ['Glyph', 'tint', 'text/primary, text/secondary, text/accent or text/disabled'], ['Source', 'style', 'Outlined, weight 400, grade 0']] },

{ id: 'icon-button', name: 'Icon button', group: 'atoms', phase: 1, variants: 6,
  desc: 'A 48dp round target holding one 24dp symbol. Used in the address bar, the browser toolbar and list rows. Toggle shows an on state, like the bookmark star.',
  usage: { do: ['Always set a content description that names the action (“Add bookmark”, not “Star”).', 'Pair a long press with a visible menu, and a LONG_PRESS haptic.'], dont: ['Don’t shrink the target below 48dp, even in dense bars.'] },
  props: [DSH.S('symbol', '@DrawableRes Int'), DSH.T('contentDescription', 'More options'), DSH.V('type', 'Standard', 'Toggle'), DSH.B('selected', false), DSH.B('enabled', true), DSH.S('onLongClick', '(() -> Unit)? = null')],
  live: {
    controls: [DSH.sel('type', 'Type', ['Standard', 'Toggle']), DSH.sel('icon', 'Symbol', ['more_vert', 'star', 'refresh', 'link', 'chevron_left']), DSH.bool('selected', 'Selected (toggle)', false), DSH.sel('state', 'State', ['Default', 'Pressed', 'Disabled']), DSH.txt('label', 'Content description', 'More options')],
    render: p => iconBtnHTML(p),
    jsx: p => DSH.kt(p.type === 'Toggle' ? 'PangolinIconToggle' : 'PangolinIconButton', { symbol: `R.drawable.ic_symbol_${p.icon}`, contentDescription: DSH.q(p.label), checked: p.type === 'Toggle' ? String(!!p.selected) : '', enabled: p.state === 'Disabled' ? 'false' : '', onClick: p.type === 'Toggle' ? '' : '{ }', onCheckedChange: p.type === 'Toggle' ? '{ }' : '' }),
    gallery: () => [iconBtnHTML({ type: 'Standard', icon: 'chevron_left', state: 'Default', label: 'Back' }), iconBtnHTML({ type: 'Standard', icon: 'refresh', state: 'Pressed', label: 'Reload' }), iconBtnHTML({ type: 'Standard', icon: 'link', state: 'Disabled', label: 'Copy link' }), iconBtnHTML({ type: 'Toggle', icon: 'star', selected: false, state: 'Default', label: 'Add bookmark' }), iconBtnHTML({ type: 'Toggle', icon: 'star', selected: true, state: 'Default', label: 'Remove bookmark' }), iconBtnHTML({ type: 'Standard', icon: 'more_vert', state: 'Default', label: 'More options' })].join('') },
  anatomy: [['Target', 'size · shape', '48dp · radius-full'], ['Symbol', 'size · tint', '24dp · text/primary'], ['Selected', 'tint · symbol', 'text/accent · filled variant'], ['Pressed', 'state layer', 'text/primary at 10%'], ['Disabled', 'content', 'text/primary at 38%'], ['Focus', 'ring', 'border/focus 2dp']] },

{ id: 'button', name: 'Button', group: 'atoms', phase: 1, variants: 15,
  desc: 'A text action. Filled for the single main action on a surface (Unlock), Outlined for its alternative (Switch to normal browsing), Text for low emphasis and dialog actions, Destructive for a dialog action that cannot be undone.',
  usage: { do: ['Name the action in the label: “Clear”, not “OK”.', 'Use one Filled button per surface.', 'Use size L only for Done in the tab grid.'], dont: ['Don’t use Destructive for actions that can be undone; act at once and offer Undo instead.'] },
  props: [DSH.T('text', 'Unlock'), DSH.V('variant', 'Filled', 'Outlined', 'Text', 'Destructive'), DSH.V('size', 'M', 'L'), DSH.S('leadingSymbol', 'Int? = null'), DSH.B('enabled', true)],
  live: {
    controls: [DSH.sel('type', 'Variant', ['Filled', 'Outlined', 'Text', 'Destructive']), DSH.sel('size', 'Size', ['M', 'L']), DSH.sel('state', 'State', ['Default', 'Pressed', 'Disabled']), DSH.txt('label', 'Text', 'Unlock'), DSH.sel('icon', 'Leading symbol', ['None', 'lock_open', 'refresh', 'delete'])],
    render: p => btnHTML(p),
    jsx: p => DSH.kt('PangolinButton', { text: DSH.q(p.label), onClick: '{ }', variant: p.type === 'Filled' ? '' : `ButtonVariant.${p.type}`, size: p.size === 'M' ? '' : 'ButtonSize.Large', leadingSymbol: p.icon === 'None' ? '' : `R.drawable.ic_symbol_${p.icon}`, enabled: p.state === 'Disabled' ? 'false' : '' }),
    gallery: () => btnHTML({ type: 'Filled', size: 'M', state: 'Default', label: 'Unlock', icon: 'lock_open' }) + btnHTML({ type: 'Outlined', size: 'M', state: 'Default', label: 'Switch to normal browsing', icon: 'None' }) + btnHTML({ type: 'Text', size: 'M', state: 'Default', label: 'Cancel', icon: 'None' }) + btnHTML({ type: 'Destructive', size: 'M', state: 'Default', label: 'Clear', icon: 'None' }) + btnHTML({ type: 'Text', size: 'L', state: 'Default', label: 'Done', icon: 'None' }) + btnHTML({ type: 'Filled', size: 'M', state: 'Disabled', label: 'Unlock', icon: 'None' }) },
  anatomy: [['Container M · L', 'height · touch', '40dp · 48dp; L is 48dp tall'], ['Container', 'shape · padding', 'radius-full · space-24 sides (space-16 for Text)'], ['Label M · L', 'type', 'type-label-lg · type-title-lg'], ['Filled', 'fill · label', 'bg/accent · text/on-accent'], ['Outlined', 'border · label', 'border/outline 1dp · text/accent'], ['Text', 'label', 'text/accent'], ['Destructive', 'label', 'text/error'], ['Gap', 'symbol to label', 'space-8, symbol 18dp'], ['Disabled', 'fill · label', 'text/primary at 12% · text/primary at 38%']] },

{ id: 'letter-badge', name: 'Letter badge', group: 'atoms', phase: 1, variants: 3,
  desc: 'One uppercase letter from the host, or the title when there is no host. Stands in for favicons everywhere, in both modes, so normal and private lists look the same and favicons never enter private mode.',
  usage: { do: ['Derive the letter from the host first (example.com → E), then the title.', 'Hide it from screen readers; the row or tile title already names the page.'], dont: ['Don’t load favicons, even in normal mode.'] },
  props: [DSH.T('source', 'host, else title'), DSH.V('size', 'S 24dp', 'M 28dp', 'L 40dp')],
  live: {
    controls: [DSH.txt('source', 'Host or title', 'github.com'), DSH.sel('size', 'Size', ['M', 'S', 'L'])],
    render: p => badgeHTML(p),
    jsx: p => DSH.kt('LetterBadge', { text: `badgeLetter(${DSH.q(p.source)})`, size: `BadgeSize.${{ S: 'Small', M: 'Medium', L: 'Large' }[p.size]}` }),
    gallery: () => badgeHTML({ source: 'wikipedia.org', size: 'S' }) + badgeHTML({ source: 'github.com', size: 'M' }) + badgeHTML({ source: 'nytimes.com', size: 'L' }) + badgeHTML({ source: '', size: 'M' }) },
  anatomy: [['Circle S · M · L', 'size', '24 · 28 · 40dp (S was 22dp in the 4 column grid)'], ['Circle', 'shape · fill', 'radius-full · bg/accent-container'], ['Letter', 'type · color', 'type-label-lg (L uses type-title-md) · text/on-accent-container'], ['Fallback', 'glyph', 'A centered dot when the source has no letter or digit']],
  notes: PRIVATE_RULE },

{ id: 'tab-counter', name: 'Tab counter', group: 'atoms', phase: 1, variants: 3,
  desc: 'Opens the tab grid from the browser toolbar. A number in a rounded box, not an icon. While private mode is locked it shows the lock symbol instead of a count, so no private detail leaks.',
  usage: { do: ['Show “99+” above 99.', 'Say the count in the content description (“Tabs, 3 open”).'], dont: ['Don’t show a private tab count while private mode is locked.'] },
  props: [DSH.T('count', '3'), DSH.B('locked', false)],
  live: {
    controls: [DSH.txt('count', 'Count', '3'), DSH.bool('locked', 'Private locked', false)],
    render: p => counterHTML(p),
    jsx: p => DSH.kt('TabCounter', { count: String(parseInt(p.count, 10) || 0), locked: p.locked ? 'true' : '', onClick: '{ }' }),
    gallery: () => counterHTML({ count: '1' }) + counterHTML({ count: '12' }) + counterHTML({ count: '140' }) + counterHTML({ count: '3', locked: true }) },
  anatomy: [['Target', 'size', '48dp, same as Icon button'], ['Box', 'size · border', '24dp · 2dp text/primary'], ['Box', 'corner', '6dp (part of the counter glyph, not the shape scale)'], ['Digits', 'type', 'type-label-md; 9sp for 99+'], ['Locked', 'symbol', 'lock at 24dp, text/primary']] },

{ id: 'close-button', name: 'Close button', group: 'atoms', phase: 1, variants: 4,
  desc: 'Round X in the corner of a tab tile. Closing is done with this button, never by swiping, so it never fights the swipe between Normal and Private.',
  usage: { do: ['Keep a 48dp touch target even when the visual is 40dp.', 'Fire the tab closed haptic and show an Undo snackbar.'], dont: ['Don’t name the page in the content description in private mode; “Close tab” is enough.'] },
  props: [DSH.V('size', 'M 44dp', 'S 40dp'), DSH.T('contentDescription', 'Close tab')],
  live: {
    controls: [DSH.sel('size', 'Size', ['M', 'S']), DSH.sel('state', 'State', ['Default', 'Pressed']), DSH.txt('label', 'Content description', 'Close tab')],
    render: p => onTile(closeHTML(p), p.size === 'S'),
    jsx: p => DSH.kt('PangolinCloseButton', { onClick: '{ }', size: p.size === 'M' ? '' : 'CloseButtonSize.Small', contentDescription: p.label === 'Close tab' ? '' : DSH.q(p.label) }),
    gallery: () => onTile(closeHTML({ size: 'M', label: 'Close tab' })) + onTile(closeHTML({ size: 'S', label: 'Close tab' }), true) },
  anatomy: [['Circle M · S', 'size', '44dp (2 columns) · 40dp (4 columns)'], ['Circle', 'fill', 'bg/scrim-tile'], ['Symbol', 'size · tint', '24dp close · text/on-scrim'], ['Target', 'size', '48dp minimum'], ['Placement', 'inset from tile corner', 'space-8 (2 columns), space-4 (4 columns)']] },

{ id: 'new-tab-button', name: 'New tab button', group: 'atoms', phase: 1, variants: 2,
  desc: 'The round + centered in the tab grid’s action bar. Tap opens a new tab in the current mode. Long press opens the Close all menu (Phase 4), mirroring iOS.',
  usage: { do: ['Fire the new tab haptic on tap and LONG_PRESS when the menu opens.'], dont: ['Don’t show it while private mode is locked.'] },
  props: [DSH.S('onClick', '() -> Unit'), DSH.S('onLongClick', '(() -> Unit)? = null')],
  live: {
    controls: [DSH.sel('state', 'State', ['Default', 'Pressed']), DSH.bool('closeAll', 'Has long press menu', false)],
    render: p => fabHTML(p),
    jsx: p => DSH.kt('NewTabButton', { onClick: '{ }', onLongClick: p.closeAll ? '{ showCloseAll = true }' : '' }) },
  anatomy: [['Circle', 'size · shape', '64dp · radius-full'], ['Circle', 'fill', 'bg/accent-container'], ['Symbol', 'size · tint', '24dp add · text/on-accent-container'], ['Pressed', 'state layer', 'text/on-accent-container at 10%']] },

{ id: 'progress-line', name: 'Progress line', group: 'atoms', phase: 1, variants: 1,
  desc: 'The 2dp loading line under the address bar. Hidden when the page is not loading, with the 2dp kept so the layout never jumps. Never shown while private mode is locked.',
  props: [DSH.T('progress', '0f to 1f')],
  live: {
    controls: [DSH.txt('value', 'Progress (0 to 100)', '60')],
    render: p => `<div class="pgn-demo-bar">${progressHTML(p)}</div>`,
    jsx: p => DSH.kt('ProgressLine', { progress: `{ ${(Math.min(100, Math.max(0, parseInt(p.value, 10) || 0)) / 100)}f }` }) },
  anatomy: [['Track', 'height · fill', '2dp · bg/container-highest'], ['Indicator', 'fill', 'bg/accent'], ['Motion', 'progress change', 'motion-fade-short']] },

/* ================= Phase 2: molecules (live) ================= */
{ id: 'segmented-pill', name: 'Segmented pill', group: 'molecules', phase: 2, status: 'beta', variants: 4,
  desc: 'The Normal and Private switch at the top of the tab grid, reusable for any two or three way choice. The highlight follows a position value, so a pager drives it while the user drags.',
  usage: { do: ['Fire the mode switch haptic when the choice settles, not on every frame.', 'Keep labels to one or two words.'], dont: ['Don’t show a private tab count: it must not show while private mode is locked.'] },
  props: [DSH.S('segments', 'List<String>'), DSH.T('selectedIndex', '0'), DSH.T('position', 'Float, defaults to selectedIndex'), DSH.S('onSelect', '(Int) -> Unit')],
  live: {
    controls: [DSH.sel('pos', 'Position', ['0', '0.25', '0.5', '0.75', '1']), DSH.txt('a', 'First label', '3 Tabs'), DSH.txt('b', 'Second label', 'Private')],
    render: p => pillHTML([p.a, p.b], +p.pos),
    jsx: p => DSH.kt('SegmentedPill', { segments: `listOf(${DSH.q(p.a)}, ${DSH.q(p.b)})`, selectedIndex: String(Math.round(+p.pos)), position: `pager.currentPage + pager.currentPageOffsetFraction`, onSelect: '{ onModeSelected(modeOf(it)) }' }),
    gallery: () => pillHTML(['3 Tabs', 'Private'], 0) + pillHTML(['3 Tabs', 'Private'], 0.5) + pillHTML(['Downloads', 'Hidden', 'Ask'], 2) },
  anatomy: [['Track', 'height · shape · fill', '56dp · radius-full · bg/container-high'], ['Highlight', 'inset · fill', 'space-4 · bg/accent-container'], ['Label selected · other', 'type · color', 'type-title-md · text/on-accent-container · text/secondary'], ['Segments', 'semantics', 'Tab role with selected state, in a selectable group']] },

{ id: 'search-field', name: 'Search field', group: 'molecules', phase: 2, status: 'beta', variants: 3,
  desc: 'Rounded search input with a magnifier and a clear button once there is text. Filters as the user types; the keyboard’s search key closes the keyboard. In private mode it asks the keyboard not to learn.',
  props: [DSH.T('query', ''), DSH.T('placeholder', 'Search bookmarks'), DSH.B('incognito', false), DSH.S('onQueryChange', '(String) -> Unit')],
  live: {
    controls: [DSH.txt('q', 'Query', ''), DSH.txt('ph', 'Placeholder', 'Search bookmarks'), DSH.bool('focus', 'Focused', false)],
    render: p => searchHTML(p),
    jsx: p => DSH.kt('SearchField', { query: DSH.q(p.q), onQueryChange: '{ query = it }', placeholder: DSH.q(p.ph) }),
    gallery: () => searchHTML({ q: '', ph: 'Search bookmarks' }) + searchHTML({ q: 'github', ph: '', focus: true }) },
  anatomy: [['Field', 'height · shape · fill', '56dp · radius-lg · bg/container-highest'], ['Focused', 'border', 'border/focus 2dp'], ['Leading', 'symbol', 'search, text/secondary'], ['Clear', 'target', '48dp Icon button, close'], ['Text · placeholder', 'type · color', 'type-body-lg · text/primary · text/secondary']] },

{ id: 'list-row', name: 'List row', group: 'molecules', phase: 2, status: 'beta', variants: 2,
  desc: 'Leading slot (usually a letter badge), title, supporting line and a trailing action. Card rows stand alone as rounded tiles (bookmarks); plain rows sit flat in a list or settings group (history, settings).',
  usage: { do: ['Give a long press the same actions as the row’s menu, with the long press haptic.'], dont: ['Don’t load favicons in the leading slot; use a Letter badge.'] },
  props: [DSH.T('title', ''), DSH.T('supporting', 'null'), DSH.V('style', 'Card', 'Plain'), DSH.S('leading · trailing', 'composable slots'), DSH.S('onClick · onLongClick', '(() -> Unit)?')],
  live: {
    controls: [DSH.sel('style', 'Style', ['Card', 'Plain']), DSH.txt('title', 'Title', 'Pangolin on GitHub'), DSH.txt('sub', 'Supporting', 'github.com'), DSH.bool('badge', 'Letter badge', true), DSH.bool('menu', 'Menu button', true)],
    render: p => `<div class="pgn-demo-list">${rowHTML(p)}</div>`,
    jsx: p => DSH.kt('PangolinListRow', { title: DSH.q(p.title), supporting: p.sub ? DSH.q(p.sub) : '', style: p.style === 'Card' ? '' : 'ListRowStyle.Plain', onClick: '{ }', leading: p.badge ? '{ LetterBadge(badgeLetter(host, title), size = BadgeSize.Large) }' : '', trailing: p.menu ? '{ PangolinIconButton(R.drawable.ic_symbol_more_vert, "More actions", onClick = { }) }' : '' }),
    gallery: () => `<div class="pgn-demo-list">${rowHTML({ style: 'Card', title: 'Wikipedia', sub: 'wikipedia.org', badge: true, menu: true })}${rowHTML({ style: 'Card', title: 'The New York Times', sub: 'nytimes.com', badge: true, menu: true })}</div><div class="pgn-demo-list pgn-demo-list--plain">${sectionHTML('Today')}${rowHTML({ style: 'Plain', title: 'Pull requests', sub: '9:41 AM  github.com/pulls', badge: true, small: true, del: true })}${rowHTML({ style: 'Plain', title: 'Search engine', sub: 'DuckDuckGo' })}</div>` },
  anatomy: [['Row', 'min height · padding', '64dp with a supporting line (56dp without) · space-16'], ['Card', 'shape · fill', 'radius-md · bg/container-high'], ['Card list', 'gap', 'space-8'], ['Title', 'type · color', 'type-title-md · text/primary'], ['Supporting', 'type · color', 'type-body-sm · text/secondary'], ['Badge to text', 'gap', 'space-12'], ['Section label', 'type · color', 'type-title-sm · text/accent']] },

{ id: 'menu', name: 'Menu', group: 'molecules', phase: 2, status: 'beta', variants: 2,
  desc: 'A short list of actions anchored to its trigger: the overflow menu, the back history menu, row menus. Always a solid card with a shadow, even over a web page (D11).',
  usage: { do: ['Close the menu before acting.', 'Put Delete last, in the error color.'], dont: ['Don’t make menus translucent; only the browser bars use the glass material.'] },
  props: [DSH.B('expanded', false), DSH.S('items', 'PangolinMenuItem(text, onClick, leadingSymbol?, destructive?, supporting?)')],
  live: {
    controls: [DSH.bool('destructive', 'Destructive last item', true), DSH.bool('supporting', 'History style items', false)],
    render: p => menuHTML(p),
    jsx: p => `PangolinMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {\n    PangolinMenuItem("Open", onClick = { pick(onOpen) })\n    PangolinMenuItem("Edit", onClick = { pick(onEdit) })\n    PangolinMenuItem("Delete", onClick = { pick(onDelete) }${p.destructive ? ', destructive = true' : ''})\n}` },
  anatomy: [['Surface', 'shape · fill · shadow', 'radius-sm · bg/container · 6dp shadow'], ['Item', 'height · type', '48dp · type-body-lg'], ['Destructive item', 'color', 'text/error'], ['Motion', 'open', 'motion-spatial-fast']] },

{ id: 'snackbar', name: 'Snackbar', group: 'molecules', phase: 2, status: 'beta', variants: 2,
  desc: 'The result of an action the user just took, with Undo when it can be reversed. One at a time: a new one replaces the old. Four seconds, above the bottom bar. Solid, even over a page (D11).',
  usage: { do: ['Use showOnly(message, "Undo") and act on its result.'], dont: ['Don’t name a private page in the message.', 'Don’t leave one on screen when private mode locks.'] },
  props: [DSH.T('message', 'Bookmark deleted'), DSH.T('actionLabel', 'Undo')],
  live: {
    controls: [DSH.txt('msg', 'Message', 'Bookmark deleted'), DSH.txt('act', 'Action', 'Undo')],
    render: p => snackHTML(p),
    jsx: p => `scope.launch {\n    if (snackbar.showOnly(${DSH.q(p.msg)}${p.act ? ', ' + DSH.q(p.act) : ''})) bookmarks.restore(bookmark)\n}\n\nPangolinSnackbarHost(state = snackbar, modifier = Modifier.align(Alignment.BottomCenter))`,
    gallery: () => snackHTML({ msg: 'Tab closed', act: 'Undo' }) + snackHTML({ msg: 'Link copied', act: '' }) },
  anatomy: [['Surface', 'shape · fill', 'radius-sm · bg/inverse'], ['Message', 'type · color', 'type-body-md · text/inverse'], ['Action', 'color', 'text/inverse-accent'], ['Width', 'max', 'content-max'], ['Motion', 'in · out', 'motion-fade-medium · motion-exit']] },

{ id: 'banner', name: 'Banner', group: 'molecules', phase: 2, status: 'beta', variants: 4,
  desc: 'An inline notice at the top of content for a lasting condition: no screen lock set, private tabs could not be restored, the first private download goes to the shared folder. Stays until resolved or dismissed.',
  props: [DSH.T('message', ''), DSH.V('tone', 'Info', 'Error'), DSH.S('action', 'StateAction? = null'), DSH.S('onDismiss', '(() -> Unit)? = null')],
  live: {
    controls: [DSH.sel('tone', 'Tone', ['Error', 'Info']), DSH.txt('msg', 'Message', 'Private mode needs a screen lock. Set a PIN, pattern or password to use it.'), DSH.txt('act', 'Action', 'Set screen lock'), DSH.bool('dismiss', 'Dismiss button', false)],
    render: p => bannerHTML(p),
    jsx: p => DSH.kt('Banner', { message: DSH.q(p.msg), tone: p.tone === 'Info' ? '' : 'BannerTone.Error', action: p.act ? `StateAction(${DSH.q(p.act)}) { }` : '', onDismiss: p.dismiss ? '{ }' : '' }),
    gallery: () => bannerHTML({ tone: 'Error', msg: 'Private mode needs a screen lock. Set a PIN, pattern or password to use it.', act: 'Set screen lock' }) + bannerHTML({ tone: 'Info', msg: 'Private downloads are saved to your Downloads folder.', dismiss: true }) },
  anatomy: [['Surface', 'shape · fill', 'radius-md · bg/container-high (Error: bg/error-container)'], ['Symbol', 'name · tint', 'info · text/secondary (Error: error · text/on-error-container)'], ['Message', 'type', 'type-body-md'], ['Action', 'color', 'text/accent (Error: text/on-error-container)'], ['Semantics', 'live region', 'Polite']] },

{ id: 'empty-state', name: 'Empty state', group: 'molecules', phase: 2, status: 'beta', variants: 3,
  desc: 'Symbol, title, one line of body and at most one main action. Used for no tabs, locked private tabs, no bookmarks, no history and no search matches.',
  props: [DSH.S('symbol', 'Int'), DSH.T('title', 'No bookmarks'), DSH.T('body', 'null'), DSH.S('action · secondaryAction', 'StateAction? = null')],
  live: {
    controls: [DSH.sel('kind', 'Example', ['No bookmarks', 'Private locked', 'No matches'])],
    render: p => emptyHTML(p.kind),
    jsx: p => p.kind === 'Private locked'
      ? DSH.kt('EmptyState', { symbol: 'R.drawable.ic_symbol_lock', title: '"Private tabs are locked"', action: 'StateAction("Unlock", onUnlock)' })
      : DSH.kt('EmptyState', { symbol: p.kind === 'No matches' ? 'R.drawable.ic_symbol_search_off' : 'R.drawable.ic_symbol_star', title: DSH.q(p.kind), body: p.kind === 'No matches' ? '"No bookmarks match \\"$query\\"."' : '"Tap the star next to the address bar to save a page in normal browsing."' }) },
  anatomy: [['Symbol', 'size · tint', '40dp · text/secondary'], ['Title', 'type · color', 'type-title-md · text/primary'], ['Body', 'type · color', 'type-body-lg · text/secondary'], ['Action', 'component', 'Button, Filled'], ['Container', 'padding · width', 'space-32 · control-max']] },

{ id: 'blocked-indicator', name: 'Blocked indicator', group: 'molecules', phase: 2, status: 'beta', variants: 4,
  desc: 'A passive symbol at the start of the address field, after the page menu button, when a site asked for location, camera, microphone or notifications in private mode. Never a prompt. Tapping it opens a sheet explaining the block (Phase 3). On a bar it takes the bar’s content color.',
  props: [DSH.V('kind', 'Location', 'Camera', 'Microphone', 'Notifications'), DSH.S('onClick', '() -> Unit'), DSH.S('tint', 'Color, the bar content color')],
  live: {
    controls: [DSH.sel('kind', 'Kind', ['Location', 'Camera', 'Microphone', 'Notifications'])],
    render: p => `<div class="pgn-demo-addr">${blockedHTML(p.kind)}<span class="pgn-demo-addr__url">maps.example.com</span></div>`,
    jsx: p => DSH.kt('BlockedIndicator', { kind: `BlockedKind.${p.kind}`, onClick: '{ showBlockedSheet = true }', tint: 'barColors.content' }),
    gallery: () => ['Location', 'Camera', 'Microphone', 'Notifications'].map(blockedHTML).join('') },
  anatomy: [['Symbol', 'name', 'location_off · videocam_off · mic_off · notifications_off'], ['Symbol', 'tint', 'Bar content color'], ['Target', 'size', '48dp'], ['Semantics', 'content description', '“Location blocked in private mode”']] },

{ id: 'choice-row', name: 'Choice row', group: 'molecules', phase: 2, status: 'beta', variants: 4,
  desc: 'A radio or switch row for settings and pickers, such as the search engine choice. The whole row is the target, so TalkBack reads one item with its state.',
  props: [DSH.T('label', 'DuckDuckGo'), DSH.V('control', 'Radio', 'Switch'), DSH.B('selected', false), DSH.T('supporting', 'null')],
  live: {
    controls: [DSH.sel('control', 'Control', ['Radio', 'Switch']), DSH.bool('on', 'Selected', true), DSH.txt('label', 'Label', 'DuckDuckGo')],
    render: p => `<div class="pgn-demo-list pgn-demo-list--plain">${choiceHTML(p)}</div>`,
    jsx: p => DSH.kt('ChoiceRow', { label: DSH.q(p.label), selected: String(!!p.on), onSelect: '{ onSelected(engine) }', control: p.control === 'Radio' ? '' : 'ChoiceControl.Switch' }),
    gallery: () => `<div class="pgn-demo-list pgn-demo-list--plain">${['DuckDuckGo', 'Google', 'Startpage'].map((l, i) => choiceHTML({ control: 'Radio', on: i === 0, label: l })).join('')}${choiceHTML({ control: 'Switch', on: true, label: 'Show tab thumbnails' })}</div>` },
  anatomy: [['Row', 'min height · padding', '56dp · space-16'], ['Radio · switch on', 'color', 'bg/accent'], ['Label', 'type', 'type-body-lg']] },

{ id: 'field-progress', name: 'Field progress', group: 'molecules', phase: 3, status: 'beta', variants: 3,
  desc: 'Loading progress drawn on the address field, in two phases (U6). While waiting for the site, a short arc in a lighter accent travels clockwise around the field edge, one lap per 1.4 s. Once the page starts arriving the arc fades out and a 2dp line grows along the field bottom edge, clipped to its shape. With Remove animations on, the arc is a still outline.',
  usage: { do: ['Drive the arc from PageState.waitingForSite and the line from progress.', 'Keep Stop in the field for as long as the page loads.'], dont: ['Don’t show it while private mode is locked.'] },
  props: [DSH.B('waitingForSite', false), DSH.T('progress', '0..1'), DSH.S('style', 'BarStyle (accent, accentSoft)')],
  anatomy: [['Arc', 'length · stroke', 'about 20% of the field outline · 2dp'], ['Arc', 'color', 'BarStyle.accentSoft (accent mixed toward the field, at least 2:1)'], ['Arc', 'motion', 'one clockwise lap per 1.4 s, linear'], ['Line', 'height · color', '2dp · BarStyle.accent'], ['Hand over', 'motion', 'arc fades over motion-fade-short; line grows with motion-spatial-fast']] },
{ id: 'text-size-row', name: 'Text size row', group: 'molecules', phase: 3, status: 'beta', variants: 1,
  desc: 'A row in the page menu: the label, a smaller button, the current percent, a larger button. Steps 50 to 300 percent, per tab, memory only.',
  props: [DSH.T('percent', '100'), DSH.B('canDecrease', true), DSH.B('canIncrease', true), DSH.S('onDecrease · onIncrease', '() -> Unit')],
  anatomy: [['Buttons', 'size · target', '40dp circle on bg/container-highest · 48dp'], ['Percent', 'type', 'type-label-lg, 48dp wide'], ['Semantics', 'labels', '“Smaller text” · “Larger text”']] },
{ id: 'find-in-page-bar', name: 'Find in page bar', group: 'molecules', phase: 3, status: 'beta', variants: 4,
  desc: 'Takes the unified bar’s place while Find on page is open: a field with a search symbol, the query and the match count (“3 of 12”, “No matches”), then previous, next and close. Closes and clears on lock, tab or mode switch, a new page, or another screen. Incognito keyboard in private mode.',
  props: [DSH.T('current · total', 'Int'), DSH.S('editor', '@Composable () -> Unit'), DSH.S('onPrevious · onNext · onClose', '() -> Unit')],
  anatomy: [['Bar', 'height · material', 'same as the unified bar'], ['Field', 'height · shape', '52dp · radius-lg'], ['Count', 'type · color', 'type-label-lg · bar content color, polite live region'], ['Buttons', 'symbols', 'keyboard_arrow_up · keyboard_arrow_down · close'], ['Semantics', 'pane title', '“Find on page” (private: “Private, find on page”)']] },
/* ================= Phase 3: organisms (scaffold) ================= */
{ id: 'tab-tile', name: 'Tab tile', group: 'organisms', phase: 3, status: T,
  desc: 'A tab in the grid: title and host centered on a rounded card, close button in the corner, letter badge and title underneath. No thumbnail, by design.',
  props: [DSH.T('title', ''), DSH.T('host', ''), DSH.B('selected', false), DSH.B('compact', false), DSH.S('onClick · onClose', '() -> Unit')],
  anatomy: [['Card', 'aspect · shape', '0.8 · radius-xl (compact: radius-md)'], ['Card', 'fill', 'bg/container-high'], ['Selected', 'border', '2dp border/selected'], ['Title', 'type', 'type-title-md (compact: type-title-sm)'], ['Host', 'type · color', 'type-body-sm · text/secondary'], ['Label row', 'gap', 'space-12 (compact: space-8)']],
  notes: PRIVATE_RULE },
{ id: 'tab-grid-bar', name: 'Tab grid action bar', group: 'organisms', phase: 3, status: T,
  desc: 'Bottom of the tab grid: empty left slot reserved for Select, the New tab button centered, Done on the right.',
  anatomy: [['Bar', 'height · width', '96dp · control-max'], ['Center', 'content', 'New tab button'], ['Right', 'content', 'Button, Text, size L, “Done”']] },
{ id: 'unified-address-bar', name: 'Unified address bar', group: 'organisms', phase: 3, status: 'beta', variants: 11,
  desc: 'The one browser bar, at the bottom (D13). Back is always there and dims when it can’t go back; Forward exists only while there is a page to go forward to. The field holds the page menu button, the domain and Reload or Stop, with the two phase progress on its edge. The tab counter sits at the end. Long press on Back, the domain and Tabs opens menus. No Private chip (D14): the green teal marks private mode and screen readers hear “Private”.',
  usage: { do: ['Show the domain only; tap edits the full address.', 'Let Forward slide in and out with motion-spatial-fast.', 'Pass each menu as a slot; the bar anchors it and gives the long press haptic.'], dont: ['Don’t show a URL, title or count while private mode is locked.', 'Don’t add a second long press haptic in the app.'] },
  props: [DSH.S('state', 'UnifiedBarState'), DSH.S('style · backdrop', 'BarStyle · BackdropState?'), DSH.S('onBack · onForward · onReload · onStop · onAddressClick · onTabsClick', '() -> Unit'), DSH.S('editor', '@Composable () -> Unit'), DSH.S('backMenu · pageMenu · addressMenu · tabMenu', 'UnifiedBarMenuContent?')],
  anatomy: [['Row', 'height · padding', '56dp, space-8 above and below and at the sides, plus the navigation bar inset'], ['Row', 'width', 'capped at control-max and centered; the tint spans the full width'], ['Back · Forward · Tabs', 'target', '48dp'], ['Field', 'height · shape · fill', '52dp · radius-lg · BarStyle.field'], ['Page menu · Reload', 'slot', '44dp inside the field'], ['Domain', 'type', 'type-body-lg, centered, one line'], ['Tint', 'material', 'translucent bar material with blur (D10)']],
  notes: 'Private mode: the bar is always the private green teal, labels start with “Private”, and the blocked request symbol sits after the page menu button.' },
{ id: 'status-bar-strip', name: 'Status bar strip', group: 'organisms', phase: 3, status: 'beta', variants: 3,
  desc: 'The tint behind the status bar at the top of the browser screen, now that the address bar lives at the bottom. Takes the site’s top color in normal mode and the private bar color in private mode.',
  props: [DSH.S('style · backdrop', 'BarStyle · BackdropState?'), DSH.S('windowInsets', 'safeDrawing, top only')],
  anatomy: [['Strip', 'height', 'the status bar inset'], ['Strip', 'material', 'translucent bar material, same as the unified bar']] },
{ id: 'unified-bar-menus', name: 'Unified bar menus', group: 'organisms', phase: 3, status: 'beta', variants: 9,
  desc: 'The three menus of the unified bar. Page menu: Settings, History, Bookmarks, Request desktop or mobile site, Text size, Find on page, Add or Remove bookmark (both modes, D15), Share. Address menu (long press on the domain): Close tab, Share, Paste and go, Copy link. Tab menu (long press on Tabs): Close all, Close this tab, New private tab, New tab; only the two New items while private is locked. They open upward with the most used item nearest the finger.',
  props: [DSH.S('PageMenuContent', 'ColumnScope, state and callbacks'), DSH.S('AddressMenuContent', 'ColumnScope, canPaste and callbacks'), DSH.S('TabMenuContent', 'ColumnScope, locked, tabCount and callbacks')],
  anatomy: [['Surface', 'component', 'Menu (solid, shadowed, D11)'], ['Close all', 'color · haptic', 'text/error · Close all multi pulse'], ['Closes', 'feedback', 'Undo snackbar; private snackbars never name a page']] },
{ id: 'unified-bar-screens', name: 'Unified bar screens', group: 'organisms', phase: 3, status: 'beta', variants: 7,
  desc: 'Whole phone frames at 390dp showing the bar in place: browsing, each menu open, editing above the keyboard, private with a blocked request, and private locked.',
  anatomy: [['Frame', 'width', '390dp, the cover screen'], ['Page', 'content', 'neutral sample background, never real site imagery']] },
{ id: 'docked-address-bar', name: 'Docked address bar', group: 'organisms', phase: 3, status: 'beta', variants: 14,
  desc: 'The unified address bar on the inner screen (D16): a 360dp pill under the rail’s corner, holding only the URL and its buttons. The URL is left aligned. Rail on the right: URL, page menu, Reload or Stop. Rail on the left: Reload or Stop, page menu, URL. Progress, editing and find in page keep working in its place.',
  props: [DSH.S('layout', 'BarLayout.Docked(RailSide.Left | Right)'), DSH.S('hidden', '() -> Float, the swap slide')],
  anatomy: [['Bar', 'width · height', '360dp (PangolinBars.DockedBarWidth) · 64dp'], ['Bar', 'position', 'EdgeGutter 12dp from the rail’s edge and the bottom, plus the navigation bar inset'], ['URL', 'alignment', 'start aligned (centered only in the outer screen layout)']] },
{ id: 'browser-rail', name: 'Browser rail', group: 'organisms', phase: 3, status: 'beta', variants: 6,
  desc: 'The vertical strip of the inner screen L layout (D16), on the left or right edge above the docked bar. Top to bottom: Back (long press history), Forward only when possible, Tabs (long press tab menu), a divider, and the swap button that moves the controls to the other hand.',
  usage: { do: ['Float the rail over the page as glass; the page runs the full width under it (D19).', 'Slide it out through its own edge while the page scrolls down, and back on scroll up or a tap on the pill.', 'Swap by sliding out through the current edge and in from the other one.'], dont: ['Don’t slide the rail across the page.', 'Don’t reserve a strip of the page beside it (retired by D19).'] },
  props: [DSH.S('state', 'UnifiedBarState'), DSH.S('side', 'RailSide'), DSH.S('onBack · onForward · onTabsClick · onSwap', '() -> Unit'), DSH.S('backMenu · tabMenu', 'UnifiedBarMenuContent?')],
  anatomy: [['Rail', 'width · padding', 'RailWidth 64dp · 8dp'], ['Rail', 'position', '12dp from the edge, bottom above the bar (RailGap 8dp)'], ['Targets', 'size · gap', '48dp · 4dp'], ['Swap', 'symbol · motion', 'swap_horiz · out with motion-exit, in with motion-spatial']],
  notes: 'Private mode: labels start with “Private”. Locked: Back disabled, Tabs shows the lock.' },
{ id: 'l-layout-screens', name: 'L layout screens', group: 'organisms', phase: 3, status: 'beta', variants: 11,
  desc: 'Inner screen frames of the L layout: rail on either side, the menus open, editing, find in page, private, locked, and the swap mid way. Since D19 the page runs the full width under the rail in the app; these frames still draw the earlier inset beside the rail and are due a catalog update.',
  anatomy: [['Frame', 'size', 'about 840 x 760dp, the unfolded inner screen'], ['Page', 'width', 'full width under the rail (D19); the 84dp inset shown in the frames is retired']] },
{ id: 'link-menu', name: 'Link menu', group: 'organisms', phase: 3, status: 'beta', variants: 4,
  desc: 'Opens at the touch point when a link on a page is long pressed (D17). First row: the link address, one line, ellipsized in the middle, not tappable. Normal: Open in new tab, Open in background, Open in private tab, then Copy link. Private: Open in new private tab, Open in background, Open in normal tab, then Copy link. Links that are not http or https show only Copy link.',
  usage: { do: ['Use the solid, shadowed Menu (D11) in the mode’s palette, with the press haptic.', 'Switch modes when opening across them; normal to locked private prompts at once.', 'Close it on lock (without animation), mode switch, a fold change and scroll.'], dont: ['Don’t offer a background variant across modes.', 'Don’t show it for javascript: links, on the lock screen or while the address is being edited.'] },
  props: [DSH.S('LinkMenuContent', 'ColumnScope, url, isPrivate and callbacks')],
  anatomy: [['Surface', 'component', 'Menu (solid, shadowed)'], ['Address row', 'type · lines', 'type-body-sm · text/secondary · one line, middle ellipsis'], ['Copy link', 'separation', 'divider above; private copies are marked sensitive']],
  notes: 'Opening a private link in normal mode adds it to normal history. Cookie jars stay separate and the load sends no referrer.' },
{ id: 'compact-bar', name: 'Compact bar', group: 'organisms', phase: 3, status: 'beta', variants: 8,
  desc: 'The floating domain pill the bars collapse into while the page scrolls down (D19). Outer screen: centered 24dp above the bottom of the window. Inner screen: in the docked bar’s corner on the rail’s side, 16dp from the bottom. Shows the loading line or the waiting arc like the full field. Tapping it brings the bars back without starting an edit.',
  usage: { do: ['Use the same glass and tint as the full bar (D10): the site’s footer color in normal mode, always the green teal in private.', 'Label it with the domain plus “show the address bar” (outer) or “show the controls” (inner), starting with “Private” in private mode.'], dont: ['Don’t start editing on the first tap.', 'Don’t show it on the lock screen, the blank tab or while a menu, find in page or the address field is up; the bars stay full there.'] },
  props: [DSH.S('state', 'UnifiedBarState'), DSH.S('layout', 'BarLayout.Centered | Docked(RailSide)'), DSH.S('style · backdrop', 'BarStyle · BackdropState?'), DSH.S('onExpand', '() -> Unit')],
  anatomy: [['Pill', 'height · shape', 'CompactBarHeight 36dp (grows with font scale) · radius-full'], ['Pill', 'padding · stroke', '16dp at the ends · 1dp hairline'], ['Domain', 'type', '14sp medium'], ['Position', 'outer · inner', 'CompactBarBottom 24dp, centered · CompactBarDockedBottom 16dp, EdgeGutter from the side'], ['Loading', 'line', '2dp along the bottom edge']] },
{ id: 'bar-collapse', name: 'Bars collapsing on scroll', group: 'organisms', phase: 3, status: 'beta', variants: 11,
  desc: 'How the browser bars get out of the way while reading (D19), shown at collapse progress 0, 0.5 and 1. Outer screen: the buttons fade out first, then the bar’s material narrows into the compact bar. Inner screen: the rail slides out through its own edge while the docked bar shrinks into the pill in its corner.',
  usage: { do: ['Collapse after 48dp of scrolling down and expand after 24dp up, with a no bounce spring of about 250 ms.', 'Show the bars in full at the top of the page, when a load starts, on lock, with TalkBack on, and while any menu, find in page or the address field is up.', 'Change instantly when the system turns animations off.'], dont: ['Don’t follow the finger.', 'Don’t animate on lock: the lock screen covers the page and the bars show in full at once.'] },
  props: [DSH.S('rememberBarCollapseProgress', 'BarCollapseState -> State<Float>'), DSH.S('BarCollapseMetrics', 'thresholds and offsets')],
  anatomy: [['Thresholds', 'down · up', '48dp · 24dp since the last direction change'], ['Motion', 'spring', 'PangolinMotion default, no bounce'], ['Engine', 'page footer', 'setBottomBarCollapse(px) so fixed footers follow the bar']],
  notes: 'Not yet detected: the bottom of a page and pages shorter than the window (the engine reports only the scroll offset). On the fallback surface without blur the bars never collapse.' },
{ id: 'preview-tile', name: 'Preview tile', group: 'organisms', phase: 3, status: 'beta', variants: 3,
  desc: 'A normal mode tab tile with a picture of the top of the page under a header strip with the host and close, tinted with the page’s top color (D12). Private tiles never use it.',
  anatomy: [['Strip', 'height', '48dp (40dp at 4 columns), grows with font scale'], ['Picture', 'aspect', 'card 0.8'], ['Selected', 'border', '2dp border/selected with a 2dp page colored gap']],
  notes: PRIVATE_RULE },
{ id: 'lock-panel', name: 'Private lock panel', group: 'organisms', phase: 3, status: T,
  desc: 'One lock layout for the browser content area and the private tab grid page: lock symbol, title, optional message, Unlock and Switch to normal browsing. Never animated in, so private content is never visible during a transition.',
  props: [DSH.B('available', true), DSH.T('message', ''), DSH.S('onUnlock · onSwitchToNormal', '() -> Unit')],
  anatomy: [['Symbol', 'size', '40dp lock'], ['Title', 'type', 'type-title-md'], ['Primary action', 'component', 'Button, Filled, “Unlock”'], ['Secondary action', 'component', 'Button, Outlined, “Switch to normal browsing”'], ['Haptics', 'result', 'Unlock succeeds · Unlock fails']] },
{ id: 'dialog', name: 'Dialog', group: 'organisms', phase: 3, status: T,
  desc: 'Only for input (edit bookmark) or a choice that cannot be undone (clear all history). Title is a question or an action; the confirm button names the action.',
  anatomy: [['Surface', 'shape · fill', 'radius-xl · bg/container-high'], ['Width', 'max', 'control-max'], ['Destructive confirm', 'component', 'Button, Destructive']],
  notes: 'Any dialog showing private content closes when private mode locks.' },
{ id: 'bottom-sheet', name: 'Bottom sheet', group: 'organisms', phase: 3, status: T,
  desc: 'Choices and explanations that need more room than a menu: search engine picker, the blocked request explainer, site settings, permission prompts in normal mode.',
  anatomy: [['Surface', 'shape · fill · shadow', 'radius-xl top corners · bg/container-low · shadow-sheet'], ['Motion', 'open', 'motion-spatial']] },

/* ================= Phase 4: feature patterns (scaffold) ================= */
{ id: 'download-row', name: 'Download row', group: 'features', phase: 4, status: T,
  desc: 'List row variant with progress and a row menu (open, share, delete with Undo). Private downloads never appear in normal download history.',
  anatomy: [['Leading', 'content', 'Letter badge by file type'], ['Progress', 'component', 'Progress line inside the row']] },
{ id: 'permission-sheet', name: 'Permission sheet', group: 'features', phase: 4, status: T,
  desc: 'Normal mode only. Names the site and the permission with its symbol, and offers Allow and Don’t allow. Remembered per site.',
  anatomy: [['Container', 'component', 'Bottom sheet'], ['Actions', 'components', 'Button Filled “Allow” · Button Text “Don’t allow”']],
  notes: 'In private mode this sheet never appears; the Blocked indicator explains instead.' },
{ id: 'site-settings-sheet', name: 'Site settings sheet', group: 'features', phase: 4, status: T,
  desc: 'From the address bar: the site, its permissions as rows with a symbol and a value, and zoom. In private mode it only explains that everything is blocked.',
  anatomy: [['Rows', 'component', 'Choice row']] },
{ id: 'close-all-menu', name: 'Close all menu', group: 'features', phase: 4, status: 'beta',
  desc: 'Built into the unified bar’s tab menu (long press on Tabs, D13) instead of the New tab button: “Close all N tabs” or “Close all private tabs”. Acts at once and shows Undo; a private close is committed at once if private mode locks.',
  anatomy: [['Container', 'component', 'Unified bar menus, tab menu'], ['Haptic', 'on close', 'Close all (distinct multi pulse)']] },
{ id: 'pull-to-reload', name: 'Pull to reload indicator', group: 'features', phase: 4, status: T,
  desc: 'Pull down on a page to reload it. The indicator follows the finger and fires one haptic as it crosses the threshold. Lands with the browser screen in Phase 3.',
  anatomy: [['Indicator', 'fill · symbol', 'bg/container-high · refresh in text/accent'], ['Motion', 'follow · release', 'finger tracked · motion-spatial'], ['Haptic', 'threshold', 'Pull to reload']] },
{ id: 'start-page-tile', name: 'Start page tile', group: 'features', phase: 4, status: T,
  desc: 'Bookmark shortcuts on a start page (product Phase 2), drawn with letter badges and no thumbnails.',
  anatomy: [['Badge', 'component', 'Letter badge, L'], ['Label', 'type', 'type-body-sm']] },
];
