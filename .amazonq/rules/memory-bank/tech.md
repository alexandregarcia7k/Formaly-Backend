# Technology Stack - Formaly Backend

## Programming Languages

### TypeScript 5.7.3
- **Primary Language**: All source code written in TypeScript
- **Strict Mode**: Enabled for maximum type safety
- **Configuration**: `tsconfig.json` with strict compiler options
- **Path Aliases**: `@/*` for clean imports
- **Target**: ES2021 with Node.js runtime

## Core Framework & Runtime

### NestJS 11.0.1
- **Framework**: Progressive Node.js framework for building efficient server-side applications
- **Architecture**: Modular, dependency injection-based
- **Decorators**: Extensive use of TypeScript decorators
- **CLI**: `@nestjs/cli` for code generation and project management

### Fastify 11.1.8
- **HTTP Server**: High-performance alternative to Express
- **Platform**: `@nestjs/platform-fastify` adapter
- **Plugins**: 
  - `@fastify/cookie` 11.0.2 - Cookie handling
  - `@fastify/static` 8.3.0 - Static file serving

### Node.js
- **Runtime**: Node.js LTS
- **Package Manager**: npm

## Database & ORM

### PostgreSQL
- **Database**: Relational database
- **Connection**: Via Prisma Client
- **Local Development**: Docker container (localhost:5432)
- **Production**: Neon Serverless or similar

### Prisma 6.19.0
- **ORM**: Type-safe database client
- **Client**: `@prisma/client` 6.19.0
- **CLI**: `prisma` 6.19.0 for migrations and schema management
- **Features**:
  - Type-safe queries
  - Auto-generated types
  - Migration system
  - Prisma Studio for data visualization

## Authentication & Security

### Passport.js 0.7.0
- **Strategy**: JWT authentication
- **Integration**: `@nestjs/passport` 11.0.5
- **JWT**: `@nestjs/jwt` 11.0.1
- **Strategy**: `passport-jwt` 4.0.1

### bcrypt 6.0.0
- **Password Hashing**: Secure password storage
- **Cost Factor**: 10 (configurable)
- **Types**: `@types/bcrypt` 6.0.0

## Validation & Documentation

### Zod 4.1.12
- **Schema Validation**: Runtime type checking
- **Integration**: `nestjs-zod` 5.0.1
- **DTOs**: All input validation via Zod schemas
- **Type Inference**: TypeScript types inferred from schemas

### Swagger 11.2.1
- **API Documentation**: `@nestjs/swagger` 11.2.1
- **OpenAPI**: Auto-generated API documentation
- **UI**: Interactive API explorer at `/api`

## Development Tools

### Testing
- **Framework**: Jest 30.0.0
- **TypeScript**: `ts-jest` 29.2.5
- **E2E**: Supertest 7.0.0
- **Types**: `@types/jest` 30.0.0
- **Config**: `jest-e2e.json` for E2E tests

### Code Quality
- **Linter**: ESLint 9.18.0
  - `@eslint/js` 9.18.0
  - `@eslint/eslintrc` 3.2.0
  - `typescript-eslint` 8.20.0
  - `eslint-plugin-prettier` 5.2.2
  - `eslint-config-prettier` 10.0.1
- **Formatter**: Prettier 3.4.2
- **Config**: `eslint.config.mjs`, `.prettierrc`

### Build Tools
- **Compiler**: TypeScript Compiler (tsc)
- **Loader**: `ts-loader` 9.5.2
- **Node Execution**: `ts-node` 10.9.2
- **Path Resolution**: `tsconfig-paths` 4.2.0
- **Source Maps**: `source-map-support` 0.5.21

### Containerization
- **Docker**: Dockerfile for containerization
- **Compose**: `docker-compose.yml` for local development
- **PostgreSQL**: Containerized database

## Dependencies Overview

### Production Dependencies
```json
{
  "@fastify/cookie": "^11.0.2",
  "@fastify/static": "^8.3.0",
  "@nestjs/common": "^11.0.1",
  "@nestjs/core": "^11.0.1",
  "@nestjs/jwt": "^11.0.1",
  "@nestjs/passport": "^11.0.5",
  "@nestjs/platform-fastify": "^11.1.8",
  "@nestjs/swagger": "^11.2.1",
  "@prisma/client": "^6.19.0",
  "bcrypt": "^6.0.0",
  "nestjs-zod": "^5.0.1",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "reflect-metadata": "^0.2.2",
  "rxjs": "^7.8.1",
  "zod": "^4.1.12"
}
```

### Development Dependencies
```json
{
  "@nestjs/cli": "^11.0.0",
  "@nestjs/schematics": "^11.0.0",
  "@nestjs/testing": "^11.0.1",
  "@types/bcrypt": "^6.0.0",
  "@types/jest": "^30.0.0",
  "@types/node": "^22.10.7",
  "@types/passport-jwt": "^4.0.1",
  "eslint": "^9.18.0",
  "jest": "^30.0.0",
  "prettier": "^3.4.2",
  "prisma": "^6.19.0",
  "typescript": "^5.7.3"
}
```

## Development Commands

### Installation
```bash
npm install                    # Install all dependencies
```

### Development
```bash
npm run dev                    # Start development server with watch mode
npm run start                  # Start server (no watch)
npm run start:debug            # Start with debugger
```

### Build
```bash
npm run build                  # Compile TypeScript to JavaScript
npm run start:prod             # Run production build
```

### Code Quality
```bash
npm run lint                   # Run ESLint with auto-fix
npm run format                 # Format code with Prettier
```

### Testing
```bash
npm run test                   # Run unit tests
npm run test:watch             # Run tests in watch mode
npm run test:cov               # Run tests with coverage
npm run test:debug             # Run tests with debugger
npm run test:e2e               # Run end-to-end tests
```

### Database
```bash
npx prisma migrate dev         # Create and apply migration
npx prisma migrate deploy      # Apply migrations (production)
npx prisma migrate status      # Check migration status
npx prisma studio              # Open Prisma Studio GUI
npx prisma generate            # Generate Prisma Client
npx prisma db push             # Push schema without migration
npx prisma db seed             # Run seed script
```

### NestJS CLI
```bash
nest generate module <name>    # Generate module
nest generate controller <name> # Generate controller
nest generate service <name>   # Generate service
nest generate resource <name>  # Generate complete CRUD resource
```

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT
JWT_SECRET="your-secret-key-min-32-characters"
JWT_EXPIRES_IN="7d"

# Server
PORT=3333
NODE_ENV="development"

# CORS (optional)
CORS_ORIGIN="http://localhost:3000"
```

## Build Output
- **Directory**: `dist/`
- **Entry Point**: `dist/main.js`
- **Source Maps**: Generated for debugging
- **Module System**: CommonJS

## IDE Support
- **VSCode**: Recommended with TypeScript and ESLint extensions
- **Type Checking**: Real-time via TypeScript language server
- **Debugging**: Launch configurations for Node.js debugging
