# Auth0 HIPAA-Compliant Setup Guide

## 1. Create Auth0 Account & Application

### Account Setup:
1. Go to https://auth0.com and create account
2. **IMPORTANT**: Contact Auth0 sales to enable HIPAA compliance features
3. Request Business Associate Agreement (BAA) - required for HIPAA

### Application Configuration:
1. Create new "Single Page Application" for frontend
2. Create new "Machine to Machine Application" for backend API
3. Configure these settings for HIPAA compliance:

```json
{
  "name": "EmageSmile-Frontend",
  "app_type": "spa",
  "callbacks": [
    "http://localhost:3000/callback",
    "https://yourdomain.com/callback"
  ],
  "logout_urls": [
    "http://localhost:3000",
    "https://yourdomain.com"
  ],
  "web_origins": [
    "http://localhost:3000",
    "https://yourdomain.com"
  ],
  "grant_types": ["authorization_code", "refresh_token"],
  "token_endpoint_auth_method": "none"
}
```

## 2. HIPAA Security Settings

### Password Policy (Admin → Security → Password Policy):
```json
{
  "length": {
    "min": 12,
    "max": 128
  },
  "strength": "excellent",
  "history": 5,
  "no_personal_info": true
}
```

### Session Management:
- Absolute session timeout: 8 hours
- Inactivity timeout: 30 minutes
- Force logout on browser close: enabled

### MFA Configuration:
1. Go to Security → Multi-factor Auth
2. Enable "Google Authenticator" and "SMS"
3. Set MFA policy to "Always" for all users
4. Configure trusted devices: 30 days max

## 3. Custom Database Connection (for existing users)

Since you have existing users in Supabase, we'll create a custom database connection:

```javascript
// Login Script (Auth0 Dashboard → Database Connections → Custom Database)
function login(email, password, callback) {
  const supabase = require('@supabase/supabase-js');
  const bcrypt = require('bcryptjs');
  
  const supabaseUrl = configuration.SUPABASE_URL;
  const supabaseKey = configuration.SUPABASE_SERVICE_ROLE_KEY;
  const client = supabase.createClient(supabaseUrl, supabaseKey);
  
  client
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
    .then(({ data: user, error }) => {
      if (error || !user) {
        return callback(new WrongUsernameOrPasswordError(email));
      }
      
      bcrypt.compare(password, user.password_hash, (err, isValid) => {
        if (err || !isValid) {
          return callback(new WrongUsernameOrPasswordError(email));
        }
        
        callback(null, {
          user_id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          app_metadata: {
            practice_id: user.practice_id,
            role: user.role
          }
        });
      });
    });
}
```

## 4. Environment Variables Needed

Add these to your `.env` files:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-spa-client-id
AUTH0_CLIENT_SECRET=your-spa-client-secret
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_M2M_CLIENT_ID=your-m2m-client-id
AUTH0_M2M_CLIENT_SECRET=your-m2m-client-secret

# HIPAA Compliance
AUTH0_SESSION_TIMEOUT=28800  # 8 hours
AUTH0_INACTIVITY_TIMEOUT=1800  # 30 minutes
```

## 5. Next Steps

After Auth0 setup:
1. Install Auth0 SDKs in frontend/backend
2. Replace current JWT system
3. Implement MFA flows
4. Add session management
5. Test authentication flows

## 6. HIPAA Compliance Checklist

- [ ] BAA signed with Auth0
- [ ] Strong password policy configured
- [ ] MFA enabled for all users
- [ ] Session timeouts configured
- [ ] Audit logging enabled
- [ ] Data encryption in transit/rest
- [ ] User access controls implemented