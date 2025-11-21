# Project Structure - Formaly Backend

## Directory Organization

```
Formaly-Backend/
├── .amazonq/                    # Amazon Q configuration and rules
│   ├── agents/                  # Agent configurations
│   └── rules/                   # Development rules and context
│       ├── memory-bank/         # Generated documentation
│       ├── Context.md           # Technical context
│       ├── NestJS-Patterns.md   # Architecture patterns
│       ├── Rules.md             # Best practices
│       └── VALIDATION_CHECKLIST.md
│
├── docs/                        # Project documentation
│   └── SCHEMA_DECISIONS.md      # Database design decisions
│
├── prisma/                      # Database layer
│   ├── migrations/              # Database migrations
│   │   └── 20251110004244_init/ # Initial migration
│   ├── schema.prisma            # Database schema definition
│   └── post-migration.sql       # Post-migration scripts
│
├── src/                         # Application source code
│   ├── common/                  # Shared utilities
│   │   ├── decorators/          # Custom NestJS decorators
│   │   ├── exceptions/          # Custom exception classes
│   │   ├── filters/             # Exception filters
│   │   ├── guards/              # Authentication guards
│   │   ├── interceptors/        # Request/response interceptors
│   │   ├── pipes/               # Validation pipes
│   │   └── types/               # Shared TypeScript types
│   │
│   ├── config/                  # Configuration files
│   │   └── jwt.config.ts        # JWT configuration
│   │
│   ├── modules/                 # Feature modules
│   │   ├── auth/                # Authentication module
│   │   ├── dashboard/           # Analytics module
│   │   ├── forms/               # Form management module
│   │   ├── prisma/              # Prisma service module
│   │   ├── public-forms/        # Public form access module
│   │   └── users/               # User management module
│   │
│   ├── app.controller.ts        # Root controller
│   ├── app.module.ts            # Root module
│   └── main.ts                  # Application bootstrap
│
├── test/                        # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
└── Configuration Files
    ├── package.json             # Dependencies and scripts
    ├── tsconfig.json            # TypeScript configuration
    ├── nest-cli.json            # NestJS CLI configuration
    ├── docker-compose.yml       # Docker setup
    └── Dockerfile               # Container definition
```

## Core Components

### 1. Application Bootstrap (main.ts)
- Initializes NestJS application with Fastify adapter
- Configures global pipes (Zod validation)
- Sets up exception filters
- Enables CORS
- Configures Swagger documentation
- Starts HTTP server

### 2. Root Module (app.module.ts)
- Imports all feature modules
- Configures global modules (Prisma, Config)
- Sets up dependency injection container

### 3. Feature Modules

#### Auth Module (`modules/auth/`)
- User authentication and authorization
- OAuth provider integration
- JWT token generation and validation
- User registration and login

#### Forms Module (`modules/forms/`)
- Form CRUD operations
- Form field management
- Form configuration (password, expiration, limits)
- Form cloning
- Owner authorization

#### Public Forms Module (`modules/public-forms/`)
- Public form access without authentication
- Password validation for protected forms
- Form submission handling
- View tracking
- Response validation

#### Users Module (`modules/users/`)
- User profile management
- Account linking across providers
- User data retrieval

#### Dashboard Module (`modules/dashboard/`)
- Analytics and statistics
- KPI calculations
- Recent activity tracking
- Data aggregation

#### Prisma Module (`modules/prisma/`)
- Database connection management
- Prisma client provider
- Global database service

### 4. Common Layer

#### Decorators
- `@CurrentUser()`: Extract authenticated user from request
- Custom parameter decorators for request data

#### Exceptions
- `FormNotFoundException`: Form not found error
- `FormUnauthorizedException`: Access denied error
- `ValidationException`: Input validation error
- `InvalidCredentialsException`: Authentication error

#### Guards
- `JwtAuthGuard`: Protect routes requiring authentication
- `@Public()`: Decorator to bypass authentication

#### Filters
- `PrismaExceptionFilter`: Handle Prisma errors
- Global exception handling

#### Pipes
- `ZodValidationPipe`: Validate DTOs with Zod schemas

#### Types
- Shared TypeScript interfaces and types
- Error response types
- Common data structures

## Architectural Patterns

### Clean Architecture (3-Layer)
```
Controller Layer (HTTP)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Database (PostgreSQL)
```

**Controller Responsibilities:**
- Route HTTP requests
- Validate input with DTOs
- Extract request data
- Return HTTP responses
- NO business logic

**Service Responsibilities:**
- All business logic
- Orchestrate repository calls
- Data transformations
- Validation of business rules
- Throw custom exceptions

**Repository Responsibilities:**
- Database queries (Prisma)
- Data mapping
- Query optimization
- NO business logic

### Dependency Injection
- Constructor injection for all dependencies
- Providers registered in module metadata
- Singleton scope by default
- Testable and maintainable code

### Module Organization
- Feature-based modules (auth, forms, users)
- Each module is self-contained
- Clear module boundaries
- Explicit imports/exports

### Data Flow
```
HTTP Request
    ↓
Controller (validates with DTO)
    ↓
Service (business logic)
    ↓
Repository (Prisma query)
    ↓
Database
    ↓
Response flows back up
```

## Database Schema Architecture

### Multi-Tenant Design
- Each user has isolated forms
- Cascade deletes maintain referential integrity
- Normalized structure for flexibility

### Key Relationships
- `User` → `Account` (1:N) - Multi-provider support
- `User` → `Form` (1:N) - User owns forms
- `Form` → `FormField` (1:N) - Form has fields
- `Form` → `FormPassword` (1:1 optional) - Password protection
- `Form` → `FormSubmission` (1:N) - Form receives submissions
- `FormSubmission` → `FormValue` (1:N) - Submission has field values
- `FormField` → `FormValue` (1:N) - Field referenced in values
- `Form` → `FormView` (1:N) - View tracking

### Design Decisions
- UUID primary keys for security
- JSON storage for flexible field configurations
- Composite primary key for FormView (deduplication)
- Indexes on foreign keys and query patterns
- Hard delete with CASCADE (no soft delete)
- Separate password table for optional protection

## Configuration Management
- Environment variables via `.env`
- Type-safe config with Zod validation
- Separate configs for development/production
- Docker support for containerization
