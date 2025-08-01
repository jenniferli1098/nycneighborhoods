# Backend Test Suite

This directory contains comprehensive unit and integration tests for the NYC Neighborhoods backend API.

## Test Structure

### Unit Tests
- **`models/`** - Tests for Mongoose models (Visit, District, etc.)
- **`middleware/`** - Tests for middleware functions (authentication, etc.)

### Integration Tests
- **`routes/`** - Tests for API route handlers
- **`integration/`** - End-to-end API workflow tests

## Setup

The test suite uses:
- **Jest** - Test framework
- **Supertest** - HTTP assertion library for API testing
- **MongoDB Memory Server** - In-memory MongoDB for isolated tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test tests/models/Visit.test.js
```

## Test Features

- **Isolated Environment** - Each test runs with a fresh in-memory database
- **Authentication Testing** - JWT token validation and user isolation
- **Data Validation** - Schema validation and error handling
- **API Workflow Testing** - Complete CRUD operations
- **User Security** - Tests ensure data isolation between users

## Coverage

The test suite covers:
- ✅ Visit model validation and operations
- ✅ District model operations
- ✅ Authentication middleware
- ✅ Visits API endpoints (GET, POST, PUT, DELETE)
- ✅ User data isolation
- ✅ Error handling and edge cases
- ✅ Data relationships and population

## Adding New Tests

When adding new features:
1. Add unit tests for new models in `models/`
2. Add route tests in `routes/`
3. Add integration tests for complex workflows in `integration/`
4. Ensure proper cleanup and isolation