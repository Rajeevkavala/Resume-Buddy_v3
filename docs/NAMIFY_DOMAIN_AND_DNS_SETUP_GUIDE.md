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
          │         Vercel Global Edge CDN        │       │   AWS EC2 Graviton    │
          │         (resume-buddy-v3)             │       │ (resumebuddy-backend) │
          │         76.76.21.21 / CNAME           │       │  [AWS_ELASTIC_IP]     │
          └───────────────────────────────────────┘       └───────────────────────┘
```

---

## 🎯 Target Endpoints & Verified Production Status

| Subdomain / URL | Target Service | Hosting Platform | Target IP / Canonical Value | Status |
|---|---|---|---|---|
| `https://resume-buddy.tech` | Apex Frontend (307 Redirect to `www`) | **Vercel** | `76.76.21.21` (or `216.198.79.1`) | ✅ **Verified & Live** |
| `https://www.resume-buddy.tech` | Primary Next.js Web App | **Vercel** | `cname.vercel-dns.com` | ✅ **Verified & Live** |
| `https://api.resume-buddy.tech` | LaTeX (`/api/compile`) & Realtime WS (`/socket.io`) | **AWS EC2 Graviton** | `[YOUR_AWS_EC2_ELASTIC_IP]` | ⚠️ **Action Required (Update A Record in Namify)** |

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
3. If they are pointing elsewhere (like Cloudflare), DNS records must be added in that external provider instead.

---

## 🛠️ Step 3: Access the DNS Management Zone

1. On the right-hand panel of the domain details page, locate the **DNS Management** widget.
2. Click **Manage DNS**.
3. A popup or management window titled **DNS Service Interface** will appear.

---

## 🛠️ Step 4: Configure the Exact DNS Records

In the **DNS Management** window, ensure the following records are present and correctly mapped:

### 1. Backend API & WebSocket Subdomain (`api`) ➔ AWS EC2

> [!IMPORTANT]
> This is the primary pending step! Update this record to your AWS EC2 Elastic IP address to redirect API traffic from the old host to AWS.

* Click **Add A Record** (or edit existing `api` record):
  * **Host Name:** `api`
  * **Destination IPv4 Address:** `[YOUR_AWS_EC2_ELASTIC_IP]` *(e.g., `13.235.xxx.xxx`)*
  * **TTL:** `3600` *(or the lowest selectable value for fast propagation)*
* Click **Save** / **Add Record**.

---

### 2. Primary Frontend Subdomain (`www`) ➔ Vercel

* Click **Add CNAME Record** (or verify existing):
  * **Host Name:** `www`
  * **Value / Points To:** `cname.vercel-dns.com`
  * **TTL:** `3600` or `7200`
* Click **Save**.

---

### 3. Apex / Root Domain (`resume-buddy.tech`) ➔ Vercel

* Click **Add A Record** (or verify existing):
  * **Host Name:** `@` *(or leave blank / `resume-buddy.tech` depending on interface prompt)*
  * **Destination IPv4 Address:** `76.76.21.21`
  * **TTL:** `3600` or `7200`
* Click **Save**.

---

### Complete DNS Records Summary Matrix

| Record Type | Host Name | Target / Destination Value | Suggested TTL | Purpose |
|---|---|---|---|---|
| **A** | `api` | `[YOUR_AWS_EC2_ELASTIC_IP]` | `3600` (1 hr) | Points API & WebSockets to AWS Graviton |
| **CNAME** | `www` | `cname.vercel-dns.com` | `7200` (2 hrs) | Next.js Frontend on Vercel Edge |
| **A** | `@` (apex) | `76.76.21.21` | `7200` (2 hrs) | Root domain redirect to `www` via Vercel |

---

## 🛠️ Step 5: Configure AWS EC2 Security Group & Nginx SSL

Once the DNS record for `api.resume-buddy.tech` points to your AWS Elastic IP, set up Nginx and the SSL certificate on your EC2 instance:

### 1. Ensure AWS Security Group Inbound Rules

In the [AWS EC2 Console](https://console.aws.amazon.com/ec2/) ➔ **Security Groups** ➔ Select your backend instance SG:
* **Port 22 (SSH):** `My IP`
* **Port 80 (HTTP):** `0.0.0.0/0` *(Required for Certbot ACME domain validation)*
* **Port 443 (HTTPS):** `0.0.0.0/0` *(Required for encrypted API and WebSocket calls)*

---

### 2. Issue Let's Encrypt SSL Certificate on AWS EC2

SSH into your AWS Graviton server:

```bash
ssh -i resumebuddy-key.pem ubuntu@[YOUR_AWS_ELASTIC_IP]
```

Run Certbot to request a trusted HTTPS certificate for `api.resume-buddy.tech`:

```bash
# Stop any process on port 80 temporarily if needed, or use certbot standalone
sudo systemctl stop nginx

# Request Let's Encrypt certificate
sudo certbot certonly --standalone \
  -d api.resume-buddy.tech \
  --email resumebuddy0@gmail.com \
  --agree-tos \
  --non-interactive

# Start Nginx back up
sudo systemctl start nginx
```

---

### 3. Configure Production Nginx Reverse Proxy

Create or update `/etc/nginx/sites-available/resume-buddy-api.conf`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

# 1. HTTP -> HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.resume-buddy.tech;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://api.resume-buddy.tech$request_uri;
    }
}

# 2. Main Production Backend API & WebSocket Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.resume-buddy.tech;

    # SSL Certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.resume-buddy.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.resume-buddy.tech/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # CORS Whitelist for Vercel Frontend
    set $cors_origin "";
    if ($http_origin ~* "^https:\/\/(www\.)?resume-buddy\.tech$|^https:\/\/resume-buddy-v3\.vercel\.app$") {
        set $cors_origin $http_origin;
    }

    add_header Access-Control-Allow-Origin $cors_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials "true" always;

    client_max_body_size 25M;

    # LaTeX PDF Compilation Microservice (Port 8080)
    location /api/compile {
        limit_req zone=api_limit burst=15 nodelay;

        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $cors_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        proxy_pass http://127.0.0.1:8080/compile;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
    }

    # LaTeX Service Healthcheck
    location /healthz {
        proxy_pass http://127.0.0.1:8080/healthz;
    }

    # Socket.io Realtime Voice & Chat (Port 3001)
    location /socket.io/ {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $cors_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
            add_header Access-Control-Allow-Credentials "true" always;
            return 204;
        }

        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket long-lived stream timeouts
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_buffering off;
    }

    # Status / Default Fallback
    location / {
        return 200 '{"status":"online","service":"ResumeBuddy AWS Backend Microservices"}';
        add_header Content-Type application/json;
    }
}
```

Activate and reload Nginx:

```bash
sudo ln -sf /etc/nginx/sites-available/resume-buddy-api.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🛠️ Step 6: Synchronize Environment Variables Across Platforms

### 1. Vercel Production Environment Variables

Ensure the following variables are configured in **Vercel Dashboard ➔ Project Settings ➔ Environment Variables**:

| Variable Key | Production Value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://www.resume-buddy.tech` | Frontend Root URL |
| `APP_DOMAIN` | `www.resume-buddy.tech` | Cookie domain binding |
| `LATEX_SERVICE_URL` | `https://api.resume-buddy.tech` | Directs PDF generation to AWS Graviton |
| `NEXT_PUBLIC_WEBSOCKET_URL` | `https://api.resume-buddy.tech` | Directs WebSocket connections to AWS |

---

### 2. AWS Backend (`/opt/resumebuddy/.env.backend`)

On your AWS EC2 instance, ensure `/opt/resumebuddy/.env.backend` has:

```env
NODE_ENV=production
PORT=3001
REDIS_URL="rediss://default:AZT_AAIncDFhYzAzODM2MTFjNDE0ZGU0ODI4MjU1ZTJmZWY0OWJkOHAxMzgxNDM@equal-snake-38143.upstash.io:6379"
NEXT_PUBLIC_APP_URL="https://www.resume-buddy.tech"
ALLOWED_ORIGINS="https://www.resume-buddy.tech,https://resume-buddy.tech,https://resume-buddy-v3.vercel.app"
JWT_SECRET="jtVrKKDLdL0XZdSUl5smxicGqZPopBSlv2SHmvbOM48"
```

Restart backend containers:
```bash
cd /opt/resumebuddy
docker compose down && docker compose up -d
```

---

## 🔍 Verification & Health Check Commands

After saving your DNS records in Namify, run these checks to confirm everything is resolving and responding properly:

### 1. Check DNS Propagation (PowerShell or Bash)

```powershell
# Check api subdomain resolution
Resolve-DnsName api.resume-buddy.tech

# Check www subdomain resolution
Resolve-DnsName www.resume-buddy.tech

# Check apex domain resolution
Resolve-DnsName resume-buddy.tech
```

### 2. Verify Backend API HTTPS & Nginx Status

```bash
curl -I https://api.resume-buddy.tech
# Expected: HTTP/2 200 OK or JSON status payload
```

### 3. Verify Tectonic LaTeX Engine Health

```bash
curl -s https://api.resume-buddy.tech/healthz
# Expected: {"ok":true}
```

### 4. Verify Socket.io Realtime Endpoint

```bash
curl -I "https://api.resume-buddy.tech/socket.io/?EIO=4&transport=polling"
# Expected: HTTP/2 200 OK
```

### 5. Verify Frontend Vercel Delivery

```bash
curl -I https://www.resume-buddy.tech
# Expected: HTTP/2 200 OK with Server: Vercel
```

---

## 🚑 Troubleshooting & Common Pitfalls

| Issue | Root Cause | Solution |
|---|---|---|
| **DNS still returns old IP (`165.232.181.37`)** | Local DNS cache or TTL not expired | Flush local DNS cache (`ipconfig /flushdns` on Windows, or test via Google DNS: `Resolve-DnsName api.resume-buddy.tech -Server 8.8.8.8`). Allow 15–30 minutes for Namify propagation. |
| **Certbot fails: `Connection refused` / `Timeout`** | Port 80 not open on AWS Security Group | In AWS EC2 Console ➔ Security Groups ➔ Add Inbound Rule: **HTTP (Port 80) from `0.0.0.0/0`**. |
| **Browser CORS Error on `/api/compile`** | Origin header mismatch | Confirm Nginx configuration includes `https://www.resume-buddy.tech` in the `$cors_origin` regex block. |
| **WebSocket Connection Failed on Frontend** | Port 3001 not listening or Nginx upgrade headers missing | Verify `proxy_set_header Upgrade $http_upgrade;` and `proxy_set_header Connection "Upgrade";` exist in Nginx `/socket.io/` block. |
