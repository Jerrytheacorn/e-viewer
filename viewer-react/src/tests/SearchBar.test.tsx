import { render, screen } from '@testing-library/react'
import SearchBar from '../components/SearchBar'
import { describe, it, expect } from 'vitest'

describe('SearchBar', () => {
  it('renders input and button', () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText(/Search tags/i)).toBeTruthy()
    expect(screen.getByText(/Search/i)).toBeTruthy()
  })
})
