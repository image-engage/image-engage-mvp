# Auth0 Local Development Setup

## Quick Start (5 minutes)

### 1. Create Free Auth0 Account
1. Go to https://auth0.com/signup
2. Choose "Personal" (free tier)
3. Select region closest to you

### 2. Create Application
1. Dashboard → Applications → Create Application
2. Name: "EmageSmile Local"
3. Type: "Single Page Web Applications"
4. Click "Create"

### 3. Configure Application Settings
In your new application settings:

**Allowed Callback URLs:**
```
http://localhost:3000/callback
```

**Allowed Logout URLs:**
```
http://localhost:3000
```

**Allowed Web Origins:**
```
http://localhost:3000
```

**Save Changes**

### 4. Create API
1. Dashboard → APIs → Create API
2. Name: "EmageSmile API"
3. Identifier: `https://emage-smile-local.com/api`
4. Signing Algorithm: RS256
5. Click "Create"

### 5. Environment Variables

**Frontend (.env):**
```bash
NEXT_PUBLIC_AUTH0_DOMAIN=dev-xxxxxxxx.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_AUTH0_AUDIENCE=https://emage-smile-local.com/api
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001
```

**Backend (.env):**
```bash
AUTH0_DOMAIN=dev-xxxxxxxx.us.auth0.com
AUTH0_AUDIENCE=https://emage-smile-local.com/api
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 6. Test Setup
```bash
# Install dependencies
npm install

# Start both servers
npm run dev  # in both frontend/ and backend/ directories
```

## Optional: Enable MFA for Testing

1. Dashboard → Security → Multi-factor Auth
2. Enable "Google Authenticator"
3. Set Policy to "Always" (for testing)

## No HIPAA BAA Needed for Development
- Free tier works for local development
- HIPAA compliance only needed for production
- All security features available in free tier

## Ready in 5 Minutes!
Your local Auth0 setup will be fully functional for development and testing.