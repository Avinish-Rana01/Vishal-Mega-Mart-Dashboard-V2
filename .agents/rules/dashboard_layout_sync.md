# Dashboard Section Layout Rules

When building, modifying, or refactoring dashboard sections (e.g., LiveStock, CycleCount, StoreValidation):

1. **Strictly Use Common CSS Classes:** Always utilize the shared CSS layout classes (e.g., `.cc-container`, `.cc-kpi-row`, `.cc-card`, `.cc-chart-scroll`, `.cc-data-grid-card`) to maintain perfect layout synchronization across the dashboard grid.
2. **NO Inline Layout Overrides:** NEVER apply inline styles like `style={{ flex: 1, minHeight: 0 }}` to layout containers (`.cc-card`, `.cc-chart-scroll`, etc.). These overrides stretch the flex containers and break the strict vertical height parity defined in the CSS.
3. **Chart Wrapping:** Charts must always be wrapped in a `<div className="cc-chart-scroll">` inside a `<div className="cc-card">` to adhere to the global fixed-height constraints.
4. **Shimmer / Skeleton Sizing:** When building loading shimmers (e.g., `DashboardShimmer`), calculate the exact pixel height by summing both the *inner content* AND the *container padding*. Skeleton boxes must represent the final outer dimensions of the container (e.g., 40px toolbar + 294px chart + 18px padding = 352px) to guarantee zero layout shift when data loads.

## 5. Dashboard Data Grid Componentization
When adding a native scrollable data table below the charts in a dashboard section:
- **Use the Shared Component:** Always use `<DashboardDataGrid>` located in `src/components/charts/DashboardDataGrid.jsx`. Do not build inline `<table className="cc-data-grid-table">` elements inside sections.
- **Render Props for Rows:** Use the `renderRow={(row, index) => <tr...>}` prop for row rendering. This guarantees the parent section maintains full control over custom row interactivity, badges, and `framer-motion` animations.
- **Empty States:** Always pass an `emptyStateContent` React Node to handle cases where the dataset is empty, rather than a plain string, to allow for custom SVG illustrations or icons.
