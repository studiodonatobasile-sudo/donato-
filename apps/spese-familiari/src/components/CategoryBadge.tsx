import { resolveCategory } from '../types'
import { useCustomCategories } from '../context/CategoriesContext'

export function CategoryBadge({ categoryId }: { categoryId: string }) {
  const customCategories = useCustomCategories()
  const { subcategory, macro } = resolveCategory(categoryId, customCategories)
  return (
    <span className="category-badge">
      <span className="legend-swatch" style={{ background: `var(${macro.colorVar})` }} />
      {macro.icon} {subcategory ? subcategory.label : macro.label}
    </span>
  )
}
