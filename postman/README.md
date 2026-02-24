# ResumeBuddy Postman E2E Setup

## Files
- [ResumeBuddy-E2E.postman_collection.json](ResumeBuddy-E2E.postman_collection.json)
- [ResumeBuddy-Production.postman_environment.json](ResumeBuddy-Production.postman_environment.json)

## Import Steps
1. Open Postman.
2. Import both files from this folder.
3. Select environment **ResumeBuddy Production**.
4. Fill required variables:
   - `email`, `password`
   - `adminApiKey` (for admin/metrics protected checks)
   - `resumeFilePath` (for multipart upload tests)
   - `emailVerificationCode`, `otpCode`, `resetCode` for manual OTP/verification flows

## Recommended Run Order (E2E)
1. `00 Health & Metrics`
2. `01 Auth` (`Login` if user already exists, otherwise `Register` then `Login`)
3. `02 Auth Extended`
4. `03 Resumes`
5. `04 Rate Limit`
6. `05 Notifications`
7. `06 Admin`
8. `07 Webhooks`
9. `08 WebSocket HTTP Endpoints`

## Notes
- Most protected endpoints use **session cookies** (`rb_session`), so keep requests on the same domain and run `Login` first.
- `accessToken` is captured but many routes rely on cookie auth, not bearer auth.
- `resumeId` is auto-populated from list/upload responses when available.
- Google callback and Razorpay webhook happy path require real provider values/signatures.

## Newman CLI (optional)
```bash
newman run postman/ResumeBuddy-E2E.postman_collection.json \
  -e postman/ResumeBuddy-Production.postman_environment.json \
  --reporters cli
```
