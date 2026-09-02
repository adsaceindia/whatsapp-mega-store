# WhatsApp Store SaaS Architecture & Functional Spec

## 1. Plan & Feature-Limit Matrix Proposal

Here is the proposed subscription tier structure:

| Feature / Plan | Free Trial (14 Days) | Starter | Growth | Pro |
| :--- | :--- | :--- | :--- | :--- |
| **Pricing (Monthly)** | $0 | $19 / mo | $49 / mo | $99 / mo |
| **Pricing (Annual 20% off)**| N/A | $182 / yr | $470 / yr | $950 / yr |
| **Max Products** | 50 | 500 | 5,000 | Unlimited |
| **Max Orders / Month** | 50 | 500 | 5,000 | Unlimited |
| **Max Staff Seats** | 1 (Admin only) | 3 | 10 | Unlimited |
| **Banners / Coupons** | 2 | 10 | 50 | Unlimited |
| **WhatsApp Numbers** | 1 | 1 | 2 | 5 (Multi-agent routing) |
| **Custom Domain** | No (Subdomain only) | No | Yes | Yes |
| **Analytics (GA4/Meta)** | No | No | Yes | Yes (+ Custom Head Scripts) |
| **"Powered By" Branding** | Forced | Forced | Removable | Removable |
| **Support** | Community/Docs | Standard Email | Priority Support | Dedicated Account Manager |

### Payment Gateway Confirmation
**Recommendation:** We should integrate **Stripe** as the primary billing engine for global capability (Stripe Billing handles subscriptions, proration, and dunning perfectly). If your primary target market is strictly India, **Razorpay Subscriptions** is the best choice due to UPI auto-pay and RBI compliance. 
*Please confirm if you want to proceed with Stripe, Razorpay, or build a dual-gateway abstraction from day one.*

---

## 2. Data Model Design (Schema Additions)

To support multi-tenancy, billing, and roles, we need to introduce the following core entities on top of the existing `Products`, `Orders`, and `Categories`:

*   **`users`**: `id`, `email`, `password_hash`, `role` (SUPER_ADMIN, STORE_ADMIN, STORE_STAFF), `store_id` (nullable), `status`, `mfa_secret`, `mfa_enabled`.
*   **`stores`**: `id`, `name`, `subdomain`, `custom_domain`, `domain_status` (PENDING, VERIFIED, ACTIVE), `status` (ACTIVE, SUSPENDED, PAST_DUE), `theme_settings` (JSON), `integration_settings` (JSON for GA4/Meta IDs).
*   **`plans`**: `id`, `name`, `monthly_price`, `annual_price`, `gateway_product_id`, `features` (JSON for limits).
*   **`subscriptions`**: `id`, `store_id`, `plan_id`, `status` (TRIALING, ACTIVE, PAST_DUE, CANCELED), `current_period_end`, `gateway_subscription_id`.
*   **`invoices`**: `id`, `store_id`, `subscription_id`, `amount`, `currency`, `status`, `gateway_invoice_id`, `pdf_url`.
*   **`audit_logs`**: `id`, `actor_id` (User), `store_id`, `action`, `resource_type`, `resource_id`, `ip_address`, `details` (JSON), `created_at`.
*   **`roles_permissions`**: For granular access, defining what `STORE_STAFF` can access (e.g., `READ_ORDERS`, `WRITE_PRODUCTS`).

---

## 3. Phased Implementation Plan

*   **Phase 1: Roles, Permissions & Multi-tenancy Core** (Tenant isolation, Super Admin vs Store Admin views, Impersonation logging).
*   **Phase 2: Subscription & Billing** (Gateway integration, Plan enforcement, Webhooks for trial expiry and payment failures).
*   **Phase 3: Domain Mapping** (Subdomain routing, Custom domain verification logic).
*   **Phase 4: Integrations & Analytics** (Injecting GA4/Meta scripts per store).
*   **Phase 5: Cross-Cutting** (Transactional emails, Staff invites, Audit logs UI).

---

## 4. Compliance & Constraints Flag

*   **PCI-DSS Compliance:** We will **never** touch or store raw credit card numbers. All payment collection will use Stripe Elements / Razorpay Checkout, which tokenizes cards directly with the gateway.
*   **Domain SSL:** Custom domain automated SSL requires an infrastructure provider that supports programmatic SSL (like Vercel Domains API, Cloudflare for SaaS, or AWS API Gateway). 
*   **Custom `<head>` Scripts:** Allowing raw script injection (for the Pro plan) is an XSS vector. This must be heavily sanitized or isolated to prevent malicious admins from hijacking the platform domain's cookies.

---

## 5. Security-First Architecture & Infrastructure

*   **Tenant Isolation:** All database queries must include a mandatory `WHERE store_id = ?` clause. We will implement Row-Level Security (RLS) if using PostgreSQL.
*   **MFA (Multi-Factor Authentication):** Implementing TOTP (Time-based One-Time Password) for all Super Admin and Store Admin accounts to prevent account takeovers.
*   **Encrypted Backups:** Database backups will be encrypted at rest using AES-256 and rotated on a 30-day lifecycle.
*   **Audit Trails:** Every financial and administrative operation writes an immutable record to the `audit_logs` table before the transaction commits.
*   **Testing Protocols:** Automated integration tests (using Jest/Supertest) targeting the webhook endpoints to simulate Stripe/Razorpay lifecycle events (payment_succeeded, payment_failed).

