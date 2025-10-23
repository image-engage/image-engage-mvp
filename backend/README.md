# EmageSmile AI Backend API

A comprehensive Node.js/TypeScript backend API for the EmageSmile dental practice platform.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Patient Consent Management**: CRUD operations for patient consent forms
- **Media Upload & Management**: File upload with image optimization and video support
- **Analytics & Reporting**: Dashboard statistics and procedure analytics
- **Database Integration**: PostgreSQL with Supabase
- **File Storage**: Local file system with organized directory structure
- **Security**: Helmet, CORS, input validation, and SQL injection protection

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer with Sharp for image processing
- **Validation**: Joi
- **Security**: Helmet, CORS
- **Development**: Nodemon, ts-node

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- Environment variables configured

### Installation

1. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file with:
   - Supabase credentials
   - JWT secret
   - File upload settings

3. **Database Setup**:
   - Run the migration script in `src/database/migrations/001_initial_schema.sql`
   - This creates all necessary tables and security policies

4. **Create Upload Directories**:
   ```bash
   mkdir -p uploads/before uploads/after
   ```

### Development

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Patient Consents
- `GET /api/consents` - List all consents (with pagination & search)
- `GET /api/consents/:id` - Get specific consent
- `POST /api/consents` - Create new consent
- `PUT /api/consents/:id` - Update consent
- `DELETE /api/consents/:id` - Delete consent

### Media Management
- `GET /api/media` - List media files (with filters)
- `GET /api/media/:id` - Get specific media file
- `POST /api/media/upload` - Upload media files
- `DELETE /api/media/:id` - Delete media file
- `GET /api/media/download/:id` - Download media file

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/procedures` - Procedure type analytics
- `GET /api/analytics/monthly-trends` - Monthly consent trends

## Database Schema

### Users Table
- User authentication and profile information
- Role-based access control (admin/staff)

### Patient Consents Table
- Patient information and consent details
- Digital signature storage
- Procedure type and notes

### Patient Media Table
- Media file metadata and organization
- Before/after categorization
- File path and size tracking

## File Upload System

### Supported Formats
- **Images**: JPEG, PNG, GIF, WebP
- **Videos**: MP4, AVI, MOV, WMV

### Features
- Automatic image optimization with Sharp
- Organized directory structure (`uploads/before/`, `uploads/after/`)
- File size limits and validation
- Unique filename generation

### Directory Structure
```
uploads/
├── before/
│   ├── uuid-filename.jpg
│   └── uuid-filename.mp4
└── after/
    ├── uuid-filename.jpg
    └── uuid-filename.mp4
```

## Security Features

- **Authentication**: JWT tokens with expiration
- **Authorization**: Role-based access control
- **Input Validation**: Joi schema validation
- **File Security**: MIME type validation, size limits
- **Database Security**: Parameterized queries, RLS policies
- **HTTP Security**: Helmet middleware, CORS configuration

## Error Handling

Comprehensive error handling with:
- Validation errors
- Authentication/authorization errors
- File upload errors
- Database errors
- Generic server errors

## Development Guidelines

### Code Organization
- Routes in `/routes` directory
- Middleware in `/middleware` directory
- Database config in `/config` directory
- Types in `/types` directory

### Best Practices
- TypeScript for type safety
- Async/await for asynchronous operations
- Proper error handling and logging
- Input validation on all endpoints
- Consistent API response format

## Deployment

### Environment Variables
Ensure all required environment variables are set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `PORT`
- `NODE_ENV`

### File Storage
- Ensure upload directories exist and have proper permissions
- Consider cloud storage for production deployments
- Implement backup strategies for uploaded files

### Database
- Run migrations on production database
- Set up proper backup and monitoring
- Configure connection pooling for high traffic

## Monitoring & Logging

- Request logging with Morgan
- Error logging to console
- Health check endpoint at `/health`
- Performance monitoring recommended

## Contributing


1. Follow TypeScript best practices
2. Add proper error handling
3. Include input validation
4. Write comprehensive tests
5. Update documentation

## License

MIT License - see LICENSE file for details