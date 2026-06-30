export const GEAR_TYPES = [
  { value: 'shoes', label: 'Chaussures de course' },
  { value: 'bike', label: 'Vélo' },
  { value: 'wetsuit', label: 'Combinaison' },
  { value: 'helmet', label: 'Casque' },
] as const

export type GearType = (typeof GEAR_TYPES)[number]['value']
