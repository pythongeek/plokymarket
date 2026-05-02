# Plokymarket Security Hardening Guide
# Last Updated: 2026-05-02

## VPS: Hetzner CX33 (204.168.167.195)

---

## Firewall (iptables-persistent)

**UFW was removed** — Docker bypasses UFW rules. Replaced with iptables-persistent.

### Port Access Matrix
| Port | Service | Public | Localhost | Notes |
|------|---------|--------|-----------|-------|
| 22 | SSH | ✅ ALLOW (key-only) | — | Password auth disabled |
| 80 | HTTP | ✅ ALLOW | — | Let's Encrypt only |
| 443 | HTTPS | ✅ ALLOW | — | Full TLS 1.2/1.3 |
| 3000 | Next.js (PM2) | ❌ DROP | ✅ | Only via nginx |
| 4000 | PostgREST | ❌ DROP | ✅ | Only via nginx |
| 5433 | PostgreSQL | ❌ DROP | ✅ | Docker port binding |
| 8000 | Kong/Gotrue | ❌ NOT RUNNING | — | — |

### iptables Rules (saved to /etc/iptables/rules.v4)
```
# Drop port 3000 from non-localhost
-A INPUT ! -s 127.0.0.1/32 -p tcp -m tcp --dport 3000 -j DROP

# Drop port 4000 from non-localhost  
-A INPUT ! -s 127.0.0.1/32 -p tcp -m tcp --dport 4000 -j DROP

# PostgREST DNAT (via Docker)
-A PREROUTING -d 127.0.0.1/32 ! -i lo -p tcp -m tcp --dport 4000 -j DROP
```

---

## SSH Hardening
```
PermitRootLogin without-password   # Key-based root login allowed
PasswordAuthentication no           # No password auth
PubkeyAuthentication yes           # Key auth required
X11Forwarding no                   # Disabled
```

**ALL SSH access requires valid SSH key. No password-based access exists.**

---

## Docker Security

### /etc/docker/daemon.json
```json
{
  "iptables": false,
  "ip6tables": false
}
```
**Docker cannot override iptables rules** — prevents container escape from firewall.

### Container Network Binding
- PostgreSQL: `127.0.0.1:5433:5432` (localhost only)
- PostgREST: `127.0.0.1:4000:3000` (localhost only)

---

## nginx Security Headers
Applied to both polymarketbd.com and plokymarket.com:
```
X-Frame-Options: SAMEORIGIN / DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
server_tokens off
ssl_protocols TLSv1.2 TLSv1.3
```

### Rate Limiting
- `api_limit`: 10 requests/sec per IP (general)
- `auth_limit`: 5 requests/sec per IP (auth endpoints)
- `conn_limit`: 10 connections per IP

---

## Fail2ban (SSH Protection)

Active jails:
- `sshd`: ban after 3 failed attempts, 24hr ban
- `nginx-http-auth`: ban after 5 failed basic auth attempts

**Currently banned IPs:** 8 IPs banned (see `fail2ban-client status sshd`)

---

## Database Security (PostgreSQL)

- Password: `U7ZzbXwaLrkQMIGprixYY8ADFrCOr6XX` (changed after incident)
- Port 5433 bound to 127.0.0.1 only
- `pg_hba.conf`: reject all by default, whitelist 172.18.0.0/16 (docker)
- **RLS enabled on all 145 tables** ✅
- **41 RLS policies** defined across tables
- `anon` role has restricted access enforced by RLS

### RLS Policy Examples
- `markets`: public read (active markets), authenticated write (orders)
- `users`: own profile read, no public read
- `orders`: own orders only
- `wallets`: own balance only

---

## Known Security Incident (2026-05-01)
Cryptominer found in `polymarket-postgres` Docker container.
- Attacker IP: 181.214.147.108
- Root cause: weak PostgreSQL password ("postgres")
- Response: password changed, port locked to localhost, attacker IP blocked at firewall

---

## Renewal Checklist
After any VPS reboot or config change:
1. Verify `iptables -L INPUT | grep 3000` — DROP rule should be first
2. Verify `ss -tlnp | grep 3000` — should show `127.0.0.1:3000`
3. Verify `docker ps` — containers should be running
4. Verify `fail2ban-client status` — should be active
5. Run: `curl -sk https://127.0.0.1/ -H "Host: polymarketbd.com" -I | grep X-Frame`
