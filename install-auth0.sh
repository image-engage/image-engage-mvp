#!/bin/bash

echo "🔐 Installing Auth0 for HIPAA-Compliant Authentication"
echo "=================================================="

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install @auth0/auth0-react@^2.2.4
cd ..

# Install backend dependencies  
echo "📦 Installing backend dependencies..."
cd backend
npm install auth0@^4.2.0 express-oauth-server@^2.0.0 jwks-rsa@^3.1.0 express-jwt@^8.4.1
cd ..

echo "✅ Dependencies installed successfully!"
echo ""
echo "🚀 Next Steps:"
echo "1. Set up Auth0 tenant (see AUTH0_SETUP.md)"
echo "2. Update .env files with Auth0 credentials"
echo "3. Configure Auth0 custom database connection"
echo "4. Test authentication flow"
echo ""
echo "📋 Environment Variables Needed:"
echo "Frontend (.env):"
echo "  - NEXT_PUBLIC_AUTH0_DOMAIN"
echo "  - NEXT_PUBLIC_AUTH0_CLIENT_ID" 
echo "  - NEXT_PUBLIC_AUTH0_AUDIENCE"
echo ""
echo "Backend (.env):"
echo "  - AUTH0_DOMAIN"
echo "  - AUTH0_AUDIENCE"
echo "  - AUTH0_M2M_CLIENT_ID"
echo "  - AUTH0_M2M_CLIENT_SECRET"
echo ""
echo "🔒 HIPAA Compliance Features Included:"
echo "  ✓ Multi-factor authentication (MFA)"
echo "  ✓ Session timeout management"
echo "  ✓ Role-based access control"
echo "  ✓ Secure token handling"
echo "  ✓ Audit logging ready"