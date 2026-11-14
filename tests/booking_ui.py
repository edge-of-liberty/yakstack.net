"""Local browser checks with mocked API responses; no live payments or calendar calls."""
import functools, http.server, json, pathlib, threading
from datetime import datetime, timedelta, timezone
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/consultation/'
test_date=(datetime.now(timezone.utc)+timedelta(days=2)).date().isoformat()
api='https://6hy5v6405n5f1br8.dyb.lambda-web.us-east-2.on.aws'
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='chrome',headless=True)
        for width,height in [(1440,900),(390,844)]:
            page=browser.new_page(viewport={'width':width,'height':height})
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            def route(r):
                path=r.request.url.split(api)[-1]
                if path=='/v1/config': data={'availability':True,'checkout':True,'mode':'test'}
                elif path.startswith('/v1/availability'): data={'slots':[{'start':test_date+'T15:00:00.000Z','end':test_date+'T16:00:00.000Z'}]}
                elif path=='/v1/bookings':
                    body=r.request.post_data_json
                    assert body['customer']['email']=='test@example.com'
                    assert len(body['key'])==64 and r.request.headers['x-booking-test-key']=='private-test'
                    data={'id':'a'*64,'state':'checkout','checkoutUrl':'https://checkout.stripe.com/test'}
                else: raise AssertionError(path)
                r.fulfill(status=200,content_type='application/json',body=json.dumps(data))
            page.route(api+'/**',route)
            page.route('https://checkout.stripe.com/**',lambda r:r.fulfill(body='Mock Stripe test checkout'))
            page.goto(url)
            page.locator('#slot-form').wait_for(state='visible')
            page.locator('#booking-date').fill(test_date)
            page.get_by_role('button',name='Find available times').click()
            page.locator('#slot-options button').click()
            page.locator('#customer-name').fill('Test Customer')
            page.locator('#customer-email').fill('test@example.com')
            page.locator('#test-key').fill('private-test')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.locator('#checkout').click()
            page.wait_for_url('https://checkout.stripe.com/test')
            assert not errors,errors
            page.close()
        page=browser.new_page()
        page.route(api+'/**',lambda r:r.abort())
        page.goto(url)
        assert page.get_by_role('link',name='Email a consultation request').get_attribute('href').startswith('mailto:nancy@yakstack.net')
        assert page.locator('#slot-form').is_hidden()
        page.goto(url+'?booking='+'b'*64+'&result=success')
        page.wait_for_function("document.getElementById('booking-message').textContent.includes('redirect alone')")
        assert 'confirmed' not in page.locator('#booking-message').inner_text().replace('does not confirm','')
        browser.close()
    print('PASS: desktop/mobile selection, test checkout redirect, offline email fallback, and untrusted success redirect')
finally:
    server.shutdown()
