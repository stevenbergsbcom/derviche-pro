/**
 * Barrel - Modules de rendu PDF pour les statistiques admin
 */

export * from './pdf-layout';

export { renderCover } from './pdf-cover';
export type { RenderCoverInput } from './pdf-cover';

export { renderKpis } from './pdf-kpis';
export type { RenderKpisInput } from './pdf-kpis';

export { renderShowsTable, renderVenuesTable } from './pdf-tables';

export { renderChart } from './pdf-chart';
export type { RenderChartInput } from './pdf-chart';
