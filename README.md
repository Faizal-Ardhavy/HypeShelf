# HypeShelf

A shared recommendations hub for discovering and sharing favorite movies, books, music, and other media.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Convex](https://img.shields.io/badge/Convex-FF6F00?style=flat&logo=convex&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=flat&logo=clerk&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [RBAC Implementation](#rbac-implementation)
- [Security Considerations](#security-considerations)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## Overview

HypeShelf is a full-stack web application for creating, sharing, and discovering recommendations across various categories (movies, books, music, games, etc.). Built as a take-home assignment demonstrating:

- Clean code structure with TypeScript
- Security-focused development with input validation and RBAC
- Loading states, error handling, and user feedback mechanisms
- Real-time data synchronization with Convex
- Authentication via Clerk

---

## Features

### Public Page (Non-Authenticated Users)
- View latest recommendations without signing in
- Filter recommendations by genre
- Read-only access

### Authenticated Users
- Add new recommendations (title, genre, link, description)
- Edit and delete own recommendations
- View author information on all recommendations
- Real-time updates when data changes
- Character count indicators (title: 200, description: 500)
- Genre dropdown with predefined options

### Admin Features (First User)
- Delete any recommendation (not just own)
- Mark recommendations as "Staff Pick"
- Full moderation capabilities

### User Experience
- Toast notifications (Sonner)
- Modal confirmation for destructive actions
- Loading states on all async operations
- Error boundaries for runtime errors
- Database timeout/error handling with retry
- Relative timestamps ("2 hours ago")
- Character counters with visual warnings
- Responsive design

---

## Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications

### Backend & Auth
- **[Convex](https://www.convex.dev/)** - Real-time database and backend
- **[Clerk](https://clerk.com/)** - Authentication and user management

### Tooling
- **ESLint** - Code linting
- **PostCSS** - CSS processing

---

## Getting Started

### Prerequisites
- **Node.js** 18+ and npm/pnpm/yarn
- **Clerk account** ([sign up free](https://clerk.com/))
- **Convex account** ([sign up free](https://www.convex.dev/))

### 1. Clone the Repository
```bash
git clone https://github.com/Faizal-Ardhavy/HypeShelf.git
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
# or
yarn install
```

### 3. Set Up Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Copy your **Publishable Key**
4. Create `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 4. Set Up Convex

1. Run Convex setup:
```bash
npx convex dev
```

2. Follow the prompts to create a Convex account
3. The URL will be automatically added to `.env.local`:
```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

4. Set Clerk configuration in Convex:
```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://your-clerk-domain.clerk.accounts.dev"
```

**To find your Clerk domain:**
- Go to Clerk Dashboard → API Keys
- Look for "Issuer" under JWT Templates
- Example: `https://ready-akita-25.clerk.accounts.dev`

### 5. Run the Development Server

**Terminal 1 - Next.js:**
```bash
npm run dev
```

**Terminal 2 - Convex:**
```bash
npx convex dev
```

### 6. Open the App
Navigate to [http://localhost:3000](http://localhost:3000)

---

## Architecture

### Tech Stack Rationale

#### Why Next.js App Router?
- **Server Components**: Better performance with less client-side JavaScript
- **Modern routing**: File-based routing with layouts
- **Production-ready**: Built-in optimizations (image optimization, code splitting)
- **TypeScript-first**: Excellent DX with type safety

#### Why Convex?
- **Real-time by default**: Instant UI updates when data changes
- **Type-safe**: Generated TypeScript types from schema
- **Backend logic**: No separate API routes needed
- **Built-in auth**: Easy integration with Clerk
- **Optimistic updates**: Better UX with automatic rollback on errors

#### Why Clerk?
- **Quick setup**: Authentication in minutes
- **Secure**: Industry-standard JWT tokens
- **UI components**: Pre-built sign-in/sign-up flows
- **User management**: Built-in user dashboard
- **Free tier**: Generous for side projects

### Component Organization

```
app/
├── components/          # Reusable UI components
│   ├── AddRecommendationForm.tsx
│   ├── AuthButtons.tsx
│   ├── DBErrorHandler.tsx
│   ├── DeleteModal.tsx
│   └── ErrorBoundary.tsx
├── ConvexClientProvider.tsx
├── layout.tsx          # Root layout with providers
└── page.tsx            # Main home page

convex/
├── _generated/         # Auto-generated by Convex
├── modules/
│   ├── recommendations/
│   │   ├── mutation.ts  # Add, delete, toggle staff pick
│   │   └── query.ts     # Get recommendations with filters
│   └── users/
│       ├── mutation.ts  # Create/get user (role assignment)
│       └── query.ts     # Get current user, check admin
├── auth.config.js      # Clerk JWT configuration
├── constants.ts        # Roles, genres, validation, messages
├── schema.ts           # Database schema
└── types.ts            # TypeScript type definitions
```

### Database Schema

**Users Table:**
```typescript
users: {
  userId: string,      // Clerk user ID
  name: string,        // Display name
  email: string,       // Email address
  role: "admin" | "user"  // RBAC role
}
```

**Recommendations Table:**
```typescript
recommendations: {
  title: string,        // Recommendation title (1-200 chars)
  genre: string,        // Category (from predefined list)
  link: string,         // URL (validated HTTP/HTTPS)
  blurb: string,        // Description (1-500 chars)
  userId: string,       // Creator's Clerk ID
  authorName: string,   // Creator's name (denormalized)
  isStaffPick: boolean, // Admin-marked highlight
  _creationTime: number // Built-in Convex timestamp
}
```

**Indexes:**
- `by_userId` on users table for fast lookups

---

## RBAC Implementation

### The "First User = Admin" Pattern

**Decision Rationale:**
1. **Simplicity**: No complex admin assignment flow needed
2. **Security**: First user is typically the app owner/deployer
3. **Scalability**: New users automatically get appropriate permissions
4. **No backdoor**: Can't promote users without database access

### How It Works

#### 1. User Creation (`convex/modules/users/mutation.ts`)
```typescript
const totalUsers = await ctx.db.query("users").collect();
const isFirstUser = totalUsers.length === 0;

const role = isFirstUser ? ROLES.ADMIN : ROLES.USER;
```

**On first sign-in:**
- Check total user count
- If 0 → assign `admin` role
- Otherwise → assign `user` role
- Store in database

#### 2. Permission Checks

**Delete Recommendation:**
```typescript
// Admin can delete anything, users only their own
const isAdmin = userRecord.role === ROLES.ADMIN;
const isOwner = recommendation.userId === identity.subject;

if (!isAdmin && !isOwner) {
  throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
}
```

**Toggle Staff Pick:**
```typescript
// ONLY admins can toggle staff picks
if (!userRecord || userRecord.role !== ROLES.ADMIN) {
  throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
}
```

#### 3. UI Conditional Rendering

```typescript
// Show staff pick button only to admins
{currentUser?.role === "admin" && (
  <button onClick={handleToggleStaffPick}>
    Mark as Staff Pick
  </button>
)}

// Show delete button to admins or owners
{canDelete(rec) && (
  <button onClick={handleDelete}>Delete</button>
)}
```

### Role Capabilities Matrix

| Action | Admin | User | Public |
|--------|-------|------|--------|
| View recommendations | Yes | Yes | Yes |
| Filter by genre | Yes | Yes | Yes |
| Add recommendation | Yes | Yes | No |
| Edit own recommendation | Yes | Yes | No |
| Delete own recommendation | Yes | Yes | No |
| Delete any recommendation | Yes | No | No |
| Toggle staff pick | Yes | No | No |

---

## Security Considerations

### 1. Input Validation & Sanitization

**Backend Validation (`convex/modules/recommendations/mutation.ts`):**
```typescript
// Sanitize to prevent XSS
function sanitizeInput(input: string): string {
  return input.trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .substring(0, 2048);
}

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
```

**Validation Rules:**
- Title: 1-200 characters
- Description: 1-500 characters
- URL: Valid HTTP/HTTPS, max 2048 characters
- Genre: Must be from predefined list (no arbitrary input)

### 2. XSS Protection
- React escapes by default
- Additional sanitization removes `<script>` tags
- URL validation prevents `javascript:` protocol

### 3. Authentication & Authorization
- **Convex + Clerk JWT**: Industry-standard token-based auth
- **Server-side checks**: All mutations verify user identity
- **Role verification**: RBAC enforced at database level
- **No client-side trust**: UI hides buttons but backend validates

### 4. Error Message Safety
- Generic messages prevent information leakage
- "Authentication required" instead of "User not found"
- No database schema details exposed
- Stack traces only in console, not shown to users

### 5. Rate Limiting
Not implemented. Would require additional infrastructure:
- Convex doesn't have built-in rate limiting
- Consider Cloudflare or custom middleware for production

---

## Deployment

### Deploy to Vercel (Recommended)

#### 1. Deploy Next.js App
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### 2. Deploy Convex Backend
```bash
# From project root
npx convex deploy
```

#### 3. Set Environment Variables in Vercel
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_CONVEX_URL` (from `npx convex deploy` output)

#### 4. Configure Clerk for Production
- Go to Clerk Dashboard → Domains
- Add your Vercel domain
- Update allowed origins

#### 5. Update Convex Environment
```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://your-clerk-domain.clerk.accounts.dev" --prod
```

### Alternative: Deploy to Other Platforms

**Next.js can deploy to:**
- Netlify
- Railway
- AWS Amplify
- Any Node.js host

**Convex is platform-agnostic:**
- Backend stays on Convex cloud
- Just update `NEXT_PUBLIC_CONVEX_URL` environment variable

---

## Project Structure

```
HypeShelf/
├── app/
│   ├── components/
│   │   ├── AddRecommendationForm.tsx    # Form to add new recommendations
│   │   ├── AuthButtons.tsx              # Sign in/User button
│   │   ├── DBErrorHandler.tsx           # Database error handling utilities
│   │   ├── DeleteModal.tsx              # Delete confirmation modal
│   │   └── ErrorBoundary.tsx            # React error boundary
│   ├── ConvexClientProvider.tsx         # Convex + Clerk integration
│   ├── globals.css                      # Global styles
│   ├── layout.tsx                       # Root layout with providers
│   └── page.tsx                         # Main home page
│
├── convex/
│   ├── _generated/                      # Auto-generated types
│   ├── modules/
│   │   ├── recommendations/
│   │   │   ├── mutation.ts              # Add, delete, toggle staff pick
│   │   │   └── query.ts                 # Get recommendations with filters
│   │   └── users/
│   │       ├── mutation.ts              # Create/get user (role assignment)
│   │       └── query.ts                 # Get current user, check admin
│   ├── auth.config.js                   # Clerk JWT configuration
│   ├── constants.ts                     # App constants (roles, genres, etc.)
│   ├── schema.ts                        # Database schema definition
│   └── types.ts                         # TypeScript type definitions
│
├── public/                              # Static assets
├── .env.local                           # Environment variables (gitignored)
├── convex.json                          # Convex configuration
├── eslint.config.mjs                    # ESLint configuration
├── next.config.ts                       # Next.js configuration
├── package.json                         # Dependencies
├── postcss.config.mjs                   # PostCSS configuration
├── tailwind.config.ts                   # Tailwind CSS configuration
├── tsconfig.json                        # TypeScript configuration
└── README.md                            # This file
```

---

## Development Notes

### Environment Variables

**Required:**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CONVEX_URL=https://....convex.cloud
```

**Convex Environment (set via CLI):**
```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://your-clerk-domain.clerk.accounts.dev"
```

### Database Migrations

Convex handles schema changes automatically:
1. Update `convex/schema.ts`
2. Convex detects changes
3. Migrations applied automatically

**No manual migrations needed!**

### Testing Locally

**As First User (Admin):**
1. Clear Convex data: `npx convex data clear`
2. Sign in → You become admin
3. Test admin features (delete any, staff pick)

**As Regular User:**
1. Sign up with different account
2. Test user features (can only delete own)

---

## Additional Documentation

- [IMPROVEMENTS.md](IMPROVEMENTS.md) - Detailed list of all code quality improvements
- [DATABASE_ERROR_HANDLING.md](DATABASE_ERROR_HANDLING.md) - Error handling implementation details

---

## Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev/)
- [Clerk Documentation](https://clerk.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## License

This project is built as a take-home assignment and is free to use for educational purposes.

---

## Author

**Faizal Ardhavy**

- GitHub: [@Faizal-Ardhavy](https://github.com/Faizal-Ardhavy)
- Repository: [HypeShelf](https://github.com/Faizal-Ardhavy/HypeShelf)

---

## Acknowledgments

Built for Fluence take-home assignment demonstrating:
- Clean code structure with TypeScript
- Security-minded development (validation, RBAC, XSS protection)
- UX considerations (loading states, error handling, toast notifications)
- Comprehensive documentation and reasoning
