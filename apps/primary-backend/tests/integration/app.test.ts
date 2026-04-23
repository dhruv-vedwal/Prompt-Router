import { describe, it, expect } from 'vitest'
import { app } from '../../src/app'

describe('Elysia App Integration', () => {
  it('should be defined', () => {
    expect(app).toBeDefined()
  })

  it('should return 404 for unknown routes', async () => {
    const response = await app.handle(
      new Request('http://localhost/')
    )
    expect(response.status).toBe(404)
  })

  it('should return 401 for profile when not logged in', async () => {
    const response = await app.handle(
      new Request('http://localhost/auth/profile')
    )
    // This proves the /auth/profile route exists and the "Unauthorized" logic is working
    expect(response.status).toBe(401)
  })
})
