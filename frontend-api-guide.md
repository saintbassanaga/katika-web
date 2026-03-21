# Katica — Frontend API Guide

> Base URL: `https://api.katica.app`
> Auth: JWT via `ACCESS_TOKEN` cookie (BFF flow) ou `Authorization: Bearer <token>` (SPA/mobile)
> Platform API: `X-Api-Key: ktk_live_...` header
> Format: `application/json` sauf multipart indiqué

---

## Table des matières

1. [Authentification (BFF)](#1-authentification-bff)
2. [Utilisateur](#2-utilisateur)
3. [Portefeuille](#3-portefeuille)
4. [Escrow](#4-escrow)
5. [Retraits (Payout)](#5-retraits-payout)
6. [Litiges](#6-litiges)
7. [Notifications](#7-notifications)
8. [MFA](#8-mfa)
9. [Vérification d'identité](#9-vérification-didentité)
10. [Portail Développeur](#10-portail-développeur)
11. [Admin](#11-admin)
12. [Support](#12-support)
13. [WebSocket](#13-websocket)
14. [Enums de référence](#14-enums-de-référence)

---

## 1. Authentification (BFF)

### Seed CSRF (appeler en premier)
```
GET /bff/csrf
```
Retourne un cookie `XSRF-TOKEN`. À inclure dans le header `X-XSRF-TOKEN` sur tous les POST/PATCH/DELETE.

**Response:** `204 No Content`

---

### Inscription
```
POST /api/auth/register
```
**Body:**
```json
{
  "phoneNumber": "+237670000000",
  "fullName": "Jean Dupont",
  "password": "motdepasse123",
  "email": "jean@example.com",
  "role": "BUYER"
}
```
| Champ | Type | Règles |
|---|---|---|
| `phoneNumber` | string | E.164, 9-15 chiffres, obligatoire |
| `fullName` | string | 2-100 chars, obligatoire |
| `password` | string | 6-128 chars, obligatoire |
| `email` | string | email valide, optionnel |
| `role` | `UserRole` | `BUYER` ou `SELLER` uniquement |

**Response `201`:**
```json
{
  "userId": "uuid",
  "fullName": "Jean Dupont",
  "role": "BUYER",
  "createdAt": "2026-03-13T10:00:00Z",
  "message": "..."
}
```

---

### Connexion
```
POST /bff/auth/login
```
**Body:**
```json
{
  "phoneNumber": "+237670000000",
  "password": "motdepasse123"
}
```

**Response `200` (sans MFA):**
```json
{
  "success": true,
  "requiresMfa": false,
  "userId": "uuid",
  "role": "BUYER",
  "message": "..."
}
```
→ Cookies `ACCESS_TOKEN` + `REFRESH_TOKEN` posés automatiquement.

**Response `200` (avec MFA):**
```json
{
  "success": false,
  "requiresMfa": true,
  "challengeId": "uuid",
  "mfaExpiresIn": 300,
  "mfaType": "TOTP"
}
```

---

### Vérification MFA
```
POST /bff/auth/mfa/verify
```
**Body:**
```json
{
  "challengeId": "uuid",
  "code": "123456",
  "backupCode": null
}
```
| Champ | Type | Règles |
|---|---|---|
| `challengeId` | string | obligatoire |
| `code` | string | 6 chiffres, obligatoire si pas de backupCode |
| `backupCode` | string | optionnel, alternatif au code TOTP |

**Response `200`:** cookies posés, même structure que login sans MFA.

---

### Rafraîchir le token
```
POST /bff/auth/refresh
```
Utilise le cookie `REFRESH_TOKEN` automatiquement. Pas de body.

**Response `200`:** nouveau `ACCESS_TOKEN` cookie.

---

### Déconnexion
```
POST /bff/auth/logout
```
Révoque le refresh token et supprime les cookies.

**Response `204`**

---

### Récupérer l'utilisateur connecté
```
GET /bff/auth/me
```
**Response `200`:**
```json
{
  "userId": "uuid",
  "fullName": "Jean Dupont",
  "role": "BUYER",
  "email": "j***@example.com",
  "mfaEnabled": true,
  "issuedAt": "2026-03-13T10:00:00Z",
  "expiresAt": "2026-03-13T11:00:00Z"
}
```

---

### Mot de passe oublié
```
POST /api/auth/forgot-password
```
**Body:**
```json
{ "email": "jean@example.com" }
```
**Response `200`** — toujours, même si l'email n'existe pas (anti-énumération).

---

### Réinitialiser le mot de passe
```
POST /api/auth/reset-password
```
**Body:**
```json
{
  "token": "token-reçu-par-email",
  "newPassword": "nouveau123",
  "confirmPassword": "nouveau123"
}
```
| Champ | Type | Règles |
|---|---|---|
| `token` | string | obligatoire |
| `newPassword` | string | 6-128 chars, obligatoire |
| `confirmPassword` | string | doit correspondre à newPassword |

**Response `200`**

---

## 2. Utilisateur

### Mon profil
```
GET /api/users/me
```
**Response `200`:**
```json
{
  "id": "uuid",
  "fullName": "Jean Dupont",
  "phone": "+237***0000",
  "email": "j***@example.com",
  "emailVerified": false,
  "cniProvided": false,
  "role": "BUYER",
  "verified": false,
  "mfaEnabled": false,
  "addressStreet": null,
  "addressCity": null,
  "addressRegion": null,
  "addressCountry": null,
  "addressPostalCode": null,
  "profileComplete": false,
  "createdAt": "2026-03-13T10:00:00Z",
  "updatedAt": "2026-03-13T10:00:00Z"
}
```

---

### Mettre à jour le profil
```
PATCH /api/users/me
```
**Body (tous les champs optionnels):**
```json
{
  "fullName": "Jean Dupont",
  "email": "jean@example.com",
  "cniNumber": "123456789",
  "addressStreet": "Rue de la Paix",
  "addressCity": "Douala",
  "addressRegion": "Littoral",
  "addressCountry": "CM",
  "addressPostalCode": "12345"
}
```

**Response `200`:** `UserProfileResponse` (voir ci-dessus).

---

### Changer le mot de passe
```
PATCH /api/users/me/password
```
**Body:**
```json
{
  "currentPassword": "ancienMotDePasse",
  "newPassword": "nouveauMotDePasse",
  "confirmPassword": "nouveauMotDePasse"
}
```
**Response `200`**

---

## 3. Portefeuille

### Mon portefeuille
```
GET /api/wallet
```
**Response `200`:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "balance": "45000.00",
  "frozenAmount": "10000.00",
  "totalAmount": "55000.00",
  "currency": "XAF",
  "updatedAt": "2026-03-13T10:00:00Z"
}
```

---

### Historique des mouvements
```
GET /api/wallet/movements?type=ESCROW_FREEZE,PAYOUT_DEBIT&page=0&size=20
```
| Param | Type | Défaut |
|---|---|---|
| `type` | string (virgule-séparé) | tous |
| `page` | int | 0 |
| `size` | int | 20 (max 100) |

**Response `200`:** `PageResponse<WalletMovementResponse>`
```json
{
  "content": [
    {
      "id": "uuid",
      "movementType": "ESCROW_FREEZE",
      "amount": "10000.00",
      "balanceBefore": "55000.00",
      "balanceAfter": "45000.00",
      "frozenBefore": "0.00",
      "frozenAfter": "10000.00",
      "relatedTransactionId": "uuid",
      "relatedTransactionType": "ESCROW",
      "description": "Gel escrow KT-2026-ABC123",
      "createdAt": "2026-03-13T10:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3,
  "first": true,
  "last": false
}
```

---

## 4. Escrow

### Créer une transaction
```
POST /api/escrow
```
**Body:**
```json
{
  "buyerPhone": "+237670000000",
  "grossAmount": 10000,
  "description": "iPhone 13 Pro",
  "deliveryDeadline": "2026-03-20T23:59:59Z",
  "idempotencyKey": "clé-unique-optionnelle",
  "sellerId": null
}
```
| Champ | Type | Règles |
|---|---|---|
| `buyerPhone` | string | E.164, obligatoire |
| `grossAmount` | number | entier, min 25, max 10 000 000, obligatoire |
| `description` | string | max 500 chars, optionnel |
| `deliveryDeadline` | ISO 8601 | optionnel |
| `idempotencyKey` | string | max 100 chars, optionnel — retry safe |
| `sellerId` | UUID | optionnel — Platform API uniquement |

**Response `201`:** `EscrowTransactionResponse`
```json
{
  "id": "uuid",
  "reference": "KT-2026-ABC123",
  "buyerId": "uuid",
  "buyerName": "Marie Acheteur",
  "sellerId": "uuid",
  "sellerName": "Jean Vendeur",
  "grossAmount": "10000.00",
  "platformFee": "300.00",
  "netAmount": "9700.00",
  "currency": "XAF",
  "status": "INITIATED",
  "activeDisputeId": null,
  "createdAt": "2026-03-13T10:00:00Z",
  "lockedAt": null,
  "shippedAt": null,
  "deliveredAt": null,
  "releasedAt": null,
  "disputedAt": null,
  "refundedAt": null
}
```

---

### Lister mes transactions
```
GET /api/escrow?status=LOCKED,SHIPPED&page=0&size=20&actorId=<uuid>
```
| Param | Type | Défaut |
|---|---|---|
| `status` | string (virgule-séparé) | tous |
| `page` | int | 0 |
| `size` | int | 20 (max 100) |
| `actorId` | UUID | optionnel — Platform API |

**Response `200`:** `PageResponse<EscrowTransactionResponse>`

---

### Détail d'une transaction
```
GET /api/escrow/{transactionId}?actorId=<uuid>
```
**Response `200`:** `EscrowTransactionResponse`
**Response `404`:** transaction non trouvée ou accès refusé

---

### Générer le QR code (vendeur)
```
POST /api/escrow/{transactionId}/verification-code?actorId=<uuid>
```
**Response `200`:**
```json
{ "verificationCode": "ABCD1234" }
```

---

### Scanner le QR code (acheteur)
```
POST /api/escrow/verification-code/scan
```
**Body:**
```json
{
  "transactionId": "uuid",
  "code": "ABCD1234",
  "deviceId": "optionnel",
  "location": "optionnel"
}
```
**Response `200`:** `EscrowTransactionResponse` avec status `RELEASED`

---

### Libérer les fonds
```
POST /api/escrow/{transactionId}/release
```
**Body:**
```json
{
  "verificationCode": "ABCD1234",
  "actorId": null
}
```
**Response `200`:** `EscrowTransactionResponse`

---

### Marquer comme expédié (vendeur)
```
POST /api/escrow/{transactionId}/ship?actorId=<uuid>
```
**Response `200`:** `EscrowTransactionResponse` avec status `SHIPPED`

---

### Confirmer réception (acheteur)
```
POST /api/escrow/{transactionId}/deliver?actorId=<uuid>
```
**Response `200`:** `EscrowTransactionResponse` avec status `DELIVERED`

---

### Annuler
```
POST /api/escrow/{transactionId}/cancel?actorId=<uuid>
```
**Response `200`:** `EscrowTransactionResponse` avec status `CANCELLED` ou `REFUNDED`

---

### Cycle de vie — statuts
```
INITIATED → LOCKED → SHIPPED → DELIVERED → RELEASED
                  ↘ CANCELLED / REFUNDED
                  ↘ DISPUTED → RESOLVED_BUYER | RESOLVED_SELLER | RESOLVED_SPLIT
```

---

## 5. Retraits (Payout)

### Demander un retrait
```
POST /api/payouts
```
**Body:**
```json
{
  "destinationPhone": "+237670000000",
  "amount": 5000,
  "userId": null
}
```
| Champ | Type | Règles |
|---|---|---|
| `destinationPhone` | string | E.164, obligatoire |
| `amount` | number | positif, obligatoire |
| `userId` | UUID | optionnel — Platform API |

**Response `201`:** `PayoutRequestResponse`
```json
{
  "id": "uuid",
  "reference": "PO-2026-XYZ789",
  "userId": "uuid",
  "destinationPhone": "+237670000000",
  "operator": "MTN",
  "amount": "5000.00",
  "platformFee": "0.00",
  "providerFee": "50.00",
  "fee": "50.00",
  "netAmount": "4950.00",
  "actualProviderFee": null,
  "currency": "XAF",
  "status": "OTP_SENT",
  "failureReason": null,
  "createdAt": "2026-03-13T10:00:00Z",
  "otpSentAt": "2026-03-13T10:00:00Z",
  "otpValidatedAt": null,
  "submittedAt": null,
  "completedAt": null,
  "failedAt": null
}
```

---

### Lister mes retraits
```
GET /api/payouts?status=COMPLETED,FAILED&page=0&size=20&actorId=<uuid>
```
**Response `200`:** `PageResponse<PayoutRequestResponse>`

---

### Détail d'un retrait
```
GET /api/payouts/{payoutId}?actorId=<uuid>
```
**Response `200`:** `PayoutRequestResponse`

---

### Valider l'OTP
```
POST /api/payouts/{payoutRequestId}/otp?actorId=<uuid>
```
**Body:**
```json
{ "code": "123456" }
```
| Champ | Type | Règles |
|---|---|---|
| `code` | string | exactement 6 chiffres |

**Response `200`:** `PayoutRequestResponse` avec status `OTP_VALIDATED`

---

### Soumettre le retrait
```
POST /api/payouts/{payoutRequestId}/submit?actorId=<uuid>
```
**Response `200`:** `PayoutRequestResponse` avec status `PROCESSING`

---

### Cycle de vie — statuts
```
PENDING → OTP_SENT → OTP_VALIDATED → PROCESSING → COMPLETED
                                               ↘ FAILED
```

---

## 6. Litiges

### Ouvrir un litige
```
POST /api/disputes
```
**Body:**
```json
{
  "transactionId": "uuid",
  "initiatorId": null,
  "initiatorRole": "BUYER",
  "reason": "NOT_RECEIVED",
  "description": "Je n'ai pas reçu ma commande après 10 jours.",
  "claimedAmount": 10000
}
```
| Champ | Type | Règles |
|---|---|---|
| `transactionId` | UUID | obligatoire |
| `initiatorId` | UUID | optionnel — Platform API |
| `initiatorRole` | `TransactionRole` | `BUYER` ou `SELLER`, obligatoire |
| `reason` | `DisputeReason` | obligatoire |
| `description` | string | max 2000 chars, obligatoire |
| `claimedAmount` | number | optionnel |

**Response `201`:** `DisputeResponse`

---

### Lister mes litiges
```
GET /api/disputes?page=0&size=20&actorId=<uuid>
```
**Response `200`:** `PageResponse<DisputeResponse>`

---

### Détail d'un litige
```
GET /api/disputes/{disputeId}?actorId=<uuid>
```
**Response `200`:**
```json
{
  "id": "uuid",
  "reference": "DSP-2026-ABC123",
  "transactionId": "uuid",
  "transactionRef": "KT-2026-ABC123",
  "initiatorId": "uuid",
  "initiatorRole": "BUYER",
  "reason": "NOT_RECEIVED",
  "description": "...",
  "claimedAmount": "10000.00",
  "status": "UNDER_REVIEW",
  "resolutionType": null,
  "refundedToBuyer": null,
  "releasedToSeller": null,
  "arbitrationFee": null,
  "submissionDeadline": null,
  "buyerArbitrationFeePaid": false,
  "sellerArbitrationFeePaid": false,
  "buyerName": "Marie Acheteur",
  "sellerName": "Jean Vendeur",
  "grossAmount": "10000.00",
  "currency": "XAF",
  "createdAt": "2026-03-13T10:00:00Z",
  "resolvedAt": null,
  "messages": []
}
```

---

### Soumettre une preuve
```
POST /api/disputes/{disputeId}/evidence
Content-Type: multipart/form-data
```
**Fields:**
| Champ | Type | Règles |
|---|---|---|
| `file` | file | image/vidéo/PDF, max 10 MB |
| `evidenceType` | string | `IMAGE`, `VIDEO`, `DOCUMENT`, `SCREENSHOT` |
| `description` | string | optionnel |

**Response `201`:** `DisputeEvidenceResponse`
```json
{
  "id": "uuid",
  "disputeId": "uuid",
  "uploaderId": "uuid",
  "uploaderName": "Marie Acheteur",
  "uploaderRole": "BUYER",
  "evidenceType": "IMAGE",
  "originalFileName": "photo.jpg",
  "storagePath": "...",
  "fileSize": 204800,
  "description": "Photo du colis vide",
  "verified": false,
  "createdAt": "2026-03-13T10:00:00Z"
}
```

---

### Messages d'un litige
```
GET /api/disputes/{disputeId}/messages
```
**Response `200`:** `List<DisputeMessageResponse>`
```json
[
  {
    "id": "uuid",
    "disputeId": "uuid",
    "senderId": "uuid",
    "senderName": "Marie Acheteur",
    "senderRole": "BUYER",
    "content": "Voici mes preuves.",
    "messageType": "USER_MESSAGE",
    "internalOnly": false,
    "attachmentCount": 0,
    "createdAt": "2026-03-13T10:00:00Z"
  }
]
```

---

### Payer les frais d'arbitrage
```
POST /api/disputes/{disputeId}/arbitration/submit
```
**Response `200`:** `DisputeResponse` avec status `AWAITING_ARBITRATION_PAYMENT`

---

### Cycle de vie — statuts
```
OPENED → UNDER_REVIEW → AWAITING_BUYER
                     ↘ AWAITING_SELLER
                     ↘ AWAITING_ARBITRATION_PAYMENT → REFERRED_TO_ARBITRATION
→ RESOLVED_BUYER | RESOLVED_SELLER | RESOLVED_SPLIT | CLOSED_NO_ACTION | CANCELLED
```

---

## 7. Notifications

### Mes notifications
```
GET /api/notifications?page=0&size=20
```
**Response `200`:** `PageResponse<AppNotificationResponse>`
```json
{
  "content": [
    {
      "id": "uuid",
      "type": "ESCROW_LOCKED",
      "title": "Paiement reçu",
      "body": "Le paiement pour KT-2026-ABC123 a été confirmé.",
      "entityId": "uuid",
      "entityReference": "KT-2026-ABC123",
      "read": false,
      "createdAt": "2026-03-13T10:00:00Z",
      "readAt": null
    }
  ],
  "page": 0, "size": 20, "totalElements": 5, "totalPages": 1,
  "first": true, "last": true
}
```

---

### Nombre de non-lus
```
GET /api/notifications/unread-count
```
**Response `200`:**
```json
{ "count": 3 }
```

---

### Marquer comme lu
```
PATCH /api/notifications/{id}/read
```
**Response `200`**

---

### Tout marquer comme lu
```
PATCH /api/notifications/read-all
```
**Response `204`**

---

## 8. MFA

### Statut MFA
```
GET /api/mfa/status
```
**Response `200`:**
```json
{ "enabled": true }
```

---

### Initier la configuration
```
GET /api/mfa/setup
```
**Response `200`:**
```json
{
  "secretKey": "BASE32SECRETKEY",
  "qrCodeDataUrl": "data:image/png;base64,...",
  "backupCodes": ["code1", "code2", "...8 codes"],
  "message": "Scannez le QR code avec votre application d'authentification"
}
```

---

### Confirmer l'activation
```
POST /api/mfa/confirm
```
**Body:**
```json
{
  "code": "123456",
  "backupCode": null
}
```
**Response `200`**

---

### Désactiver le MFA
```
POST /api/mfa/disable
```
**Body:** même structure que confirm
**Response `200`**

---

## 9. Vérification d'identité

### Soumettre une demande
```
POST /api/users/me/verification
Content-Type: multipart/form-data
```
**Fields:**
| Champ | Type |
|---|---|
| `bill1` | file (facture d'eau/électricité/téléphone) |
| `bill2` | file (deuxième justificatif) |

**Response `201`:** `VerificationRequestResponse`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "status": "PENDING",
  "notes": null,
  "rejectionReason": null,
  "bill1Uploaded": true,
  "bill2Uploaded": true,
  "reviewedBy": null,
  "submittedAt": "2026-03-13T10:00:00Z",
  "reviewedAt": null
}
```

---

### Statut de ma demande
```
GET /api/users/me/verification
```
**Response `200`:** `VerificationRequestResponse`

---

## 10. Portail Développeur

> Nécessite un compte Katica authentifié.

### Créer une application
```
POST /api/developer/applications
```
**Body:**
```json
{
  "name": "MonMarché App",
  "description": "Marketplace de vêtements",
  "websiteUrl": "https://monmarche.cm",
  "logoUrl": "https://monmarche.cm/logo.png",
  "organizationName": "MonMarché SARL",
  "organizationSize": "1-10",
  "industry": "ECOMMERCE",
  "useCase": "Escrow pour achats marketplace",
  "contactEmail": "dev@monmarche.cm",
  "contactPhone": "+237670000000",
  "termsAccepted": true,
  "termsVersion": "1.0",
  "requestedScopes": ["escrow:write", "payout:write"],
  "webhookUrl": "https://monmarche.cm/webhooks/katica",
  "initialKeyName": "Production Key",
  "initialKeyEnvironment": "PRODUCTION"
}
```

**Response `201`:** `ApplicationResponse` avec `initialApiKey` — **à stocker immédiatement, ne sera plus affiché**

---

### Mes applications
```
GET /api/developer/applications
```
**Response `200`:** `List<ApplicationResponse>`

---

### Détail
```
GET /api/developer/applications/{appId}
```
**Response `200`:** `ApplicationResponse`
```json
{
  "id": "uuid",
  "ownerId": "uuid",
  "name": "MonMarché App",
  "status": "ACTIVE",
  "tier": "FREE",
  "authStrategy": "API_KEY",
  "allowedScopes": ["escrow:write", "payout:write"],
  "rateLimitPerHour": 100,
  "rateLimitPerDay": 1000,
  "webhookUrl": "https://monmarche.cm/webhooks/katica",
  "webhookSecretConfigured": true,
  "oauth2ClientId": null,
  "createdAt": "2026-03-13T10:00:00Z"
}
```

---

### Mettre à jour
```
PATCH /api/developer/applications/{appId}
```
**Body (tous optionnels):**
```json
{
  "name": "Nouveau nom",
  "description": "...",
  "websiteUrl": "...",
  "webhookUrl": "..."
}
```

---

### Créer une clé API
```
POST /api/developer/applications/{appId}/keys
```
**Body:**
```json
{
  "name": "Clé mobile",
  "environment": "PRODUCTION"
}
```
**Response `201`:** `ApiKeyResponse` avec `secret` — **une seule fois**
```json
{
  "id": "uuid",
  "applicationId": "uuid",
  "name": "Clé mobile",
  "keyPrefix": "ktk_live_XXXXXXXXX",
  "environment": "PRODUCTION",
  "active": true,
  "lastUsedAt": null,
  "expiresAt": null,
  "createdAt": "2026-03-13T10:00:00Z",
  "secret": "ktk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

---

### Lister les clés
```
GET /api/developer/applications/{appId}/keys
```
**Response `200`:** `List<ApiKeyResponse>` — `secret` toujours null ici

---

### Rotation d'une clé
```
POST /api/developer/applications/{appId}/keys/{keyId}/rotate
```
**Response `200`:** `ApiKeyResponse` avec nouveau `secret` — **une seule fois**

---

### Révoquer une clé
```
DELETE /api/developer/applications/{appId}/keys/{keyId}
```
**Response `204`**

---

### Régénérer le secret webhook
```
POST /api/developer/applications/{appId}/webhook-secret
```
**Response `200`:**
```json
{ "webhookSecret": "whs_XXXXXXXXXXXXXXXXXXXXXXXX" }
```
Secret affiché **une seule fois**.

---

## 11. Admin

> Rôle requis: `ADMIN` ou `SUPERVISOR`

### Dashboard
```
GET /api/admin/dashboard
```
**Response `200`:**
```json
{
  "totalUsers": 1250,
  "activeUsers": 1100,
  "totalBuyers": 800,
  "totalSellers": 400,
  "totalStaff": 50,
  "totalTransactions": 3200,
  "initiatedTransactions": 50,
  "lockedTransactions": 120,
  "releasedTransactions": 2800,
  "disputedTransactions": 30,
  "cancelledTransactions": 200,
  "totalVolumeReleased": "128500000.00",
  "totalDisputes": 85,
  "openDisputes": 12,
  "underReviewDisputes": 20,
  "referredToArbitrationDisputes": 3,
  "resolvedDisputes": 50
}
```

---

### Utilisateurs
```
GET /api/admin/users?role=BUYER&active=true&page=0&size=20
GET /api/admin/users/{userId}
```
**Response:** `UserAdminResponse`
```json
{
  "id": "uuid",
  "fullName": "Jean Dupont",
  "role": "BUYER",
  "verified": true,
  "active": true,
  "deleted": false,
  "createdAt": "2026-03-13T10:00:00Z",
  "updatedAt": "2026-03-13T10:00:00Z",
  "lastLoginAt": "2026-03-13T09:00:00Z"
}
```

---

### Créer un agent support
```
POST /api/admin/users/staff
```
**Body:**
```json
{
  "phoneNumber": "+237670000001",
  "fullName": "Agent Support",
  "password": "password123",
  "email": "agent@katica.app",
  "role": "SUPPORT"
}
```
| `role` | Valeurs autorisées |
|---|---|
| | `SUPPORT`, `SUPERVISOR` |

---

### Activer / Désactiver un utilisateur
```
PATCH /api/admin/users/{userId}/activate
PATCH /api/admin/users/{userId}/deactivate
```
**Response `200`**

---

### Supprimer (soft-delete)
```
DELETE /api/admin/users/{userId}
```
**Response `200`**

---

### Transactions
```
GET /api/admin/transactions?status=DISPUTED&page=0&size=20
GET /api/admin/transactions/{transactionId}
```
**Response:** `EscrowTransactionResponse`

---

### Litiges
```
GET /api/admin/disputes?status=UNDER_REVIEW&page=0&size=20
GET /api/admin/disputes/unassigned
GET /api/admin/disputes/{disputeId}
```

---

### Assigner un litige
```
POST /api/admin/disputes/{disputeId}/assign
```
**Body:**
```json
{ "agentId": "uuid" }
```

---

### Désassigner
```
POST /api/admin/disputes/{disputeId}/unassign
```

---

### Résoudre un litige (Admin/Support/Supervisor)
```
POST /api/disputes/{disputeId}/resolve
```
**Body:**
```json
{
  "resolutionType": "FULL_REFUND_BUYER",
  "actorId": "uuid-agent-ou-admin",
  "sellerPercent": null
}
```
| `resolutionType` | Description |
|---|---|
| `FULL_REFUND_BUYER` | 100% remboursé à l'acheteur |
| `PARTIAL_REFUND_BUYER` | Montant réclamé à l'acheteur, reste au vendeur |
| `RELEASE_TO_SELLER` | 100% au vendeur (moins frais) |
| `SPLIT_50_50` | 50/50 |
| `CUSTOM_RATIO` | `sellerPercent` requis (0-100) |
| `NO_ACTION` | Fonds libérés au vendeur, litige fermé |

---

### Vérifications d'identité (Admin)
```
GET /api/admin/verifications?status=PENDING&page=0&size=20
GET /api/admin/verifications/{requestId}
PATCH /api/admin/verifications/{requestId}/start-review
PATCH /api/admin/verifications/{requestId}/review
```
**Body pour review:**
```json
{
  "decision": "APPROVED",
  "rejectionReason": null
}
```

---

### Applications développeur (Admin)
```
GET /api/admin/developer/applications?page=0&size=20
POST /api/admin/developer/applications/{appId}/approve
POST /api/admin/developer/applications/{appId}/suspend
POST /api/admin/developer/applications/{appId}/revoke
POST /api/admin/developer/applications/{appId}/tier
POST /api/admin/developer/applications/{appId}/scopes
```
**Body suspend:**
```json
{ "reason": "Violation des conditions d'utilisation", "notes": null }
```
**Body tier:**
```json
{ "tier": "PROFESSIONAL" }
```
**Body scopes:**
```json
{ "scopes": ["escrow:write", "payout:write", "dispute:read"] }
```

---

## 12. Support

> Rôle requis: `SUPPORT` ou `SUPERVISOR`

### Mes litiges assignés
```
GET /api/support/disputes?page=0&size=20
```
Retourne les litiges assignés à l'agent + le pool non-assigné.

---

### Détail
```
GET /api/support/disputes/{disputeId}
GET /api/support/disputes/{disputeId}/transaction
```

---

### Mettre à jour le statut
```
PATCH /api/support/disputes/{disputeId}/status
```
**Body:**
```json
{
  "status": "AWAITING_BUYER",
  "note": "En attente des preuves de l'acheteur"
}
```
| Transitions autorisées |
|---|
| `UNDER_REVIEW` → `AWAITING_BUYER` |
| `UNDER_REVIEW` → `AWAITING_SELLER` |

---

### Notes internes
```
PATCH /api/support/disputes/{disputeId}/notes
```
**Body:**
```json
{ "notes": "L'acheteur a fourni des preuves insuffisantes." }
```

---

## 13. WebSocket

### Connexion STOMP
```
ws://api.katica.app/ws
```
Headers: `Authorization: Bearer <token>`

### Souscrire aux notifications
```
SUBSCRIBE /user/{userId}/queue/notifications
```
Reçoit les `AppNotificationResponse` en temps réel.

### Souscrire aux messages de litige
```
SUBSCRIBE /topic/dispute/{disputeId}
```

### Envoyer un message
```
SEND /app/dispute/{disputeId}/message
```
**Body:**
```json
{
  "content": "J'ai bien reçu la commande.",
  "internalOnly": false
}
```

### Indicateur de frappe
```
SEND /app/dispute/{disputeId}/typing
```
**Body:**
```json
{ "typing": true }
```

### Accusé de lecture
```
SEND /app/dispute/{disputeId}/read
```

---

## 14. Enums de référence

### `UserRole`
| Valeur | Description |
|---|---|
| `BUYER` | Acheteur uniquement |
| `SELLER` | Vendeur uniquement |
| `BOTH` | Acheteur et vendeur |
| `ADMIN` | Administrateur plateforme |
| `SUPPORT` | Agent support |
| `SUPERVISOR` | Superviseur support |

### `TransactionStatus`
| Valeur | Description |
|---|---|
| `INITIATED` | Créée, paiement en attente |
| `LOCKED` | Paiement confirmé, fonds gelés |
| `SHIPPED` | Vendeur a expédié |
| `DELIVERED` | Acheteur a confirmé réception |
| `RELEASED` | Fonds libérés au vendeur |
| `DISPUTED` | Litige ouvert |
| `REFUNDED` | Remboursé à l'acheteur |
| `CANCELLED` | Annulée |
| `EXPIRED` | Expirée |

### `PayoutStatus`
| Valeur | Description |
|---|---|
| `PENDING` | En attente |
| `OTP_SENT` | OTP envoyé |
| `OTP_VALIDATED` | OTP validé |
| `PROCESSING` | Soumis au provider |
| `COMPLETED` | Virement effectué |
| `FAILED` | Échec |
| `CANCELLED` | Annulé |

### `DisputeStatus`
| Valeur | Description |
|---|---|
| `OPENED` | Ouvert |
| `UNDER_REVIEW` | En cours d'examen |
| `AWAITING_BUYER` | En attente de l'acheteur |
| `AWAITING_SELLER` | En attente du vendeur |
| `AWAITING_ARBITRATION_PAYMENT` | En attente paiement frais arbitrage |
| `REFERRED_TO_ARBITRATION` | Transmis à l'arbitrage |
| `RESOLVED_BUYER` | Résolu en faveur de l'acheteur |
| `RESOLVED_SELLER` | Résolu en faveur du vendeur |
| `RESOLVED_SPLIT` | Résolu avec partage |
| `CLOSED_NO_ACTION` | Fermé sans action |
| `CANCELLED` | Annulé |

### `DisputeReason`
`NOT_RECEIVED` · `LATE_DELIVERY` · `WRONG_ADDRESS` · `PARTIAL_DELIVERY` · `NOT_AS_DESCRIBED` · `DEFECTIVE` · `COUNTERFEIT` · `WRONG_ITEM` · `QUALITY_ISSUE` · `SERVICE_NOT_RENDERED` · `SERVICE_INCOMPLETE` · `SERVICE_UNSATISFACTORY` · `SELLER_UNRESPONSIVE` · `BUYER_UNRESPONSIVE` · `OVERCHARGED` · `HIDDEN_FEES` · `SUSPECTED_FRAUD` · `UNAUTHORIZED_TRANSACTION` · `OTHER`

### `MobileOperator`
`MTN` · `ORANGE` · `AIRTEL` · `MOOV` · `WAVE` · `VODACOM` · `VODAFONE` · `TIGO` · `ZAMTEL`

### `MovementType` (wallet)
`ESCROW_FREEZE` · `ESCROW_UNFREEZE` · `ESCROW_CREDIT` · `REFUND_UNFREEZE` · `REFUND_CREDIT` · `DISPUTE_FREEZE` · `DISPUTE_REFUND_BUYER` · `DISPUTE_RELEASE_SELLER` · `DISPUTE_SPLIT_BUYER` · `DISPUTE_SPLIT_SELLER` · `PAYOUT_DEBIT` · `PAYOUT_REVERSAL` · `PAYOUT_FAILED_REFUND` · `DEPOSIT_CREDIT` · `PLATFORM_FEE_CREDIT`

### `NotificationType`
`ESCROW_LOCKED` · `ESCROW_SHIPPED` · `ESCROW_DELIVERED` · `ESCROW_RELEASED` · `ESCROW_DISPUTED` · `ESCROW_CANCELLED` · `ESCROW_REFUNDED` · `PAYOUT_COMPLETED` · `PAYOUT_FAILED` · `VERIFICATION_APPROVED` · `VERIFICATION_REJECTED`

### `ApiKeyEnvironment`
| Valeur | Clé format |
|---|---|
| `SANDBOX` | `ktk_test_...` |
| `PRODUCTION` | `ktk_live_...` |

### `ApiKeyTier`
| Valeur | Limite/heure | Limite/jour |
|---|---|---|
| `FREE` | 100 | 1 000 |
| `BASIC` | 500 | 10 000 |
| `PROFESSIONAL` | 2 000 | 100 000 |
| `ENTERPRISE` | 10 000 | illimité |

---

## Codes d'erreur HTTP

| Code | Signification |
|---|---|
| `400` | Validation échouée — voir `errors[]` dans la réponse |
| `401` | Non authentifié |
| `403` | Accès refusé (mauvais rôle ou propriétaire) |
| `404` | Ressource non trouvée |
| `409` | Conflit (doublon, état incompatible) |
| `422` | État de la ressource invalide pour cette opération |
| `429` | Trop de requêtes (rate limit) — header `Retry-After` présent |
| `500` | Erreur serveur |

**Format erreur:**
```json
{
  "timestamp": "2026-03-13T10:00:00Z",
  "status": 422,
  "error": "INVALID_TRANSACTION_STATE",
  "message": "La transaction n'est pas dans l'état requis.",
  "path": "/api/escrow/uuid/release"
}
```
