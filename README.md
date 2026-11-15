# YakStack GitHub Pages website

Live at https://yakstack.net/. Existing homepage content, design, local fonts, logo and images
are preserved. No GoDaddy runtime or booking widgets. DNS and email configuration are unchanged.

The consultation page connects to the existing BCF API for genuine availability when configured.
Checkout is currently disabled; the email fallback is nancy@yakstack.net. Private Stripe test
checkout is supported when the backend prerequisites are enabled; it is clearly labelled and
requires a private test code. No production payment flow is enabled. Payment redirects cannot
confirm appointments: status comes from the API using a private per-booking capability stored in
the originating browser tab. Calendar IDs, credentials and backend configuration stay private.

Publish: commit/push main using existing GitHub Pages setup. No build or new framework. Relative
asset/navigation links work under a project path and the custom domain. No publication polling
required; Nancy can check the resulting page after GitHub publishes it. Original GoDaddy HTML,
backups, and migration files must remain excluded from Git/publication.

Local browser test (requires already installed Python Playwright and Chrome):
`python tests/booking_ui.py`. It uses mocked API responses, checks desktop/mobile flow and offline
fallback, and never sends payments or calendar requests. `node --check assets/booking.js` checks
syntax. Backend tests and prerequisites live in bcf-platform/docs/booking-launch.md.


### Consultation display configuration

The single homepage consultation link opens the existing BCF booking client at
`/consultation/`. Availability and checkout remain controlled by the API; an email
request is always available when booking is disabled. No times or staff are selected
by the website. Stripe remains private test checkout only.

After publishing Booking Management changes in the sibling `bcf-platform` repository,
run `python3 tools/sync_consultation.py` to refresh the public display snapshot and
static price labels. The consultation page also reads current API metadata before
showing availability. The snapshot contains no staff or calendar identifiers.

Local UI validation: run `tests/booking_ui.py` using the existing migration Python
virtual environment with Playwright. It mocks the API and never charges or books.
