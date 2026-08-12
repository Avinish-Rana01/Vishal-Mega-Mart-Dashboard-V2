# Git Rules

- **DO NOT** commit or push code to git automatically or on your own.
- Only run `git` commands (add, commit, push) if the user explicitly instructs you to do so.
- The company prefers to avoid small frequent commits. Leave the committing to the user unless requested otherwise.



# UI Design System Rules

- **Dashboard Statistic Cards**: ALWAYS use the `CurvedCard` component (`src/components/common/CurvedCard.jsx`) for any high-level statistic or metric cards in the application. Do NOT manually hardcode HTML/CSS for these cards.
- When implementing a `CurvedCard`, you must preserve the specific context by passing the `title`, `value`, `waveColor` (gradient array), and `icon` (SVG) props.

# Project Knowledge & Architecture Context (For New Developers & Agents)

## Current Architecture & API Patterns
- **Frontend Fallbacks**: The React UI heavily relies on the `summary` block in API responses. For example, if 0 rows are returned, the UI expects `summary.storeName` and `summary.date` to be populated so the info bar can render the selected store's name.
- **SQL Server Casing Bugs**: The backend C# ADO.NET mapping uses `StringComparer.OrdinalIgnoreCase` when converting `SqlDataReader` to `Dictionary<string, object?>`. This is CRITICAL because the legacy SQL stored procedures (like `SP_NEW_DASHBOARD`) often return mixed-case columns (e.g., `Store_Name` instead of `STORE_NAME`). 

## Planned Features: RBAC (Role-Based Access Control)
- **Current Auth State**: `AuthController.cs` (`POST /api/auth/login`) currently validates users against `SP_Master` but **DOES NOT** issue a JWT token. Additionally, it currently blocks any user with `User_Type` of `"Store"` or `"Warehouse"`.
- **The RBAC Plan**: We are migrating to JWT-based auth. Once JWT is implemented, the backend services (like `LiveStockService.cs` and `ModernReportController.cs`) will extract the `User_Type` and `StoreCode` directly from the token's claims via `IHttpContextAccessor`.
- **Data Filtering Strategy**: Instead of creating 9 different APIs for Admins, Managers, and Billers, we will use **Parameter Interception**. If a Biller makes a request, the backend will dynamically override `request.StoreCode` with the StoreCode from their JWT token, forcing the SQL query to only return data for their assigned store. Admins will bypass this override.
