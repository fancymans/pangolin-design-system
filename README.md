# Pangolin Design System

Documentation for the design system of [Pangolin](https://github.com/fancymans/pangolin), an Android browser whose private tabs survive the app being closed. The site shows every token and component, in normal light, normal dark and private mode.

**Live site:** https://fancymans.github.io/pangolin-design-system/

## Where things live

This repo documents the design system; it does not define it.

| What | Source of truth | Here |
|---|---|---|
| Token values (color, spacing, radius, type, motion, browser bars) | `design/tokens.json` in the app repo | `data/tokens.json`, a copy |
| Components | Compose code in the app's `:core:designsystem` module | `data/shots/`, screenshots rendered by the app's CI |
| Component states | `DesignCatalog.kt` in the app repo | `data/DesignCatalog.kt`, a copy (for state labels) |
| Usage, anatomy, phases, page design | this repo | `site/` |

To change a token or a component, open a pull request on the app repo. After it merges, the app's CI renders the components, copies the files into `data/` here, and this repo's workflow rebuilds and publishes the site. Do not edit `data/` by hand.

To change the docs (usage notes, anatomy tables, page layout), edit `site/` here.

## Build locally

```
pip install pillow   # optional, trims tall menu screenshots
python3 site/build.py _site
open _site/index.html
```

`site/template.html` comes from the design-system-site skill. Component screenshots are rendered with Roborazzi under Robolectric, which does not draw elevation shadows, so menus show without their shadow here.
