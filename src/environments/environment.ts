export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'ws://localhost:8080/ws',
  
  // Fyers OAuth Configuration
  fyersAppId: '0LJ7WSSBAY-100',
  fyersClientId: 'WWRBNF6CEE',
  fyersSecretId: 'WWRBNF6CEE',  // Note: Keep this secure in production!
  fyersRedirectUri: 'http://localhost:4200/auth/fyers/callback',
  fyersAuthUrl: 'https://api-t1.fyers.in/api/v3/generate-authcode',
  
  // Fyers API Endpoints
  fyersApiBaseUrl: 'https://api-t1.fyers.in/api/v3',
  fyersDataBaseUrl: 'https://api-t1.fyers.in/data'
};
