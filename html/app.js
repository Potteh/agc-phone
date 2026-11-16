const phone=document.getElementById('phone');let self='',messages=[],contacts=[],history=[];
const $=id=>document.getElementById(id);
const post=(name,data={})=>fetch(`https://${GetParentResourceName()}/${name}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
function page(name){$('home').style.display=name==='home'?'block':'none';document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.id===name));}
function notice(msg){$('notice').textContent=msg;setTimeout(()=>{if($('notice').textContent===msg)$('notice').textContent=''},4500)}
function render(){
 const thread=$('thread');thread.replaceChildren();
 messages.slice().reverse().forEach(m=>{const el=document.createElement('div');el.className='bubble';el.textContent=`${m.sender===self?'You':m.sender}: ${m.body}`;thread.appendChild(el)});
 thread.scrollTop=thread.scrollHeight;
 const list=$('contact-list');list.replaceChildren();
 contacts.forEach(c=>{const row=document.createElement('div');row.className='bubble';const name=document.createElement('span');name.textContent=`${c.name} — ${c.number} `;const call=document.createElement('button');call.textContent='Call';call.onclick=()=>post('dial',{number:c.number});const del=document.createElement('button');del.textContent='Delete';del.onclick=()=>post('deleteContact',{number:c.number});row.append(name,call,del);list.appendChild(row)});
 const calls=$('history');calls.replaceChildren();history.forEach(h=>{const row=document.createElement('div');row.className='bubble';row.textContent=`${h.caller===self?'Outgoing':'Incoming'} — ${h.status}`;calls.appendChild(row)});
}
window.addEventListener('message',({data})=>{
 if(data.action==='visibility'){phone.classList.toggle('hidden',!data.visible);if(data.visible)page('home')}
 if(data.action==='load'){self=data.data.citizenid;messages=data.data.messages||[];contacts=data.data.contacts||[];history=data.data.history||[];$('my-number').textContent='Your number: '+(data.data.number||'Unavailable');phone.classList.toggle('samsung',data.data.theme==='samsung');phone.classList.toggle('iphone',data.data.theme!=='samsung');render()}
 if(data.action==='message'){messages.unshift(data.data);render()}
 if(data.action==='error')notice(data.message)
 if(data.action==='incoming'||data.action==='calling'){page('call-screen');$('call-title').textContent=data.action==='incoming'?'Incoming call':'Calling...';$('call-number').textContent=data.data.number;$('answer').style.display=data.action==='incoming'?'inline-block':'none'}
 if(data.action==='connected'){$('call-title').textContent='Connected';$('answer').style.display='none'}
 if(data.action==='callEnded'){page('home');notice('Call ended')}
});
document.querySelectorAll('[data-app]').forEach(b=>b.onclick=()=>page(b.dataset.app));
document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{const theme=b.dataset.theme;phone.classList.toggle('samsung',theme==='samsung');phone.classList.toggle('iphone',theme==='iphone');post('saveTheme',{theme})});
$('back').onclick=()=>page('home');$('close').onclick=()=>post('close');
$('send').onclick=()=>{const recipient=$('recipient').value.trim(),body=$('body').value.trim();if(!/^\d{10}$/.test(recipient)||!body){notice('Enter a valid number and message');return}post('sendMessage',{recipient,body});$('body').value=''};
$('save-contact').onclick=()=>{const name=$('contact-name').value.trim(),number=$('contact-number').value.trim();if(!name||!/^\d{10}$/.test(number)){notice('Enter a name and 10-digit number');return}post('saveContact',{name,number});$('contact-name').value='';$('contact-number').value=''};
$('dial').onclick=()=>{const number=$('dial-number').value.trim();if(!/^\d{10}$/.test(number)){notice('Enter a 10-digit number');return}post('dial',{number})};
$('answer').onclick=()=>post('answer');$('hangup').onclick=()=>post('hangup');
document.addEventListener('keydown',e=>{if(e.key==='Escape')post('close')});
