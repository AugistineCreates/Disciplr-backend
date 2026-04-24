import request from 'supertest'
import { app } from '../app.js'
import { requireJson } from '../middleware/requireJson.js'
import express from 'express'

describe('Content-Type Enforcement Middleware', () => {
  let testApp: express.Application

  beforeAll(() => {
    testApp = express()
    
    // Add express.json() middleware to test JSON parsing
    testApp.use(express.json())
    
    // Test routes with different configurations
    testApp.get('/test-get', (req, res) => {
      res.json({ message: 'GET request successful' })
    })

    testApp.post('/test-post', requireJson, (req, res) => {
      res.json({ received: req.body })
    })

    testApp.put('/test-put', requireJson, (req, res) => {
      res.json({ received: req.body })
    })

    testApp.patch('/test-patch', requireJson, (req, res) => {
      res.json({ received: req.body })
    })

    testApp.delete('/test-delete', requireJson, (req, res) => {
      res.json({ received: req.body })
    })

    testApp.head('/test-head', requireJson, (req, res) => {
      res.status(200).end()
    })

    testApp.options('/test-options', requireJson, (req, res) => {
      res.status(200).end()
    })
  })

  describe('GET requests should pass through', () => {
    it('should allow GET requests without content-type', async () => {
      const response = await request(testApp)
        .get('/test-get')
        .expect(200)

      expect(response.body).toEqual({ message: 'GET request successful' })
    })

    it('should allow GET requests with any content-type', async () => {
      const response = await request(testApp)
        .get('/test-get')
        .set('Content-Type', 'text/plain')
        .expect(200)

      expect(response.body).toEqual({ message: 'GET request successful' })
    })
  })

  describe('HEAD requests should pass through', () => {
    it('should allow HEAD requests without content-type', async () => {
      await request(testApp)
        .head('/test-head')
        .expect(200)
    })

    it('should allow HEAD requests with any content-type', async () => {
      await request(testApp)
        .head('/test-head')
        .set('Content-Type', 'text/plain')
        .expect(200)
    })
  })

  describe('OPTIONS requests should pass through', () => {
    it('should allow OPTIONS requests without content-type', async () => {
      await request(testApp)
        .options('/test-options')
        .expect(200)
    })

    it('should allow OPTIONS requests with any content-type', async () => {
      await request(testApp)
        .options('/test-options')
        .set('Content-Type', 'text/plain')
        .expect(200)
    })
  })

  describe('POST requests with bodies require application/json', () => {
    it('should allow POST with valid JSON content-type and valid body', async () => {
      const testData = { test: 'data' }
      const response = await request(testApp)
        .post('/test-post')
        .set('Content-Type', 'application/json')
        .send(testData)
        .expect(200)

      expect(response.body).toEqual({ received: testData })
    })

    it('should allow POST with application/json charset utf-8', async () => {
      const testData = { test: 'data' }
      const response = await request(testApp)
        .post('/test-post')
        .set('Content-Type', 'application/json; charset=utf-8')
        .send(testData)
        .expect(200)

      expect(response.body).toEqual({ received: testData })
    })

    it('should reject POST without content-type header', async () => {
      const response = await request(testApp)
        .post('/test-post')
        .send({ test: 'data' })
        .expect(415)

      expect(response.body).toEqual({
        error: 'Unsupported Media Type: Content-Type must be application/json'
      })
    })

    it('should reject POST with text/plain content-type', async () => {
      const response = await request(testApp)
        .post('/test-post')
        .set('Content-Type', 'text/plain')
        .send('some text')
        .expect(415)

      expect(response.body).toEqual({
        error: 'Unsupported Media Type: Content-Type must be application/json'
      })
    })

    it('should reject POST with application/x-www-form-urlencoded', async () => {
      const response = await request(testApp)
        .post('/test-post')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('key=value')
        .expect(415)

      expect(response.body).toEqual({
        error: 'Unsupported Media Type: Content-Type must be application/json'
      })
    })

    it('should reject POST with multipart/form-data', async () => {
      const response = await request(testApp)
        .post('/test-post')
        .set('Content-Type', 'multipart/form-data; boundary=----WebKitFormBoundary')
        .send('some multipart data')
        .expect(415)

      expect(response.body).toEqual({
        error: 'Unsupported Media Type: Content-Type must be application/json'
      })
    })

    it('should reject POST with invalid charset', async () => {
      const response = await request(testApp)
        .post('/test-post')
        .set('Content-Type', 'application/json; charset=iso-8859-1')
        .send({ test: 'data' })
        .expect(415)

      expect(response.body).toEqual({
        error: 'Unsupported Media Type: Only UTF-8 charset is supported for JSON'
      })
    })

    it('should allow POST with empty body (no content-length)', async () => {
      await request(testApp)
        .post('/test-post')
        .expect(200)
    })

    it('should allow POST with zero content-length', async () => {
      await request(testApp)
        .post('/test-post')
        .set('Content-Length', '0')
        .expect(200)
    })
  })

  describe('PUT requests with bodies require application/json', () => {
    it('should allow PUT with valid JSON content-type', async () => {
      const testData = { test: 'data' }
      const response = await request(testApp)
        .put('/test-put')
        .set('Content-Type', 'application/json')
        .send(testData)
        .expect(200)

      expect(response.body).toEqual({ received: testData })
    })

    it('should reject PUT without content-type header', async () => {
      const response = await request(testApp)
        .put('/test-put')
        .send({ test: 'data' })
        .expect(415)

      expect(response.body).toEqual({
        error: 'Unsupported Media Type: Content-Type must be application/json'
      })
    })
  })

  describe('PATCH requests with bodies require application/json', () => {
    it('should allow PATCH with valid JSON content-type', async () => {
      const testData = { test: 'data' }
      const response = await request(testApp)
        .patch('/test-patch')
        .set('Content-Type', 'application/json')
        .send(testData)
        .expect(200)

      expect(response.body).toEqual({ received: testData })
    })

    it('should reject PATCH without content-type header', async () => {
      const response = await request(testApp)
        .patch('/test-patch')
        .send({ test: 'data' })
        .expect(415)

      expect(response.body).toEqual({
        error: 'Unsupported Media Type: Content-Type must be application/json'
      })
    })
  })

  describe('DELETE requests with bodies require application/json', () => {
    it('should allow DELETE with valid JSON content-type', async () => {
      const testData = { test: 'data' }
      const response = await request(testApp)
        .delete('/test-delete')
        .set('Content-Type', 'application/json')
        .send(testData)
        .expect(200)

      expect(response.body).toEqual({ received: testData })
    })

    it('should allow DELETE with empty body', async () => {
      await request(testApp)
        .delete('/test-delete')
        .expect(200)
    })

    it('should reject DELETE with body but no content-type', async () => {
      const response = await request(testApp)
        .delete('/test-delete')
        .send({ test: 'data' })
        .expect(415)

      expect(response.body).toEqual({
        error: 'Unsupported Media Type: Content-Type must be application/json'
      })
    })
  })

  describe('Invalid JSON handling', () => {
    it('should return 400 for malformed JSON (handled by express.json)', async () => {
      const response = await request(testApp)
        .post('/test-post')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400)

      // express.json() middleware handles malformed JSON before our middleware runs
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('Edge cases', () => {
    it('should handle content-type with additional parameters', async () => {
      const testData = { test: 'data' }
      const response = await request(testApp)
        .post('/test-post')
        .set('Content-Type', 'application/json; charset=utf-8; other=value')
        .send(testData)
        .expect(200)

      expect(response.body).toEqual({ received: testData })
    })

    it('should be case insensitive for content-type header', async () => {
      const testData = { test: 'data' }
      const response = await request(testApp)
        .post('/test-post')
        .set('content-type', 'application/json')
        .send(testData)
        .expect(200)

      expect(response.body).toEqual({ received: testData })
    })

    it('should handle content-type with whitespace', async () => {
      const testData = { test: 'data' }
      const response = await request(testApp)
        .post('/test-post')
        .set('Content-Type', ' application/json ')
        .send(testData)
        .expect(200)

      expect(response.body).toEqual({ received: testData })
    })
  })
})

describe('Integration Tests with Actual Routes', () => {
  describe('Auth endpoints', () => {
    it('should reject /auth/register without proper content-type', async () => {
      const response = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'text/plain')
        .send('invalid data')
        .expect(415)

      expect(response.body).toEqual({
        error: 'Unsupported Media Type: Content-Type must be application/json'
      })
    })

    it('should reject /auth/login without proper content-type', async () => {
      const response = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('email=test@example.com&password=password')
        .expect(415)

      expect(response.body).toEqual({
        error: 'Unsupported Media Type: Content-Type must be application/json'
      })
    })

    it('should allow /auth/register with proper content-type', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      // This should pass content-type validation but may fail due to other validation
      const response = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send(userData)

      // Should not get 415 error (content-type validation passed)
      expect(response.status).not.toBe(415)
    })
  })

  describe('Vault endpoints', () => {
    it('should reject POST /vaults without proper content-type', async () => {
      const response = await request(app)
        .post('/vaults')
        .set('Content-Type', 'text/plain')
        .set('Authorization', 'Bearer fake-token')
        .send('invalid data')
        .expect(415)

      expect(response.body).toEqual({
        error: 'Unsupported Media Type: Content-Type must be application/json'
      })
    })

    it('should allow GET /vaults without content-type header', async () => {
      // GET requests should not be affected by the middleware
      await request(app)
        .get('/vaults')
        .set('Authorization', 'Bearer fake-token')
        .expect(401) // Should get auth error, not content-type error
    })
  })

  describe('Jobs endpoints', () => {
    it('should reject POST /jobs/enqueue without proper content-type', async () => {
      const response = await request(app)
        .post('/jobs/enqueue')
        .set('Content-Type', 'text/plain')
        .set('Authorization', 'Bearer fake-admin-token')
        .send('invalid data')
        .expect(415)

      expect(response.body).toEqual({
        error: 'Unsupported Media Type: Content-Type must be application/json'
      })
    })

    it('should allow GET /jobs/health without content-type header', async () => {
      // GET requests should not be affected by the middleware
      await request(app)
        .get('/jobs/health')
        .set('Authorization', 'Bearer fake-admin-token')
        .expect(401) // Should get auth error, not content-type error
    })
  })
})
