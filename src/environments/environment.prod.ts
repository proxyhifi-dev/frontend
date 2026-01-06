export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api',
  wsUrl: 'wss://api.yourdomain.com/ws',
  
  // Fyers OAuth Configuration (Production)
  fyersAppId: '0LJ7WSSBAY-100',
  fyersClientId: 'WWRBNF6CEE',
  fyersSecretId: 'WWRBNF6CEE',  // TODO: Use environment variable in production!
  fyersRedirectUri: 'https://yourdomain.com/auth/fyers/callback',
  fyersAuthUrl: 'https://api.fyers.in/api/v3/generate-authcode',  // Production URL (remove -t1)
  
  // Fyers API Endpoints (Production)
  fyersApiBaseUrl: 'https://api.fyers.in/api/v3',
  fyersDataBaseUrl: 'https://api.fyers.in/data'
};
