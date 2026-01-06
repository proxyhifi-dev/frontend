# Fyers OAuth Integration Guide

## ✅ Frontend Configuration Complete!

Your frontend is now fully configured with:
- **App ID**: `0LJ7WSSBAY-100`
- **Client ID**: `WWRBNF6CEE`
- **Secret ID**: `WWRBNF6CEE`
- **Redirect URI**: `http://localhost:4200/auth/fyers/callback`
- **Permissions**: Profile, Transactions, Orders, Market Data, Historical Data

---

## 🔧 Backend Configuration Required

Now you need to configure your **Java backend** to handle the Fyers OAuth flow.

### Step 1: Add Fyers Configuration to `application.yml`

```yaml
fyers:
  app-id: 0LJ7WSSBAY-100
  client-id: WWRBNF6CEE
  secret-id: WWRBNF6CEE
  redirect-uri: http://localhost:4200/auth/fyers/callback
  auth-url: https://api-t1.fyers.in/api/v3/generate-authcode
  token-url: https://api-t1.fyers.in/api/v3/validate-authcode
  api-base-url: https://api-t1.fyers.in/api/v3
  data-base-url: https://api-t1.fyers.in/data
```

### Step 2: Create Fyers Configuration Class

```java
package com.apex.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "fyers")
public class FyersConfig {
    private String appId;
    private String clientId;
    private String secretId;
    private String redirectUri;
    private String authUrl;
    private String tokenUrl;
    private String apiBaseUrl;
    private String dataBaseUrl;
}
```

### Step 3: Create Fyers OAuth Controller

```java
package com.apex.controller;

import com.apex.config.FyersConfig;
import com.apex.service.FyersAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth/fyers")
@RequiredArgsConstructor
public class FyersAuthController {

    private final FyersAuthService fyersAuthService;
    private final FyersConfig fyersConfig;

    @PostMapping("/callback")
    public ResponseEntity<?> handleCallback(@RequestBody Map<String, String> payload) {
        try {
            String authCode = payload.get("authCode");
            String clientId = payload.get("clientId");
            String secretId = payload.get("secretId");
            String redirectUri = payload.get("redirectUri");

            log.info("Received Fyers callback with auth code");

            // Validate inputs
            if (authCode == null || authCode.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing authorization code"));
            }

            // Exchange auth code for access token
            String accessToken = fyersAuthService.exchangeAuthCode(
                authCode, 
                clientId, 
                secretId, 
                redirectUri
            );

            // Get user profile
            Map<String, Object> userProfile = fyersAuthService.getUserProfile(accessToken);

            // Generate JWT token for your app
            String jwtToken = fyersAuthService.generateJwtToken(userProfile);

            // Return tokens
            return ResponseEntity.ok(Map.of(
                "token", jwtToken,
                "fyersAccessToken", accessToken,
                "user", userProfile
            ));

        } catch (Exception e) {
            log.error("Error handling Fyers callback", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", e.getMessage()));
        }
    }
}
```

### Step 4: Create Fyers Auth Service

```java
package com.apex.service;

import com.apex.config.FyersConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FyersAuthService {

    private final FyersConfig fyersConfig;
    private final RestTemplate restTemplate;

    /**
     * Exchange authorization code for access token
     */
    public String exchangeAuthCode(String authCode, String clientId, 
                                   String secretId, String redirectUri) {
        try {
            // Generate app ID hash (required by Fyers)
            String appIdHash = generateAppIdHash();

            // Prepare request
            Map<String, Object> request = Map.of(
                "grant_type", "authorization_code",
                "appIdHash", appIdHash,
                "code", authCode
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            // Call Fyers API
            ResponseEntity<Map> response = restTemplate.postForEntity(
                fyersConfig.getTokenUrl(),
                entity,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String accessToken = (String) response.getBody().get("access_token");
                log.info("Successfully obtained Fyers access token");
                return accessToken;
            } else {
                throw new RuntimeException("Failed to obtain access token from Fyers");
            }

        } catch (Exception e) {
            log.error("Error exchanging auth code for access token", e);
            throw new RuntimeException("Failed to authenticate with Fyers: " + e.getMessage());
        }
    }

    /**
     * Get user profile from Fyers
     */
    public Map<String, Object> getUserProfile(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", accessToken);

            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                fyersConfig.getApiBaseUrl() + "/profile",
                HttpMethod.GET,
                entity,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new RuntimeException("Failed to get user profile");
            }

        } catch (Exception e) {
            log.error("Error getting user profile", e);
            throw new RuntimeException("Failed to get user profile: " + e.getMessage());
        }
    }

    /**
     * Generate app ID hash (SHA-256)
     */
    private String generateAppIdHash() {
        try {
            String input = fyersConfig.getAppId() + ":" + fyersConfig.getSecretId();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
            
        } catch (Exception e) {
            log.error("Error generating app ID hash", e);
            throw new RuntimeException("Failed to generate app ID hash");
        }
    }

    /**
     * Generate JWT token for your application
     */
    public String generateJwtToken(Map<String, Object> userProfile) {
        // Implement your JWT token generation logic here
        // This should create a token with user information
        // Example using io.jsonwebtoken.Jwts
        
        // TODO: Implement JWT token generation
        return "your-jwt-token";
    }
}
```

### Step 5: Add Dependencies to `pom.xml`

```xml
<!-- Spring Web for RestTemplate -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- JWT for token generation (optional) -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>

<!-- Lombok -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

### Step 6: Create RestTemplate Bean

```java
package com.apex.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

---

## 🔄 OAuth Flow

### Frontend Flow:
1. User clicks "Login with Fyers" on `/login`
2. Redirected to Fyers: `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=WWRBNF6CEE&...`
3. User authenticates on Fyers
4. Fyers redirects back to: `http://localhost:4200/auth/fyers/callback?auth_code=...&state=...`
5. Frontend calls backend: `POST /api/auth/fyers/callback` with auth code

### Backend Flow:
6. Backend exchanges auth code for access token with Fyers
7. Backend gets user profile from Fyers
8. Backend generates JWT token
9. Backend returns JWT + Fyers access token to frontend
10. Frontend stores tokens and redirects to dashboard

---

## ✅ Testing

### Test Frontend:
```bash
git pull origin feature/complete-ui-fixes
npm start
open http://localhost:4200/login
# Click "Login with Fyers"
```

### Test Backend:
```bash
# Start your backend on port 8080
# Endpoint should be available:
POST http://localhost:8080/api/auth/fyers/callback
```

---

## 🔐 Security Notes

1. **Never expose Secret ID in frontend** - It's only in environment for development
2. **Use environment variables in production**
3. **Validate state parameter** (CSRF protection) - Already implemented in frontend
4. **Store tokens securely** - Use HttpOnly cookies in production
5. **Implement token refresh** - Fyers tokens expire after 24 hours

---

## 📚 Fyers API Documentation

- [Fyers API Docs](https://myapi.fyers.in/docs/)
- [OAuth Flow](https://myapi.fyers.in/docs/#authentication)
- [API V3 Reference](https://myapi.fyers.in/docsv3/)

---

## 🎯 Next Steps

1. ✅ Frontend configured (DONE)
2. ⚙️ Configure backend (Follow steps above)
3. 🧪 Test OAuth flow
4. 🚀 Implement trading features
5. 📊 Add market data streaming

---

**Frontend Status**: ✅ Complete and Ready!  
**Backend Status**: ⚙️ Configuration Required
