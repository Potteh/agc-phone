const phone=document.getElementById('phone');
const $=id=>document.getElementById(id);
let self='',myNumber='',messages=[],contacts=[],history=[],callActive=false,selectedConversation='';
let preferences={wallpaper:'aurora',brightness:85,darkMode:true,sounds:true,lockEnabled:true};
let locked=false,notifications=[],layout=['dialer','messages','contacts','settings'];
const post=(name,data={})=>fetch(`https://${GetParentResourceName()}/${name}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
const contactByNumber=n=>contacts.find(c=>c.number===n);
const contactName=n=>contactByNumber(n)?.name||n;
const phonePattern=/^\d{10}$/;
function page(name){$('home').style.display=name==='home'?'block':'none';document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.id===name));}
function notice(msg){$('notice').textContent=msg;setTimeout(()=>{if($('notice').textContent===msg)$('notice').textContent=''},4000)}
function avatar(name,photo){const a=document.createElement('span');a.className='avatar';a.textContent=(name||'?').slice(0,1).toUpperCase();if(typeof photo==='string'&&/^https:\/\//i.test(photo)){const img=document.createElement('img');img.alt='';img.referrerPolicy='no-referrer';img.src=photo;img.onerror=()=>img.remove();a.appendChild(img)}return a}
function toast(title,body){
 addNotification(title,body);const el=$('toast');el.replaceChildren();const h=document.createElement('strong');h.textContent=title;const p=document.createElement('p');p.textContent=body;el.append(h,p);el.classList.add('show');setTimeout(()=>el.classList.remove('show'),5000)}
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
 if(data.action==='visibility'){phone.classList.toggle('hidden',!data.visible);if(data.visible){page('home');setLocked(preferences.lockEnabled&&!callActive)}else{setLocked(false);$('notification-shade').classList.remove('open')}}
 if(data.action==='load'){self=data.data.citizenid;myNumber=data.data.number||'';messages=data.data.messages||[];contacts=data.data.contacts||[];history=data.data.history||[];$('my-number').textContent='Your number · '+(myNumber||'Unavailable');setTheme(data.data.theme);applyPreferences(data.data.preferences);applyHomeLayout(data.data.preferences?.home_layout);render()}
 if(data.action==='message'){messages.unshift(data.data);render();if(data.data.sender!==self){toast('New message',data.data.body.slice(0,90))}}
 if(data.action==='error')notice(data.message)
 if(data.action==='incoming'||data.action==='calling'){callActive=true;setLocked(false);page('call-screen');const incoming=data.action==='incoming';$('call-title').textContent=incoming?'Incoming call':'Calling…';$('call-number').textContent=contactName(data.data.number);$('call-avatar').replaceChildren(avatar(contactName(data.data.number),contactByNumber(data.data.number)?.photo));$('answer').style.display=incoming?'inline-block':'none';if(incoming)toast('Incoming call',contactName(data.data.number))}
 if(data.action==='connected'){$('call-title').textContent='Connected';$('answer').style.display='none'}
 if(data.action==='callEnded'){callActive=false;page('home');notice('Call ended')}
});
document.querySelectorAll('[data-app]').forEach(b=>b.onclick=()=>{if(!editMode)page(b.dataset.app)});
document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{setTheme(b.dataset.theme);post('saveTheme',{theme:b.dataset.theme})});
$('back').onclick=()=>{if(!callActive)page('home');else notice('Hang up to leave the call')};
$('close').onclick=()=>post('close');
$('send').onclick=()=>{const recipient=$('recipient').value.trim(),body=$('body').value.trim();if(!phonePattern.test(recipient)||!body){notice('Enter a valid number and message');return}post('sendMessage',{recipient,body});$('body').value='';selectedConversation='';};
$('save-contact').onclick=()=>{const name=$('contact-name').value.trim(),number=$('contact-number').value.trim(),photo=$('contact-photo').value.trim();if(!name||!phonePattern.test(number)||photo&&!/^https:\/\//i.test(photo)){notice('Enter a name, number, and optional HTTPS photo URL');return}post('saveContact',{name,number,photo});$('contact-name').value='';$('contact-number').value='';$('contact-photo').value=''};
$('dial').onclick=()=>{const number=$('dial-number').value.trim();if(!phonePattern.test(number)){notice('Enter a 10-digit number');return}post('dial',{number})};
$('answer').onclick=()=>post('answer');$('hangup').onclick=()=>post('hangup');
document.addEventListener('keydown',e=>{if(e.key==='Escape')post('close')});
setInterval(updateClock,10000);

function setLocked(value){
 locked=!!value;
 $('lock-screen').classList.toggle('open',locked);
 if(locked)$('notification-shade').classList.remove('open');
 updateClock();
}
function updateClock(){
 const now=new Date();
 $('clock').textContent=now.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
 $('lock-time').textContent=now.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
 $('lock-date').textContent=now.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});
 $('widget-date').textContent=now.toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'});
 $('widget-time').textContent=now.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
}
function addNotification(title,body){
 notifications.unshift({title:String(title).slice(0,80),body:String(body).slice(0,180),time:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})});
 notifications=notifications.slice(0,30);
 renderNotifications();
}
function renderNotifications(){
 const list=$('notification-list');list.replaceChildren();
 if(!notifications.length){const empty=document.createElement('p');empty.textContent='No notifications';list.appendChild(empty)}
 notifications.forEach(n=>{const card=document.createElement('div');card.className='notification-item';const head=document.createElement('strong');head.textContent=n.title;const body=document.createElement('p');body.textContent=n.body;const time=document.createElement('small');time.textContent=n.time;card.append(head,body,time);list.appendChild(card)});
 $('widget-notifications').textContent=notifications.length+' alert'+(notifications.length===1?'':'s');
 $('lock-preview').textContent=notifications.length?notifications[0].title+' · '+notifications[0].body:'No new notifications';
}
function applyPreferences(p){
 if(p){preferences={
 wallpaper:['aurora','ocean','sunset','midnight'].includes(p.wallpaper)?p.wallpaper:'aurora',
 brightness:Math.max(35,Math.min(100,Number(p.brightness)||85)),
 darkMode:p.dark_mode===1||p.dark_mode===true,
 sounds:p.sounds===1||p.sounds===true,
 lockEnabled:p.lock_enabled===1||p.lock_enabled===true
 }}
 phone.dataset.wallpaper=preferences.wallpaper;
 phone.classList.toggle('light-mode',!preferences.darkMode);
 phone.style.setProperty('--screen-brightness',String(preferences.brightness/100));
 $('brightness').value=preferences.brightness;
 $('quick-brightness').value=preferences.brightness;$('quick-brightness-value').textContent=preferences.brightness+'%';$('quick-wallpaper').value=preferences.wallpaper;
 $('quick-dark').classList.toggle('enabled',preferences.darkMode);$('quick-sound').classList.toggle('enabled',preferences.sounds);$('quick-lock').classList.toggle('enabled',preferences.lockEnabled);
 $('brightness-value').textContent=preferences.brightness+'%';
 $('dark-mode').checked=preferences.darkMode;
 $('sounds').checked=preferences.sounds;
 $('lock-enabled').checked=preferences.lockEnabled;
 document.querySelectorAll('[data-wallpaper]').forEach(b=>b.classList.toggle('selected',b.dataset.wallpaper===preferences.wallpaper));
}
function savePreferences(){
 preferences={wallpaper:phone.dataset.wallpaper||'aurora',brightness:Number($('brightness').value),darkMode:$('dark-mode').checked,sounds:$('sounds').checked,lockEnabled:$('lock-enabled').checked};
 applyPreferences();
 post('savePreferences',preferences);
}
document.querySelectorAll('[data-wallpaper]').forEach(b=>b.onclick=()=>{phone.dataset.wallpaper=b.dataset.wallpaper;savePreferences()});
['brightness','dark-mode','sounds','lock-enabled'].forEach(id=>$(id).addEventListener('change',savePreferences));
$('brightness').addEventListener('input',()=>{$('brightness-value').textContent=$('brightness').value+'%';$('quick-brightness').value=$('brightness').value;$('quick-brightness-value').textContent=$('brightness').value+'%'});
$('quick-brightness').addEventListener('input',()=>{$('brightness').value=$('quick-brightness').value;$('brightness-value').textContent=$('brightness').value+'%';$('quick-brightness-value').textContent=$('brightness').value+'%';savePreferences()});
$('quick-wallpaper').onchange=()=>{phone.dataset.wallpaper=$('quick-wallpaper').value;savePreferences()};
$('quick-dark').onclick=()=>{$('dark-mode').checked=!$('dark-mode').checked;savePreferences()};
$('quick-sound').onclick=()=>{$('sounds').checked=!$('sounds').checked;savePreferences()};
$('quick-lock').onclick=()=>{$('lock-enabled').checked=!$('lock-enabled').checked;savePreferences()};
$('quick-notify').onclick=()=>{$('control-center').classList.remove('open');$('notification-shade').classList.add('open')};
$('control-toggle').onclick=()=>{$('control-center').classList.toggle('open');$('notification-shade').classList.remove('open')};
$('control-close').onclick=()=>$('control-center').classList.remove('open');
$('unlock').onclick=()=>setLocked(false);
$('shade-toggle').onclick=()=>{$('notification-shade').classList.toggle('open')};
$('lock-notifications').onclick=()=>{$('notification-shade').classList.add('open')};
$('close-shade').onclick=()=>$('notification-shade').classList.remove('open');
$('clear-notifications').onclick=()=>{notifications=[];renderNotifications()};
updateClock();
renderNotifications();

const appGrid=$('app-grid');
function applyHomeLayout(saved){
 const allowed=['dialer','messages','contacts','settings'];
 const candidate=typeof saved==='string'?saved.split(','):saved;
 layout=Array.isArray(candidate)&&candidate.length===4&&new Set(candidate).size===4&&candidate.every(x=>allowed.includes(x))?candidate:allowed;
 const buttons=Object.fromEntries([...appGrid.querySelectorAll('[data-app]')].map(b=>[b.dataset.app,b]));
 layout.forEach(name=>appGrid.appendChild(buttons[name]));
}
let dragging=null;
appGrid.querySelectorAll('[data-app]').forEach(button=>{
 button.draggable=true;
 button.addEventListener('dragstart',e=>{dragging=button.dataset.app;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragging)});
 button.addEventListener('dragover',e=>e.preventDefault());
 button.addEventListener('drop',e=>{
   e.preventDefault();
   const target=button.dataset.app;
   if(!dragging||dragging===target)return;
   const from=layout.indexOf(dragging),to=layout.indexOf(target);
   if(from<0||to<0)return;
   layout.splice(from,1);layout.splice(to,0,dragging);
   applyHomeLayout(layout);
   post('saveHomeLayout',layout);
   dragging=null;
 });
 button.addEventListener('dragend',()=>{dragging=null});
});
$('widget-notifications').parentElement.addEventListener('click',()=>{$('notification-shade').classList.add('open')});

let editMode=false,firstSelected=null;
$('edit-apps').onclick=()=>{
 editMode=!editMode;firstSelected=null;
 $('edit-apps').textContent=editMode?'Done':'Edit Home Screen';
 appGrid.classList.toggle('editing',editMode);
 appGrid.querySelectorAll('[data-app]').forEach(b=>b.classList.toggle('edit-icon',editMode));
};
appGrid.querySelectorAll('[data-app]').forEach(button=>{
 button.addEventListener('click',e=>{
  if(!editMode)return;
  e.preventDefault();e.stopImmediatePropagation();
  const current=button.dataset.app;
  if(!firstSelected){firstSelected=current;button.classList.add('selected-icon');return}
  const a=layout.indexOf(firstSelected),b=layout.indexOf(current);
  if(a!==b&&a>=0&&b>=0){[layout[a],layout[b]]=[layout[b],layout[a]];applyHomeLayout(layout);post('saveHomeLayout',layout)}
  firstSelected=null;appGrid.querySelectorAll('.selected-icon').forEach(x=>x.classList.remove('selected-icon'));
 });
});
