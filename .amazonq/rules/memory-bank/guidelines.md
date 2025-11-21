# Development Guidelines - Formaly Backend

## Code Quality Standards

### File Organization
- **One class per file**: Each service, controller, repository, or exception class in its own file
- **Descriptive filenames**: Use kebab-case matching the class name (e.g., `forms.service.ts`, `app.exceptions.ts`)
- **Grouped exports**: Related exceptions or types grouped in single files for convenience
- **Index files**: Not used - explicit imports preferred for clarity

### Code Formatting
- **Indentation**: 2 spaces (enforced by Prettier)
- **Line length**: Soft limit of 80-100 characters
- **Semicolons**: Required at end of statements
- **Quotes**: Single quotes for strings
- **Trailing commas**: Used in multi-line objects/arrays
- **Import organization**: 
  1. External packages (`@nestjs/*`, third-party)
  2. Internal modules (`@/common/*`, `@/modules/*`)
  3. Types and interfaces
  4. Blank line between groups

### Naming Conventions
- **Classes**: PascalCase (e.g., `FormsService`, `PublicFormsService`)
- **Interfaces**: PascalCase with descriptive names (e.g., `JwtPayload`, `AuthResponse`)
- **Functions/Methods**: camelCase with verb prefixes (e.g., `findOne`, `validatePassword`, `generateToken`)
- **Variables**: camelCase (e.g., `userId`, `formData`, `accessToken`)
- **Constants**: UPPER_SNAKE_CASE for true constants (e.g., `ErrorCode` enum values)
- **Private methods**: camelCase with `private` keyword (e.g., `private generateFingerprint()`)
- **DTOs**: PascalCase ending with `Dto` (e.g., `CreateFormDto`, `SubmitResponseDto`)
- **Exceptions**: PascalCase ending with `Exception` (e.g., `FormNotFoundException`)

### Documentation Standards
- **JSDoc comments**: Used for complex classes and public APIs
- **Inline comments**: Minimal - code should be self-documenting
- **Section separators**: Used in exception files with `// ==================== SECTION ====================`
- **Portuguese messages**: User-facing error messages in Portuguese
- **English code**: All code, variables, and technical comments in English

## Architectural Patterns

### Clean Architecture Implementation

#### Service Layer Pattern (5/5 files)
```typescript
@Injectable()
export class FormsService {
  constructor(private readonly formsRepository: FormsRepository) {}

  async create(dto: CreateFormDto, userId: string): Promise<Form> {
    // Business logic here
    const formData: Prisma.FormCreateInput = { /* ... */ };
    return this.formsRepository.create(formData);
  }
}
```

**Key characteristics:**
- Services contain ALL business logic
- Constructor injection with `private readonly` for dependencies
- Methods are async and return typed Promises
- DTOs used for input validation
- Repositories called for data access
- Custom exceptions thrown for error cases

#### Exception Handling Pattern (5/5 files)
```typescript
export class FormNotFoundException extends NotFoundException {
  constructor(formId?: string) {
    const message = formId
      ? `Formulário ${formId} não encontrado`
      : ErrorMessages[ErrorCode.FORM_NOT_FOUND];
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message,
      error: ErrorCode.FORM_NOT_FOUND,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}
```

**Key characteristics:**
- Extend NestJS built-in exceptions
- Structured error responses with `ErrorResponse` interface
- Error codes from centralized `ErrorCode` enum
- Optional contextual parameters (e.g., `formId`)
- Consistent timestamp inclusion
- Portuguese user-facing messages

#### Dependency Injection Pattern (5/5 files)
```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly jwtService: JwtService,
  private readonly usersRepository: UsersRepository,
) {}
```

**Key characteristics:**
- Constructor injection exclusively
- `private readonly` for all injected dependencies
- Multiple dependencies injected as needed
- No manual instantiation with `new`
- Services, repositories, and Prisma injected

### Data Access Patterns

#### Prisma Query Pattern (4/5 files)
```typescript
const form = await this.prisma.form.findUnique({
  where: { id },
  include: {
    fields: true,
    password: true,
    _count: { select: { submissions: true } },
  },
});
```

**Key characteristics:**
- Direct Prisma client usage in services (no separate repository layer in some modules)
- `include` for relations
- `_count` for aggregations
- Type-safe queries with Prisma types
- Async/await for all database operations

#### Validation Before Action Pattern (5/5 files)
```typescript
if (!form) {
  throw new FormNotFoundException(id);
}

if (form.status === 'INACTIVE') {
  throw new FormInactiveException();
}

if (form.expiresAt && form.expiresAt < new Date()) {
  throw new FormExpiredException();
}
```

**Key characteristics:**
- Check existence first
- Validate business rules sequentially
- Throw specific exceptions immediately
- Early returns for error cases
- Guard clauses pattern

### Security Patterns

#### Password Hashing Pattern (3/5 files)
```typescript
// Hashing
const passwordHash = await bcrypt.hash(dto.password, 10);

// Comparison
const isValid = await bcrypt.compare(password, form.password.hash);
if (!isValid) {
  throw new FormPasswordInvalidException();
}
```

**Key characteristics:**
- bcrypt with cost factor 10
- Async operations for hashing and comparison
- Immediate exception on invalid password
- Never expose password hashes in responses

#### Data Sanitization Pattern (3/5 files)
```typescript
const { password, ...userWithoutPassword } = user;
return {
  user: userWithoutPassword,
  accessToken,
};
```

**Key characteristics:**
- Destructuring to remove sensitive fields
- Return sanitized objects
- Never include password in responses
- Explicit field selection in responses

#### Fingerprinting Pattern (1/5 files)
```typescript
private generateFingerprint(ip?: string, userAgent?: string): string {
  const data = `${ip || 'unknown'}-${userAgent || 'unknown'}`;
  return createHash('sha256').update(data).digest('hex');
}
```

**Key characteristics:**
- SHA-256 hashing for anonymization
- Combine IP and user agent
- Handle undefined values gracefully
- Private utility method

### Business Logic Patterns

#### Ownership Validation Pattern (2/5 files)
```typescript
async findOne(id: string, userId: string): Promise<Form> {
  const form = await this.formsRepository.findById(id);
  
  if (!form) {
    throw new FormNotFoundException(id);
  }
  
  if (form.userId !== userId) {
    throw new FormUnauthorizedException();
  }
  
  return form;
}
```

**Key characteristics:**
- Check existence before ownership
- Compare userId from token with resource owner
- Throw specific authorization exception
- Reuse in other methods (e.g., `update`, `remove`)

#### Conditional Resource Creation Pattern (3/5 files)
```typescript
if (dto.password) {
  formData.password = {
    create: {
      hash: await bcrypt.hash(dto.password, 10),
    },
  };
}
```

**Key characteristics:**
- Optional nested resource creation
- Conditional based on DTO fields
- Prisma nested create syntax
- Hash sensitive data before storage

#### Upsert Pattern (2/5 files)
```typescript
await this.prisma.formView.upsert({
  where: {
    formId_fingerprint: {
      formId: id,
      fingerprint,
    },
  },
  create: { formId: id, fingerprint },
  update: {},
});
```

**Key characteristics:**
- Composite key in where clause
- Create if not exists
- Empty update to avoid duplicates
- Idempotent operations

#### Parallel Query Pattern (2/5 files)
```typescript
const [forms, total] = await Promise.all([
  this.formsRepository.findByUserId(userId, skip, limit),
  this.formsRepository.countByUserId(userId),
]);
```

**Key characteristics:**
- `Promise.all` for independent queries
- Array destructuring for results
- Improves performance
- Used for pagination data

### Type Safety Patterns

#### Prisma Type Usage Pattern (3/5 files)
```typescript
const formData: Prisma.FormCreateInput = {
  user: { connect: { id: userId } },
  name: dto.name,
  // ...
};

const updateData: Prisma.FormUpdateInput = {
  name: dto.name,
  // ...
};
```

**Key characteristics:**
- Use Prisma-generated types for data operations
- `Prisma.ModelCreateInput` for creation
- `Prisma.ModelUpdateInput` for updates
- Type-safe nested operations

#### Interface Definition Pattern (2/5 files)
```typescript
interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
}
```

**Key characteristics:**
- Interfaces for structured data
- `Omit` utility type for excluding fields
- Export public interfaces
- Keep private interfaces local

#### Enum for Constants Pattern (1/5 files)
```typescript
export enum ErrorCode {
  INVALID_CREDENTIALS = 'AUTH_1001',
  TOKEN_EXPIRED = 'AUTH_1002',
  FORM_NOT_FOUND = 'FORM_3001',
  // ...
}
```

**Key characteristics:**
- String enums for error codes
- Categorized with prefixes (AUTH_, FORM_, etc.)
- Numeric suffixes for uniqueness
- Centralized in types file

#### Type Casting Pattern (2/5 files)
```typescript
config: (field.config || {}) as Prisma.JsonObject,
value: value as Prisma.InputJsonValue,
```

**Key characteristics:**
- Cast to Prisma JSON types when needed
- Provide default empty object
- Used for flexible JSON fields
- Type assertion with `as`

## Common Code Idioms

### Error Response Structure (5/5 files)
```typescript
super({
  statusCode: HttpStatus.NOT_FOUND,
  message: errorMessage,
  error: ErrorCode.FORM_NOT_FOUND,
  timestamp: new Date().toISOString(),
} as ErrorResponse);
```

### Null Coalescing for Defaults (3/5 files)
```typescript
const data = `${ip || 'unknown'}-${userAgent || 'unknown'}`;
```

### Array Filtering and Mapping (2/5 files)
```typescript
const requiredFields = form.fields.filter((f) => f.required);
const missingFields = requiredFields.filter(
  (field) => dto.values[field.name] === undefined || 
             dto.values[field.name] === null || 
             dto.values[field.name] === '',
);
```

### Object Entries Transformation (1/5 files)
```typescript
Object.entries(dto.values)
  .filter(([key]) => form.fields.some((f) => f.name === key))
  .map(([key, value]) => {
    const field = form.fields.find((f) => f.name === key)!;
    return { fieldId: field.id, type: field.type, value };
  })
```

### Conditional Nested Updates (2/5 files)
```typescript
...(dto.fields && {
  fields: {
    deleteMany: {},
    create: dto.fields.map((field) => ({ /* ... */ })),
  },
}),
```

## Frequently Used Annotations

### NestJS Decorators
- `@Injectable()` - Mark classes as providers (5/5 files)
- `@Module()` - Define modules (not in analyzed files, but standard)
- `@Controller()` - Define controllers (not in analyzed files, but standard)

### Method Decorators
- `async` - All database and business logic methods (5/5 files)
- `private` - Utility methods not exposed publicly (2/5 files)

### Type Annotations
- `: Promise<Type>` - Explicit return types for async methods (5/5 files)
- `: Type` - Explicit parameter types (5/5 files)
- `?: Type` - Optional parameters (5/5 files)

## Best Practices Summary

### DO
✅ Use constructor injection with `private readonly`
✅ Throw custom exceptions for business errors
✅ Validate existence before operations
✅ Check ownership for protected resources
✅ Use Prisma types for type safety
✅ Hash passwords with bcrypt (cost 10)
✅ Remove sensitive data from responses
✅ Use `Promise.all` for parallel queries
✅ Provide optional contextual parameters in exceptions
✅ Use descriptive error codes and messages
✅ Write async/await (never .then/.catch)
✅ Use early returns for error cases
✅ Validate required fields before processing

### DON'T
❌ Instantiate dependencies with `new`
❌ Use generic `Error` or `HttpException` directly
❌ Return null instead of throwing exceptions
❌ Expose passwords or tokens in responses
❌ Skip ownership validation
❌ Use `any` type
❌ Perform business logic in controllers
❌ Access database outside services/repositories
❌ Forget to handle optional parameters
❌ Use synchronous bcrypt methods
❌ Skip validation of business rules
❌ Nest try-catch blocks unnecessarily

## Testing Patterns (Not in analyzed files)
While not present in the analyzed files, the project structure indicates:
- Unit tests with Jest
- E2E tests with Supertest
- Test files colocated with source (`.spec.ts`)
- Mocking of dependencies for isolation
