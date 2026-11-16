const phone=document.getElementById('phone');
const $=id=>document.getElementById(id);
let self='',myNumber='',messages=[],contacts=[],history=[],callActive=false,selectedConversation='';
const post=(name,data={})=>fetch(`https://${GetParentResourceName()}/${name}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
const contactByNumber=n=>contacts.find(c=>c.number===n);
const contactName=n=>contactByNumber(n)?.name||n;
const phonePattern=/^\d{10}$/;
function page(name){$('home').style.display=name==='home'?'block':'none';document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.id===name));}
function notice(msg){$('notice').textContent=msg;setTimeout(()=>{if($('notice').textContent===msg)$('notice').textContent=''},4000)}
function avatar(name,photo){const a=document.createElement('span');a.className='avatar';a.textContent=(name||'?').slice(0,1).toUpperCase();if(typeof photo==='string'&&/^https:\/\//i.test(photo)){const img=document.createElement('img');img.alt='';img.referrerPolicy='no-referrer';img.src=photo;img.onerror=()=>img.remove();a.appendChild(img)}return a}
function toast(title,body){const el=$('toast');el.replaceChildren();const h=document.createElement('strong');h.textContent=title;const p=document.createElement('p');p.textContent=body;el.append(h,p);el.classList.add('show');setTimeout(()=>el.classList.remove('show'),5000)}
function otherId(m){return m.sender===self?m.recipient:m.sender}
function numberById(id){return id===self?myNumber:contacts.find(c=>c.citizenid===id)?.number||id}
function render(){
 const list=$('contact-list');list.replaceChildren();
 contacts.forEach(c=>{const row=document.createElement('div');row.className='contact-row';row.appendChild(avatar(c.name,c.photo));const label=document.createElement('span');label.className='contact-label';label.textContent=c.name+' · '+c.number;row.appendChild(label);const call=document.createElement('button');call.textContent='☎';call.title='Call';call.onclick=()=>post('dial',{number:c.number});const sms=document.createElement('button');sms.textContent='✉';sms.title='Message';sms.onclick=()=>{$('recipient').value=c.number;page('messages')};const del=document.createElement('button');del.textContent='×';del.title='Delete contact';del.onclick=()=>post('deleteContact',{number:c.number});row.append(call,sms,del);list.appendChild(row)});
 const calls=$('history');calls.replaceChildren();history.forEach(h=>{const row=document.createElement('div');row.className='history-row';row.textContent=`${h.caller===self?'↗ Outgoing':'↙ Incoming'} · ${h.status}`;calls.appendChild(row)});
 const thread=$('thread');thread.replaceChildren();
 messages.slice().reverse().filter(m=>!selectedConversation||otherId(m)===selectedConversation).forEach(m=>{const el=document.createElement('div');el.className='bubble '+(m.sender===self?'mine':'theirs');el.textContent=m.body;thread.appendChild(el)});thread.scrollTop=thread.scrollHeight;
 const conversations=$('conversations');conversations.replaceChildren();
 const seen=new Set();messages.forEach(m=>{const id=otherId(m);if(seen.has(id))return;seen.add(id);const b=document.createElement('button');b.className='conversation';b.textContent=(id===self?'Notes':numberById(id))+' · '+m.body.slice(0,26);b.onclick=()=>{selectedConversation=id;render()};conversations.appendChild(b)});
}
function setTheme(theme){phone.classList.toggle('samsung',theme==='samsung');phone.classList.toggle('iphone',theme!=='samsung')}
window.addEventListener('message',({data})=>{
 if(data.action==='visibility'){phone.classList.toggle('hidden',!data.visible);if(data.visible)page('home')}
 if(data.action==='load'){self=data.data.citizenid;myNumber=data.data.number||'';messages=data.data.messages||[];contacts=data.data.contacts||[];history=data.data.history||[];$('my-number').textContent='Your number · '+(myNumber||'Unavailable');setTheme(data.data.theme);render()}
 if(data.action==='message'){messages.unshift(data.data);render();if(data.data.sender!==self){toast('New message',data.data.body.slice(0,90))}}
 if(data.action==='error')notice(data.message)
 if(data.action==='incoming'||data.action==='calling'){callActive=true;page('call-screen');const incoming=data.action==='incoming';$('call-title').textContent=incoming?'Incoming call':'Calling…';$('call-number').textContent=contactName(data.data.number);$('call-avatar').replaceChildren(avatar(contactName(data.data.number),contactByNumber(data.data.number)?.photo));$('answer').style.display=incoming?'inline-block':'none';if(incoming)toast('Incoming call',contactName(data.data.number))}
 if(data.action==='connected'){$('call-title').textContent='Connected';$('answer').style.display='none'}
 if(data.action==='callEnded'){callActive=false;page('home');notice('Call ended')}
});
document.querySelectorAll('[data-app]').forEach(b=>b.onclick=()=>page(b.dataset.app));
document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{setTheme(b.dataset.theme);post('saveTheme',{theme:b.dataset.theme})});
$('back').onclick=()=>{if(!callActive)page('home');else notice('Hang up to leave the call')};
$('close').onclick=()=>post('close');
$('send').onclick=()=>{const recipient=$('recipient').value.trim(),body=$('body').value.trim();if(!phonePattern.test(recipient)||!body){notice('Enter a valid number and message');return}post('sendMessage',{recipient,body});$('body').value='';selectedConversation='';};
$('save-contact').onclick=()=>{const name=$('contact-name').value.trim(),number=$('contact-number').value.trim(),photo=$('contact-photo').value.trim();if(!name||!phonePattern.test(number)||photo&&!/^https:\/\//i.test(photo)){notice('Enter a name, number, and optional HTTPS photo URL');return}post('saveContact',{name,number,photo});$('contact-name').value='';$('contact-number').value='';$('contact-photo').value=''};
$('dial').onclick=()=>{const number=$('dial-number').value.trim();if(!phonePattern.test(number)){notice('Enter a 10-digit number');return}post('dial',{number})};
$('answer').onclick=()=>post('answer');$('hangup').onclick=()=>post('hangup');
document.addEventListener('keydown',e=>{if(e.key==='Escape')post('close')});
setInterval(()=>{$('clock').textContent=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})},10000);
