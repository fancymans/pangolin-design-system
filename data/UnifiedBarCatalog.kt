package design.darrin.pangolin.core.designsystem.catalog

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.absolutePadding
import androidx.compose.ui.AbsoluteAlignment
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.Constraints
import design.darrin.pangolin.core.designsystem.BarLayout
import design.darrin.pangolin.core.designsystem.LLayoutMetrics
import design.darrin.pangolin.core.designsystem.RailSide
import design.darrin.pangolin.core.designsystem.ReservedAreaColors
import design.darrin.pangolin.core.designsystem.organisms.PangolinBrowserRail
import design.darrin.pangolin.core.designsystem.organisms.PangolinCompactBar
import kotlin.math.roundToInt
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import design.darrin.pangolin.core.designsystem.BarBackdrop
import design.darrin.pangolin.core.designsystem.BarColors
import design.darrin.pangolin.core.designsystem.BarStyle
import design.darrin.pangolin.core.designsystem.PangolinBars
import design.darrin.pangolin.core.designsystem.PangolinMode
import design.darrin.pangolin.core.designsystem.PangolinShapes
import design.darrin.pangolin.core.designsystem.PangolinSpacing
import design.darrin.pangolin.core.designsystem.PangolinTheme
import design.darrin.pangolin.core.designsystem.PangolinType
import design.darrin.pangolin.core.designsystem.R
import design.darrin.pangolin.core.designsystem.atoms.PangolinIconButton
import design.darrin.pangolin.core.designsystem.molecules.BlockedKind
import design.darrin.pangolin.core.designsystem.molecules.EmptyState
import design.darrin.pangolin.core.designsystem.molecules.FieldProgress
import design.darrin.pangolin.core.designsystem.molecules.FindInPageBar
import design.darrin.pangolin.core.designsystem.molecules.FindInPageState
import design.darrin.pangolin.core.designsystem.molecules.PangolinMenuDivider
import design.darrin.pangolin.core.designsystem.molecules.PangolinMenuItem
import design.darrin.pangolin.core.designsystem.molecules.PangolinMenuSurface
import design.darrin.pangolin.core.designsystem.molecules.StateAction
import design.darrin.pangolin.core.designsystem.molecules.TextSizeMenuRow
import design.darrin.pangolin.core.designsystem.organisms.AddressMenuContent
import design.darrin.pangolin.core.designsystem.organisms.LinkMenuContent
import design.darrin.pangolin.core.designsystem.organisms.PageMenuContent
import design.darrin.pangolin.core.designsystem.organisms.StatusBarStrip
import design.darrin.pangolin.core.designsystem.organisms.TabMenuContent
import design.darrin.pangolin.core.designsystem.organisms.UnifiedAddressBar
import design.darrin.pangolin.core.designsystem.organisms.UnifiedBarState
import design.darrin.pangolin.core.designsystem.organisms.UnifiedBarMenuContent

/**
 * Catalog states for the unified address bar (docs/design/unified-address-bar-plan.md): the
 * field progress, the text size row, the bar in every state of the design canvas, its menus as
 * standalone surfaces, and full width compositions like the canvas phone frames. Every
 * screenshot is one still frame (staticPreview): no infinite animation runs under Roborazzi.
 *
 * States marked private draw in the private palette whatever the catalog mode, because private
 * mode is always the fixed green teal (brief D2); the others follow the catalog's mode.
 */
internal object UnifiedBarCatalog {

    private val sampleHost = "example.com"
    private val longHost = "a-very-long-registrable-domain-name-example.co.uk"
    private val sampleLink = "https://example.com/articles/pangolins"
    private val longLink = "https://www.a-very-long-registrable-domain-name-example.co.uk/articles/2026/10/28/" +
        "how-pangolins-roll-into-a-ball-when-threatened?utm_source=newsletter&utm_medium=email#scales"

    private val first = UnifiedBarState(host = sampleHost, placeholder = "Search or enter address", tabCount = 3)
    private val backAvailable = first.copy(canGoBack = true)
    private val backForward = first.copy(canGoBack = true, canGoForward = true)
    private val waiting = backAvailable.copy(loading = true, waitingForSite = true, progress = 0.05f)
    private val arriving = backAvailable.copy(loading = true, waitingForSite = false, progress = 0.38f)
    private val longHostForward = backForward.copy(host = longHost)
    private val blank = UnifiedBarState(host = null, placeholder = "Search or enter address", tabCount = 4, reloadAvailable = false)
    private val editing = backAvailable.copy(editing = true)
    private val privateBlocked = UnifiedBarState(
        isPrivate = true, host = sampleHost, placeholder = "Search privately", canGoBack = true, tabCount = 2,
        blocked = BlockedKind.Location,
    )
    private val privateLocked = UnifiedBarState(
        isPrivate = true, locked = true, host = null, placeholder = "Search privately", tabCount = 2, reloadAvailable = false,
    )

    val entries: List<CatalogEntry> = listOf(
        CatalogEntry("field-progress", "Field progress", CatalogGroup.Molecules, listOf(
            CatalogState("waiting", "Waiting for the site: the arc circles the field") { still ->
                ProgressSample(loading = true, waiting = true, progress = 0f, still = still)
            },
            CatalogState("arriving", "Page arriving: the line at 38%") { still ->
                ProgressSample(loading = true, waiting = false, progress = 0.38f, still = still)
            },
            CatalogState("still-outline", "Remove animations: the arc is a still outline") { still ->
                ProgressSample(loading = true, waiting = true, progress = 0f, still = still, animations = false)
            },
        )),
        CatalogEntry("text-size-row", "Text size row", CatalogGroup.Molecules, listOf(
            CatalogState("steps", "100%, at the smallest, disabled") {
                Column(verticalArrangement = Arrangement.spacedBy(PangolinSpacing.Space12)) {
                    PangolinMenuSurface {
                        TextSizeMenuRow(percent = 100, canDecrease = true, canIncrease = true, onDecrease = {}, onIncrease = {})
                    }
                    PangolinMenuSurface {
                        TextSizeMenuRow(percent = 50, canDecrease = false, canIncrease = true, onDecrease = {}, onIncrease = {})
                    }
                    PangolinMenuSurface {
                        TextSizeMenuRow(percent = 100, canDecrease = true, canIncrease = true, onDecrease = {}, onIncrease = {}, enabled = false)
                    }
                }
            },
        )),
        CatalogEntry("find-in-page-bar", "Find in page bar", CatalogGroup.Molecules, listOf(
            CatalogState("empty", "Just opened: empty, nothing to step through") { FindSample(FindInPageState()) },
            CatalogState("matches", "Typing with matches: 3 of 12") {
                FindSample(FindInPageState(query = "pangolin", current = 3, total = 12, resultKnown = true))
            },
            CatalogState("no-matches", "No matches: previous and next disabled") {
                FindSample(FindInPageState(query = "armadillo", current = 0, total = 0, resultKnown = true))
            },
            CatalogState("private", "Private") {
                PrivateIfNeeded(true) {
                    FindSample(FindInPageState(query = "scales", current = 1, total = 4, resultKnown = true, isPrivate = true))
                }
            },
            CatalogState("docked-right", "Docked (L layout), rail on the right") {
                FindSample(FindInPageState(query = "pangolin", current = 3, total = 12, resultKnown = true), layout = BarLayout.Docked(RailSide.Right))
            },
            CatalogState("docked-left", "Docked (L layout), rail on the left") {
                FindSample(FindInPageState(query = "armadillo", current = 0, total = 0, resultKnown = true), layout = BarLayout.Docked(RailSide.Left))
            },
        )),
        CatalogEntry("unified-address-bar", "Unified address bar", CatalogGroup.Organisms, listOf(
            barState("first-page", "First page: Back dimmed", first),
            barState("back", "Back available", backAvailable),
            barState("back-forward", "Back and forward", backForward),
            barState("waiting", "Waiting for the site (arc), Stop", waiting),
            barState("arriving", "Page arriving (line at 38%)", arriving),
            barState("long-host", "Long host with forward", longHostForward),
            barState("blank", "Blank tab: placeholder, no reload", blank),
            barState("editing", "Editing: the field takes the row", editing),
            barState("site-color", "Site color (dark site header)", arriving, siteColor = SamplePage.Dark.header.toArgb()),
            barState("private-blocked", "Private with a blocked request", privateBlocked),
            barState("private-locked", "Private locked", privateLocked),
        )),
        CatalogEntry("status-bar-strip", "Status bar strip", CatalogGroup.Organisms, listOf(
            CatalogState("theme", "Theme bar color") { StripSample(siteColor = null, isPrivate = false) },
            CatalogState("site", "Site top color") { StripSample(siteColor = SamplePage.Bright.header.toArgb(), isPrivate = false) },
            CatalogState("private", "Private") { StripSample(siteColor = null, isPrivate = true) },
        )),
        CatalogEntry("unified-bar-menus", "Unified bar menus", CatalogGroup.Organisms, listOf(
            CatalogState("page-normal", "Page menu, normal (bookmarked page)") {
                PangolinMenuSurface { ShowMenu(PageMenuSample(isPrivate = false, bookmarked = true)) }
            },
            CatalogState("page-private", "Page menu, private (Add bookmark saves to the shared list)") {
                PrivateIfNeeded(true) { PangolinMenuSurface { ShowMenu(PageMenuSample(isPrivate = true, bookmarked = false)) } }
            },
            CatalogState("page-private-bookmarked", "Page menu, private (bookmarked page)") {
                PrivateIfNeeded(true) { PangolinMenuSurface { ShowMenu(PageMenuSample(isPrivate = true, bookmarked = true)) } }
            },
            CatalogState("page-blank", "Page menu on a blank tab") {
                PangolinMenuSurface { ShowMenu(PageMenuSample(isPrivate = false, bookmarked = false, blank = true)) }
            },
            CatalogState("address", "Address menu, clipboard holds text") {
                PangolinMenuSurface { ShowMenu(AddressMenuSample(isPrivate = false, canPaste = true)) }
            },
            CatalogState("address-no-paste", "Address menu, private, nothing to paste") {
                PrivateIfNeeded(true) { PangolinMenuSurface { ShowMenu(AddressMenuSample(isPrivate = true, canPaste = false)) } }
            },
            CatalogState("tabs-normal", "Tab menu, normal") {
                PangolinMenuSurface { ShowMenu(TabMenuSample(isPrivate = false, locked = false, count = 3)) }
            },
            CatalogState("tabs-private", "Tab menu, private") {
                PrivateIfNeeded(true) { PangolinMenuSurface { ShowMenu(TabMenuSample(isPrivate = true, locked = false, count = 2)) } }
            },
            CatalogState("tabs-locked", "Tab menu, private locked") {
                PrivateIfNeeded(true) { PangolinMenuSurface { ShowMenu(TabMenuSample(isPrivate = true, locked = true, count = 2)) } }
            },
        )),
        // Link long press menu (D17, browser basics plan section 1).
        CatalogEntry("link-menu", "Link menu", CatalogGroup.Organisms, listOf(
            CatalogState("normal", "Normal: open in new tab, background, private tab; copy link") {
                PangolinMenuSurface { ShowMenu(LinkMenuSample(sampleLink, isPrivate = false)) }
            },
            CatalogState("private", "Private: open in new private tab, background, normal tab; copy link") {
                PrivateIfNeeded(true) { PangolinMenuSurface { ShowMenu(LinkMenuSample(sampleLink, isPrivate = true)) } }
            },
            CatalogState("other-scheme", "Other scheme (mailto): copy link only") {
                PangolinMenuSurface { ShowMenu(LinkMenuSample("mailto:hello@example.com", isPrivate = false)) }
            },
            CatalogState("long-url", "Long address: one line, ellipsized in the middle") {
                PangolinMenuSurface { ShowMenu(LinkMenuSample(longLink, isPrivate = false)) }
            },
        )),
        CatalogEntry("unified-bar-screens", "Unified bar screens", CatalogGroup.Organisms, listOf(
            CatalogState("browsing", "Browsing") { still -> Phone(backAvailable, still) },
            CatalogState("page-menu", "Page menu open") { still ->
                Phone(backAvailable, still, menu = OpenMenu(Alignment.BottomStart, PageMenuSample(isPrivate = false, bookmarked = false)))
            },
            CatalogState("address-menu", "Address menu open") { still ->
                Phone(backAvailable, still, menu = OpenMenu(Alignment.BottomCenter, AddressMenuSample(isPrivate = false, canPaste = true)))
            },
            CatalogState("tab-menu", "Tab menu open") { still ->
                Phone(backAvailable, still, menu = OpenMenu(Alignment.BottomEnd, TabMenuSample(isPrivate = false, locked = false, count = 3)))
            },
            CatalogState("editing", "Editing, above the keyboard") { still -> Phone(editing, still, keyboard = true) },
            CatalogState("private-blocked", "Private with a blocked request") { still -> Phone(privateBlocked, still) },
            CatalogState("private-locked", "Private locked") { still -> Phone(privateLocked, still) },
        )),
        // Unfolded L layout (docs/design/unfolded-l-layout-plan.md).
        CatalogEntry("docked-address-bar", "Docked address bar (L layout)", CatalogGroup.Organisms, listOf(
            dockedState("right", "Rail on the right: URL, page menu, Reload", backAvailable, RailSide.Right),
            dockedState("right-arriving", "Rail on the right: page arriving, Stop", arriving, RailSide.Right),
            dockedState("right-site-color", "Rail on the right: site color", arriving, RailSide.Right, SamplePage.Dark.header.toArgb()),
            dockedState("right-long-host", "Rail on the right: long host", longHostForward, RailSide.Right),
            dockedState("right-editing", "Rail on the right: editing", editing, RailSide.Right),
            dockedState("right-private", "Rail on the right: private with a blocked request", privateBlocked, RailSide.Right),
            dockedState("right-locked", "Rail on the right: private locked", privateLocked, RailSide.Right),
            dockedState("right-blank", "Rail on the right: blank tab, no Reload slot, page menu at the end", blank, RailSide.Right),
            dockedState("left", "Rail on the left: Reload, page menu, URL", backAvailable, RailSide.Left),
            dockedState("left-waiting", "Rail on the left: waiting for the site", waiting, RailSide.Left),
            dockedState("left-site-color", "Rail on the left: site color", arriving, RailSide.Left, SamplePage.Dark.header.toArgb()),
            dockedState("left-editing", "Rail on the left: editing", editing, RailSide.Left),
            dockedState("left-private", "Rail on the left: private with a blocked request", privateBlocked, RailSide.Left),
            dockedState("left-blank", "Rail on the left: blank tab, no Reload slot, URL right after the page menu", blank, RailSide.Left),
        )),
        CatalogEntry("browser-rail", "Browser rail (L layout)", CatalogGroup.Organisms, listOf(
            railState("first-page", "First page: Back dimmed", first, RailSide.Right),
            railState("back", "Back only", backAvailable, RailSide.Right),
            railState("back-forward", "Back and forward", backForward, RailSide.Right),
            railState("left", "On the left, back and forward", backForward, RailSide.Left),
            railState("private", "Private", privateBlocked.copy(canGoForward = true), RailSide.Right),
            railState("locked", "Private locked: Back dimmed, lock on Tabs", privateLocked, RailSide.Right),
        )),
        CatalogEntry("l-layout-screens", "L layout screens (inner screen)", CatalogGroup.Organisms, listOf(
            CatalogState("rail-right", "Rail on the right") { still -> InnerScreen(backForward, RailSide.Right, still) },
            CatalogState("rail-left", "Rail on the left") { still -> InnerScreen(backForward, RailSide.Left, still) },
            CatalogState("tab-menu", "Tab menu open beside the rail") { still ->
                InnerScreen(backAvailable, RailSide.Right, still, menu = InnerMenu(fromRail = true, TabMenuSample(isPrivate = false, locked = false, count = 3)))
            },
            CatalogState("back-menu-left", "Back menu open, rail on the left") { still ->
                InnerScreen(backAvailable, RailSide.Left, still, menu = InnerMenu(fromRail = true, BackMenuSample))
            },
            CatalogState("page-menu", "Page menu open above the bar") { still ->
                InnerScreen(backAvailable, RailSide.Right, still, menu = InnerMenu(fromRail = false, PageMenuSample(isPrivate = false, bookmarked = false)))
            },
            CatalogState("editing", "Editing, above the keyboard") { still -> InnerScreen(editing, RailSide.Right, still, keyboard = true) },
            CatalogState("find", "Find in page in the docked bar's place") { still ->
                InnerScreen(
                    backAvailable, RailSide.Left, still, keyboard = true,
                    find = FindInPageState(query = "pangolin", current = 3, total = 12, resultKnown = true),
                )
            },
            CatalogState("private", "Private") { still -> InnerScreen(privateBlocked, RailSide.Right, still) },
            CatalogState("private-locked", "Private locked") { still -> InnerScreen(privateLocked, RailSide.Right, still) },
            CatalogState("blank-left", "Blank tab, rail on the left: no gap before the URL") { still -> InnerScreen(blank, RailSide.Left, still) },
            CatalogState(
                "swap-mid",
                "Swap, mid way: the old rail half out through its edge and the old bar half below the bottom, the new ones half in, the page inset moving across",
            ) { still ->
                InnerScreen(backAvailable, RailSide.Left, still, swapFrom = RailSide.Right)
            },
        )),
        // Hide on scroll (D19, browser basics plan section 4).
        CatalogEntry("compact-bar", "Compact bar", CatalogGroup.Organisms, listOf(
            compactState("page", "Domain pill", backAvailable),
            compactState("loading", "Loading: the line at 38% along the bottom edge", arriving),
            compactState("waiting", "Waiting for the site: the arc circles the pill", waiting),
            compactState("long-host", "Long host", longHostForward),
            compactState("site-color", "Site color (dark site footer)", arriving, siteColor = SamplePage.Dark.header.toArgb()),
            compactState("private", "Private", privateBlocked),
            compactState("private-loading", "Private, loading", privateBlocked.copy(loading = true, progress = 0.62f)),
            compactState("docked", "Inner screen label (show the controls)", backAvailable, layout = BarLayout.Docked(RailSide.Right)),
        )),
        CatalogEntry("bar-collapse", "Bars collapsing on scroll", CatalogGroup.Organisms, listOf(
            CatalogState("outer-expanded", "Outer screen, progress 0: the full bar over the page") { still -> OuterCollapse(backAvailable, 0f, still) },
            CatalogState("outer-half", "Outer screen, progress 0.5: buttons gone, the material narrowing to the pill") { still ->
                OuterCollapse(backAvailable, 0.5f, still)
            },
            CatalogState("outer-collapsed", "Outer screen, progress 1: the domain pill 24dp above the bottom") { still ->
                OuterCollapse(backAvailable, 1f, still)
            },
            CatalogState("outer-collapsed-loading", "Outer screen, collapsed while loading") { still -> OuterCollapse(arriving, 1f, still) },
            CatalogState("outer-collapsed-private", "Outer screen, collapsed, private") { still -> OuterCollapse(privateBlocked, 1f, still) },
            CatalogState("inner-right-expanded", "Inner screen, rail on the right, progress 0") { still ->
                InnerCollapse(backForward, RailSide.Right, 0f, still)
            },
            CatalogState("inner-right-half", "Inner screen, rail on the right, progress 0.5: rail half out, the bar shrinking in its corner") { still ->
                InnerCollapse(backForward, RailSide.Right, 0.5f, still)
            },
            CatalogState("inner-right-collapsed", "Inner screen, rail on the right, progress 1: the pill in the corner") { still ->
                InnerCollapse(backForward, RailSide.Right, 1f, still)
            },
            CatalogState("inner-left-expanded", "Inner screen, rail on the left, progress 0") { still ->
                InnerCollapse(backForward, RailSide.Left, 0f, still)
            },
            CatalogState("inner-left-half", "Inner screen, rail on the left, progress 0.5") { still ->
                InnerCollapse(backForward, RailSide.Left, 0.5f, still)
            },
            CatalogState("inner-left-collapsed", "Inner screen, rail on the left, progress 1") { still ->
                InnerCollapse(backForward, RailSide.Left, 1f, still)
            },
        )),
    )

    private fun compactState(
        id: String,
        label: String,
        state: UnifiedBarState,
        siteColor: Int? = null,
        layout: BarLayout = BarLayout.Centered,
    ) = CatalogState(id, label) { still ->
        PrivateIfNeeded(state.isPrivate) {
            Box(modifier = Modifier.fillMaxWidth().height(CompactSampleHeight)) {
                SamplePageArea(Modifier.matchParentSize())
                PangolinCompactBar(
                    state = state,
                    style = sampleStyle(siteColor),
                    backdrop = null,
                    onExpand = {},
                    layout = layout,
                    staticPreview = still,
                    modifier = Modifier.align(Alignment.Center).padding(horizontal = PangolinBars.EdgeGutter),
                )
            }
        }
    }

    private fun dockedState(id: String, label: String, state: UnifiedBarState, side: RailSide, siteColor: Int? = null) =
        CatalogState(id, label) { still ->
            PrivateIfNeeded(state.isPrivate) {
                Box(modifier = Modifier.fillMaxWidth()) {
                    SamplePageArea(Modifier.matchParentSize())
                    SampleBar(state, still, siteColor, layout = BarLayout.Docked(side))
                }
            }
        }

    private fun railState(id: String, label: String, state: UnifiedBarState, side: RailSide) =
        CatalogState(id, label) { still ->
            PrivateIfNeeded(state.isPrivate) {
                // The rail standing on the docked bar's corner, the L as on the inner screen.
                Box(modifier = Modifier.fillMaxWidth()) {
                    SamplePageArea(Modifier.matchParentSize())
                    SampleRail(state, side, still, Modifier.align(if (side == RailSide.Right) AbsoluteAlignment.BottomRight else AbsoluteAlignment.BottomLeft))
                    SampleBar(state, still, layout = BarLayout.Docked(side), modifier = Modifier.align(Alignment.BottomCenter))
                }
            }
        }

    private fun barState(id: String, label: String, state: UnifiedBarState, siteColor: Int? = null) =
        CatalogState(id, label) { still ->
            PrivateIfNeeded(state.isPrivate) {
                SampleBar(state, still, siteColor)
            }
        }
}

/** One open menu in a phone composition, drawn in place above the bar at [alignment]. */
private class OpenMenu(val alignment: Alignment, val content: UnifiedBarMenuContent)

/** The bar style the catalog uses: the bottom edge over an opaque page (no live blur in the catalog). */
@Composable
private fun sampleStyle(siteColor: Int? = null): BarStyle {
    val mode = PangolinTheme.mode
    return BarColors.style(PangolinTheme.colors, mode, siteColor, BarBackdrop.AppSurface)
}

/** Draws [content] in the private theme when [private], else in the catalog's own mode. */
@Composable
private fun PrivateIfNeeded(isPrivate: Boolean, content: @Composable () -> Unit) {
    if (!isPrivate || PangolinTheme.mode == PangolinMode.Private) {
        content()
        return
    }
    PangolinTheme(privateMode = true, darkTheme = true) {
        Box(Modifier.background(PangolinTheme.colors.bgPage).padding(PangolinSpacing.Space8)) { content() }
    }
}

@Composable
private fun SampleBar(
    state: UnifiedBarState,
    still: Boolean,
    siteColor: Int? = null,
    modifier: Modifier = Modifier,
    layout: BarLayout = BarLayout.Centered,
    hidden: Float = 0f,
    collapse: Float = 0f,
) {
    val style = sampleStyle(siteColor)
    UnifiedAddressBar(
        layout = layout,
        hidden = { hidden },
        collapse = { collapse },
        state = state,
        style = style,
        backdrop = null,
        onBack = {},
        onForward = {},
        onReload = {},
        onStop = {},
        onAddressClick = {},
        onTabsClick = {},
        editor = { SampleEditor(style) },
        backMenu = if (state.canGoBack) BackMenuSample else null,
        pageMenu = PageMenuSample(isPrivate = state.isPrivate, bookmarked = false, blank = state.host == null),
        addressMenu = AddressMenuSample(isPrivate = state.isPrivate, canPaste = true),
        tabMenu = TabMenuSample(isPrivate = state.isPrivate, locked = state.locked, count = state.tabCount),
        windowInsets = WindowInsets(0, 0, 0, 0),
        staticPreview = still,
        modifier = modifier,
    )
}

/** The rail as the catalog shows it, with sample menus. */
@Composable
private fun SampleRail(
    state: UnifiedBarState,
    side: RailSide,
    still: Boolean,
    modifier: Modifier = Modifier,
    hidden: Float = 0f,
    collapse: Float = 0f,
) {
    PangolinBrowserRail(
        state = state,
        side = side,
        style = sampleStyle(),
        backdrop = null,
        onBack = {},
        onForward = {},
        onTabsClick = {},
        onSwap = {},
        backMenu = if (state.canGoBack) BackMenuSample else null,
        tabMenu = TabMenuSample(isPrivate = state.isPrivate, locked = state.locked, count = state.tabCount),
        windowInsets = WindowInsets(0, 0, 0, 0),
        hidden = { hidden },
        collapse = { collapse },
        staticPreview = still,
        modifier = modifier,
    )
}

/** The find bar with a stand in for the app's text field (the query, or the placeholder). */
@Composable
private fun FindSample(state: FindInPageState, modifier: Modifier = Modifier, layout: BarLayout = BarLayout.Centered) {
    val style = sampleStyle()
    FindInPageBar(
        layout = layout,
        modifier = modifier,
        state = state,
        style = style,
        backdrop = null,
        onPrevious = {},
        onNext = {},
        onClose = {},
        editor = {
            Text(
                text = state.query.ifEmpty { "Find on page" },
                style = PangolinType.bodyLg,
                color = if (state.query.isEmpty()) style.placeholder else style.content,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        },
        windowInsets = WindowInsets(0, 0, 0, 0),
    )
}

/** Stands in for the app's address TextField: the full URL and a clear button. */
@Composable
private fun SampleEditor(style: BarStyle) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(start = PangolinSpacing.Space16),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            "https://example.com/articles/pangolins",
            style = PangolinType.bodyLg,
            color = style.content,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier
                .weight(1f)
                .background(style.selection),
        )
        PangolinIconButton(R.drawable.ic_symbol_close, "Clear", onClick = {}, tint = style.content)
    }
}

private val BackMenuSample: UnifiedBarMenuContent = { dismiss ->
    PangolinMenuItem(
        "Example Domain",
        onClick = dismiss,
        supporting = "example.com",
    )
    PangolinMenuDivider()
    PangolinMenuItem(
        "Forward",
        onClick = dismiss,
        leadingSymbol = R.drawable.ic_symbol_chevron_right,
        enabled = false,
    )
}

private fun PageMenuSample(isPrivate: Boolean, bookmarked: Boolean, blank: Boolean = false): UnifiedBarMenuContent = { dismiss ->
    PageMenuContent(
        isPrivate = isPrivate,
        bookmarkable = !blank,
        bookmarked = bookmarked,
        desktopMode = false,
        textScalePercent = 100,
        canDecreaseText = true,
        canIncreaseText = true,
        pageActionsEnabled = !blank,
        onSettings = {}, onHistory = {}, onBookmarks = {}, onToggleDesktop = {}, onSmallerText = {},
        onLargerText = {}, onFind = {}, onToggleBookmark = {}, onShare = {},
        dismiss = dismiss,
    )
}

private fun AddressMenuSample(isPrivate: Boolean, canPaste: Boolean): UnifiedBarMenuContent = { dismiss ->
    AddressMenuContent(
        isPrivate = isPrivate,
        canPaste = canPaste,
        onCloseTab = {}, onShare = {}, onPasteAndGo = {}, onCopyLink = {},
        dismiss = dismiss,
    )
}

private fun LinkMenuSample(url: String, isPrivate: Boolean): UnifiedBarMenuContent = { dismiss ->
    LinkMenuContent(
        url = url,
        isPrivate = isPrivate,
        onOpenInNewTab = {}, onOpenInBackground = {}, onOpenInOtherMode = {}, onCopyLink = {},
        dismiss = dismiss,
    )
}

private fun TabMenuSample(isPrivate: Boolean, locked: Boolean, count: Int): UnifiedBarMenuContent = { dismiss ->
    TabMenuContent(
        isPrivate = isPrivate,
        locked = locked,
        tabCount = count,
        onCloseAll = {}, onCloseThis = {}, onNewPrivateTab = {}, onNewTab = {},
        dismiss = dismiss,
    )
}

/** The progress drawn over a bare field of the bar's colors. */
@Composable
private fun ProgressSample(loading: Boolean, waiting: Boolean, progress: Float, still: Boolean, animations: Boolean = true) {
    val style = sampleStyle()
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(style.tint)
            .padding(PangolinSpacing.Space8),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(PangolinBars.FieldHeight)
                .clip(PangolinShapes.Lg)
                .background(style.field),
            contentAlignment = Alignment.Center,
        ) {
            Text("example.com", style = PangolinType.bodyLg, color = style.content)
            FieldProgress(
                loading = loading,
                waitingForSite = waiting,
                progress = progress,
                arcColor = style.accentSoft,
                lineColor = style.accent,
                animationsEnabled = animations,
                staticPreview = still,
                modifier = Modifier.matchParentSize(),
            )
        }
    }
}

@Composable
private fun StripSample(siteColor: Int?, isPrivate: Boolean) {
    PrivateIfNeeded(isPrivate) {
        val style = sampleStyle(siteColor)
        Column(modifier = Modifier.fillMaxWidth()) {
            StatusBarStrip(style = style, backdrop = null, windowInsets = WindowInsets(top = 24.dp))
            SamplePageArea(Modifier.fillMaxWidth().height(64.dp))
        }
    }
}

/** Width of the design canvas's phone frames. */
private val PhoneWidth: Dp = 390.dp

/** Height of the phone compositions in the catalog (shorter than a phone, same layout). */
private val PhoneHeight: Dp = 520.dp

/**
 * A phone frame like the canvas: status bar strip, a made up page (or the lock panel), and the
 * bar at the bottom, with an open menu above it or a keyboard sized block under it.
 */
@Composable
private fun Phone(state: UnifiedBarState, still: Boolean, menu: OpenMenu? = null, keyboard: Boolean = false) {
    PrivateIfNeeded(state.isPrivate) {
        val style = sampleStyle()
        val colors = PangolinTheme.colors
        Box(
            modifier = Modifier
                .widthIn(max = PhoneWidth)
                .fillMaxWidth()
                .height(PhoneHeight)
                .clip(PangolinShapes.Sm)
                .background(colors.bgPage),
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                StatusBarStrip(style = style, backdrop = null, windowInsets = WindowInsets(top = 24.dp))
                Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                    if (state.locked) {
                        // Stand in for the app's private lock panel (not in the design system yet).
                        Box(Modifier.fillMaxSize().background(colors.bgPage), contentAlignment = Alignment.Center) {
                            EmptyState(
                                R.drawable.ic_symbol_lock,
                                "Private tabs are locked",
                                action = StateAction("Unlock") {},
                                modifier = Modifier.widthIn(max = 320.dp),
                            )
                        }
                    } else {
                        SamplePageArea(Modifier.fillMaxSize())
                    }
                    if (menu != null) {
                        MenuInPlace(menu)
                    }
                }
                SampleBar(state, still)
                if (keyboard) KeyboardBlock()
            }
        }
    }
}

@Composable
private fun BoxScope.MenuInPlace(menu: OpenMenu) {
    PangolinMenuSurface(
        modifier = Modifier
            .align(menu.alignment)
            .padding(horizontal = PangolinSpacing.Space8, vertical = PangolinSpacing.Space4)
            .widthIn(min = 200.dp, max = 280.dp),
    ) {
        ShowMenu(menu.content)
    }
}

/** Draws a bar menu's content in place; its dismiss does nothing. */
@Composable
private fun ColumnScope.ShowMenu(content: UnifiedBarMenuContent) {
    content(this, {})
}

/** The catalog's made up page (catalog samples, never a real site), cropped to the top. */
@Composable
private fun SamplePageArea(modifier: Modifier, widthPx: Int = 390, heightPx: Int = 640) {
    val picture = remember(widthPx, heightPx) { samplePicture(SamplePage.Light, widthPx = widthPx, heightPx = heightPx) }
    Image(
        bitmap = picture,
        contentDescription = null,
        contentScale = ContentScale.Crop,
        alignment = Alignment.TopCenter,
        modifier = modifier,
    )
}

/** A block the size of a phone keyboard with key shapes, for the editing frame. */
@Composable
private fun KeyboardBlock(height: Dp = 200.dp) {
    val colors = PangolinTheme.colors
    val key = colors.bgContainerHighest
    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(height)
            .background(colors.bgContainer),
    ) {
        val rows = listOf(10, 9, 9, 5)
        val gap = 6.dp.toPx()
        val rowHeight = (size.height - gap * (rows.size + 1)) / rows.size
        rows.forEachIndexed { r, count ->
            val keyWidth = (size.width - gap * (10 + 1)) / 10
            val total = if (r == rows.lastIndex) size.width - gap * 2 else count * keyWidth + (count - 1) * gap
            val start = (size.width - total) / 2
            val top = gap + r * (rowHeight + gap)
            if (r == rows.lastIndex) {
                drawRoundRect(key, Offset(start, top), Size(total, rowHeight), CornerRadius(6.dp.toPx()))
            } else {
                for (i in 0 until count) {
                    drawRoundRect(key, Offset(start + i * (keyWidth + gap), top), Size(keyWidth, rowHeight), CornerRadius(6.dp.toPx()))
                }
            }
        }
    }
}

/** Size of the inner screen frames: about the Fold's inner screen in dp. */
private val InnerWidth: Dp = 840.dp
private val InnerHeight: Dp = 760.dp

/** Height of the keyboard on the inner screen frames. */
private val InnerKeyboardHeight: Dp = 280.dp

/**
 * One open menu in an inner screen frame, drawn in place where the app's popup opens (L8):
 * [fromRail] beside the rail with its bottom at the rail's bottom (Back and Tabs), otherwise above
 * the docked bar with its edge beside the rail (page and address).
 */
private class InnerMenu(val fromRail: Boolean, val content: UnifiedBarMenuContent)

/**
 * An inner screen frame of about 840 x 760dp, drawn at full size and scaled to the catalog's
 * width: the status bar strip, a made up page inset on the rail's side (L6) with the reserved
 * strip in the page's background color ([ReservedAreaColors]; the private color while locked),
 * the rail on [side] standing on the docked bar's corner, and an open menu, a keyboard or the
 * docked find bar. With [swapFrom], one frame half way through a swap from that side to [side]
 * (L7): the leaving rail half out through its edge and the leaving bar half below the bottom
 * edge, the new ones half in, and the page inset half way across.
 */
@Composable
private fun InnerScreen(
    state: UnifiedBarState,
    side: RailSide,
    still: Boolean,
    menu: InnerMenu? = null,
    keyboard: Boolean = false,
    find: FindInPageState? = null,
    swapFrom: RailSide? = null,
) {
    PrivateIfNeeded(state.isPrivate) {
        ScaledFrame(InnerWidth, InnerHeight) {
            val style = sampleStyle()
            val colors = PangolinTheme.colors
            val right = side == RailSide.Right
            val swapping = swapFrom != null && swapFrom != side
            val hidden = if (swapping) 0.5f else 0f
            val inset = if (swapping) 0.5f else LLayoutMetrics.insetPosition(side)
            val (insetLeft, insetRight) = LLayoutMetrics.pageInsets(inset)
            val reserved = ReservedAreaColors.color(
                colors = colors,
                mode = PangolinTheme.mode,
                siteBackground = SamplePage.Light.background.toArgb(),
                pageShown = !state.locked,
            )
            Column(modifier = Modifier.fillMaxSize().clip(PangolinShapes.Sm).background(colors.bgPage)) {
                StatusBarStrip(style = style, backdrop = null, windowInsets = WindowInsets(top = 24.dp))
                Box(modifier = Modifier.weight(1f).fillMaxWidth().background(reserved)) {
                    Box(modifier = Modifier.fillMaxSize().absolutePadding(left = insetLeft, right = insetRight)) {
                        if (state.locked) {
                            Box(Modifier.fillMaxSize().background(colors.bgPage), contentAlignment = Alignment.Center) {
                                EmptyState(
                                    R.drawable.ic_symbol_lock,
                                    "Private tabs are locked",
                                    action = StateAction("Unlock") {},
                                    modifier = Modifier.widthIn(max = 320.dp),
                                )
                            }
                        } else {
                            SamplePageArea(Modifier.fillMaxSize(), widthPx = 756, heightPx = 736)
                        }
                    }
                    if (swapping && swapFrom != null) {
                        // The leaving copies on the old side.
                        SampleRail(
                            state = state,
                            side = swapFrom,
                            still = still,
                            hidden = 0.5f,
                            modifier = Modifier.align(if (swapFrom == RailSide.Right) AbsoluteAlignment.BottomRight else AbsoluteAlignment.BottomLeft),
                        )
                        SampleBar(state, still, layout = BarLayout.Docked(swapFrom), hidden = 0.5f, modifier = Modifier.align(Alignment.BottomCenter))
                    }
                    SampleRail(
                        state = state,
                        side = side,
                        still = still,
                        hidden = hidden,
                        modifier = Modifier.align(if (right) AbsoluteAlignment.BottomRight else AbsoluteAlignment.BottomLeft),
                    )
                    if (find != null) {
                        FindSample(find.copy(isPrivate = state.isPrivate), Modifier.align(Alignment.BottomCenter), BarLayout.Docked(side))
                    } else {
                        SampleBar(state, still, layout = BarLayout.Docked(side), hidden = hidden, modifier = Modifier.align(Alignment.BottomCenter))
                    }
                    if (menu != null) {
                        PangolinMenuSurface(
                            modifier = Modifier
                                .align(if (right) AbsoluteAlignment.BottomRight else AbsoluteAlignment.BottomLeft)
                                .absolutePadding(
                                    left = if (right) 0.dp else LLayoutMetrics.PageInset,
                                    right = if (right) LLayoutMetrics.PageInset else 0.dp,
                                    bottom = if (menu.fromRail) LLayoutMetrics.RailBottom else PangolinBars.EdgeGutter + LLayoutMetrics.DockedBarHeight,
                                )
                                .widthIn(min = 200.dp, max = 280.dp),
                        ) {
                            ShowMenu(menu.content)
                        }
                    }
                }
                if (keyboard) KeyboardBlock(InnerKeyboardHeight)
            }
        }
    }
}

/**
 * Lays [content] out at [width] by [height] and scales it down to fit the available width, so a
 * whole inner screen fits the catalog (and its 411dp wide screenshots).
 */
@Composable
private fun ScaledFrame(width: Dp, height: Dp, content: @Composable () -> Unit) {
    Box(
        modifier = Modifier.layout { measurable, constraints ->
            val w = width.roundToPx()
            val h = height.roundToPx()
            val scale = if (constraints.hasBoundedWidth) minOf(1f, constraints.maxWidth / w.toFloat()) else 1f
            val placeable = measurable.measure(Constraints.fixed(w, h))
            layout((w * scale).roundToInt(), (h * scale).roundToInt()) {
                placeable.placeWithLayer(0, 0) {
                    scaleX = scale
                    scaleY = scale
                    transformOrigin = TransformOrigin(0f, 0f)
                }
            }
        },
    ) { content() }
}

/** Height of the page strip behind a compact bar sample. */
private val CompactSampleHeight: Dp = 72.dp

/**
 * A phone frame with the page under the bar (D19): the status bar strip, a made up page filling
 * the frame, and the unified bar over its bottom at collapse [progress] (0 expanded, 1 the
 * domain pill).
 */
@Composable
private fun OuterCollapse(state: UnifiedBarState, progress: Float, still: Boolean) {
    PrivateIfNeeded(state.isPrivate) {
        val style = sampleStyle()
        Box(
            modifier = Modifier
                .widthIn(max = PhoneWidth)
                .fillMaxWidth()
                .height(PhoneHeight)
                .clip(PangolinShapes.Sm)
                .background(PangolinTheme.colors.bgPage),
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                StatusBarStrip(style = style, backdrop = null, windowInsets = WindowInsets(top = 24.dp))
                SamplePageArea(Modifier.weight(1f).fillMaxWidth())
            }
            SampleBar(state, still, collapse = progress, modifier = Modifier.align(Alignment.BottomCenter))
        }
    }
}

/**
 * An inner screen frame with the page running under the rail and the docked bar (D19), scaled
 * to the catalog's width: the rail on [side] slid out by [progress] through its edge and the
 * docked bar shrunk by [progress] into the pill in its corner.
 */
@Composable
private fun InnerCollapse(state: UnifiedBarState, side: RailSide, progress: Float, still: Boolean) {
    PrivateIfNeeded(state.isPrivate) {
        ScaledFrame(InnerWidth, InnerHeight) {
            val style = sampleStyle()
            Column(modifier = Modifier.fillMaxSize().clip(PangolinShapes.Sm).background(PangolinTheme.colors.bgPage)) {
                StatusBarStrip(style = style, backdrop = null, windowInsets = WindowInsets(top = 24.dp))
                Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                    SamplePageArea(Modifier.fillMaxSize(), widthPx = 840, heightPx = 736)
                    SampleRail(
                        state = state,
                        side = side,
                        still = still,
                        collapse = progress,
                        modifier = Modifier.align(if (side == RailSide.Right) AbsoluteAlignment.BottomRight else AbsoluteAlignment.BottomLeft),
                    )
                    SampleBar(state, still, layout = BarLayout.Docked(side), collapse = progress, modifier = Modifier.align(Alignment.BottomCenter))
                }
            }
        }
    }
}
