# Katika — Escrow Payment Platform

> **Production-grade** mobile-first escrow payment platform for the Cameroonian market. Built on Spring Boot 4, OAuth2, and Angular 20+ with enterprise-level security, hexagonal architecture, and real-time WebSocket features.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Prerequisites](#3-prerequisites)
4. [Project Initialization](#4-project-initialization)
  - [Backend Setup](#41-backend-setup)
  - [Environment Variables](#42-environment-variables)
  - [RSA Key Generation](#43-rsa-key-generation)
  - [Redis ACL Setup](#44-redis-acl-setup)
  - [Database Initialization](#45-database-initialization)
5. [Security Architecture](#5-security-architecture)
  - [Security Filter Chain Ordering](#51-security-filter-chain-ordering)
  - [OAuth2 Authorization Server](#52-oauth2-authorization-server)
  - [Backend For Frontend (BFF) Pattern](#53-backend-for-frontend-bff-pattern)
  - [JWT Token Lifecycle](#54-jwt-token-lifecycle)
  - [Multi-Factor Authentication](#55-multi-factor-authentication)
  - [Data Encryption & Hashing](#56-data-encryption--hashing)
  - [Rate Limiting](#57-rate-limiting)
  - [WebSocket Security](#58-websocket-security)
  - [Webhook HMAC Validation](#59-webhook-hmac-validation)
6. [Angular 20+ Integration — Security & Architecture](#6-angular-20-integration--security--architecture)
  - [Project Structure (Mobile-First, Feature-Shell)](#61-project-structure-mobile-first-feature-shell)
  - [HTTP Client & Interceptors](#62-http-client--interceptors)
  - [CSRF Token Seeding](#63-csrf-token-seeding)
  - [Auth Store (NgRx Signal Store)](#64-auth-store-ngrx-signal-store)
  - [Route Guards & Access Control](#65-route-guards--access-control)
  - [Token Refresh Strategy](#66-token-refresh-strategy)
  - [WebSocket Client (STOMP + RxJS)](#67-websocket-client-stomp--rxjs)
  - [Mobile-First Layout Strategy](#68-mobile-first-layout-strategy)
  - [PWA & Offline Resilience](#69-pwa--offline-resilience)
  - [Angular Security Checklist](#610-angular-security-checklist)
7. [Docker Deployment](#7-docker-deployment)
8. [Development Workflow](#8-development-workflow)
9. [Monitoring & Observability](#9-monitoring--observability)
10. [Testing Strategy](#10-testing-strategy)
11. [API Reference](#11-api-reference)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Project Overview

**Katika** is a peer-to-peer escrow platform that holds funds in trust until both buyer and seller fulfill their obligations. It targets the West African mobile-money ecosystem (Campay, Monetbil) and is designed from day one to operate on mobile networks.

| Dimension | Detail |
|---|---|
| **Domain** | Fintech / Escrow / P2P Payments |
| **Market** | Cameroon (XAF currency) |
| **Backend** | Spring Boot 4 · Java 21 · Hexagonal Architecture |
| **Database** | PostgreSQL 16 + Redis 7 |
| **Auth** | OAuth2 Authorization Server · RS256 JWT · TOTP 2FA |
| **Frontend** | Angular 20+ (mobile-first PWA) |
| **Payments** | Campay · Monetbil (Mobile Money) |
| **Real-time** | STOMP WebSocket over SockJS |
| **Observability** | Prometheus · Grafana · Loki · Promtail |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                                                                 │
│   Angular 20+ PWA (Mobile-First)                               │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│   │  Shell   │  │  Auth    │  │ Escrow   │  │ Dispute  │     │
│   │  App     │  │  Feature │  │ Feature  │  │ Feature  │     │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│         │              │               │             │          │
│   HttpOnly Cookie (ACCESS_TOKEN / REFRESH_TOKEN)               │
│   XSRF-TOKEN (SameSite=Strict, CSRF seed via /bff/auth/csrf)  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS (Nginx reverse proxy)
┌─────────────────────────────▼───────────────────────────────────┐
│                    BACKEND FOR FRONTEND (BFF)                   │
│                                                                 │
│  /bff/auth/*  — stateless, cookie-based token management        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Spring Security Filter Chain (Order 2)                   │  │
│  │  CookieCsrfTokenRepository | CookieBearerTokenResolver   │  │
│  │  BffAuthController → calls Authorization Server          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Internal (katika-internal network)
┌─────────────────────────────▼───────────────────────────────────┐
│                   AUTHORIZATION SERVER (Order 1)                │
│                                                                 │
│  OAuth2 JDBC · RS256 JWT · /oauth2/token · /oauth2/jwks        │
│  Client Registry: angular-client · mobile-app · katika-service │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    RESOURCE SERVER (Order 4)                    │
│                                                                 │
│  Domain Services (Hexagonal Architecture)                       │
│  ┌────────────┐ ┌─────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Escrow    │ │ Payout  │ │ Dispute  │ │  Notification  │  │
│  │  Service   │ │ Service │ │ Service  │ │  (WebSocket)   │  │
│  └────────────┘ └─────────┘ └──────────┘ └────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Infrastructure Adapters                     │  │
│  │  PostgreSQL 16 · Redis 7 · Campay · Monetbil · S3       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Hexagonal Architecture Layers

```
src/main/java/tech/bytesmind/katika/
│
├── api/                    ← Driving Adapters (REST, WebSocket)
│   ├── controller/         ← HTTP Controllers
│   ├── dto/                ← Input/Output models (never domain entities)
│   └── exception/          ← Global exception handler (@RestControllerAdvice)
│
├── domain/                 ← Pure Business Logic (no framework imports)
│   ├── entity/             ← JPA Entities (12 domain aggregates)
│   ├── enums/              ← Domain enumerations (status machines)
│   ├── exception/          ← Business rule violations
│   ├── port/               ← 20 interface contracts (in/out ports)
│   ├── service/            ← 12 Domain Services
│   └── vo/                 ← Value Objects (immutable, validated)
│
├── infrastructure/         ← Driven Adapters (implements domain ports)
│   ├── persistence/        ← JPA repositories + adapters
│   ├── redis/              ← 6 Redis adapters (session, rate-limit, OTP…)
│   ├── payment/            ← Campay + Monetbil adapters
│   ├── storage/            ← S3 / local file storage adapter
│   └── qrcode/             ← ZXing QR generation adapter
│
└── config/                 ← Spring configuration + Security chains
    └── bff/                ← BFF token service + cookie management
```

---

## 3. Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Java | 21 (LTS) | Backend runtime |
| Gradle | 8.x | Build tool |
| Docker | 24+ | Local orchestration |
| Docker Compose | 2.x | Multi-service setup |
| Node.js | 22+ (LTS) | Angular frontend |
| Angular CLI | 20+ | Frontend scaffolding |
| OpenSSL | 3.x | RSA key generation |
| Make | 4.x | Dev shortcuts |
| Redis CLI | 7.x | ACL management |

---

## 4. Project Initialization

### 4.1 Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/bytesmind/katika.git
cd katika

# 2. Copy and fill in environment variables
cp .env.example .env
# → Edit .env with your secrets (see section 4.2)

# 3. Generate RSA keys for JWT signing
make generate-keys
# OR manually (see section 4.3)

# 4. Configure Redis ACL
make setup-redis-acl
# OR manually (see section 4.4)

# 5. Start infrastructure (PostgreSQL + Redis)
make dev

# 6. Verify database migrations ran
docker compose exec postgres psql -U katika -d katika_db -c "\dt"

# 7. Start the application (dev profile)
./gradlew bootRun --args='--spring.profiles.active=dev'

# 8. Verify startup
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP","components":{...}}
```

### 4.2 Environment Variables

All secrets are injected via environment variables. **Never commit `.env` to version control.**

```bash
# ─── Database ──────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=katika_db
DB_USERNAME=katika
DB_PASSWORD=<strong-random-password>

# ─── Redis ─────────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<strong-random-password>
REDIS_SSL=false           # true in production (TLS)

# ─── JWT / OAuth2 ──────────────────────────────────────────────
JWT_ISSUER_URI=http://localhost:8080
# Keys loaded from classpath:certs/ (dev) or via env (prod)
JWT_PRIVATE_KEY_PATH=classpath:certs/privateKey.pem
JWT_PUBLIC_KEY_PATH=classpath:certs/publicKey.pem

# ─── Encryption (AES-256-GCM for PII) ─────────────────────────
ENCRYPTION_KEY=<base64-encoded-32-bytes>
# Generate: openssl rand -base64 32

# ─── Cookie Security ───────────────────────────────────────────
COOKIE_SECURE=false       # true in production (HTTPS)
COOKIE_DOMAIN=localhost   # .katika.com in production

# ─── CORS ──────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS=http://localhost:4200

# ─── OAuth2 Clients (Register in DB via migration or API) ──────
OAUTH2_ANGULAR_CLIENT_SECRET=<bcrypt-hashed-secret>
OAUTH2_MOBILE_CLIENT_SECRET=<bcrypt-hashed-secret>

# ─── Payment Providers ─────────────────────────────────────────
CAMPAY_USERNAME=<campay-username>
CAMPAY_PASSWORD=<campay-password>
CAMPAY_WEBHOOK_SECRET=<campay-webhook-hmac-secret>

MONETBIL_SERVICE_KEY=<monetbil-service-key>
MONETBIL_SECRET=<monetbil-api-secret>
MONETBIL_WEBHOOK_SECRET=<monetbil-webhook-hmac-secret>

# ─── SMS / Notifications ───────────────────────────────────────
TWILIO_ACCOUNT_SID=<twilio-sid>
TWILIO_AUTH_TOKEN=<twilio-token>
TWILIO_PHONE_NUMBER=+237XXXXXXXXX

# ─── Storage ───────────────────────────────────────────────────
STORAGE_PROVIDER=local    # s3 in production
S3_BUCKET=katika-uploads
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=eu-west-1

# ─── Email ─────────────────────────────────────────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=noreply@katika.cm
MAIL_PASSWORD=<app-password>
```

**Generating secure secrets:**
```bash
# 32-byte AES key (base64)
openssl rand -base64 32

# Strong database password
openssl rand -hex 32

# HMAC webhook secrets
openssl rand -hex 48
```

### 4.3 RSA Key Generation

JWT tokens are signed with RS256 (2048-bit minimum). Keys live in `src/main/resources/certs/`.

```bash
# Create directory
mkdir -p src/main/resources/certs

# Generate 4096-bit RSA private key (production: use 4096)
openssl genrsa -out src/main/resources/certs/privateKey.pem 4096

# Extract public key
openssl rsa -in src/main/resources/certs/privateKey.pem \
            -pubout \
            -out src/main/resources/certs/publicKey.pem

# Verify key length (must be ≥ 2048)
openssl rsa -in src/main/resources/certs/privateKey.pem -text -noout | grep "Key:"
```

> **Production:** Store private keys in a secrets manager (AWS Secrets Manager, HashiCorp Vault, or GCP Secret Manager). Mount them as environment variables or files at runtime. **Never commit private keys.**

Add to `.gitignore`:
```gitignore
src/main/resources/certs/privateKey.pem
.env
users.acl
```

### 4.4 Redis ACL Setup

Redis uses ACL to restrict the application user to only necessary commands.

```bash
# users.acl (do NOT commit this file — contains passwords)
# Format: user <name> on ><password> ~<key-pattern> +<commands>

user default off
user katika_admin on ><STRONG_ADMIN_PASSWORD> ~* &* +@all
user katika_app on ><APP_PASSWORD> \
  ~session:* ~rate:* ~otp:* ~idempotency:* ~totp:* ~verification:* \
  +get +set +del +expire +ttl +exists +incr +decr \
  +setex +getex +pexpire +pttl \
  +hget +hset +hdel +hgetall \
  +lpush +rpush +lrange +llen \
  +zadd +zrem +zrange +zrangebyscore +zcard \
  -@dangerous -@admin -@scripting
```

```bash
# Apply ACL file to running Redis (Docker)
docker compose exec redis redis-cli CONFIG SET aclfile /etc/redis/users.acl

# Verify
docker compose exec redis redis-cli -u redis://katika_admin:<password>@localhost:6379 ACL LIST
```

### 4.5 Database Initialization

Flyway runs automatically on application startup. Migrations are in `src/main/resources/db/migration/`.

| Migration | Description |
|---|---|
| `V1__extensions.sql` | `uuid-ossp`, `pgcrypto`, utility functions |
| `V2__domain_tables.sql` | All 12 domain tables + indexes |
| `V3__reference_generation.sql` | `KT-YYYY-XXXXXX` reference format |
| `V4__immutability_triggers.sql` | Prevent modification of critical financial fields |
| `V5__status_transition_triggers.sql` | Enforce state machine transitions at DB level |
| `V6__audit_columns.sql` | `created_by`, `updated_by`, `deleted_by` on all tables |
| `V7__auth_columns.sql` | Password hash, phone hash, MFA settings |
| `V8__oauth2_tables.sql` | OAuth2 Authorization Server JDBC tables + seed data |

```bash
# Manually run migrations (if needed)
./gradlew flywayMigrate

# Check migration status
./gradlew flywayInfo

# Connect to database
make db-shell
# or: docker compose exec postgres psql -U katika -d katika_db
```

---

## 5. Security Architecture

### 5.1 Security Filter Chain Ordering

Spring Security applies filter chains in priority order. Four independent chains are configured:

```
Request arrives
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Order 1: OAuth2 Authorization Server Chain     │
│  Matches: /oauth2/**, /oauth/**, /.well-known/** │
│  Purpose: Issues access tokens & refresh tokens │
│  Session: ALWAYS (JDBC session for auth flow)   │
└─────────────────────────────────────────────────┘
      │ (if not matched, falls through)
      ▼
┌─────────────────────────────────────────────────┐
│  Order 2: BFF Security Chain                    │
│  Matches: /bff/**                               │
│  Purpose: Cookie-based token proxy for SPA      │
│  Session: STATELESS                             │
│  CSRF: CookieCsrfTokenRepository               │
└─────────────────────────────────────────────────┘
      │ (if not matched, falls through)
      ▼
┌─────────────────────────────────────────────────┐
│  Order 3: Authentication Chain                  │
│  Matches: /auth/login, /auth/register, /auth/** │
│  Purpose: Form login, MFA challenge, rate limit │
│  Session: IF_REQUIRED (for MFA state)           │
│  Special: MfaAuthFilter before UsernamePassword │
└─────────────────────────────────────────────────┘
      │ (if not matched, falls through)
      ▼
┌─────────────────────────────────────────────────┐
│  Order 4: Resource Server Chain                 │
│  Matches: /** (all remaining)                   │
│  Purpose: JWT validation for API endpoints      │
│  Session: STATELESS                             │
│  Auth: Bearer JWT (RS256 validated)             │
└─────────────────────────────────────────────────┘
```

### 5.2 OAuth2 Authorization Server

The authorization server is the **sole issuer** of all tokens. No other component issues JWTs.

**Registered Clients (seeded via V8 migration):**

| Client ID | Grant Types | Purpose |
|---|---|---|
| `angular-client` | `authorization_code`, `refresh_token` | Angular SPA via BFF |
| `mobile-app` | `authorization_code`, `refresh_token` | Native mobile app |
| `katika-service` | `client_credentials` | Internal service-to-service |

**Token Configuration:**
```yaml
# Access Token: RS256, 30-minute TTL
# Refresh Token: opaque, 7-day TTL, single-use rotation
# Scopes: read write delete
# Custom Claims: katika_user_id, role, email, mfa_enabled
```

**Well-Known Endpoints:**
- `GET /oauth2/jwks` — Public key set (JWKS) for token verification
- `GET /.well-known/openid-configuration` — OpenID Connect discovery
- `POST /oauth2/token` — Token issuance
- `POST /oauth2/revoke` — Token revocation

### 5.3 Backend For Frontend (BFF) Pattern

The BFF pattern solves the fundamental SPA security problem: **browsers cannot securely store tokens**.

```
Traditional (INSECURE for SPA)          BFF Pattern (SECURE)
─────────────────────────────           ─────────────────────

Client → POST /login                    Client → POST /bff/auth/login
  ← { access_token: "eyJ..." }           ← Set-Cookie: ACCESS_TOKEN=eyJ...
  stores in localStorage/memory            HttpOnly; Secure; SameSite=Strict

  → GET /api/resource                   → GET /api/resource
    Authorization: Bearer eyJ...          Cookie: ACCESS_TOKEN=eyJ...
    (XSS can steal this!)                 (XSS cannot read HttpOnly cookies)
```

**BFF Endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/bff/auth/csrf` | Seed XSRF-TOKEN cookie (call on app init) |
| `POST` | `/bff/auth/login` | Login → sets ACCESS_TOKEN + REFRESH_TOKEN cookies |
| `POST` | `/bff/auth/mfa/verify` | Verify TOTP/backup code during login flow |
| `POST` | `/bff/auth/refresh` | Rotate tokens using REFRESH_TOKEN cookie |
| `POST` | `/bff/auth/logout` | Revoke tokens + clear all cookies |
| `GET` | `/bff/auth/me` | Decode ACCESS_TOKEN → user profile (no DB call) |

**Cookie Configuration:**

| Cookie | HttpOnly | Secure | SameSite | TTL |
|---|---|---|---|---|
| `ACCESS_TOKEN` | ✅ | prod only | `Strict` | 30 min |
| `REFRESH_TOKEN` | ✅ | prod only | `Strict` | 7 days |
| `XSRF-TOKEN` | ❌ | prod only | `Strict` | session |

> The `XSRF-TOKEN` cookie is readable by JavaScript intentionally — Angular's `HttpClientXsrfModule` reads it and sends it as the `X-XSRF-TOKEN` request header. The server validates this header against the expected value, protecting against CSRF.

### 5.4 JWT Token Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│                    JWT ACCESS TOKEN PAYLOAD                      │
│                                                                  │
│  {                                                               │
│    "iss": "https://auth.katika.cm",      ← Issuer              │
│    "sub": "user-uuid-here",              ← Subject (user ID)    │
│    "aud": ["angular-client"],            ← Intended audience    │
│    "exp": 1735000000,                    ← Expiry (30 min)      │
│    "iat": 1734998200,                    ← Issued at            │
│    "jti": "unique-token-id",             ← JWT ID (replay guard)│
│    "scope": "read write",                ← Granted scopes       │
│    "katika_user_id": "uuid",             ← Custom: user UUID    │
│    "role": "BUYER",                      ← Custom: user role    │
│    "email": "user@example.com",          ← Custom: email        │
│    "mfa_enabled": true                   ← Custom: MFA status   │
│  }                                                               │
│                                                                  │
│  Signature: RS256 (4096-bit RSA, private key signs, JWKS verifies)│
└──────────────────────────────────────────────────────────────────┘
```

**Refresh Token Rotation:** Every `POST /bff/auth/refresh` call:
1. Validates the REFRESH_TOKEN cookie
2. Calls `POST /oauth2/token` with `grant_type=refresh_token`
3. Receives a **new** access token + **new** refresh token
4. Overwrites both cookies
5. The old refresh token is **immediately invalidated** (single-use)

This means a stolen refresh token can only be used once before it becomes invalid.

### 5.5 Multi-Factor Authentication

TOTP (RFC 6238) implementation compatible with Google Authenticator, Authy, and any TOTP app.

**Enrollment Flow:**
```
1. GET /mfa/setup
   ← { secret: "BASE32SECRET", qrCodeUri: "data:image/png;...", backupCodes: [...] }

2. User scans QR code with authenticator app

3. POST /mfa/confirm { code: "123456" }
   → Validates TOTP code for the first time
   ← { enabled: true }
   ✓ MFA is now active on the account
```

**Login Flow (with MFA enabled):**
```
1. POST /bff/auth/login { username, password }
   ← 200 { mfaRequired: true, challengeToken: "temp-token" }

2. POST /bff/auth/mfa/verify { challengeToken, code: "123456" }
   ← Sets ACCESS_TOKEN + REFRESH_TOKEN cookies
   ✓ Login complete
```

**Security hardening:**
- TOTP replay protection: Redis stores each used code for 90 seconds (prevents reuse within the same 30s window)
- Backup codes: 10 single-use codes, BCrypt-hashed (strength 12) in the database
- Brute-force protection: Rate limiter blocks after 5 failed MFA attempts/15 minutes
- Encrypted TOTP secret: Stored with AES-256-GCM in the database

### 5.6 Data Encryption & Hashing

```
┌────────────────┬──────────────────┬────────────────────────────────┐
│ Data Type      │ Algorithm        │ Notes                          │
├────────────────┼──────────────────┼────────────────────────────────┤
│ Passwords      │ BCrypt (str=12)  │ 2^12 = 4096 hash rounds        │
│ Phone numbers  │ AES-256-GCM      │ 12-byte random IV per record   │
│ Email address  │ AES-256-GCM      │ Key-versioned for rotation      │
│ CNI numbers    │ AES-256-GCM      │ Same key, different field tag   │
│ TOTP secrets   │ AES-256-GCM      │ Never stored plaintext          │
│ Backup codes   │ BCrypt (str=12)  │ One-way, single-use tracking    │
├────────────────┼──────────────────┼────────────────────────────────┤
│ Phone (lookup) │ SHA-256 (raw)    │ Deterministic for DB index      │
│ Email (lookup) │ SHA-256 (raw)    │ Uniqueness without exposing PII │
├────────────────┼──────────────────┼────────────────────────────────┤
│ Webhook sigs   │ HMAC-SHA256      │ Timing-safe comparison          │
│ Verification   │ HMAC-SHA256      │ QR code signature + expiry      │
│ JWT signature  │ RS256 (4096-bit) │ Asymmetric, public key for verify│
└────────────────┴──────────────────┴────────────────────────────────┘
```

**AES-256-GCM Details:**
```
Ciphertext format: [1-byte key version] [12-byte IV] [N-byte ciphertext + 16-byte GCM tag]
```
The key version prefix enables zero-downtime key rotation: new records use the new key, old records are re-encrypted lazily or during a migration job.

### 5.7 Rate Limiting

Redis-backed sliding window rate limiting applied before business logic.

| Endpoint | Limit | Window |
|---|---|---|
| `POST /bff/auth/login` | 5 attempts | 15 minutes |
| `POST /bff/auth/mfa/verify` | 5 attempts | 15 minutes |
| `POST /payouts/{id}/otp` | 3 attempts | 5 minutes |
| `POST /payouts/{id}/submit` | 3 attempts | 5 minutes |

When limit is exceeded:
```json
HTTP 429 Too Many Requests
{
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfterSeconds": 847
}
```

### 5.8 WebSocket Security

STOMP WebSocket connections at `/ws` (SockJS fallback enabled).

**Authentication on CONNECT:**
```
Client → STOMP CONNECT frame
         Authorization: Bearer <ACCESS_TOKEN>
         (or cookie: ACCESS_TOKEN=<token>)

Server validates JWT → extracts user + role
      → sets SecurityContext for the WebSocket session

STOMP subscription validation:
  /topic/dispute.{disputeId}         → buyer OR seller of that dispute OR support/admin
  /topic/dispute.{disputeId}.internal → SUPPORT or ADMIN role only
```

**Message limits:**
- Max message size: 16 KB
- Max send buffer size: 512 KB
- Message send timeout: 10 seconds

### 5.9 Webhook HMAC Validation

Payment provider webhooks are validated before any processing:

```
1. Webhook arrives at POST /api/webhooks/{provider}

2. WebhookHmacAuthenticationFilter runs FIRST:
   a. Cache request body (for re-reading after signature check)
   b. Read X-Campay-Signature or X-Monetbil-Signature header
   c. Compute HMAC-SHA256(secretKey, rawRequestBody)
   d. Compare using MessageDigest.isEqual() (timing-safe! prevents timing attacks)
   e. Reject with 401 if signature mismatch

3. Payload size check: reject if > 1 MB

4. Idempotency check: reject if webhook ID already processed (Redis + PostgreSQL)

5. Route to domain service for business processing
```

---

## 6. Angular 20+ Integration — Security & Architecture

### 6.1 Project Structure (Mobile-First, Feature-Shell)

```
katika-angular/
│
├── src/
│   ├── app/
│   │   ├── core/                          ← Singleton services (loaded once)
│   │   │   ├── auth/
│   │   │   │   ├── auth.store.ts          ← NgRx Signal Store (auth state)
│   │   │   │   ├── auth.service.ts        ← Login/logout/refresh calls
│   │   │   │   └── auth.guard.ts          ← Route protection
│   │   │   ├── http/
│   │   │   │   ├── csrf.interceptor.ts    ← Auto-attach X-XSRF-TOKEN
│   │   │   │   ├── auth.interceptor.ts    ← 401 → token refresh logic
│   │   │   │   └── error.interceptor.ts   ← Global HTTP error handling
│   │   │   ├── websocket/
│   │   │   │   └── stomp-client.service.ts← Singleton STOMP connection
│   │   │   └── core.providers.ts          ← Provide all core services
│   │   │
│   │   ├── shared/                        ← Dumb components, pipes, directives
│   │   │   ├── components/
│   │   │   ├── directives/
│   │   │   └── pipes/
│   │   │
│   │   ├── features/                      ← Lazy-loaded feature modules
│   │   │   ├── auth/                      ← Login, Register, MFA enrollment
│   │   │   ├── dashboard/                 ← Home (role-aware)
│   │   │   ├── escrow/                    ← Create, track escrow transactions
│   │   │   ├── disputes/                  ← Dispute list, real-time chat
│   │   │   ├── payouts/                   ← Mobile money withdrawal
│   │   │   └── profile/                   ← User profile, MFA settings
│   │   │
│   │   ├── app.routes.ts                  ← Root route configuration
│   │   ├── app.config.ts                  ← Application providers
│   │   └── app.component.ts               ← Shell component (mobile layout)
│   │
│   ├── environments/
│   │   ├── environment.ts                 ← Dev (localhost, debug)
│   │   └── environment.prod.ts            ← Production (katika.cm)
│   │
│   └── styles/
│       ├── _variables.scss                ← Design tokens (spacing, colors)
│       ├── _breakpoints.scss              ← Mobile-first breakpoint mixins
│       └── main.scss                      ← Global styles
│
├── angular.json
├── tsconfig.json
└── package.json
```

### 6.2 HTTP Client & Interceptors

Angular 20 uses functional interceptors with `withInterceptors()`.

**`app.config.ts` — Provider setup:**
```typescript
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { csrfInterceptor } from './core/http/csrf.interceptor';
import { authInterceptor } from './core/http/auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),              // Angular 20 zoneless mode
    provideRouter(routes,
      withComponentInputBinding(),
      withViewTransitions()
    ),
    provideHttpClient(
      withFetch(),                                  // Use Fetch API (SSR-compatible)
      withInterceptors([
        csrfInterceptor,                            // 1st: attach XSRF token
        authInterceptor,                            // 2nd: handle 401 → refresh
      ])
    ),
  ]
};
```

**`csrf.interceptor.ts`:**
```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Reads the XSRF-TOKEN cookie (set by the server) and sends it
 * as the X-XSRF-TOKEN request header for all mutating requests.
 * Angular's built-in HttpClientXsrfModule does this automatically
 * if the cookie name matches. We use a custom interceptor for
 * explicit control and custom cookie names.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const doc = inject(DOCUMENT);
  const csrfToken = getCookie(doc, 'XSRF-TOKEN');

  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const isSameOrigin = req.url.startsWith('/') || req.url.startsWith(window.location.origin);

  if (isMutation && isSameOrigin && csrfToken) {
    req = req.clone({
      setHeaders: { 'X-XSRF-TOKEN': csrfToken },
      withCredentials: true,   // CRITICAL: send cookies cross-origin in dev
    });
  }

  return next(req);
};

function getCookie(doc: Document, name: string): string | null {
  return doc.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1] ?? null;
}
```

**`auth.interceptor.ts` — 401 handling with token refresh:**
```typescript
import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError(error => {
      // Only intercept 401 on non-auth endpoints to avoid infinite loops
      if (error.status === HttpStatusCode.Unauthorized && !req.url.includes('/bff/auth/')) {
        if (!isRefreshing) {
          isRefreshing = true;
          return authService.refreshToken().pipe(
            switchMap(() => {
              isRefreshing = false;
              return next(req.clone({ withCredentials: true }));
            }),
            catchError(refreshError => {
              isRefreshing = false;
              authService.logout();               // Clear state
              router.navigate(['/auth/login']);    // Redirect
              return throwError(() => refreshError);
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
```

### 6.3 CSRF Token Seeding

On application initialization, seed the CSRF token before any mutations.

**`app.component.ts`:**
```typescript
import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  template: `<router-outlet />`,
  standalone: true,
})
export class AppComponent implements OnInit {
  private readonly http = inject(HttpClient);

  ngOnInit(): void {
    // Seed XSRF-TOKEN cookie so all subsequent POST/PUT/DELETE carry the header
    this.http.get(`${environment.apiUrl}/bff/auth/csrf`, { withCredentials: true })
      .subscribe();
  }
}
```

### 6.4 Auth Store (NgRx Signal Store)

Angular 20 promotes Signal-based state. Use `@ngrx/signals` for auth state.

**`auth.store.ts`:**
```typescript
import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { AuthService, UserProfile } from './auth.service';
import { Router } from '@angular/router';

interface AuthState {
  user: UserProfile | null;
  mfaRequired: boolean;
  challengeToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  mfaRequired: false,
  challengeToken: null,
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ user }) => ({
    isAuthenticated: computed(() => !!user()),
    isAdmin: computed(() => user()?.role === 'ADMIN'),
    isSupport: computed(() => ['ADMIN', 'SUPPORT', 'SUPERVISOR'].includes(user()?.role ?? '')),
    userRole: computed(() => user()?.role ?? null),
  })),

  withMethods((store, authService = inject(AuthService), router = inject(Router)) => ({

    login: rxMethod<{ username: string; password: string }>(
      pipe(
        tap(() => store._patchState({ loading: true, error: null })),
        switchMap(credentials => authService.login(credentials).pipe(
          tap(response => {
            if (response.mfaRequired) {
              store._patchState({ mfaRequired: true, challengeToken: response.challengeToken, loading: false });
            } else {
              store._patchState({ user: response.user, loading: false });
              router.navigate(['/dashboard']);
            }
          }),
          catchError(err => {
            store._patchState({ error: err.error?.message ?? 'Login failed', loading: false });
            return EMPTY;
          })
        ))
      )
    ),

    verifyMfa: rxMethod<{ code: string }>(
      pipe(
        switchMap(({ code }) => authService.verifyMfa({ code, challengeToken: store.challengeToken()! }).pipe(
          tap(user => {
            store._patchState({ user, mfaRequired: false, challengeToken: null });
            router.navigate(['/dashboard']);
          }),
          catchError(err => {
            store._patchState({ error: 'Invalid MFA code' });
            return EMPTY;
          })
        ))
      )
    ),

    loadCurrentUser: rxMethod<void>(
      pipe(
        switchMap(() => authService.getMe().pipe(
          tap(user => store._patchState({ user })),
          catchError(() => { store._patchState({ user: null }); return EMPTY; })
        ))
      )
    ),

    logout(): void {
      authService.logout().subscribe(() => {
        store._patchState(initialState);
        router.navigate(['/auth/login']);
      });
    }
  }))
);
```

### 6.5 Route Guards & Access Control

**`auth.guard.ts`:**
```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (store.isAuthenticated()) return true;
  return router.createUrlTree(['/auth/login']);
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  const role = store.userRole();
  if (role && allowedRoles.includes(role)) return true;
  return router.createUrlTree(['/403']);
};
```

**`app.routes.ts`:**
```typescript
import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'escrow',
    canActivate: [authGuard],
    loadChildren: () => import('./features/escrow/escrow.routes').then(m => m.escrowRoutes),
  },
  {
    path: 'disputes',
    canActivate: [authGuard],
    loadChildren: () => import('./features/disputes/disputes.routes').then(m => m.disputeRoutes),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMIN', 'SUPERVISOR'])],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', loadComponent: () => import('./shared/components/not-found/not-found.component') },
];
```

### 6.6 Token Refresh Strategy

Since tokens are HttpOnly cookies (invisible to JavaScript), the Angular app tracks auth state via `/bff/auth/me`, not by decoding the token.

**`auth.service.ts`:**
```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  mfaEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/bff/auth`;

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.base}/login`, credentials, { withCredentials: true });
  }

  verifyMfa(payload: { code: string; challengeToken: string }): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.base}/mfa/verify`, payload, { withCredentials: true });
  }

  /**
   * Calls /bff/auth/refresh — the server reads REFRESH_TOKEN cookie,
   * rotates both tokens, and overwrites the cookies.
   * Zero token values ever touch JavaScript.
   */
  refreshToken(): Observable<void> {
    return this.http.post<void>(`${this.base}/refresh`, {}, { withCredentials: true });
  }

  /**
   * Decodes the server-side cookie into user info.
   * Never exposes the raw token to JavaScript.
   */
  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/me`, { withCredentials: true });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, {}, { withCredentials: true });
  }
}
```

**App initialization — restore session on reload:**
```typescript
// app.config.ts
import { APP_INITIALIZER } from '@angular/core';
import { AuthStore } from './core/auth/auth.store';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...other providers...
    {
      provide: APP_INITIALIZER,
      useFactory: (authStore: AuthStore) => () => authStore.loadCurrentUser(),
      deps: [AuthStore],
      multi: true,
    },
  ]
};
```

### 6.7 WebSocket Client (STOMP + RxJS)

**Install:**
```bash
npm install @stomp/stompjs sockjs-client
npm install -D @types/sockjs-client
```

**`stomp-client.service.ts`:**
```typescript
import { inject, Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject, filter, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StompClientService implements OnDestroy {
  private client!: Client;
  private connected = false;
  private readonly messageSubject = new Subject<{ destination: string; body: any }>();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws`),
        // Cookie-based auth: ACCESS_TOKEN cookie sent automatically
        // OR pass token in connect headers (if cookie not available):
        connectHeaders: { 'X-Connect-Token': 'cookie' },
        reconnectDelay: 3000,
        onConnect: () => {
          this.connected = true;
          resolve();
        },
        onDisconnect: () => { this.connected = false; },
        onStompError: frame => reject(frame),
      });
      this.client.activate();
    });
  }

  subscribe(destination: string): Observable<any> {
    return this.messageSubject.asObservable().pipe(
      filter(msg => msg.destination === destination),
      map(msg => msg.body)
    );
  }

  subscribeToTopic(destination: string): StompSubscription {
    return this.client.subscribe(destination, (message: IMessage) => {
      this.messageSubject.next({
        destination,
        body: JSON.parse(message.body)
      });
    });
  }

  publish(destination: string, body: object): void {
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  disconnect(): void {
    this.client?.deactivate();
  }

  ngOnDestroy(): void { this.disconnect(); }
}
```

**Usage in a dispute component:**
```typescript
@Component({ /* ... */ })
export class DisputeChatComponent implements OnInit, OnDestroy {
  private readonly stomp = inject(StompClientService);
  private subscription!: StompSubscription;
  messages = signal<DisputeMessage[]>([]);

  async ngOnInit(): Promise<void> {
    await this.stomp.connect();
    this.subscription = this.stomp.subscribeToTopic(
      `/topic/dispute.${this.disputeId}`
    );
    this.stomp.subscribe(`/topic/dispute.${this.disputeId}`)
      .subscribe(msg => this.messages.update(m => [...m, msg]));
  }

  sendMessage(content: string): void {
    this.stomp.publish(`/app/dispute.${this.disputeId}.message`, { content });
  }

  ngOnDestroy(): void { this.subscription?.unsubscribe(); }
}
```

### 6.8 Mobile-First Layout Strategy

**Design principles:**
- Base styles target 360px (small Android) — scale up with min-width breakpoints
- Use CSS container queries for component-level responsiveness
- Use `clamp()` for fluid typography — no breakpoint jumps
- Touch targets ≥ 44px × 44px (WCAG 2.1 SC 2.5.5)
- Maximum one hand operation: critical actions in thumb zone (bottom 40% of screen)

**`_breakpoints.scss`:**
```scss
// Mobile-first breakpoints (min-width)
$breakpoints: (
  'xs':  360px,   // small phones (Samsung Galaxy A)
  'sm':  480px,   // large phones (iPhone Pro Max)
  'md':  768px,   // tablets (landscape phone / portrait tablet)
  'lg':  1024px,  // desktop / laptop
  'xl':  1280px,  // wide desktop
  '2xl': 1536px,  // ultra-wide
);

@mixin breakpoint($bp) {
  @media (min-width: map-get($breakpoints, $bp)) {
    @content;
  }
}

// Usage: @include breakpoint('md') { ... }
```

**`app.component.ts` (Shell layout):**
```typescript
@Component({
  selector: 'app-root',
  template: `
    <div class="app-shell">
      <!-- Mobile: bottom nav. Desktop: sidebar -->
      @if (isHandset()) {
        <app-bottom-nav />
      } @else {
        <app-sidebar />
      }

      <main class="content" role="main">
        @if (isLoading()) {
          <app-skeleton-loader />
        }
        <router-outlet />
      </main>

      <!-- Global toast notifications -->
      <app-toast-container />
    </div>
  `,
})
export class AppComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);

  isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map(result => result.matches)
    ),
    { initialValue: true }  // Default to mobile
  );
}
```

### 6.9 PWA & Offline Resilience

```bash
# Add PWA support
ng add @angular/pwa

# Configure service worker strategy in ngsw-config.json:
# - App shell: precached
# - Static assets: cache-first
# - API calls: network-first with fallback
```

**`ngsw-config.json` key sections:**
```json
{
  "dataGroups": [
    {
      "name": "api-fresh",
      "urls": ["/bff/auth/me"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxAge": "30m",
        "timeout": "5s"
      }
    },
    {
      "name": "api-performance",
      "urls": ["/api/escrow/**", "/api/disputes/**"],
      "cacheConfig": {
        "strategy": "performance",
        "maxAge": "2m"
      }
    }
  ]
}
```

**Offline-aware HTTP:**
```typescript
// In interceptor: detect offline and show user-friendly error
export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  if (!navigator.onLine) {
    return throwError(() => ({ offline: true, message: 'You are offline' }));
  }
  return next(req);
};
```

### 6.10 Angular Security Checklist

| Risk | Mitigation | Status |
|---|---|---|
| XSS via token storage | HttpOnly cookies (no `localStorage` / `sessionStorage`) | ✅ BFF pattern |
| CSRF attacks | `X-XSRF-TOKEN` header + `SameSite=Strict` cookies | ✅ CSRF interceptor |
| Token leakage via JS | Tokens never in response body or JS-readable vars | ✅ HttpOnly enforced |
| Open redirect after login | Validate `returnUrl` against allowed paths whitelist | ⚠️ Implement in guard |
| Clickjacking | `X-Frame-Options: DENY` from server | ✅ Server-set |
| Content injection | Angular's built-in `DomSanitizer` for dynamic HTML | ✅ Default behavior |
| DOM-based XSS | Never use `innerHTML`, `bypassSecurityTrust*` without audit | ⚠️ Code review policy |
| Prototype pollution | Use `JSON.parse` + schema validation for API responses | ✅ TypeScript interfaces |
| Sensitive data in URL | Never pass tokens or PII as query/path params | ✅ Cookie-only auth |
| Dependency vulnerabilities | `npm audit` in CI/CD pipeline | ⚠️ Add to CI |
| Source map exposure | Disable source maps in production build | ✅ `sourceMap: false` in prod |
| Console logging of secrets | ESLint rule banning `console.log` in production | ⚠️ Add lint rule |

**Angular build security (`angular.json` production):**
```json
{
  "configurations": {
    "production": {
      "optimization": true,
      "sourceMap": false,
      "namedChunks": false,
      "extractLicenses": true,
      "vendorChunk": false,
      "buildOptimizer": true,
      "outputHashing": "all"
    }
  }
}
```

---

## 7. Docker Deployment

### Development (local)

```bash
# Start PostgreSQL + Redis only
make dev
# Equivalent: docker compose up postgres redis -d

# Start with monitoring stack
make monitoring
# Equivalent: docker compose --profile monitoring up -d

# Access tools
make db-shell        # PostgreSQL CLI
make redis-shell     # Redis CLI
```

### Production

```bash
# 1. Build production image
docker build -t katika-api:latest --target runtime .

# 2. Start all services
docker compose -f compose.yaml up -d

# 3. Check health
docker compose ps
curl https://api.katika.cm/actuator/health

# 4. View logs
docker compose logs -f katika-api
```

### Docker Networks (Security Isolation)

```yaml
networks:
  katika-internal:    # 172.28.0.0/16 — No internet access
    internal: true    # PostgreSQL, Redis, API communicate here

  katika-external:    # 172.29.0.0/16 — Internet-facing
    # Only Nginx, Grafana are on this network
```

This ensures that PostgreSQL and Redis are **never directly reachable from the internet**, even if container network rules are misconfigured.

### Resource Limits

```yaml
# Per service in compose.yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### Environment-Specific Configurations

| Profile | Database | Logging | Swagger | Actuator | Session |
|---|---|---|---|---|---|
| `dev` | localhost:5434 | DEBUG | Enabled | Full | Any |
| `test` | Testcontainers | WARN | Disabled | Health only | Any |
| `prod` | SSL required | WARN (JSON) | Disabled | Health + Prometheus | HTTPS only |

---

## 8. Development Workflow

```bash
# Available Make targets
make help           # Show all targets

make dev            # Start PostgreSQL + Redis (Docker)
make monitoring     # Add Prometheus + Grafana + Loki
make clean          # Stop and remove all containers + volumes

# Application
./gradlew bootRun --args='--spring.profiles.active=dev'
./gradlew test                          # Run all tests
./gradlew test --tests "*Integration*"  # Integration tests only

# Code quality
./gradlew checkstyleMain    # Style checks
./gradlew spotbugsMain      # Static analysis

# Database
make db-shell                           # PostgreSQL shell
./gradlew flywayInfo                    # Migration status
./gradlew flywayMigrate                 # Run pending migrations

# Secrets generation
openssl rand -base64 32                 # AES-256 key
openssl rand -hex 48                    # HMAC secret
openssl genrsa -out privateKey.pem 4096 # RSA private key
```

---

## 9. Monitoring & Observability

### Metrics (Prometheus + Grafana)

**Access:** `http://localhost:3000` (Grafana) · `http://localhost:9090` (Prometheus)

**Katika-specific metrics exported at `/actuator/prometheus`:**

| Metric | Type | Description |
|---|---|---|
| `katika_escrow_transactions_total` | Counter | Transactions by status |
| `katika_payout_amount_sum` | Histogram | Payout amounts |
| `katika_login_attempts_total` | Counter | Login attempts (success/fail) |
| `katika_rate_limit_hits_total` | Counter | Rate limit triggered |
| `katika_webhook_processing_seconds` | Histogram | Webhook processing time |
| `spring_datasource_hikari_*` | Gauge | Connection pool health |
| `jvm_memory_used_bytes` | Gauge | JVM heap/non-heap |

### Log Aggregation (Loki + Promtail)

All logs emit structured JSON via Logstash encoder:

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "INFO",
  "logger": "tech.bytesmind.katika.domain.service.EscrowDomainService",
  "message": "Escrow transaction locked",
  "traceId": "abc123def456",
  "userId": "uuid-here",
  "transactionId": "KT-2025-000001",
  "amount": 50000
}
```

**Useful Loki queries:**
```logql
# All errors in the last hour
{job="katika-api"} |= "level=ERROR" | json

# Failed logins
{job="katika-api"} |~ "LOGIN_FAILED|RATE_LIMIT"

# Escrow events for a specific transaction
{job="katika-api"} |= "KT-2025-000001"
```

### Alert Rules (Prometheus)

Pre-configured alerts in `prometheus/alerts.yml`:
- Login rate > 100/min → PagerDuty
- Webhook processing failure rate > 5% → Slack
- JVM heap > 85% → Warning
- Database connection pool exhausted → Critical
- Redis memory > 90% → Warning

---

## 10. Testing Strategy

### Layered Testing

```
        ┌──────────────────────┐
        │   E2E Tests          │  ← Playwright (critical user flows)
        ├──────────────────────┤
        │   Integration Tests  │  ← Testcontainers (PostgreSQL + Redis)
        ├──────────────────────┤
        │   Unit Tests         │  ← JUnit 5 + Mockito (domain logic)
        └──────────────────────┘
```

### Running Tests

```bash
# All tests
./gradlew test

# Unit tests only (fast)
./gradlew test --tests "tech.bytesmind.katika.domain.*"

# Integration tests (requires Docker)
./gradlew test --tests "tech.bytesmind.katika.*Integration*"

# With coverage report
./gradlew test jacocoTestReport
# Report: build/reports/jacoco/test/html/index.html
```

### Integration Test Setup

```java
@SpringBootTest(webEnvironment = RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
class EscrowIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("katika_test")
        .withUsername("katika")
        .withPassword("test");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }
}
```

---

## 11. API Reference

Full OpenAPI documentation available in development at: `http://localhost:8080/swagger-ui.html`

### Authentication

```http
# Seed CSRF token (call once on app init)
GET /bff/auth/csrf

# Login
POST /bff/auth/login
Content-Type: application/json
{ "username": "phone_or_email", "password": "secret" }

# MFA verification (if mfaRequired: true)
POST /bff/auth/mfa/verify
Content-Type: application/json
{ "code": "123456", "challengeToken": "..." }

# Refresh tokens
POST /bff/auth/refresh

# Logout
POST /bff/auth/logout

# Get current user (from cookie)
GET /bff/auth/me
```

### Escrow

```http
# Get escrow transaction
GET /escrow/{transactionId}

# Generate QR verification code (seller)
POST /escrow/{transactionId}/verification-code

# Release funds (buyer scans QR)
POST /escrow/{transactionId}/release
Content-Type: application/json
{ "verificationCode": "QR_CODE_CONTENT" }
```

### Disputes

```http
# Create dispute
POST /disputes
Content-Type: application/json
{ "transactionId": "KT-2025-000001", "reason": "ITEM_NOT_RECEIVED", "description": "..." }

# Upload evidence
POST /disputes/{disputeId}/evidence
Content-Type: multipart/form-data

# Resolve dispute (SUPPORT/ADMIN only)
POST /disputes/{disputeId}/resolve
{ "resolution": "FULL_REFUND_BUYER", "notes": "..." }
```

### Response Format

All API responses follow a consistent envelope:

```json
// Success
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-15T10:30:00Z"
}

// Error
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Wallet balance is insufficient for this operation",
    "details": { }
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## 12. Troubleshooting

### Common Issues

**Application fails to start: "RSA key must be ≥ 2048 bits"**
```bash
# Check key size
openssl rsa -in src/main/resources/certs/privateKey.pem -text -noout | grep "Key:"
# Regenerate if < 2048 bits
openssl genrsa -out src/main/resources/certs/privateKey.pem 4096
```

**Redis AUTH failure**
```bash
# Check ACL
docker compose exec redis redis-cli ACL LIST
# Verify password matches users.acl
docker compose exec redis redis-cli -a <password> PING
```

**Flyway migration failed: "Table already exists"**
```bash
# Check current migration state
./gradlew flywayInfo
# If out of sync, repair checksum (don't do this with real data!)
./gradlew flywayRepair
```

**CSRF token mismatch (403 on POST)**
```bash
# Angular: ensure /bff/auth/csrf is called on init
# Angular: ensure withCredentials: true on all requests
# Check cookie: XSRF-TOKEN should be present and non-HttpOnly
```

**WebSocket connection refused**
```bash
# Check SockJS endpoint is correct: /ws (not /ws/websocket)
# Check JWT is valid (not expired)
# Enable STOMP debug: client.debug = console.log
```

**JWT validation fails: "No matching key in JWKS"**
```bash
# Ensure public key matches private key
openssl rsa -in privateKey.pem -pubout | diff - publicKey.pem
# Check JWKS endpoint: GET /oauth2/jwks
```

### Health Checks

```bash
# Application health
curl http://localhost:8080/actuator/health | jq .

# Database connectivity
curl http://localhost:8080/actuator/health/db | jq .

# Redis connectivity
curl http://localhost:8080/actuator/health/redis | jq .

# Metrics
curl http://localhost:8080/actuator/prometheus | grep katika_
```

---

## License

Copyright © 2025 BytesMind Technology. All rights reserved.

---

> Built with security-first principles. Every architectural decision prioritizes the integrity of financial transactions and the privacy of user data.
