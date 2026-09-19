# Table Sorting Standard Rule

**Description:** Standardizes how column header sorting (Ascending / Descending) is implemented across data tables and report pages.
**Tags:** ui, table, sorting, pagination, report

## Core Architecture: Where Sorting Lives

1. **The Shared Table Component (`BaseDataTable.jsx` / `ReportDataTableCard.jsx`)**:
   - **Already handles the sorting UI**: Click listeners on `<th>`, direction toggle (`asc` ↔ `desc`), CSS sorting classes (`dt-ordering-asc`, `dt-ordering-desc`), and visual arrows are **built-in**.
   - **Never rewrite or duplicate header click logic** in individual pages.

2. **When to use Server-Side vs. Client-Side Sorting**:

### A. Paginated Report Pages (Server-Side Sorting)
Any table fetching records page-by-page from the backend API MUST use server-side sorting so SQL Server sorts the entire database result set before pagination:

1. Maintain `sortColumn` and `sortDirection` in the report page state:
   ```jsx
   const [sortColumn, setSortColumn] = useState('DATE'); // or primary column
   const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
   ```
2. Pass sorting props and callback to `<ReportDataTableCard>`:
   ```jsx
   <ReportDataTableCard
     columns={columns}
     data={reportData}
     totalRecords={totalRecords}
     pageIndex={pageIndex}
     pageSize={pageSize}
     onPageChange={setPageIndex}
     onPageSizeChange={(newSize) => {
       setPageSize(newSize);
       setPageIndex(1);
     }}
     onSortChange={(col, dir) => {
       setSortColumn(col);
       setSortDirection(dir);
       setPageIndex(1); // Always reset to page 1 on sort change
     }}
     sortColumn={sortColumn}
     sortDirection={sortDirection}
   />
   ```
3. Pass `sortColumn` and `sortDirection` to the API service call in `useEffect`:
   ```jsx
   useEffect(() => {
     fetchReport(pageIndex, pageSize, sortColumn, sortDirection);
   }, [pageIndex, pageSize, sortColumn, sortDirection, ...filters]);
   ```
4. Column definitions in `columns = [...]` MUST have `key` matching the database column name expected by the stored procedure (e.g. `VOID_DATE`, `STORE_CODE`, `QTY`).

---

### B. In-Memory / Modal Tables (Client-Side Sorting)
For dialogs or modals (e.g., `DetailsModal.jsx`) where all rows for that view are already loaded in browser memory:
- **No extra page-level sort code is needed.**
- Do NOT provide `onSortChange`.
- `BaseDataTable` will automatically sort numbers numerically and strings alphabetically (`localeCompare`) in memory when headers are clicked.
