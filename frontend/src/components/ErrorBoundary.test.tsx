import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from './ErrorBoundary'

let shouldThrow = false

function ThrowingChild() {
  if (shouldThrow) throw new Error('test error')
  return <div>child content</div>
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    shouldThrow = false
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('child content')).toBeInTheDocument()
  })

  it('renders fallback UI on error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    shouldThrow = true

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('Algo salió mal al cargar esta sección.')).toBeInTheDocument()
    expect(screen.getByText('Reintentar')).toBeInTheDocument()

    vi.restoreAllMocks()
  })

  it('recovers after clicking retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    shouldThrow = true

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    )

    expect(screen.getByText('Reintentar')).toBeInTheDocument()

    shouldThrow = false
    await user.click(screen.getByText('Reintentar'))

    expect(screen.getByText('child content')).toBeInTheDocument()

    vi.restoreAllMocks()
  })
})
