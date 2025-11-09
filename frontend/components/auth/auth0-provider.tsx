'use client';

import { Auth0Provider } from '@auth0/auth0-react';
import { ReactNode } from 'react';

interface Auth0ProviderWrapperProps {
  children: ReactNode;
}

export default function Auth0ProviderWrapper({ children }: Auth0ProviderWrapperProps) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN!;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE!;

  if (!domain || !clientId || !audience) {
    throw new Error('Auth0 configuration is missing. Please check your environment variables.');
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin + '/callback' : '',
        audience: audience,
        scope: 'openid profile email read:current_user update:current_user_metadata'
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      // HIPAA Compliance: Session management
      sessionCheckExpiryDays={1}
    >
      {children}
    </Auth0Provider>
  );
}