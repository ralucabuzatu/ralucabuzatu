# ralucabuzatu.ro — site nou

Site static, o singură pagină, fără framework și fără pas de build.
Se pune direct în repo și se publică (GitHub Pages, Netlify, Cloudflare Pages — oricare).

## Structura

```
index.html                 pagina principală
confidentialitate.html     politica de confidențialitate (GDPR)
404.html                   pagina de eroare
favicon.png · apple-touch-icon.png
robots.txt · sitemap.xml
assets/css/style.css       toate stilurile
assets/js/main.js          meniu, animații, calendar, formular
images/                    fotografiile (preluate din site-ul vechi)
```

## De schimbat înainte de publicare

### 1. Linkul de programare

Programările merg pe **Cal.com**, contul `ralucabuzatu`, tipul de eveniment
*Sesiune individuala 1:1* (60 min, 300 lei) — singurul care se potrivește cu ce
vinde site-ul. Contul mai are două evenimente (`sesiune-completa`,
`sesiune-energetica`) care nu sunt legate din site.

Adresa apare în `index.html` în **trei** locuri: `data-booking-url`, linkul de
rezervă din `<noscript>` și textul „Deschide-l într-o fereastră nouă”.

```html
<div id="booking" data-booking-url="https://cal.com/ralucabuzatu/sesiune-individuala">
```

Scriptul recunoaște singur platforma:

| Adresa conține | Ce se încarcă |
|---|---|
| `cal.com` | widgetul oficial Cal.com, temă luminoasă, culoare `#8A3245`, se redimensionează singur |
| `calendly.com` | widgetul oficial Calendly, colorat la fel |
| orice altceva | `<iframe>` simplu |

Deci o eventuală mutare pe Calendly înseamnă schimbat linkul, nimic altceva.
Calendarul se încarcă abia când vizitatorul ajunge în dreptul secțiunii.

### 2. Prețul

Apare în trei locuri: cardul de preț din secțiunea „Sesiunea 1:1”, bara CTA de pe
mobil și blocul `application/ld+json` de la finalul paginii (pentru Google).
Caută `300` și actualizează-le pe toate.

### 3. Formularul de contact — ATENȚIE, trebuie reparat în n8n

Trimite către același webhook ca site-ul vechi. Constanta e în `assets/js/main.js`:

```js
var ENDPOINT = 'https://n8n.razvanbuzatu.com/webhook/incepem';
```

Payload-ul trimis (verificat, serverul răspunde `200 {"ok":true}`):

```json
{ "nume", "prenume", "email", "telefon", "mesaj",
  "acord_gdpr": true, "source": "ralucabuzatu.ro", "timestamp" }
```

**Atenție la domeniu:** webhook-ul returnează
`Access-Control-Allow-Origin: https://ralucabuzatu.ro` — doar domeniul fără `www`.
Orice pagină servită de pe alt domeniu (inclusiv `www`) primește cererea blocată
de browser, iar vizitatorul vede doar mesajul de eroare. Site-ul vechi avea exact
această problemă, fiindcă răspundea pe ambele domenii fără redirect.

Soluția aleasă aici: domeniul canonic e `https://ralucabuzatu.ro`, iar `www` și
`.com` redirecționează către el (vezi secțiunea de publicare). Astfel formularul
funcționează fără nicio modificare în n8n.

Ca plasă de siguranță, merită totuși trecute ambele domenii în n8n, la nodul
Webhook → Options → *Allowed Origins (CORS)*:

```
https://ralucabuzatu.ro,https://www.ralucabuzatu.ro
```

### 4. Titulatura profesională

În site apare consecvent **„Coach & Trainer, cu formare în psihologie clinică și în
psihoterapie pentru familie și copii”**. Dacă ai atestat de liberă practică de la
Colegiul Psihologilor și vrei să folosești titulatura de „psiholog”, schimbă în:
`<title>`, meta description, badge-ul din hero, secțiunea „Cine sunt”, footer și JSON-LD.

## Publicare pe Cloudflare Pages

Domeniul canonic este **`https://ralucabuzatu.ro`**, fără `www`. Toate adresele
din site (canonical, Open Graph, sitemap, date structurate) indică acolo.
Alegerea nu e întâmplătoare: webhook-ul n8n acceptă cereri exact de pe acest
domeniu, deci formularul funcționează fără nicio modificare în n8n.

### Pasul 1 — codul pe GitHub

Conținutul acestui folder înlocuiește conținutul repo-ului
`github.com/ralucabuzatu/ralucabuzatu` (ramura `main`).

```bash
git rm -r assets images index.html LICENSE.txt README.txt
cp -r /calea/catre/ralucabuzatu-nou/. .
git add -A
git commit -m "Site nou: structura centrata pe client, CTA catre programare"
git push
```

### Pasul 2 — proiectul Pages

Cloudflare → **Compute** → **Workers & Pages** → *Create* → fila **Pages** →
*Connect to Git* → autorizează GitHub → alege `ralucabuzatu/ralucabuzatu`.

| Câmp | Valoare |
|---|---|
| Project name | `ralucabuzatu` |
| Production branch | `main` |
| Framework preset | **None** |
| Build command | *(gol)* |
| Build output directory | `/` |

*Save and Deploy*. Nu există pas de compilare, deci durează sub un minut.
Rezultatul apare la `ralucabuzatu.pages.dev` — verifică acolo înainte de a lega domeniul.

### Pasul 3 — DNS: eliberează domeniul

Site-ul vechi ocupă acum înregistrările DNS. Înainte de a lega domeniul:
**Domains → ralucabuzatu.ro → DNS → Records** și șterge înregistrările `A`,
`AAAA` sau `CNAME` existente pentru `@` (rădăcină) și pentru `www`.

### Pasul 4 — leagă domeniul

În proiectul Pages → **Custom domains** → *Set up a custom domain* →
`ralucabuzatu.ro`. Fiind domeniu în același cont, Cloudflare creează singur
înregistrarea DNS și emite certificatul. Durează câteva minute.

### Pasul 5 — `www` și `.com` redirecționează către domeniul principal

Ca `www.ralucabuzatu.ro` să nu dea eroare, are nevoie de o înregistrare prin
care Cloudflare să poată răspunde. **DNS → Records → Add record**:
tip `AAAA`, name `www`, IPv6 `100::`, **Proxied** (norișor portocaliu).

Apoi **Rules → Redirect Rules → Create rule**:

| Câmp | Valoare |
|---|---|
| Rule name | `www catre domeniul principal` |
| If → Custom filter expression | `http.host eq "www.ralucabuzatu.ro"` |
| Then → Type | Dynamic |
| Expression | `concat("https://ralucabuzatu.ro", http.request.uri.path)` |
| Status code | 301 |
| Preserve query string | pornit |

Repetă în zona `ralucabuzatu.com`: aceeași înregistrare `AAAA` `100::` proxied
pentru `@` și `www`, apoi o regulă cu expresia
`http.host in {"ralucabuzatu.com" "www.ralucabuzatu.com"}` și aceeași destinație.
Astfel `.com` devine domeniu de protecție a mărcii, nu un site duplicat pe care
Google l-ar penaliza.

### Pasul 6 — adresă de email pe domeniu (opțional, dar recomandat)

**Email → Email Routing → Enable**, apoi creează `contact@ralucabuzatu.ro` cu
redirecționare către adresa de Gmail. E gratuit și nu necesită server de mail.
După ce funcționează, adresa poate fi afișată în site fără să pară amatoricesc —
acum e ascunsă intenționat în spatele butoanelor și al formularului.

### După publicare

1. Deschide `https://ralucabuzatu.ro`, trimite un mesaj prin formular și
   confirmă că apare în n8n.
2. Verifică redirecțiile: `www.ralucabuzatu.ro` și `ralucabuzatu.com` trebuie
   să ajungă pe `ralucabuzatu.ro`.
3. Orice `git push` pe `main` republică automat site-ul.

## Fotografiile

Patru poze, atât. Fiecare e decupată pe raportul exact al casetei în care stă și
salvată la lățime 1200 px, calitate 82, JPEG progresiv (~100 KB bucata).

| Fișier în site | Sursă | Dimensiune | Unde apare |
|---|---|---|---|
| `images/raluca-hero.jpg` | `pic01.jpg` (site-ul vechi) | 1200×1500 | prima secțiune |
| `images/raluca-despre.jpg` | `pic04.jpeg` (site-ul vechi) | 1200×1600 | „Cine sunt” |
| `images/raluca-sesiune.jpg` | `IMG_9564` | 1200×1800 | „Cum decurge” |
| `images/raluca-contact.jpg` | `IMG_9672` | 1200×1200 | „Sunt aici” |

Sursele: pozele vechi în repo-ul vechi, cele noi în
`Desktop/drive-download-20260819T215734Z-1-001` (15 originale, din care 12 nefolosite).
Ca să schimbi una, salveaz-o la lățime 1200 px cu același nume de fișier —
nu e nevoie să atingi HTML-ul. Încadrarea se reglează din `object-position`
în `assets/css/style.css` (prima valoare = stânga/dreapta, a doua = sus/jos).

## Logo

Identitatea e semnătura, nu un simbol: **Raluca Buzatu.** cules în Fraunces, cu
punctul final în burgundy, și **COACH & TRAINER** dedesubt. E doar text și CSS —
nu există fișier de logo de întreținut, se scalează perfect și se colorează din
`--wine`, ca tot restul site-ului.

Pentru pătrate mici (iconița din tab, poza de profil pe rețele) există marca
scurtă **R.** — cremă pe pătrat burgundy, `favicon.png` (512 px) și
`apple-touch-icon.png` (180 px), desenate cu același font Fraunces.
Dacă ai nevoie de ea în alt format sau altă mărime, se regenerează pornind
de la aceleași două fișiere.

## Ce s-a păstrat din site-ul vechi

- Textele despre sesiunea 1:1 și parcursul profesional
- Webhook-ul formularului de contact
- Link-urile de Instagram și TikTok și adresa de email

## Ce nu mai există

- Template-ul „Dimension” (HTML5 UP) cu ferestre modale — înlocuit cu o pagină
  clasică, cu derulare continuă
- jQuery și Font Awesome (~1,5 MB de dependențe) — nu mai sunt necesare
- Secțiunea „Elements” cu text demonstrativ în latină, rămasă din template
- Sesiunea energetică LUMIA ca serviciu separat — abordarea holistică e acum
  parte din sesiunea unică 1:1, așa cum ai cerut
