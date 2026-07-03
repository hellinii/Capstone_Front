import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// 하네스 스모크: vitest + jsdom + RTL + jest-dom 매처가 함께 동작하는지 확인.
describe('test harness', () => {
  it('renders a DOM node via RTL', () => {
    render(<div>hello-harness</div>)
    expect(screen.getByText('hello-harness')).toBeInTheDocument()
  })
})
