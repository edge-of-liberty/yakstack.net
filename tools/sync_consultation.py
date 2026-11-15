"""Copy only public display metadata from the published BCF configuration."""
import json, re, html
from pathlib import Path
root = Path(__file__).resolve().parents[1]
business_id, service_id = "yakstack", "consulting"
business = json.loads((root.parent / "bcf-platform/services/booking/config/businesses.json").read_text())[business_id]
service = business["services"][service_id]
data = {key: service[key] for key in ("name", "durationMinutes", "amountMinor", "currency", "paymentRequired")}
data.update(business=business_id, service=service_id, timeZone="America/Chicago")
(root / "assets/consultation.json").write_text(json.dumps(data, indent=2) + "\n")

# Keep the advertised rate readable even when JavaScript is unavailable.
amount = data["amountMinor"] / 100
price = ("$" + format(amount, ".2f").removesuffix(".00")) if data["currency"] == "usd" else f"{amount:.2f} {data['currency'].upper()}"
label = html.escape(f"{data['durationMinutes']} minutes · {price}")
for relative in ("index.html", "consultation/index.html"):
    page = root / relative
    page.write_text(re.sub(r'(<(?:span|p) data-consultation-price>)[^<]*', lambda m: m[1] + label, page.read_text()))
