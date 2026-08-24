# Table Store Name Rule

**Description:** Standardizes how store names and store codes are displayed in data tables across the dashboard.
**Tags:** ui, table, tooltip, store-name

## Rule

When creating or modifying data tables that display store information:
1. **Never** display the "Store Name" (e.g., `HD44 - Uttam Nagar 2`) in a dedicated column or directly in the table row cell. It takes up too much horizontal space.
2. Instead, display **only the Store Code** (e.g., `HD44`) in the table row.
3. Wrap the Store Code in a custom tooltip (`.cc-row-tooltip-wrapper` and `.cc-row-tooltip`) so that the full Store Name is revealed when the user hovers over the Store Code.
4. If a dedicated column was previously used for "Store Name", replace it with relevant supplementary data (e.g., "Date") if applicable.

## Implementation Example

```jsx
// Correct format for Store Code with Tooltip
<td className="cc-data-grid-td cc-data-grid-td-bold">
  <div className="cc-row-tooltip-wrapper">
    {row.STORE || '—'}
    {row.STORE_NAME && (
      <div className="cc-row-tooltip">
        {row.STORE} - {row.STORE_NAME}
      </div>
    )}
  </div>
</td>
```
