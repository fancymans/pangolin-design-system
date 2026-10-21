/* =====================================================================
   BRAND + TOKENS for Pangolin. Color values are generated from the
   decided seeds (bronze #8C6A3F for normal mode, the five fixed private
   values for private mode) and contrast checked before publish.
   ===================================================================== */
window.DS_BRAND = {
  name: 'Pangolin',
  initial: 'P',
  markBg: '#2F6F5E', markFg: '#FEC884',
  font: "'Roboto Flex', Roboto, system-ui, sans-serif",
  mono: "'Roboto Mono', ui-monospace, Menlo, monospace",
  fontName: 'System default (Roboto on stock Android, One UI font on Samsung)',
  fontNote: 'The app uses the device font (FontFamily.Default), so it honors the user’s Samsung font and size choices and adds nothing to the APK. Previews here use Roboto Flex as a stand in for the Android default.',
  iconLibrary: { name: 'Material Symbols', url: 'https://fonts.google.com/icons', note: 'Outlined, weight 400, grade 0, 24dp, as Android vector drawables' },
  customIconNote: 'No custom drawn icons, text glyphs or emoji. The tab counter is a counter, not an icon. Filled variants appear only for an active state, such as a bookmarked star.',
  figmaUrl: '',
  logos: __LOGOS__,
  // Product modes. Every semantic token has a value for each; previews follow the mode picked in the top bar.
  modes: [
    { id: 'light', name: 'Normal light' },
    { id: 'dark', name: 'Normal dark' },
    { id: 'private', name: 'Private' },
  ],
};

// Primitive ramps, keyed by Material tone. bronze and sand feed normal mode; jade and moss feed private mode.
window.DS_PRIMITIVES = __PRIMS__;

// Semantic tokens: [name, ref or { light, dark, private }, status?, note?]
window.DS_SEMANTIC = __SEM__;

window.DS_SCALES = {
  // 4dp grid. From design/tokens.json.
  space: __SPACE__,
  // Softer scale, decided 2026-10-19. From design/tokens.json.
  radius: __RADIUS__,

  // Pangolin is flat and tonal. Shadows appear only on overlays.
  shadow: {
    overlay: '0 6px 16px rgb(18 13 8 / .22), 0 1px 3px rgb(18 13 8 / .14)',
    sheet: '0 -4px 24px rgb(18 13 8 / .24)',
  },
  // [name, size sp, line height sp, weight, used for]. From design/tokens.json.
  type: __TYPE__,
  // Motion, decided 2026-10-19: springs without bounce for movement, short fades for appearance.
  motion: [
    ['motion-spatial', 'spring(dampingRatio = 1f, stiffness = 400f)', 'Pager settle, pill highlight, sheet open', 'spring', 1, 400],
    ['motion-spatial-fast', 'spring(dampingRatio = 1f, stiffness = 1500f)', 'Menus, chips, small position changes', 'spring', 1, 1500],
    ['motion-fade-short', 'tween(150, FastOutSlowInEasing)', 'Icon swaps (reload to stop), enabled to disabled', 'tween', 150, 'cubic-bezier(.4,0,.2,1)'],
    ['motion-fade-medium', 'tween(250, EmphasizedDecelerate)', 'Content appearing, snackbar in', 'tween', 250, 'cubic-bezier(.05,.7,.1,1)'],
    ['motion-exit', 'tween(200, EmphasizedAccelerate)', 'Dismissals, snackbar out', 'tween', 200, 'cubic-bezier(.3,0,.8,.15)'],
    ['motion-mode-crossfade', 'tween(300)', 'Color scheme change between normal and private', 'tween', 300, 'linear'],
    ['motion-fade-through-out', 'tween(90, EmphasizedAccelerate)', 'Fade through, first half: the old screen goes before the new one appears', 'tween', 90, 'cubic-bezier(.3,0,.8,.15)'],
    ['motion-fade-through-in', 'tween(210, delay 90, EmphasizedDecelerate), from 92% scale', 'Fade through, second half: bookmarks, history, settings, and the tab grid fallback', 'tween', 210, 'cubic-bezier(.05,.7,.1,1)'],
    ['motion-bar-tint', 'tween(150, FastOutSlowInEasing)', 'Browser bar tint moving from one site’s color to the next. Never for a mode or lock change', 'tween', 150, 'cubic-bezier(.4,0,.2,1)'],
  ],
  // Haptics, decided 2026-10-19. One PangolinHaptics helper maps moments to feedback.
  haptics: [
    ['Mode switch', 'Swipe settles on the other mode, or a pill segment is tapped', 'SEGMENT_TICK (API 34+), CLOCK_TICK below'],
    ['Long press menu', 'Back history, close all on +, row menus', 'LONG_PRESS'],
    ['Pull to reload', 'Pull down crosses the reload threshold, once per pull', 'GESTURE_THRESHOLD_ACTIVATE (API 34+), CONTEXT_CLICK below'],
    ['Scroll to top', 'Pull up past the bottom crosses the threshold, once per pull', 'GESTURE_THRESHOLD_ACTIVATE (API 34+), CONTEXT_CLICK below'],
    ['Page loaded', 'The visible tab finishes loading; never background tabs', 'CONFIRM'],
    ['New tab', 'A tab is opened from + or a link', 'VIRTUAL_KEY'],
    ['Tab closed', 'X on a tile', 'VIRTUAL_KEY_RELEASE'],
    ['Close all', 'All tabs closed; the only custom pattern', 'Composition: 3 × PRIMITIVE_TICK at rising scale, then PRIMITIVE_THUD'],
    ['Unlock succeeds', 'Biometric or screen lock accepted', 'CONFIRM'],
    ['Unlock fails', 'Failed or locked out', 'REJECT'],
  ],
  // Browser bars (D10, D11). PangolinBars in code.
  bars: __BARS__,
  // Layout widths and the Fold breakpoint.
  layout: __LAYOUT__,
};

// Delivery phases. Phase 1 is this build; later phases are scaffolded as TBD components.
window.DS_PHASES = [
  { n: 1, name: 'Foundations and atoms', status: 'Done (PR #17)', items: [
    'Tokens: color for normal light, normal dark and private; type; spacing; shape; elevation; motion; haptics.',
    '<code>:core:designsystem</code> module with <code>PangolinTheme</code>, <code>PangolinHaptics</code>, one copy of the Material Symbols drawables, and contrast unit tests for every text pair in all three modes.',
    'Atoms: Icon, Icon button, Button, Letter badge, Private chip, Tab counter, Close button, New tab button, Progress line.',
    'App wide theme swap to bronze and green teal. Screens keep their layouts.'] },
  { n: 2, name: 'Molecules', status: 'In review (PRs #27 to #29)', items: [
    'Segmented pill, Search field and incognito keyboard, List row and section label, Menu, Snackbar, Banner, Empty state, Blocked indicator, Choice row.',
    'The tab grid adopts the pill, empty states, close and new tab buttons and its haptics; bookmarks, history and settings adopt the rows, search, menu, snackbar, banner and choice rows. UI text moves to string resources.',
    'The Address field moves to Phase 3 with the Address bar, since its tint follows the bar.'] },
  { n: 3, name: 'Organisms and screens', status: 'Planned', items: [
    'Tab tile, Tab grid action bar, Browser toolbar, Address bar and Address field, Private lock panel, Dialog, Bottom sheet.',
    'Screens one PR each: browser screen with pull to reload, lock screen, bookmarks and history, settings. Strings move into resources with each screen.'] },
  { n: 4, name: 'Feature patterns', status: 'Backlog', items: [
    'Find in page bar, Download row, Permission sheet, Site settings sheet, Close all menu, Pull to reload indicator, Start page tile.',
    'Built when the matching product phase starts.'] },
];
