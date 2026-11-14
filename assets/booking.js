(() => {
 'use strict';
 const API='https://6hy5v6405n5f1br8.dyb.lambda-web.us-east-2.on.aws';
 const $=id=>document.getElementById(id),message=text=>{$('booking-message').textContent=text;};
 const format=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',dateStyle:'full',timeStyle:'short'});
 const localDate=ms=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(ms);
 const storage={get:k=>{try{return sessionStorage.getItem(k);}catch{return null;}},set:(k,v)=>{try{sessionStorage.setItem(k,v);return sessionStorage.getItem(k)===v;}catch{return false;}}};
 let config,selected,key,requestDate,generation=0;
 const errors={slot_unavailable:'That time is no longer available. Please choose another time.',test_access_required:'The private test access code was not accepted.',too_many_requests:'Please wait a minute before trying again.',invalid_request:'Please check your name, email, and selected time.',checkout_disabled:'Online checkout is not enabled yet. Please email Nancy.',processing:'Payment is still being processed. Check the status again shortly.',hold_expired:'This checkout hold expired. Please choose a time again.'};
 async function call(path,options={}) {
  const response=await fetch(API+path,{...options,signal:AbortSignal.timeout(20000)});
  const result=await response.json();
  if(!response.ok)throw new Error(errors[result.error]||'Online booking is unavailable right now. Please email Nancy below.');
  return result;
 }
 function showStatus(b) {
  const when=format.format(new Date(b.start))+' Central Time.';
  const text={confirmed:'Test appointment confirmed: '+when+' This was a Stripe test payment, not a real charge.',paid_pending_calendar:'Your test payment was received. Calendar setup is still pending; the appointment is not yet confirmed.',refund_pending:'This appointment could not be completed. The test payment is being refunded.',refunded:'The test payment has been refunded. This appointment is not booked.',expired:'This unpaid checkout expired. Choose a new time or email Nancy.',cancelled:'This appointment is canceled.',checkout:'Your time is temporarily held. Checkout has not been confirmed.',hold:'Checkout is still being prepared.'};
  message(text[b.state]||'Your booking is still being processed.');
  $('cancel-hold').hidden=!['hold','checkout'].includes(b.state);
 }
 const params=new URLSearchParams(location.search),booking=params.get('booking');
 async function status() {
  const capability=storage.get('booking:'+booking);
  if(!capability){message('For your privacy, booking status can only be checked in the browser tab that started checkout. Contact Nancy if you need help. A payment redirect alone does not confirm an appointment.');return;}
  $('refresh-status').hidden=false;
  try{showStatus(await call('/v1/bookings/'+booking,{headers:{Authorization:'Bearer '+capability}}));}catch(e){message(e.message);}
 }
 $('refresh-status').addEventListener('click',status);
 $('cancel-hold').addEventListener('click',async()=>{
  $('cancel-hold').disabled=true;
  try{showStatus(await call('/v1/bookings/'+booking+'/cancel',{method:'POST',headers:{Authorization:'Bearer '+storage.get('booking:'+booking)}}));}catch(e){message(e.message);}finally{$('cancel-hold').disabled=false;}
 });
 $('booking-date').min=localDate(Date.now());$('booking-date').max=localDate(Date.now()+59*86400000);
 $('booking-date').addEventListener('change',()=>{generation++;selected=null;key=null;$('slots').hidden=true;$('details').hidden=true;});
 $('slot-form').addEventListener('submit',async e=>{
  e.preventDefault();const current=++generation;selected=null;key=null;$('details').hidden=true;$('slots').hidden=true;message('Checking both calendars…');
  requestDate=$('booking-date').value;
  try {
   const data=await call('/v1/availability?business=yakstack&service=consulting&date='+encodeURIComponent(requestDate));
   if(current!==generation)return;
   $('slot-options').replaceChildren();
   for(const slot of data.slots) {
    const button=document.createElement('button');button.type='button';button.textContent=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',hour:'numeric',minute:'2-digit'}).format(new Date(slot.start));button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>{
     selected=slot;key=null;for(const b of $('slot-options').children)b.setAttribute('aria-pressed',String(b===button));
     $('selected-time').textContent=format.format(new Date(slot.start))+' Central Time — 60 minutes';
     $('details').hidden=!config.checkout;
     if(config.checkout)$('customer-name').focus();else message('This time is currently available, but online checkout is not enabled. Email Nancy to request it; no reservation has been made.');
    });$('slot-options').append(button);
   }
   $('slots').hidden=!data.slots.length;message(data.slots.length?'Choose a time. Availability is checked again at checkout.':'No available times on this date. Try another date or email Nancy.');
  }catch(e){if(current===generation)message(e.message);}
 });
 $('details').addEventListener('submit',async e=>{
  e.preventDefault();if(!selected)return;$('checkout').disabled=true;
  try {
   key=key||Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
   // Save the capability BEFORE creating a hold; losing it must not create an inaccessible checkout.
   if(!storage.set('booking-pending-key',key))throw new Error('This browser is blocking session storage. Please enable it or email Nancy.');
   const b=await call('/v1/bookings',{method:'POST',headers:{'Content-Type':'application/json','X-Booking-Test-Key':$('test-key').value},body:JSON.stringify({business:'yakstack',service:'consulting',date:requestDate,start:selected.start,key,customer:{name:$('customer-name').value,email:$('customer-email').value}})});
   if(!storage.set('booking:'+b.id,key))throw new Error('Unable to save your booking reference. Please email Nancy before continuing.');
   if(b.checkoutUrl && new URL(b.checkoutUrl).origin==='https://checkout.stripe.com')location.assign(b.checkoutUrl);else showStatus(b);
  }catch(e){message(e.message);}finally{$('checkout').disabled=false;}
 });
 (async()=>{
  if(booking&&/^[a-f0-9]{64}$/.test(booking))await status();
  try{config=await call('/v1/config');$('slot-form').hidden=!config.availability;if(config.availability&&!booking)message(config.checkout?'Private test booking is available. No real charges will be made.':'Check available times, then email Nancy to arrange your consultation. Online checkout is not enabled.');}catch{ /* The static email fallback remains usable without the API. */ }
 })();
})();
