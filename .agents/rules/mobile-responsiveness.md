# Mobile Responsiveness Strict Constraints

- **Preserve Desktop CSS:** NEVER modify the existing CSS rules, inline styles, or JSX structural properties that affect the desktop view. The desktop design is stable and must remain "as is."
- **Use Media Queries Only:** Whenever a responsive layout or mobile view task is assigned, you MUST wrap all your CSS changes inside `@media (max-width: 767px)` (or the appropriate mobile breakpoint). Use `!important` inside media queries if you need to override inline styles instead of modifying the JSX.
- **No Global JS Layout Shifts:** Do not modify React prop values (like Recharts `angle`, `margin`, or `width`) globally if it will affect the desktop layout. If a JS-based component needs mobile-specific props, you must use a `useMediaQuery` hook or CSS-based overrides where possible, and default strictly to the original desktop values.
