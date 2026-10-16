# Dazzle MCP: Mobile-Only Render Setup

यह guide उस user के लिए है जिसके पास केवल mobile phone है। Laptop या local terminal की जरूरत नहीं है। केवल mobile browser, GitHub, Render और Claude mobile app चाहिए।

## पहले से तैयार चीजें

Dazzle repository में Render deployment पहले से तैयार है:

```text
https://github.com/karanwebsolution/Dazzle
```

Repository में ये files deployment संभालती हैं:

- `render.yaml` — Render Blueprint
- `packages/mcp/src/server.ts` — Streamable HTTP + OAuth MCP server
- `packages/mcp/src/dazzle.svg` — Dazzle branding icon

## Step 1: GitHub account तैयार करें

Mobile Chrome में खोलें:

```text
https://github.com
```

अपने GitHub account में login करें। Repository दिखनी चाहिए:

```text
karanwebsolution/Dazzle
```

अगर repository private है, Render को GitHub access देना होगा। यह repository public है, इसलिए सामान्यतः direct access काम करेगा।

## Step 2: Render account बनाएं

Mobile Chrome में खोलें:

```text
https://render.com
```

1. **Get Started** या **Sign Up** दबाएं।
2. **Continue with GitHub** चुनें।
3. GitHub authorization allow करें।
4. Render Dashboard खोलें:

```text
https://dashboard.render.com
```

## Step 3: Blueprint से deploy करें — recommended

Render Dashboard में:

1. ऊपर **New** दबाएं।
2. **Blueprint** चुनें।
3. Repository select करें:

```text
karanwebsolution/Dazzle
```

4. Branch चुनें:

```text
main
```

5. Render `render.yaml` पढ़ेगा। Service name दिखेगा:

```text
dazzle-mcp
```

6. `MCP_API_KEY` के लिए secret value डालें। यह कोई strong random value होनी चाहिए, उदाहरण:

```text
Dazzle-mcp-2026-change-this-to-a-long-random-secret
```

Production में इस example value को copy न करें। अपना अलग secret बनाएं।

7. **Apply** या **Create Blueprint** दबाएं।

Render automatically यह settings use करेगा:

```text
Build Command:
corepack enable && pnpm install --frozen-lockfile && pnpm build

Start Command:
node packages/mcp/dist/server.js

Environment:
MCP_TRANSPORT=http
MCP_API_KEY=your-secret
```

## Step 4: अगर Blueprint option काम न करे

Mobile में **New → Web Service** चुनें। फिर:

```text
Repository: karanwebsolution/Dazzle
Branch: main
Runtime: Node
Root Directory: blank
Plan: Free
```

Build Command:

```bash
corepack enable && pnpm install --frozen-lockfile && pnpm build
```

Start Command:

```bash
node packages/mcp/dist/server.js
```

Environment variables में add करें:

```text
MCP_TRANSPORT=http
```

और:

```text
MCP_API_KEY=अपनी-strong-secret-key
```

फिर **Create Web Service** दबाएं।

## Step 5: Deploy पूरा होने का इंतजार करें

Render service page पर **Logs** खोलें। Successful log में यह दिखना चाहिए:

```text
Build successful
Dazzle MCP listening on port 10000 at /mcp
Your service is live
```

Render आपको एक primary URL देगा, उदाहरण:

```text
https://dazzle-2yh9.onrender.com
```

आपका URL अलग हो सकता है। Render dashboard में दिखने वाला URL ही सही URL है।

## Step 6: Health check करें

Mobile browser में अपना Render URL खोलें:

```text
https://YOUR-SERVICE.onrender.com/health
```

सही response ऐसा दिखना चाहिए:

```json
{
  "status": "ok",
  "name": "dazzle",
  "transport": "streamable-http",
  "oauth": true,
  "authenticated": true,
  "icon": "https://YOUR-SERVICE.onrender.com/icon.svg"
}
```

Icon check करने के लिए खोलें:

```text
https://YOUR-SERVICE.onrender.com/icon.svg
```

## Step 7: Claude mobile में connector add करें

Claude mobile app खोलें:

1. **Settings** खोलें।
2. **Connectors** पर जाएं।
3. ऊपर **+** दबाएं।
4. **Add custom connector** चुनें।
5. Name डालें:

```text
dazzle
```

6. Remote MCP URL डालें:

```text
https://YOUR-SERVICE.onrender.com/mcp
```

ध्यान दें: `/mcp` लगाना जरूरी है। केवल root domain डालने पर connector काम नहीं करेगा।

7. **Continue** दबाएं।
8. Claude OAuth discovery करेगा।
9. Dazzle sign-in page खुलेगा।
10. Render में रखी हुई `MCP_API_KEY` डालें।
11. **Allow Claude to connect** दबाएं।
12. Claude पर वापस आने के बाद connector enable करें।

## Step 8: Dazzle को use करें

Claude chat में connector enable करके ऐसा लिखें:

```text
Use Dazzle to create a luxury landing page for a premium coffee brand called Ember & Oak. Use a warm paper palette, editorial typography, split hero, features, testimonials, FAQ, and a strong shop-now CTA. Make the copy elegant and conversion-focused.
```

एक और example:

```text
Use Dazzle to create a brutalist landing page for a developer tool called Shipyard. Use black and white with one electric green accent, bento sections, stats, process, pricing, FAQ, and a Start Building CTA.
```

Dazzle assistant से ये चीजें भी मांग सकते हैं:

- SaaS page
- Portfolio page
- Agency page
- Product launch page
- Startup landing page
- Event page
- Course page
- Restaurant page
- Real-estate page
- App waitlist page
- Luxury brand page
- Brutalist experimental page

## Exact public URLs

अगर Render ने `dazzle-2yh9.onrender.com` URL दिया है, तो URLs होंगे:

```text
MCP:
https://dazzle-2yh9.onrender.com/mcp

Health:
https://dazzle-2yh9.onrender.com/health

Icon:
https://dazzle-2yh9.onrender.com/icon.svg
```

अगर Render ने नया service URL दिया है, तो नया URL use करें।

## Connector में “Could not start sign-in” आए तो

1. Render deployment complete है या नहीं देखें।
2. `/health` URL browser में खोलें।
3. `oauth: true` दिखना चाहिए।
4. Render में `MCP_API_KEY` मौजूद है या नहीं देखें।
5. Claude में पुराना `dazzle` connector remove करें।
6. फिर connector दोबारा add करें।
7. MCP URL के अंत में `/mcp` check करें।
8. Render में latest GitHub commit deploy हुआ है या नहीं देखें।

## Icon दिखाई न दे तो

1. Render latest commit deploy करे।
2. Browser में `/icon.svg` खोलकर icon देखें।
3. Claude में पुराना connector remove करें।
4. Connector दोबारा add करें।
5. Mobile app को close करके फिर खोलें।

Custom connector में Claude कभी-कभी default icon cache कर सकता है। Dazzle server MCP initialization metadata में branded icon advertise करता है।

## Render Free plan note

Render Free service कुछ समय inactive रहने पर sleep हो सकती है। पहली request पर cold start में कुछ seconds लग सकते हैं। यह error नहीं है। थोड़ी देर बाद दोबारा connector request करें।

## Security

- `MCP_API_KEY` केवल Render Environment में रखें।
- इसे GitHub, screenshots, public posts या Claude chat में share न करें।
- Key leak हो जाए तो Render Environment में नई key save करके redeploy करें।
- किसी और को access देना हो तो अपनी primary key share करने के बजाय अलग deployment बनाएं।
- Claude connector disconnect करने से OAuth access token revoke/stop हो जाएगा, लेकिन key Render में फिर भी मौजूद रहेगी।

## Final checklist

```text
[ ] GitHub repository: karanwebsolution/Dazzle
[ ] Render Blueprint deployed
[ ] Build successful
[ ] Start command: node packages/mcp/dist/server.js
[ ] MCP_TRANSPORT=http
[ ] MCP_API_KEY set
[ ] /health returns status ok
[ ] /icon.svg opens
[ ] Claude URL ends with /mcp
[ ] OAuth sign-in completed
[ ] dazzle connector enabled in chat
```
