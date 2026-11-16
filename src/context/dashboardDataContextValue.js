import { createContext, useContext } from 'react';

export const DashboardDataContext = createContext(null);

/**
 * Returns shared dashboard data context when rendered inside DashboardDataProvider,
 * or null when rendered standalone (preserving standalone hook behavior).
 */
export const useDashboardSharedData = () => useContext(DashboardDataContext);
