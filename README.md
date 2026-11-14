# YakStack GitHub Pages replacement

Existing captured homepage content, layout, images and fonts are preserved locally.
GoDaddy runtime scripts, account menus and cookie banner were removed. Consultation
buttons lead to consultation/index.html, a branded email-request fallback using the
existing public contact address. No reservation is confirmed and no payment is taken.
The booking API currently offers health only, so no availability UI is implied.

Publish: commit/push static files to main using the existing Pages setup. Relative
links work at /yakstack.net/ and at the eventual custom-domain root. No build needed.
The original local index.godaddy.html is excluded from Git; do not publish backups.

Launch checklist (requires Nancy's explicit cutover approval):
1. Nancy checks https://edge-of-liberty.github.io/yakstack.net/ on desktop/phone,
   follows both consultation buttons, and sends a real test request to verify delivery.
2. CNAME was independently added on GitHub as yakstack.net and is preserved.
   Confirm Pages custom-domain settings before approved cutover. The github.io
   preview may redirect to the current custom domain; local tests do not prove
   the replacement is being served there yet.
3. Update apex DNS to GitHub Pages' documented A records and www CNAME to
   edge-of-liberty.github.io. Preserve mail/TXT records. Do not change DNS beforehand.
4. Once GitHub provisions the custom-domain certificate, enable Enforce HTTPS and
   verify apex/www redirects, images and request links. Nancy handles publication
   waiting/propagation checks. Custom-domain HTTPS cannot yet be verified.
5. Only after acceptance, retire Website Builder hosting; keep domain/email services.

No DNS, account or subscription changes are included in this commit.
