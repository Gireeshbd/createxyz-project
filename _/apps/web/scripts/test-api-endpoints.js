#!/usr/bin/env node

/**
 * Comprehensive API endpoint testing suite
 * Tests all implemented endpoints with various scenarios
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const BASE_URL = 'http://localhost:4000'
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

class APITester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        }
        this.authToken = null
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${BASE_URL}${endpoint}`
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        }

        if (this.authToken) {
            headers.Authorization = `Bearer ${this.authToken}`
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            })

            let data
            try {
                data = await response.json()
            } catch (e) {
                data = { error: 'Invalid JSON response' }
            }

            return {
                status: response.status,
                data,
                ok: response.ok
            }
        } catch (error) {
            return {
                status: 0,
                data: { error: error.message },
                ok: false
            }
        }
    }

    test(name, testFn) {
        return async () => {
            try {
                console.log(`🧪 Testing: ${name}`)
                await testFn()
                console.log(`✅ PASS: ${name}`)
                this.results.passed++
                this.results.tests.push({ name, status: 'PASS' })
            } catch (error) {
                console.log(`❌ FAIL: ${name} - ${error.message}`)
                this.results.failed++
                this.results.tests.push({ name, status: 'FAIL', error: error.message })
            }
        }
    }

    expect(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual}. ${message}`)
        }
    }

    expectTruthy(value, message = '') {
        if (!value) {
            throw new Error(`Expected truthy value, got ${value}. ${message}`)
        }
    }

    expectStatus(response, expectedStatus) {
        this.expect(response.status, expectedStatus, `HTTP status mismatch`)
    }

    async runTests() {
        console.log('🚀 Starting API Endpoint Tests')
        console.log('================================\n')

        // Test basic connectivity
        await this.test('API Server Connectivity', async () => {
            const response = await this.makeRequest('/api/test-auth')
            this.expectTruthy(response.status > 0, 'Server should be reachable')
        })()

        // Test job endpoints
        await this.testJobEndpoints()

        // Test application endpoints
        await this.testApplicationEndpoints()

        // Test user endpoints
        await this.testUserEndpoints()

        // Test notification endpoints
        await this.testNotificationEndpoints()

        // Print results
        this.printResults()
    }

    async testJobEndpoints() {
        console.log('\n📋 Testing Job Endpoints')
        console.log('========================')

        await this.test('GET /api/jobs - List jobs', async () => {
            const response = await this.makeRequest('/api/jobs')
            this.expectStatus(response, 200)
            this.expectTruthy(response.data.success, 'Response should be successful')
            this.expectTruthy(Array.isArray(response.data.jobs), 'Jobs should be an array')
        })()

        await this.test('GET /api/jobs with filters', async () => {
            const response = await this.makeRequest('/api/jobs?category=technology&limit=5')
            this.expectStatus(response, 200)
            this.expectTruthy(response.data.success, 'Filtered request should succeed')
        })()

        await this.test('POST /api/jobs - Create job (no auth)', async () => {
            const jobData = {
                title: 'Test Job',
                description: 'Test Description',
                category: 'technology',
                location: 'Test Location',
                duration: '1-2 hours',
                pay_type: 'fixed',
                pay_amount: 100
            }

            const response = await this.makeRequest('/api/jobs', {
                method: 'POST',
                body: JSON.stringify(jobData)
            })

            // Should fail without auth or succeed with mock auth
            this.expectTruthy(response.status === 401 || response.status === 200, 'Should handle auth appropriately')
        })()

        await this.test('GET /api/jobs-simple - Simple endpoint test', async () => {
            const response = await this.makeRequest('/api/jobs-simple')
            this.expectStatus(response, 200)
            this.expectTruthy(response.data.success, 'Simple endpoint should work')
        })()
    }

    async testApplicationEndpoints() {
        console.log('\n📝 Testing Application Endpoints')
        console.log('===============================')

        await this.test('GET /api/applications (no auth)', async () => {
            const response = await this.makeRequest('/api/applications')
            this.expectStatus(response, 401)
            this.expectTruthy(!response.data.success, 'Should require authentication')
        })()

        // Test with mock job ID
        const mockJobId = '00000000-0000-0000-0000-000000000000'

        await this.test('GET /api/jobs/[id]/applications (no auth)', async () => {
            const response = await this.makeRequest(`/api/jobs/${mockJobId}/applications`)
            this.expectStatus(response, 401)
            this.expectTruthy(!response.data.success, 'Should require authentication')
        })()
    }

    async testUserEndpoints() {
        console.log('\n👤 Testing User Endpoints')
        console.log('========================')

        const mockUserId = '00000000-0000-0000-0000-000000000000'

        await this.test('GET /api/users/[id]/reviews', async () => {
            const response = await this.makeRequest(`/api/users/${mockUserId}/reviews`)
            this.expectStatus(response, 200)
            this.expectTruthy(response.data.success, 'Public reviews should be accessible')
        })()

        await this.test('GET /api/users/[id]/rating-stats', async () => {
            const response = await this.makeRequest(`/api/users/${mockUserId}/rating-stats`)
            this.expectStatus(response, 200)
            this.expectTruthy(response.data.success, 'Rating stats should be accessible')
        })()

        await this.test('GET /api/users/[id]/dashboard', async () => {
            const response = await this.makeRequest(`/api/users/${mockUserId}/dashboard`)
            // Should work for public data or require auth for private data
            this.expectTruthy(response.status === 200 || response.status === 401, 'Dashboard should handle auth appropriately')
        })()
    }

    async testNotificationEndpoints() {
        console.log('\n🔔 Testing Notification Endpoints')
        console.log('================================')

        await this.test('GET /api/notifications (no auth)', async () => {
            const response = await this.makeRequest('/api/notifications')
            this.expectStatus(response, 401)
            this.expectTruthy(!response.data.success, 'Should require authentication')
        })()

        await this.test('GET /api/notifications/preferences (no auth)', async () => {
            const response = await this.makeRequest('/api/notifications/preferences')
            this.expectStatus(response, 401)
            this.expectTruthy(!response.data.success, 'Should require authentication')
        })()
    }

    printResults() {
        console.log('\n📊 Test Results Summary')
        console.log('======================')
        console.log(`✅ Passed: ${this.results.passed}`)
        console.log(`❌ Failed: ${this.results.failed}`)
        console.log(`📈 Total: ${this.results.passed + this.results.failed}`)
        console.log(`🎯 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`)

        if (this.results.failed > 0) {
            console.log('\n❌ Failed Tests:')
            this.results.tests
                .filter(test => test.status === 'FAIL')
                .forEach(test => {
                    console.log(`   - ${test.name}: ${test.error}`)
                })
        }

        console.log('\n🎉 API testing completed!')
    }
}

// Run tests
const tester = new APITester()
tester.runTests().catch(error => {
    console.error('Test runner failed:', error)
    process.exit(1)
})