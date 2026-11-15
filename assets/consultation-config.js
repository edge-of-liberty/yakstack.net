(() => {
 const base=new URL('.',document.currentScript.src);
 window.consultationConfig=fetch(new URL('consultation.json',base)).then(r=>{if(!r.ok)throw Error('Configuration unavailable');return r.json();});
 window.consultationPrice=c=>`${c.durationMinutes} minutes · ${new Intl.NumberFormat('en-US',{style:'currency',currency:c.currency,maximumFractionDigits:c.amountMinor%100?2:0}).format(c.amountMinor/100)}`;
 window.consultationConfig.then(c=>document.querySelectorAll('[data-consultation-price]').forEach(el=>el.textContent=window.consultationPrice(c))).catch(()=>{});
})();
