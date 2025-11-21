# Product Overview - Formaly Backend

## Purpose
Formaly Backend is a REST API for a SaaS form builder platform that enables users to create, manage, and collect responses from online forms. Built with NestJS, Fastify, and Prisma, it provides a robust backend for form creation, authentication, response collection, and analytics.

## Value Proposition
- **Multi-tenant SaaS**: Support for multiple users with OAuth authentication (Google, GitHub, Facebook)
- **Form Builder API**: Complete CRUD operations for dynamic form creation with various field types
- **Public Form Sharing**: Generate unique links for forms that can be accessed without authentication
- **Response Management**: Collect, store, and retrieve form submissions with analytics
- **Security**: Password-protected forms, JWT authentication, and proper data validation
- **Performance**: Built on Fastify for high-performance HTTP handling

## Key Features

### 1. Authentication & User Management
- Multi-provider OAuth authentication (Google, GitHub, Facebook)
- JWT-based session management
- User account synchronization across providers
- Secure password hashing with bcrypt

### 2. Form Management (Authenticated)
- Create forms with customizable fields
- Edit and update existing forms
- Clone forms for reuse
- Delete forms (hard delete with cascade)
- Set form status (active/inactive)
- Configure form settings (max responses, expiration, multiple submissions)

### 3. Form Builder Capabilities
- **Field Types**: text, email, phone, textarea, number, date, select, radio, checkbox, file
- **Field Configuration**: labels, placeholders, validation rules, required fields
- **Dynamic Options**: Support for select/radio/checkbox with custom options
- **Field Validation**: Built-in validation with Zod schemas

### 4. Public Form Access
- Unique form URLs for public access
- Password protection for sensitive forms
- View tracking with fingerprinting
- IP-based submission control
- Form expiration and response limits

### 5. Response Collection
- Store form submissions with metadata (IP, user agent, timestamps)
- Support for multiple submissions per user (configurable)
- Normalized data storage (separate tables for submissions and field values)
- JSON-based value storage for flexibility

### 6. Dashboard & Analytics
- Form statistics and KPIs
- View counts and submission tracking
- Recent forms listing
- Response aggregation

## Target Users

### Primary Users
- **Form Creators**: Users who need to create and manage online forms for various purposes
- **Business Owners**: Companies collecting customer feedback, registrations, or surveys
- **Developers**: Teams integrating form functionality into their applications

### Use Cases
1. **Customer Registration**: Collect new customer information
2. **Surveys & Feedback**: Gather user opinions and feedback
3. **Event Registration**: Manage event sign-ups
4. **Contact Forms**: Provide contact methods on websites
5. **Data Collection**: Structured data gathering for research or business needs
6. **Lead Generation**: Capture potential customer information

## Technical Highlights
- **Clean Architecture**: Separation of concerns with Controller → Service → Repository pattern
- **Type Safety**: Full TypeScript with strict mode and Zod validation
- **Database**: PostgreSQL with Prisma ORM for type-safe queries
- **API Documentation**: Swagger/OpenAPI integration
- **Scalability**: Designed for multi-tenant SaaS deployment
- **Learning Project**: Implements best practices for backend development education
