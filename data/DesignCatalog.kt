@file:OptIn(ExperimentalLayoutApi::class)

package design.darrin.pangolin.core.designsystem.catalog

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import design.darrin.pangolin.core.designsystem.HapticMoment
import design.darrin.pangolin.core.designsystem.PangolinShapes
import design.darrin.pangolin.core.designsystem.PangolinSpacing
import design.darrin.pangolin.core.designsystem.PangolinTheme
import design.darrin.pangolin.core.designsystem.R
import design.darrin.pangolin.core.designsystem.atoms.BadgeSize
import design.darrin.pangolin.core.designsystem.atoms.ButtonSize
import design.darrin.pangolin.core.designsystem.atoms.ButtonVariant
import design.darrin.pangolin.core.designsystem.atoms.CloseButtonSize
import design.darrin.pangolin.core.designsystem.atoms.LetterBadge
import design.darrin.pangolin.core.designsystem.atoms.NewTabButton
import design.darrin.pangolin.core.designsystem.atoms.PangolinButton
import design.darrin.pangolin.core.designsystem.atoms.PangolinCloseButton
import design.darrin.pangolin.core.designsystem.atoms.PangolinIconButton
import design.darrin.pangolin.core.designsystem.atoms.PangolinIconToggle
import design.darrin.pangolin.core.designsystem.atoms.PrivateChip
import design.darrin.pangolin.core.designsystem.atoms.ProgressLine
import design.darrin.pangolin.core.designsystem.atoms.SymbolIcon
import design.darrin.pangolin.core.designsystem.atoms.SymbolSizeLarge
import design.darrin.pangolin.core.designsystem.atoms.TabCounter
import design.darrin.pangolin.core.designsystem.atoms.badgeLetter
import design.darrin.pangolin.core.designsystem.molecules.Banner
import design.darrin.pangolin.core.designsystem.molecules.BannerTone
import design.darrin.pangolin.core.designsystem.molecules.BlockedIndicator
import design.darrin.pangolin.core.designsystem.molecules.BlockedKind
import design.darrin.pangolin.core.designsystem.molecules.ChoiceControl
import design.darrin.pangolin.core.designsystem.molecules.ChoiceRow
import design.darrin.pangolin.core.designsystem.molecules.EmptyState
import design.darrin.pangolin.core.designsystem.molecules.ListRowStyle
import design.darrin.pangolin.core.designsystem.molecules.PangolinListRow
import design.darrin.pangolin.core.designsystem.molecules.PangolinMenu
import design.darrin.pangolin.core.designsystem.molecules.PangolinMenuItem
import design.darrin.pangolin.core.designsystem.molecules.PangolinSnackbar
import design.darrin.pangolin.core.designsystem.molecules.SearchField
import design.darrin.pangolin.core.designsystem.molecules.SectionLabel
import design.darrin.pangolin.core.designsystem.molecules.SegmentedPill
import design.darrin.pangolin.core.designsystem.molecules.StateAction
import design.darrin.pangolin.core.designsystem.rememberPangolinHaptics

/**
 * Every design system component and state, defined once (PRD section 7, "Design system source of
 * truth"). The in-app Design system screen shows these live; CI renders them to screenshots in
 * light, dark and private for the reference site. A new component adds its states here.
 *
 * [still] is true for screenshots: anything that opens on tap (menus) is drawn open, and nothing
 * depends on time. Labels are developer facing and stay in English.
 */
object DesignCatalog {
    val entries: List<CatalogEntry> = listOf(
        // ---------- Atoms ----------
        CatalogEntry("icon", "Icon", CatalogGroup.Atoms, listOf(
            CatalogState("set", "24dp set") {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(PangolinSpacing.Space16)) {
                    listOf(
                        R.drawable.ic_symbol_chevron_left, R.drawable.ic_symbol_chevron_right, R.drawable.ic_symbol_refresh,
                        R.drawable.ic_symbol_link, R.drawable.ic_symbol_star, R.drawable.ic_symbol_star_filled,
                        R.drawable.ic_symbol_more_vert, R.drawable.ic_symbol_add, R.drawable.ic_symbol_close,
                        R.drawable.ic_symbol_lock, R.drawable.ic_symbol_search, R.drawable.ic_symbol_tab,
                        R.drawable.ic_symbol_history, R.drawable.ic_symbol_info, R.drawable.ic_symbol_error,
                    ).forEach { SymbolIcon(it, tint = PangolinTheme.colors.textPrimary) }
                }
            },
            CatalogState("large", "40dp, empty and lock states") {
                SymbolIcon(R.drawable.ic_symbol_lock, tint = PangolinTheme.colors.textSecondary, size = SymbolSizeLarge)
            },
        )),
        CatalogEntry("icon-button", "Icon button", CatalogGroup.Atoms, listOf(
            CatalogState("states", "Standard, disabled") {
                Row {
                    PangolinIconButton(R.drawable.ic_symbol_chevron_left, "Back", onClick = {})
                    PangolinIconButton(R.drawable.ic_symbol_refresh, "Reload", onClick = {})
                    PangolinIconButton(R.drawable.ic_symbol_link, "Copy link", onClick = {}, enabled = false)
                    PangolinIconButton(R.drawable.ic_symbol_more_vert, "More options", onClick = {})
                }
            },
            CatalogState("toggle", "Toggle, off and on") {
                var on by remember { mutableStateOf(true) }
                Row {
                    PangolinIconToggle(R.drawable.ic_symbol_star, R.drawable.ic_symbol_star_filled, false, "Add bookmark", {})
                    PangolinIconToggle(R.drawable.ic_symbol_star, R.drawable.ic_symbol_star_filled, on, "Bookmark", { on = it })
                }
            },
        )),
        CatalogEntry("button", "Button", CatalogGroup.Atoms, listOf(
            CatalogState("variants", "Filled, Outlined, Text, Destructive") {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(PangolinSpacing.Space8),
                    verticalArrangement = Arrangement.spacedBy(PangolinSpacing.Space8),
                ) {
                    PangolinButton("Unlock", onClick = {}, leadingSymbol = R.drawable.ic_symbol_lock)
                    PangolinButton("Switch to normal browsing", onClick = {}, variant = ButtonVariant.Outlined)
                    PangolinButton("Cancel", onClick = {}, variant = ButtonVariant.Text)
                    PangolinButton("Clear", onClick = {}, variant = ButtonVariant.Destructive)
                }
            },
            CatalogState("large-disabled", "Large (Done), disabled") {
                Row(horizontalArrangement = Arrangement.spacedBy(PangolinSpacing.Space8), verticalAlignment = Alignment.CenterVertically) {
                    PangolinButton("Done", onClick = {}, variant = ButtonVariant.Text, size = ButtonSize.Large)
                    PangolinButton("Unlock", onClick = {}, enabled = false)
                }
            },
        )),
        CatalogEntry("letter-badge", "Letter badge", CatalogGroup.Atoms, listOf(
            CatalogState("sizes", "Small, Medium, Large, no letter") {
                Row(horizontalArrangement = Arrangement.spacedBy(PangolinSpacing.Space12), verticalAlignment = Alignment.CenterVertically) {
                    LetterBadge(badgeLetter("wikipedia.org"), size = BadgeSize.Small)
                    LetterBadge(badgeLetter("github.com"), size = BadgeSize.Medium)
                    LetterBadge(badgeLetter("nytimes.com"), size = BadgeSize.Large)
                    LetterBadge(badgeLetter("", "!"), size = BadgeSize.Medium)
                }
            },
        )),
        CatalogEntry("private-chip", "Private chip", CatalogGroup.Atoms, listOf(
            CatalogState("default", "Same colors in every mode") { PrivateChip() },
        )),
        CatalogEntry("tab-counter", "Tab counter", CatalogGroup.Atoms, listOf(
            CatalogState("counts", "3, 12, 140, private locked") {
                Row {
                    TabCounter(3, onClick = {})
                    TabCounter(12, onClick = {})
                    TabCounter(140, onClick = {})
                    TabCounter(3, onClick = {}, locked = true)
                }
            },
        )),
        CatalogEntry("close-button", "Close button", CatalogGroup.Atoms, listOf(
            CatalogState("on-tiles", "On a tile: 2 columns, 4 columns") {
                Row(horizontalArrangement = Arrangement.spacedBy(PangolinSpacing.Space16)) {
                    TileSurface(widthDp = 150, corner = PangolinShapes.Xl) {
                        PangolinCloseButton(onClick = {}, modifier = Modifier.padding(6.dp))
                    }
                    TileSurface(widthDp = 110, corner = PangolinShapes.Md) {
                        PangolinCloseButton(onClick = {}, size = CloseButtonSize.Small)
                    }
                }
            },
        )),
        CatalogEntry("new-tab-button", "New tab button", CatalogGroup.Atoms, listOf(
            CatalogState("default", "Default") { NewTabButton(onClick = {}) },
        )),
        CatalogEntry("progress-line", "Progress line", CatalogGroup.Atoms, listOf(
            CatalogState("progress", "At 60%") {
                ProgressLine(progress = { 0.6f }, modifier = Modifier.fillMaxWidth())
            },
        )),

        // ---------- Molecules ----------
        CatalogEntry("segmented-pill", "Segmented pill", CatalogGroup.Molecules, listOf(
            CatalogState("normal", "Normal selected (tap to switch)") {
                var selected by remember { mutableIntStateOf(0) }
                SegmentedPill(listOf("3 Tabs", "Private"), selected, onSelect = { selected = it })
            },
            CatalogState("private", "Private selected") {
                SegmentedPill(listOf("3 Tabs", "Private"), 1, onSelect = {})
            },
            CatalogState("dragging", "Mid swipe") {
                SegmentedPill(listOf("3 Tabs", "Private"), 0, onSelect = {}, position = 0.5f)
            },
        )),
        CatalogEntry("search-field", "Search field", CatalogGroup.Molecules, listOf(
            CatalogState("empty", "Empty") {
                var query by remember { mutableStateOf("") }
                SearchField(query, { query = it }, placeholder = "Search bookmarks")
            },
            CatalogState("filled", "With a query") {
                var query by remember { mutableStateOf("github") }
                SearchField(query, { query = it }, placeholder = "Search bookmarks")
            },
        )),
        CatalogEntry("list-row", "List row", CatalogGroup.Molecules, listOf(
            CatalogState("card", "Card (bookmarks)") {
                PangolinListRow(
                    title = "Pangolin on GitHub",
                    supporting = "github.com",
                    onClick = {},
                    leading = { LetterBadge(badgeLetter("github.com"), size = BadgeSize.Large) },
                    trailing = { PangolinIconButton(R.drawable.ic_symbol_more_vert, "More actions", onClick = {}) },
                )
            },
            CatalogState("plain", "Plain with section label (history, settings)") {
                Column {
                    SectionLabel("Today")
                    PangolinListRow(
                        title = "Pull requests",
                        supporting = "9:41 AM  github.com/pulls",
                        style = ListRowStyle.Plain,
                        onClick = {},
                        leading = { LetterBadge(badgeLetter("github.com")) },
                        trailing = { PangolinButton("Delete", onClick = {}, variant = ButtonVariant.Text) },
                    )
                    HorizontalDivider(color = PangolinTheme.colors.borderOutlineVariant)
                    PangolinListRow(title = "Search engine", supporting = "DuckDuckGo", style = ListRowStyle.Plain, onClick = {})
                }
            },
        )),
        CatalogEntry("choice-row", "Choice row", CatalogGroup.Molecules, listOf(
            CatalogState("radio", "Radio") {
                var picked by remember { mutableIntStateOf(0) }
                Column {
                    listOf("DuckDuckGo", "Google", "Startpage").forEachIndexed { i, label ->
                        ChoiceRow(label, selected = picked == i, onSelect = { picked = i })
                    }
                }
            },
            CatalogState("switch", "Switch, on and off") {
                var on by remember { mutableStateOf(true) }
                Column {
                    ChoiceRow("Show tab thumbnails", on, { on = it }, control = ChoiceControl.Switch)
                    ChoiceRow("Block pop ups", false, {}, control = ChoiceControl.Switch, supporting = "Disabled example", enabled = false)
                }
            },
        )),
        CatalogEntry("menu", "Menu", CatalogGroup.Molecules, listOf(
            CatalogState("row-menu", "Row menu (tap to open)", screenshotWindow = true) { still ->
                var open by remember { mutableStateOf(still) }
                Box {
                    PangolinIconButton(R.drawable.ic_symbol_more_vert, "More actions", onClick = { open = true })
                    PangolinMenu(expanded = open, onDismissRequest = { open = false }) {
                        listOf("Open", "Open in new tab", "Edit", "Copy link").forEach {
                            PangolinMenuItem(it, onClick = { open = false })
                        }
                        PangolinMenuItem("Delete", onClick = { open = false }, destructive = true)
                    }
                }
            },
        )),
        CatalogEntry("snackbar", "Snackbar", CatalogGroup.Molecules, listOf(
            CatalogState("undo", "With Undo") { PangolinSnackbar("Bookmark deleted", actionLabel = "Undo") },
            CatalogState("plain", "Message only") { PangolinSnackbar("Link copied") },
        )),
        CatalogEntry("banner", "Banner", CatalogGroup.Molecules, listOf(
            CatalogState("error", "Error with action") {
                Banner(
                    "Private mode needs a screen lock. Set a PIN, pattern or password to use it.",
                    tone = BannerTone.Error,
                    action = StateAction("Set screen lock") {},
                )
            },
            CatalogState("info", "Info, dismissible") {
                Banner("Private downloads are saved to your Downloads folder.", onDismiss = {})
            },
        )),
        CatalogEntry("empty-state", "Empty state", CatalogGroup.Molecules, listOf(
            CatalogState("empty", "Body, no action") {
                EmptyState(
                    R.drawable.ic_symbol_star,
                    "No bookmarks",
                    body = "Tap the star next to the address bar to save a page in normal browsing.",
                    modifier = Modifier.widthIn(max = 360.dp),
                )
            },
            CatalogState("locked", "Locked, with action") {
                EmptyState(
                    R.drawable.ic_symbol_lock,
                    "Private tabs are locked",
                    action = StateAction("Unlock") {},
                    modifier = Modifier.widthIn(max = 360.dp),
                )
            },
        )),
        CatalogEntry("blocked-indicator", "Blocked indicator", CatalogGroup.Molecules, listOf(
            CatalogState("kinds", "Beside the Private chip") {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    PrivateChip(Modifier.padding(end = PangolinSpacing.Space4))
                    BlockedKind.entries.forEach { BlockedIndicator(it, onClick = {}) }
                }
            },
        )),
        CatalogEntry("haptics", "Haptics", CatalogGroup.Foundations, listOf(
            CatalogState("moments", "Tap to feel each moment", screenshot = false) {
                val haptics = rememberPangolinHaptics()
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(PangolinSpacing.Space8),
                    verticalArrangement = Arrangement.spacedBy(PangolinSpacing.Space8),
                ) {
                    HapticMoment.entries.forEach { moment ->
                        PangolinButton(moment.name, onClick = { haptics.perform(moment) }, variant = ButtonVariant.Outlined)
                    }
                }
            },
        )),
    )
}

enum class CatalogGroup(val title: String) { Foundations("Foundations"), Atoms("Atoms"), Molecules("Molecules") }

data class CatalogEntry(val id: String, val name: String, val group: CatalogGroup, val states: List<CatalogState>)

/**
 * One state of a component. [screenshot] false keeps it out of CI screenshots (haptics).
 * [screenshotWindow] means the state draws a popup, so CI captures the whole window.
 */
class CatalogState(
    val id: String,
    val label: String,
    val screenshot: Boolean = true,
    val screenshotWindow: Boolean = false,
    val content: @Composable (still: Boolean) -> Unit,
)

/** A tile card to show close buttons in place. */
@Composable
private fun TileSurface(widthDp: Int, corner: androidx.compose.ui.graphics.Shape, content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .width(widthDp.dp)
            .aspectRatio(0.8f)
            .clip(corner)
            .background(PangolinTheme.colors.bgContainerHigh),
        contentAlignment = Alignment.TopEnd,
    ) { content() }
}
