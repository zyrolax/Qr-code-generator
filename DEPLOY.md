# Deploying Requesto as a live test on `test.requesto.in`

This puts Requesto online **without touching your existing site**. It uses:

- a **new subdomain** `test.requesto.in` (separate Nginx server block),
- its **own MongoDB** in Docker on `127.0.0.1:27018` (localhost-only, can't clash),
- the Node API under **PM2** on port **4010**,
- Nginx serving the built React app and proxying `/api` to the API.

Nothing here edits your other sites, ports, or databases.

> All commands run on the VPS over SSH unless noted.

---

## 0. DNS (do this first, it takes time to propagate)

At your DNS provider, add an **A record**:

```
test   →   <your VPS public IP>
```

Check it resolves before continuing:

```bash
dig +short test.requesto.in     # should print your VPS IP
```

---

## 1. Get the code into an isolated folder

```bash
sudo mkdir -p /var/www/requesto-test
sudo chown "$USER" /var/www/requesto-test
git clone <your-github-repo-url> /var/www/requesto-test
cd /var/www/requesto-test
```

Keeping it under its own directory means it shares nothing with your other folders.

---

## 2. Start the isolated MongoDB (Docker)

```bash
docker compose -f deploy/docker-compose.test.yml up -d
docker ps | grep requesto-test-mongo    # confirm it's running
```

This is bound to `127.0.0.1:27018` only — not exposed to the internet.

---

## 3. Configure the backend

```bash
cd /var/www/requesto-test/server
cp .env.production.example .env
# generate a strong secret and paste it into JWT_SECRET
openssl rand -hex 32
nano .env          # set JWT_SECRET; leave the rest as-is
npm install --omit=dev
```

Seed sample data (admin/user + example stickers). **This wipes the test DB —
fine here since it's brand new:**

```bash
npm run seed       # prints the admin/user logins + claim codes
```

---

## 4. Build the frontend

```bash
cd /var/www/requesto-test/client
npm install
npm run build      # outputs client/dist, which Nginx will serve
```

---

## 5. Run the API under PM2

```bash
cd /var/www/requesto-test/server
# install pm2 once if needed:  sudo npm i -g pm2
pm2 start ecosystem.config.cjs
pm2 save                        # persist across reboots
pm2 startup                     # run the one-line command it prints, once
pm2 logs requesto-test-api      # watch logs (Ctrl-C to exit)
```

The API now listens on `127.0.0.1:4010`.

---

## 6. Add the Nginx site

```bash
sudo cp /var/www/requesto-test/deploy/nginx-test.requesto.in.conf \
        /etc/nginx/sites-available/test.requesto.in
sudo ln -s /etc/nginx/sites-available/test.requesto.in \
           /etc/nginx/sites-enabled/
sudo nginx -t                   # must say "test is successful"
sudo systemctl reload nginx
```

`nginx -t` validates the whole config — if it passes, your existing sites are
unaffected. At this point `http://test.requesto.in` should load.

---

## 7. Add HTTPS

```bash
sudo certbot --nginx -d test.requesto.in
```

Certbot edits **only** the `test.requesto.in` block to add port 443 + the
certificate, and sets up auto-renewal. Your other sites' certs are untouched.

Because `.env` has `NODE_ENV=production` and `BASE_URL=https://test.requesto.in`,
the login cookie is issued `Secure` and works over HTTPS (the `trust proxy`
setting lets Express see it's behind HTTPS via Nginx).

---

## 8. Verify

- Open **https://test.requesto.in** — landing page loads.
- Log in with the seed admin (printed in step 3), open the dashboard + editor.
- Open a seed sticker URL (`https://test.requesto.in/q/<code>`) in a private
  window — the finder view. Send a message; it appears in the owner's inbox,
  and the notification email is printed to `pm2 logs` (SMTP is blank).

---

## Updating later

```bash
cd /var/www/requesto-test
git pull
cd server && npm install --omit=dev && pm2 restart requesto-test-api
cd ../client && npm install && npm run build
```

(No Nginx reload needed unless you change the Nginx file.)

## Tearing it down

```bash
pm2 delete requesto-test-api && pm2 save
sudo rm /etc/nginx/sites-enabled/test.requesto.in && sudo systemctl reload nginx
docker compose -f deploy/docker-compose.test.yml down       # add -v to also delete data
```

---

## Notes / gotchas

- **Port 4010** is assumed free. If something uses it, change `PORT` in
  `server/.env` **and** `proxy_pass` in the Nginx file to match.
- **Firewall:** you only need 80/443 open (already are, for your main site).
  Mongo stays on localhost — don't open 27018.
- This is a **test** DB with seeded demo data. Don't print real stickers from
  it; the public `/q/{code}` format is permanent, so production stickers should
  come from your real deployment, not this test one.
