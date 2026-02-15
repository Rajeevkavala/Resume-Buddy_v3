# SaaS Platform with Free/Pro Tiers & Payment Integration

Transform ResumeBuddy into a monetized SaaS platform with tiered access (Free/Pro), implementing Razorpay and Stripe payment gateways. Free users get limited access (resume analysis, improvements, 2 exports/day), while Pro users get 10 AI credits/day with unlimited exports.

## Steps

1. **Create subscription type definitions and tier configuration** in new `src/lib/types/subscription.ts` - Define `SubscriptionTier`, `Subscription`, `TierLimits` interfaces, `TIER_LIMITS` constant with free (3 AI requests, 2 exports/day, limited templates) and pro (10 AI requests, unlimited exports) configurations.

2. **Extend rate limiter with tier-based limits** in `src/lib/rate-limiter.ts` - Add `getUserSubscriptionTier()` function, modify `checkRateLimitWithDailyLimit()` to accept tier parameter, create `getExportDailyLimit()` for tracking export counts separately from AI requests.

3. **Create subscription service layer** in new `src/lib/subscription-service.ts` - Implement `createSubscription()`, `getSubscription()`, `updateSubscription()`, `cancelSubscription()`, `checkFeatureAccess()` with Firestore persistence in `subscriptions/{userId}` collection.

4. **Integrate Stripe payment gateway** in new `src/lib/payments/stripe.ts` - Configure Stripe SDK, implement `createCheckoutSession()`, `createPortalSession()`, `handleWebhook()` for subscription lifecycle events (created, updated, canceled, payment_failed).

5. **Integrate Razorpay payment gateway** in new `src/lib/payments/razorpay.ts` - Configure Razorpay SDK, implement `createOrder()`, `verifyPayment()`, `createSubscription()`, `handleWebhook()` with signature verification.

6. **Create payment webhook API routes** - Add `src/app/api/webhooks/stripe/route.ts` and `src/app/api/webhooks/razorpay/route.ts` to handle payment events and update subscription status in Firestore.

7. **Add subscription-aware server actions** in `src/app/actions.ts` - Modify all AI actions to check tier before `enforceRateLimitAsync()`, add `latexCompileFromResumeText()` export limit tracking, create `createCheckoutAction()`, `cancelSubscriptionAction()`, `getSubscriptionStatusAction()`.

8. **Update frontend context with subscription state** in `src/context/auth-context.tsx` - Add `subscription`, `tier`, `limits`, `usage` to context, fetch subscription on auth state change, expose `canAccessFeature()`, `getRemainingCredits()` helper methods.

9. **Create pricing page UI** in new `src/app/pricing/page.tsx` - Display free/pro tier comparison cards, pricing ($9.99/month or ₹799/month), feature lists, CTA buttons linking to checkout with payment gateway selection (Stripe for international, Razorpay for India).

10. **Build checkout flow components** in new `src/app/checkout/` - Create payment gateway selection, Stripe Elements integration, Razorpay checkout modal, success/cancel pages, loading states.

11. **Create billing management page** in new `src/app/billing/page.tsx` - Show current plan, usage stats with progress bars, next billing date, payment method, upgrade/downgrade options, cancel subscription, invoice history.

12. **Add feature gating to UI components** - Update `src/components/analysis-tab.tsx`, `src/components/improvements-tab.tsx`, `src/components/interview-tab.tsx`, `src/components/qa-tab.tsx`, `src/components/latex-export-dialog.tsx` to check `canAccessFeature()` and show upgrade prompts when limits exceeded.

13. **Update middleware for new routes** in `middleware.ts` - Add `/pricing` to public routes, add `/checkout`, `/billing` to protected routes, handle subscription status redirects.

14. **Extend admin panel** in `src/app/admin/` - Add subscription management tab to view/modify user subscriptions, revenue analytics dashboard, payment history viewer, manual tier override capability.

## Further Considerations

1. **Payment gateway priority**: Auto-detect user region to default Razorpay for India (INR), Stripe for international (USD) — or let user choose?

2. **Free tier access model**: Remove whitelist requirement for free users (open registration) or keep whitelist + add paid upgrade path for approved users only?

3. **Grace period handling**: When Pro subscription fails payment, immediately downgrade to Free or allow 3-day grace period before feature restriction?

4. **Export watermark**: Add "Created with ResumeBuddy" watermark on Free tier exports, or just limit template selection?
