// Centralized API error handling and validation

export class APIError extends Error {
    constructor(message, statusCode = 500, code = null, details = null) {
        super(message)
        this.name = 'APIError'
        this.statusCode = statusCode
        this.code = code
        this.details = details
    }
}

export class ValidationError extends APIError {
    constructor(message, field = null, value = null) {
        super(message, 400, 'VALIDATION_ERROR')
        this.field = field
        this.value = value
    }
}

export class AuthenticationError extends APIError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR')
    }
}

export class AuthorizationError extends APIError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR')
    }
}

export class NotFoundError extends APIError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND_ERROR')
    }
}

export class ConflictError extends APIError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT_ERROR')
    }
}

export class RateLimitError extends APIError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_ERROR')
    }
}

// Error handler middleware
export function handleAPIError(error) {
    console.error('API Error:', error)

    if (error instanceof APIError) {
        return Response.json(
            {
                success: false,
                error: error.message,
                code: error.code,
                details: error.details
            },
            { status: error.statusCode }
        )
    }

    // Handle Supabase errors
    if (error.code) {
        const supabaseError = handleSupabaseError(error)
        return Response.json(
            {
                success: false,
                error: supabaseError.message,
                code: supabaseError.code
            },
            { status: supabaseError.statusCode }
        )
    }

    // Generic server error
    return Response.json(
        {
            success: false,
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        },
        { status: 500 }
    )
}

// Handle Supabase-specific errors
function handleSupabaseError(error) {
    const errorMap = {
        // Authentication errors
        'invalid_credentials': { message: 'Invalid email or password', statusCode: 401 },
        'email_not_confirmed': { message: 'Please confirm your email address', statusCode: 401 },
        'signup_disabled': { message: 'Sign up is currently disabled', statusCode: 403 },

        // Authorization errors
        'insufficient_privilege': { message: 'Insufficient permissions', statusCode: 403 },
        'row_level_security_violation': { message: 'Access denied', statusCode: 403 },

        // Validation errors
        'invalid_input': { message: 'Invalid input data', statusCode: 400 },
        'check_violation': { message: 'Data validation failed', statusCode: 400 },
        'not_null_violation': { message: 'Required field is missing', statusCode: 400 },
        'foreign_key_violation': { message: 'Referenced resource does not exist', statusCode: 400 },
        'unique_violation': { message: 'Resource already exists', statusCode: 409 },

        // Not found errors
        'PGRST116': { message: 'Resource not found', statusCode: 404 },

        // Rate limiting
        'rate_limit_exceeded': { message: 'Too many requests', statusCode: 429 }
    }

    const mappedError = errorMap[error.code] || errorMap[error.error_code]

    if (mappedError) {
        return {
            message: mappedError.message,
            statusCode: mappedError.statusCode,
            code: error.code
        }
    }

    // Default error handling
    return {
        message: error.message || 'Database operation failed',
        statusCode: 500,
        code: error.code || 'DATABASE_ERROR'
    }
}

// Validation utilities
export const validators = {
    email: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            throw new ValidationError('Invalid email format', 'email', email)
        }
    },

    password: (password) => {
        if (!password || password.length < 6) {
            throw new ValidationError('Password must be at least 6 characters', 'password')
        }
    },

    uuid: (id, fieldName = 'id') => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(id)) {
            throw new ValidationError(`Invalid ${fieldName} format`, fieldName, id)
        }
    },

    required: (value, fieldName) => {
        if (value === null || value === undefined || value === '') {
            throw new ValidationError(`${fieldName} is required`, fieldName)
        }
    },

    string: (value, fieldName, minLength = 0, maxLength = Infinity) => {
        if (typeof value !== 'string') {
            throw new ValidationError(`${fieldName} must be a string`, fieldName, value)
        }
        if (value.length < minLength) {
            throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, fieldName, value)
        }
        if (value.length > maxLength) {
            throw new ValidationError(`${fieldName} must be no more than ${maxLength} characters`, fieldName, value)
        }
    },

    number: (value, fieldName, min = -Infinity, max = Infinity) => {
        const num = Number(value)
        if (isNaN(num)) {
            throw new ValidationError(`${fieldName} must be a number`, fieldName, value)
        }
        if (num < min) {
            throw new ValidationError(`${fieldName} must be at least ${min}`, fieldName, value)
        }
        if (num > max) {
            throw new ValidationError(`${fieldName} must be no more than ${max}`, fieldName, value)
        }
    },

    enum: (value, fieldName, allowedValues) => {
        if (!allowedValues.includes(value)) {
            throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`, fieldName, value)
        }
    },

    rating: (rating) => {
        validators.number(rating, 'rating', 1, 5)
        if (!Number.isInteger(Number(rating))) {
            throw new ValidationError('Rating must be a whole number', 'rating', rating)
        }
    }
}

// Request validation wrapper
export function validateRequest(validationRules) {
    return function (handler) {
        return async function (request, params) {
            try {
                // Parse request body if it exists
                let body = {}
                if (request.method !== 'GET' && request.method !== 'DELETE') {
                    try {
                        body = await request.json()
                    } catch (e) {
                        throw new ValidationError('Invalid JSON in request body')
                    }
                }

                // Parse query parameters
                const { searchParams } = new URL(request.url)
                const query = Object.fromEntries(searchParams.entries())

                // Run validation rules
                if (validationRules.body) {
                    for (const [field, rules] of Object.entries(validationRules.body)) {
                        const value = body[field]

                        if (rules.required) {
                            validators.required(value, field)
                        }

                        if (value !== undefined && value !== null && value !== '') {
                            if (rules.type === 'string') {
                                validators.string(value, field, rules.minLength, rules.maxLength)
                            } else if (rules.type === 'number') {
                                validators.number(value, field, rules.min, rules.max)
                            } else if (rules.type === 'email') {
                                validators.email(value)
                            } else if (rules.type === 'uuid') {
                                validators.uuid(value, field)
                            } else if (rules.enum) {
                                validators.enum(value, field, rules.enum)
                            }

                            if (rules.custom) {
                                rules.custom(value, field)
                            }
                        }
                    }
                }

                if (validationRules.params) {
                    for (const [field, rules] of Object.entries(validationRules.params)) {
                        const value = params.params[field]

                        if (rules.required) {
                            validators.required(value, field)
                        }

                        if (value && rules.type === 'uuid') {
                            validators.uuid(value, field)
                        }
                    }
                }

                // Call the actual handler
                return await handler(request, params, { body, query })

            } catch (error) {
                return handleAPIError(error)
            }
        }
    }
}

// Async error wrapper
export function asyncHandler(handler) {
    return async function (request, params) {
        try {
            return await handler(request, params)
        } catch (error) {
            return handleAPIError(error)
        }
    }
}

export default {
    APIError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    handleAPIError,
    validators,
    validateRequest,
    asyncHandler
}