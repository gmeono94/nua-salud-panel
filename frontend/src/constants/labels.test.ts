import { describe, it, expect } from 'vitest'
import { ROLE_LABELS, ACTION_LABELS, ACTION_COLORS, RESOURCE_LABELS } from './labels'

describe('ROLE_LABELS', () => {
  it('defines labels for all application roles', () => {
    expect(ROLE_LABELS.admin).toBe('Administradora')
    expect(ROLE_LABELS.strategy).toBe('Estrategia')
    expect(ROLE_LABELS.clinic_director).toBe('Directora de Clínica')
  })
})

describe('ACTION_LABELS', () => {
  it('has a label for every action color', () => {
    for (const action of Object.keys(ACTION_COLORS)) {
      expect(ACTION_LABELS).toHaveProperty(action)
    }
  })

  it('covers auth actions', () => {
    expect(ACTION_LABELS.login).toBeDefined()
    expect(ACTION_LABELS.logout).toBeDefined()
    expect(ACTION_LABELS.login_failed).toBeDefined()
  })
})

describe('RESOURCE_LABELS', () => {
  const expectedResources = [
    'appointments',
    'occupancy',
    'patients',
    'revenue',
    'top-doctors',
    'cancellation-rate',
    'avg-ticket',
    'retention-cohorts',
  ]

  it('has a label for every metric resource', () => {
    for (const resource of expectedResources) {
      expect(RESOURCE_LABELS).toHaveProperty(resource)
      expect(RESOURCE_LABELS[resource]).toBeTruthy()
    }
  })
})
