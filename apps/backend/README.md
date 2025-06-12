# Hymnal App Backend API

A comprehensive RESTful API for the Hymnal App, built with Node.js, Express, TypeScript, and Prisma ORM.

## Features

- 🔐 **JWT Authentication** with refresh tokens
- 📧 **Email Verification** using SendGrid
- 🔒 **Role-based Access Control** (Admin, Moderator, User)
- 📁 **File Storage** with AWS S3 integration
- 🎵 **Song Management** with search and filtering
- ⭐ **User Favorites** and preferences
- 📊 **View History** tracking
- 🛡️ **Security** with Helmet, CORS, and rate limiting
- 📝 **Input Validation** with Zod
- 🗄️ **PostgreSQL** database with Prisma ORM

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **File Storage**: AWS S3
- **Email Service**: SendGrid
- **Validation**: Zod
- **Security**: Helmet, CORS, bcrypt
- **Rate Limiting**: express-rate-limit

## Project Structure

```
src/
├── config/
│   └── database.ts          # Database configuration
├── controllers/
│   ├── authController.ts     # Authentication endpoints
│   ├── songController.ts     # Song management endpoints
│   ├── mediaController.ts    # Media file endpoints
│   └── userController.ts     # User preferences & favorites
├── middleware/
│   ├── auth.ts              # Authentication middleware
│   └── security.ts          # Security middleware
├── routes/
│   ├── auth.ts              # Authentication routes
│   ├── songs.ts             # Song routes
│   ├── media.ts             # Media routes
│   ├── users.ts             # User routes
│   └── index.ts             # Route aggregator
├── services/
│   ├── emailService.ts      # Email service
│   └── fileStorageService.ts # S3 file storage
├── utils/
│   └── auth.ts              # Auth utilities
├── prisma/
│   └── schema.prisma        # Database schema
└── index.ts                 # Main application entry
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hymnal_db"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Email Service (SendGrid)
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@yourdomain.com"
FRONTEND_URL="http://localhost:3000"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="your-s3-bucket-name"

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="audio/mpeg,audio/wav,image/jpeg,image/png,application/pdf"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up the database**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # (Optional) Seed the database
   npx prisma db seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/refresh-token` | Refresh access token | No |
| GET | `/verify-email` | Verify email address | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password | No |
| GET | `/profile` | Get user profile | Yes |

### Songs (`/api/v1/songs`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | Get songs (with filtering) | Optional | - |
| GET | `/search` | Search songs | Optional | - |
| GET | `/categories` | Get song categories | Optional | - |
| GET | `/:id` | Get song by ID | Optional | - |
| POST | `/` | Create song | Yes | Moderator+ |
| PUT | `/:id` | Update song | Yes | Moderator+ |
| DELETE | `/:id` | Delete song | Yes | Admin |

### Media (`/api/v1/media`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/upload` | Upload media file | Yes | Moderator+ |
| POST | `/upload-multiple` | Upload multiple files | Yes | Moderator+ |
| POST | `/generate-upload-url` | Generate upload URL | Yes | Moderator+ |
| GET | `/:id` | Get media file info | Optional | - |
| GET | `/:id/signed-url` | Get signed URL | Optional | - |
| GET | `/song/:songId` | Get song media files | Optional | - |
| DELETE | `/:id` | Delete media file | Yes | Moderator+ |

### Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/preferences` | Get user preferences | Yes |
| PUT | `/preferences` | Update preferences | Yes |
| GET | `/favorites` | Get user favorites | Yes |
| POST | `/favorites/:songId` | Add to favorites | Yes |
| DELETE | `/favorites/:songId` | Remove from favorites | Yes |
| GET | `/favorites/:songId/status` | Check favorite status | Yes |
| GET | `/history` | Get view history | Yes |
| DELETE | `/history` | Clear view history | Yes |
| GET | `/stats` | Get user statistics | Yes |

## Database Schema

The application uses the following main entities:

- **User**: User accounts with roles and preferences
- **Song**: Song information with lyrics and metadata
- **MediaFile**: Associated media files (audio, images, PDFs)
- **UserNote**: User-specific notes for songs
- **SongFavorite**: User favorite songs
- **Playlist**: User-created playlists
- **PlaylistSong**: Songs in playlists
- **UserPreferences**: User settings and preferences
- **ViewHistory**: Song view tracking

## Security Features

- **JWT Authentication** with access and refresh tokens
- **Password Hashing** using bcrypt
- **Rate Limiting** to prevent abuse
- **CORS Protection** with configurable origins
- **Security Headers** via Helmet
- **Input Validation** using Zod schemas
- **Role-based Access Control**
- **Email Verification** for new accounts

## File Upload

- **AWS S3 Integration** for file storage
- **File Type Validation** (audio, images, PDFs)
- **File Size Limits** (configurable)
- **Signed URLs** for secure access
- **Direct Upload URLs** for client-side uploads

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server

# Database
npx prisma generate  # Generate Prisma client
npx prisma migrate dev # Run migrations
npx prisma studio    # Open Prisma Studio

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

### API Testing

The API includes comprehensive documentation at `/api/v1` endpoint. You can also use tools like:

- **Postman**: Import the API collection
- **Thunder Client**: VS Code extension
- **curl**: Command line testing

### Health Check

Monitor API health at `/health` endpoint:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

## Production Deployment

1. **Environment Setup**:
   - Set `NODE_ENV=production`
   - Configure production database
   - Set up AWS S3 bucket
   - Configure SendGrid

2. **Database Migration**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Build and Start**:
   ```bash
   npm run build
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.