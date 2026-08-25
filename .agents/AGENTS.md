# Git Rules

- **DO NOT** commit or push code to git automatically or on your own.
- Only run `git` commands (add, commit, push) if the user explicitly instructs you to do so.
- The company prefers to avoid small frequent commits. Leave the committing to the user unless requested otherwise.



# UI Design System Rules (V2 Visual Dashboard)

## Layout Rules
- The dashboard uses a **Tab-based layout** defined in `DashboardPage.jsx`. Do NOT add new sections as vertical stacks below existing ones.
- There MUST be exactly 10 separate tabs, one for each individual report. Do NOT group them into broad categories.
- The 10 Tabs are: LiveStock, CycleCount, Sale Dashboard, Void Dashboard, Return Dashboard, Vendor Discrepancy, DC Validation, DC Encoding, Tag Location, and Tag Cycle Count.
- Each dashboard section MUST follow the **3-Row Pattern**:
  1. KPI Row (`ds-kpi-row`) — summary numbers at the top.
  2. Charts Row (`ds-charts-row`) — main visualizations.
  3. List Row — a compact `StoreRankList`, NOT a full table.
- Every section MUST start with the `SectionHeader` component for consistent titles and actions.

## Component Rules (V2 Chart Library)
ALL visual sections in the V2 Dashboard MUST use these reusable components from `src/components/charts/`:

| Component | File | Use Case |
|---|---|---|
| `SectionHeader` | `common/SectionHeader.jsx` | The main header at the top of every section |
| `CurvedCard` | `common/CurvedCard.jsx` | Primary (dark gradient) KPI metric card |
| `KpiCard` | `charts/KpiCard.jsx` | Secondary (white) KPI metric cards |
| `StoreRankList` | `charts/StoreRankList.jsx` | Ranked list of stores/vendors with colored badges |
| `GroupedBarChart` | `charts/GroupedBarChart.jsx` | Side-by-side comparisons (e.g. SAP vs RFID) |
| `SemiDonutChart` | `charts/SemiDonutChart.jsx` | Single-value accuracy/progress gauge |
| `DonutChart` | `charts/DonutChart.jsx` | Multi-segment breakdown |
| `TimelineChart` | `charts/TimelineChart.jsx` | Hourly/time-block single-series bar chart |

- **NEVER** hardcode inline Recharts JSX (`<BarChart>`, `<PieChart>`, etc.) directly inside a section file. Always use the components above.
- **NEVER** use `DataTableCard` or `BaseDataTable` inside any dashboard section. Tables are for Report pages ONLY.
- Import shared layout CSS: `import '../../components/charts/DashboardSection.css';`

## Styling Rules
- Color palette: Primary `#1d4ed8`, Hover `#1e3a8a`, Light `#eff6ff`, Text `#0f172a`, Muted `#64748b`, Border `#f1f5f9`.
- All layout structure MUST use CSS class names from `DashboardSection.css` (`.ds-section`, `.ds-card`, `.ds-kpi-row`, `.ds-charts-row`, etc.).
- Do NOT use inline `style={{}}` for layout structure. Inline styles are only allowed for dynamic values (colors, calculated widths).

## Data Rules
- Every section's data hook already exists in `useDashboardData.js`. Do NOT create new `useState`/`useEffect` fetch calls.
- Available hooks: `useLiveStock`, `useCycleCount`, `useVendorDiscrepancy`, `useStoreDashboard`, `useSaleDashboard`, `useVoidDashboard`, `useReturnDashboard`, `useDcValidation`, `useTagCharts`, `useWarehouseEncoding`.
- Always format numeric values with `.toLocaleString('en-IN')` for Indian number formatting.
- Always handle three states in every section: `isLoading`, `error`, and empty `data` (length === 0).

## Edge Case Rules
- **Empty data**: Show a styled empty-state div with descriptive text, NOT the browser's default "No records found".
- **Large datasets (50+ items)**: Slice bar chart data to top 10 with `.slice(0, 10)`. Add a `(Top 10 stores)` subtitle to the chart card.
- **Long names**: All list item titles MUST use `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` with `title={fullName}` on the element.
- **Loading state**: Use shimmer skeleton boxes shaped like the section content, NOT a spinner icon.


# Project Knowledge & Architecture Context (For New Developers & Agents)

## Current Architecture & API Patterns
- **Frontend Fallbacks**: The React UI heavily relies on the `summary` block in API responses. For example, if 0 rows are returned, the UI expects `summary.storeName` and `summary.date` to be populated so the info bar can render the selected store's name.
- **SQL Server Casing Bugs**: The backend C# ADO.NET mapping uses `StringComparer.OrdinalIgnoreCase` when converting `SqlDataReader` to `Dictionary<string, object?>`. This is CRITICAL because the legacy SQL stored procedures (like `SP_NEW_DASHBOARD`) often return mixed-case columns (e.g., `Store_Name` instead of `STORE_NAME`). 

## Planned Features: RBAC (Role-Based Access Control)
- **Current Auth State**: `AuthController.cs` (`POST /api/auth/login`) currently validates users against `SP_Master` but **DOES NOT** issue a JWT token. Additionally, it currently blocks any user with `User_Type` of `"Store"` or `"Warehouse"`.
- **The RBAC Plan**: We are migrating to JWT-based auth. Once JWT is implemented, the backend services (like `LiveStockService.cs` and `ModernReportController.cs`) will extract the `User_Type` and `StoreCode` directly from the token's claims via `IHttpContextAccessor`.
- **Data Filtering Strategy**: Instead of creating 9 different APIs for Admins, Managers, and Billers, we will use **Parameter Interception**. If a Biller makes a request, the backend will dynamically override `request.StoreCode` with the StoreCode from their JWT token, forcing the SQL query to only return data for their assigned store. Admins will bypass this override.

## Project Context (Tabular vs Graphical V2)
- **`POS_Web_Application React` (Tabular App)**: This is the strict 1:1 replication of the legacy tabular UI. It is built with React + JSON + caching to solve legacy speed issues, but the UI itself must remain entirely tabular for power users. No new visual charts or complex dashboard designs should be introduced here.
- **`POS_Web_Application React V2` (Graphical App)**: This is the modern, management-facing dashboard. This project replaces massive datatables with high-level charts, KPI cards, and visual analytics using Recharts. It requires iterative design work and is a separate initiative from the tabular replication.
- **Rule of Thumb**: If you are working in a folder WITHOUT "V2" in the name, your priority is high-performance, strictly tabular data binding. If the folder HAS "V2", focus on modern dashboard charts and polished UI/UX aesthetics.

## Strict Flexbox Chart Constraints
When rendering responsive charts (especially with Recharts) inside flex containers, you MUST strictly pass flex constraints down the DOM tree to prevent collapsing or infinite expansion:
1. **Flex Chain**: The parent card/wrapper must have `display: flex; flex-direction: column`.
2. **Scroll Containers**: Any scrollable wrapper inside the flex container MUST use `flex: 1; min-height: 0` (or `min-width: 0` for rows). 
3. **Avoid height: 100% alone**: Never rely solely on `height: 100%` for a chart wrapper inside a flex item, as it will often collapse. Always use `flex: 1; min-height: 0`.
4. **Recharts ResponsiveContainer**: Ensure the `ResponsiveContainer` is wrapped in a rigidly constrained `flex: 1; min-height: 0` container. If the chart needs to scroll, apply `overflow: auto` to that specific wrapper.
