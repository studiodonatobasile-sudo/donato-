import { resolveCategory } from '../types'

export function CategoryBadge({ categoryId }: { categoryId: string }) {
  const { subcategory, macro } = resolveCategory(categoryId)
  return (
    <span className="category-badge">
      <span className="legend-swatch" style={{ background: `var(${macro.colorVar})` }} />
      {macro.icon} {subcategory ? subcategory.label : macro.label}
    </span>
  )
}
