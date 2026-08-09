export interface PagerProps {
  /** Rows per page. Defaults to 10. */
  pageSize?: number;
  /** Provide to make page size persist (e.g. via a zustand view store). */
  onPageSizeChange?: (size: number) => void;
  /** Show the "rows per page" selector. Defaults to false. */
  showSizeChanger?: boolean;
  /** Page-size choices offered by the selector. Only meaningful with showSizeChanger. */
  pageSizeOptions?: number[];
}

/**
 * Enables pagination on a Codebook. This is a headless config marker: it renders
 * nothing — <Root> reads its presence and props by inspecting its children. Include
 * it to paginate, omit it to show all rows with no pager.
 *
 * Must be a direct child of <Codebook.Root> (like Toolbar/Table/FormModal), and its
 * presence should be static rather than toggled per render.
 */
// Headless marker: declares PagerProps for JSX consumers but renders nothing
// and reads no props (its parent inspects its presence/props from children).
// The `_props` param is intentionally unused (see argsIgnorePattern in eslint).
export function Pager(_props: PagerProps) {
  return null;
}
