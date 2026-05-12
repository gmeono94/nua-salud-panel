import { describe, it, expect } from 'vitest'
import { SPECIALTY_HEX, SPECIALTY_CHIPS } from './colors'

describe('SPECIALTY_HEX', () => {
  it('defines hex colors for all specialties', () => {
    expect(SPECIALTY_HEX).toHaveProperty('ginecologia')
    expect(SPECIALTY_HEX).toHaveProperty('obstetricia')
    expect(SPECIALTY_HEX).toHaveProperty('menopausia')
  })

  it('uses valid hex color format', () => {
    for (const color of Object.values(SPECIALTY_HEX)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('SPECIALTY_CHIPS', () => {
  it('defines bg and text classes for all specialties', () => {
    for (const [key, value] of Object.entries(SPECIALTY_CHIPS)) {
      expect(value.bg).toBeTruthy()
      expect(value.text).toBeTruthy()
      expect(value.bg).toContain('bg-')
      expect(value.text).toContain('text-')
    }
  })

  it('covers same specialties as SPECIALTY_HEX', () => {
    const hexKeys = Object.keys(SPECIALTY_HEX).sort()
    const chipKeys = Object.keys(SPECIALTY_CHIPS).sort()
    expect(chipKeys).toEqual(hexKeys)
  })
})
