import type { AgendaItem } from '../types'
import { ItemCard } from './ItemCard'
import { formatDateLabel } from '../utils/dateUtils'

export type ListFilter = 'prossimi' | 'oggi' | 'note' | 'completati' | 'tutti'

interface Props {
  items: AgendaItem[]
  filter: ListFilter
  onEdit: (item: AgendaItem) => void
  onDelete: (item: AgendaItem) => void
  onToggleDone: (item: AgendaItem) => void
}

function applyFilter(items: AgendaItem[], filter: ListFilter): AgendaItem[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  switch (filter) {
    case 'oggi': {
      const todayStr = today.toISOString().slice(0, 10)
      return items.filter((i) => i.date === todayStr && !i.done)
    }
    case 'prossimi':
      return items.filter((i) => !i.done)
    case 'note':
      return items.filter((i) => i.type === 'nota' && !i.done)
    case 'completati':
      return items.filter((i) => i.done)
    case 'tutti':
    default:
      return items
  }
}

function sortItems(items: AgendaItem[]): AgendaItem[] {
  return [...items].sort((a, b) => {
    if (a.date && b.date) {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      if (a.time && b.time) return a.time.localeCompare(b.time)
      if (a.time) return -1
      if (b.time) return 1
      return 0
    }
    if (a.date) return -1
    if (b.date) return 1
    return b.createdAt - a.createdAt
  })
}

export function ItemList({ items, filter, onEdit, onDelete, onToggleDone }: Props) {
  const filtered = sortItems(applyFilter(items, filter))

  if (filtered.length === 0) {
    return (
      <div className="empty-state">
        <p>Nessun elemento da mostrare.</p>
      </div>
    )
  }

  const groups: { label: string; items: AgendaItem[] }[] = []
  for (const item of filtered) {
    const label = item.date ? formatDateLabel(item.date) : 'Senza data'
    let group = groups.find((g) => g.label === label)
    if (!group) {
      group = { label, items: [] }
      groups.push(group)
    }
    group.items.push(item)
  }

  return (
    <div className="item-list">
      {groups.map((group) => (
        <div key={group.label} className="item-group">
          <h3 className="item-group-label">{group.label}</h3>
          {group.items.map((item) => (
            <ItemCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onToggleDone={onToggleDone} />
          ))}
        </div>
      ))}
    </div>
  )
}
