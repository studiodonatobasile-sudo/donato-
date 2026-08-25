import { getCategory } from '../types'

export function CategoryBadge({ categoryId }: { categoryId: string }) {
  const cat = getCategory(categoryId)
  return (
    <span className="category-badge">
      <span className="legend-swatch" style={{ background: `var(${cat.colorVar})` }} />
      {cat.icon} {cat.label}
    </span>
  )
}
