import { createContext, useContext, type ReactNode } from 'react'
import type { SubcategoryDef } from '../types'

const CustomCategoriesContext = createContext<SubcategoryDef[]>([])

/**
 * Rende disponibili le sottocategorie personalizzate dell'utente a tutto l'albero dei
 * componenti. Servono ovunque si debba risolvere l'etichetta/colore di una spesa (badge,
 * grafici, export, form): senza, una spesa con una sottocategoria personalizzata finirebbe
 * classificata come "Altro" nei punti che non le conoscono.
 */
export function CustomCategoriesProvider({ categories, children }: { categories: SubcategoryDef[]; children: ReactNode }) {
  return <CustomCategoriesContext.Provider value={categories}>{children}</CustomCategoriesContext.Provider>
}

export function useCustomCategories(): SubcategoryDef[] {
  return useContext(CustomCategoriesContext)
}
