# Namify Domains Inc. (manage.get.tech) — Domain & DNS Record Linking Guide
**Production Domain Routing for ResumeBuddy v3: Vercel Frontend + AWS EC2 Graviton Backend**

---

## 📌 Architecture & DNS Mapping Topology

The domain `resume-buddy.tech` is registered with **Namify Domains Inc.** (managed via the Radix portal at [manage.get.tech](https://manage.get.tech)). Traffic is routed as follows:

```
                          Namify Domains Inc. (manage.get.tech)
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  │                       │                       │
                  ▼                       ▼                       ▼
          resume-buddy.tech              www                     api
             [A Record]              [CNAME Record]           [A Record]
                  │                       │                       │
                  │ (Apex 307 Redirect)   │ (Canonical App)       │ (LaTeX & WebSocket)
                  ▼                       ▼                       ▼
          ┌───────────────────────────────────────┐       ┌───────────────────────┐
          │         Vercel Global Edge CDN        │       │ AWS EC2 Graviton      │
          │         (resume-buddy-v3)             │       │ ap-south-1 (Mumbai)   │
          │         76.76.21.21 / CNAME           │       │ 13.207.140.19         │
          └───────────────────────────────────────┘       └───────────────────────┘
```

---

## 🎯 Target Endpoints & Verified Production Status

| Subdomain / URL | Target Service | Hosting Platform | Target IP / Canonical Value | Status |
|---|---|---|---|---|
| `https://resume-buddy.tech` | Apex Frontend (307 Redirect to `www`) | **Vercel** | `76.76.21.21` (or `216.198.79.1`) | ✅ **Verified & Live** |
| `https://www.resume-buddy.tech` | Primary Next.js Web App | **Vercel** | `cname.vercel-dns.com` | ✅ **Verified & Live** |
| `http://api.resume-buddy.tech` (➔ `https://`) | LaTeX PDF (`/v1/resume/latex/compile`) & Realtime WS (`/socket.io`) | **AWS EC2 Graviton (`ap-south-1`)** | **`13.207.140.19`** (Instance: `i-0a7b170d82c9c9d23`) | 🚀 **AWS EC2 Live & Ready** |

---

## 🛠️ Step 1: Log in to Namify Control Panel (`manage.get.tech`)

1. Open your browser and navigate to: **[https://manage.get.tech](https://manage.get.tech)** (or the Namify customer login portal).
2. Enter your **Customer Email / Username** and **Password**.
3. Once logged in, go to the top navigation bar or sidebar and click **Manage Orders** ➔ **List / Search Orders** (or **My Domains**).
4. Locate `resume-buddy.tech` in the domain list and click on the domain name to enter its **Order Details** dashboard.

---

## 🛠️ Step 2: Verify Active Name Servers

Before configuring DNS records, confirm that your domain is using Namify's default DNS service:

1. In the domain dashboard, look at the **Name Servers** section.
2. Ensure the nameservers are set to **Namify / Radix Default Name Servers** (e.g., `ns1.radix-dns.com`, `ns2.radix-dns.com` or `ns1.namify.com`).

---

## 🛠️ Step 3: Access the DNS Management Zone

1. On the right-hand panel of the domain details page, locate the **DNS Management** widget.
2. Click **Manage DNS**.
3. A popup or management window titled **DNS Service Interface** will appear.

---

## 🛠️ Step 4: Configure the Exact DNS Records

In the **DNS Management** window, ensure the following records are set:

### 1. Backend API & WebSocket Subdomain (`api`) ➔ AWS EC2 Elastic IP

* Click **Add A Record** (or edit the existing `api` record):
  * **Host Name:** `api`
  * **Destination IPv4 Address:** **`13.207.140.19`**
  * **TTL:** `3600` *(or lowest selectable value)*
* Click **Save** / **Add Record**.

---

### 2. Primary Frontend Subdomain (`www`) ➔ Vercel

* Click **Add CNAME Record** (or verify existing):
  * **Host Name:** `www`
  * **Value / Points To:** `cname.vercel-dns.com`
  * **TTL:** `7200`
* Click **Save**.

---

### 3. Apex / Root Domain (`resume-buddy.tech`) ➔ Vercel

* Click **Add A Record** (or verify existing):
  * **Host Name:** `@` *(or leave blank / `resume-buddy.tech`)*
  * **Destination IPv4 Address:** `76.76.21.21`
  * **TTL:** `7200`
* Click **Save**.

---

### Complete DNS Records Summary Table

| Record Type | Host Name | Target / Destination Value | Suggested TTL | Purpose |
|---|---|---|---|---|
| **`A`** | **`api`** | **`13.207.140.19`** | `3600` (1 hr) | Points API & WebSockets to AWS Graviton EC2 |
| **`CNAME`** | **`www`** | `cname.vercel-dns.com` | `7200` (2 hrs) | Next.js Frontend on Vercel Edge CDN |
| **`A`** | **`@`** (apex) | `76.76.21.21` | `7200` (2 hrs) | Root domain redirect to `www` via Vercel |

---

## 🛠️ Step 5: Activate Let's Encrypt SSL on AWS EC2 (Post-DNS Update)

As soon as you save the `api` A-record in Namify and DNS propagates:

1. **SSH into the AWS EC2 instance:**
   ```bash
   ssh -i resumebuddy-key.pem ubuntu@13.207.140.19
   ```

2. **Issue the SSL Certificate using Certbot:**
   ```bash
   # Issue trusted Let's Encrypt SSL certificate for api.resume-buddy.tech
   sudo certbot --nginx -d api.resume-buddy.tech --email resumebuddy0@gmail.com --agree-tos --non-interactive
   ```

3. **Verify Nginx SSL Reload:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## 🔍 Verification & Health Check Commands

Once DNS propagates (usually 5–15 minutes):

```powershell
# 1. Verify DNS is resolving to the AWS Elastic IP (13.207.140.19)
Resolve-DnsName api.resume-buddy.tech

# 2. Check LaTeX compilation service health
curl.exe -s https://api.resume-buddy.tech/healthz
# Output: {"ok":true}

# 3. Check Socket.io realtime handshake
curl.exe -i "https://api.resume-buddy.tech/socket.io/?EIO=4&transport=polling"
# Output: HTTP/2 200 OK with handshake payload
```
