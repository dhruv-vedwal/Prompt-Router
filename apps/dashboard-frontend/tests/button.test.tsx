import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { describe, it, expect } from 'vitest'

describe('Button Component', () => {
  it('renders correctly with text', () => {
    render(<Button>Click Me</Button>)
    expect(screen.getByText('Click Me')).toBeDefined()
  })

  it('is a button element', () => {
    render(<Button>Click Me</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDefined()
  })
})
