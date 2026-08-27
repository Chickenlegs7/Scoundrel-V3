(()=>{
const root=document.getElementById('app');
const DUNGEONS={
 ashen:{id:'ashen',name:'The Ashen Crypt',desc:'An old royal tomb where the dead refuse to sleep.',floors:9,boss:'Ashen Warden',chapter:'Chapter I · The First Seal'},
 verdant:{id:'verdant',name:'Verdant Hollow',desc:'A poisoned living maze beneath strangled roots.',floors:11,boss:'The Heartroot',chapter:'Chapter II · The Green Seal'},
 frost:{id:'frost',name:'The Frostvault',desc:'Something ancient waits below the ice.',locked:true,coming:true,chapter:'Chapter III'}
};
const CLASSES={
 warrior:{name:'Warrior',hp:24,damage:5,icon:'🛡️',passive:'Guarded: Defend blocks 6 damage.',ability:'Power Strike: 8 damage. 3-turn cooldown.'},
 rogue:{name:'Rogue',hp:19,damage:6,icon:'🗡️',passive:'Opportunist: +2 damage against wounded enemies.',ability:'Vanish: avoid the next enemy attack. 3-turn cooldown.'},
 ranger:{name:'Ranger',hp:20,damage:5,icon:'🏹',passive:'Hunter: first attack each combat deals +2.',ability:'Volley: 4 damage to every enemy. 3-turn cooldown.'},
 mage:{name:'Mage',hp:17,damage:7,icon:'🔮',passive:'Arcane Echo: every third basic attack deals +3.',ability:'Fireball: 10 damage. 3-turn cooldown.'}
};
const ENEMIES=[
 {name:'Crypt Rat',hp:10,atk:4,shards:2},{name:'Bone Thrall',hp:14,atk:5,shards:3},{name:'Grave Hound',hp:18,atk:6,shards:4},{name:'Hollow Knight',hp:23,atk:7,shards:5},{name:'Ash Acolyte',hp:21,atk:8,shards:5},{name:'Tomb Brute',hp:29,atk:9,shards:7},{name:'Grave Revenant',hp:32,atk:10,shards:8}
];
const VERDANT_ENEMIES=[
 {name:'Thornling',hp:24,atk:8,shards:5,gold:5},{name:'Spore Hound',hp:29,atk:9,shards:6,gold:6,poison:1},
 {name:'Briar Stalker',hp:35,atk:10,shards:7,gold:7},{name:'Rot Shaman',hp:31,atk:11,shards:8,gold:8,regen:3},
 {name:'Vinebound Brute',hp:43,atk:12,shards:9,gold:9},{name:'Bloom Horror',hp:48,atk:13,shards:11,gold:11,poison:2},
 {name:'Ancient Treant',hp:58,atk:14,shards:13,gold:14,regen:4}
];
const GEAR={
 rusty_blade:{name:'Rusty Blade',slot:'weapon',damage:1,price:45,desc:'+1 basic attack damage.'},
 iron_blade:{name:'Iron Blade',slot:'weapon',damage:2,price:120,desc:'+2 basic attack damage.'},
 ember_edge:{name:'Ember Edge',slot:'weapon',damage:3,price:260,desc:'+3 basic attack damage.'},
 patched_leather:{name:'Patched Leather',slot:'armor',hp:2,price:45,desc:'+2 maximum HP.'},
 iron_mail:{name:'Iron Mail',slot:'armor',hp:4,guard:1,price:130,desc:'+4 HP and +1 Defend.'},
 warden_plate:{name:'Warden Plate',slot:'armor',hp:7,guard:1,price:280,desc:'+7 HP and +1 Defend.'}
};
const RUN_UPGRADES=[
 {name:'Stitch Wounds',text:'+2 maximum HP and recover 2 HP.',apply:s=>{s.maxHp+=2;s.hp=Math.min(s.maxHp,s.hp+2)}},
 {name:'Honed Edge',text:'+1 basic attack damage.',apply:s=>s.damage+=1},
 {name:'Brace',text:'Defend blocks +1 damage.',apply:s=>s.guard+=1},
 {name:'Field Dressing',text:'Camps restore +2 additional HP.',apply:s=>s.campBonus+=2},
 {name:'Finisher',text:'Your first basic attack in each combat deals +1 damage.',apply:s=>s.openingBonus+=1},
 {name:'Tough Hide',text:'The first enemy hit each combat deals 1 less damage.',apply:s=>s.firstHitReduce+=1}
];
const PERM={
 vitality:{name:'Vitality',desc:'+2 starting maximum HP per rank.',base:18,step:10,max:22},
 might:{name:'Might',desc:'+1 starting basic attack damage per rank.',base:22,step:12,max:20},
 guard:{name:'Guard',desc:'+1 Defend strength per rank.',base:18,step:10,max:20},
 recovery:{name:'Recovery',desc:'Camps restore +2 additional HP per rank.',base:14,step:8,max:20},
 mastery:{name:'Mastery',desc:'Class ability gains +1 power per rank.',base:24,step:14,max:20}
};
let state=null;
function blankRanks(){return{vitality:0,might:0,guard:0,recovery:0,mastery:0}}
const SAVE_KEY='delverMeta';
const SAVE_SCHEMA=3;
const BACKUP_KEYS=['delverMetaBackup1','delverMetaBackup2','delverMetaBackup3'];

function blankMeta(){
 return {schemaVersion:SAVE_SCHEMA,wins:0,losses:0,ashenCleared:false,verdantCleared:false,shards:0,gold:0,potions:0,expeditions:0,deaths:0,bossKills:0,bestFloor:0,bestFloors:{ashen:0,verdant:0},ranks:{},inventory:[],equipment:{},recoveryUsed:false};
}
function normalizeMeta(input={}){
 const m={...blankMeta(),...(input||{})};
 m.schemaVersion=SAVE_SCHEMA;
 m.wins=Number(m.wins)||0;m.losses=Number(m.losses)||0;
 m.ashenCleared=!!m.ashenCleared;m.verdantCleared=!!m.verdantCleared;
 m.shards=Number(m.shards)||0;m.gold=Number(m.gold)||0;m.potions=Number(m.potions)||0;
 m.expeditions=Number(m.expeditions)||0;m.deaths=Number(m.deaths)||(Number(m.losses)||0);
 m.bossKills=Number(m.bossKills)||(Number(m.wins)||0);m.bestFloor=Number(m.bestFloor)||0;
 m.bestFloors={ashen:m.bestFloor||0,verdant:0,...(m.bestFloors||{})};
 m.ranks=m.ranks||{};m.inventory=Array.isArray(m.inventory)?m.inventory:[];m.equipment=m.equipment||{};
 for(const id of Object.keys(CLASSES)){
   m.ranks[id]={...blankRanks(),...(m.ranks[id]||{})};
   for(const k of Object.keys(blankRanks()))m.ranks[id][k]=Math.max(0,Number(m.ranks[id][k])||0);
   m.equipment[id]={weapon:null,armor:null,...(m.equipment[id]||{})};
 }
 return m;
}
function rotateBackup(raw){
 if(!raw)return;
 try{
   localStorage.setItem(BACKUP_KEYS[2],localStorage.getItem(BACKUP_KEYS[1])||'');
   localStorage.setItem(BACKUP_KEYS[1],localStorage.getItem(BACKUP_KEYS[0])||'');
   localStorage.setItem(BACKUP_KEYS[0],raw);
 }catch{}
}
function loadMeta(){
 let raw=null,parsed={};
 try{raw=localStorage.getItem(SAVE_KEY);parsed=raw?JSON.parse(raw):{}}catch{}
 if(raw)rotateBackup(raw);
 const migrated=normalizeMeta(parsed);
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(migrated))}catch{}
 return migrated;
}
let meta=loadMeta();
function saveMeta(){
 try{
   const previous=localStorage.getItem(SAVE_KEY);
   if(previous)rotateBackup(previous);
   meta=normalizeMeta(meta);
   localStorage.setItem(SAVE_KEY,JSON.stringify(meta));
 }catch{}
}
function loreEntries(){
 const entries=[
  {title:'The Ember Below',unlocked:true,text:'Long ago, the kingdoms sealed their dead beneath stone and prayer. Then the first Ember rose from a forgotten grave — warm, bright, and carrying memories that did not belong to the living. Now the old places are waking. Delvers descend where armies will not, returning with Ember Shards and fragments of whatever truth sleeps below.'},
  {title:'A Delver Returns',unlocked:meta.expeditions>=1,text:'Death is not the end of a delver’s work. The Sanctum binds each recovered Ember to the adventurer who carried it home. Every failed descent leaves a mark: stronger hands, steadier breath, sharper instincts. The dungeon remembers you. You learn to remember it.'},
  {title:'Whispers of the Warden',unlocked:meta.bestFloor>=5,text:'Deep in the Ashen Crypt, the dead speak of a crowned guardian who never received a burial. The Warden is not merely protecting the tomb. Something beneath it is trying to get out — and the Warden may be the last lock still holding.'},
  {title:'Ashes of a Crown',unlocked:meta.ashenCleared,text:'When the Ashen Warden falls, the Ember in its chest does not fade. It points east, toward a forest that vanished from every royal map. Roots twist beneath ruined earth. The Ashen Crypt was not the source. It was the first warning.'},
  {title:'The Verdant Hollow',unlocked:meta.ashenCleared,text:'The Warden’s Ember leads to a valley swallowed by impossible growth. Hunters call it Verdant Hollow. Trees breathe through split bark. Flowers bloom from old bones. At its center, something beats beneath the soil like a buried heart. The second seal is alive.'},
  {title:'The Green Memory',unlocked:(meta.bestFloors?.verdant||0)>=6,text:'The Hollow remembers the hands that made it. The seals were not prisons built independently—they were roots of one binding, spread across the world. Break enough of them and whatever they bind may finally remember its own name.'},
  {title:'Heart of the Hollow',unlocked:meta.verdantCleared,text:'The Heartroot dies screaming through every tree in the valley. In the silence that follows, frost forms across the recovered seal despite the summer heat. Far to the north, something beneath ancient ice answers.'}
 ];
 return entries;
}
function chronicle(){
 const entries=loreEntries();
 shell(`<h1 class="screen-title">The Chronicle</h1><p class="muted">What your expeditions have uncovered so far.</p><div class="chronicle">${entries.map(e=>`<section class="panel lore ${e.unlocked?'':'locked-lore'}"><div class="kicker">${e.unlocked?'RECOVERED':'LOCKED'}</div><h2>${e.unlocked?e.title:'???'}</h2><p>${e.unlocked?e.text:'Descend farther to uncover this fragment.'}</p></section>`).join('')}</div><button class="ghost" id="chronicleBack">Back</button>`);
 document.getElementById('chronicleBack').onclick=menu;
}
function shell(content){root.innerHTML=`<div class="app"><div class="top"><a class="back" href="../">‹ Games</a><div class="brand">DELVER</div><span></span></div>${content}</div>`}
function equipped(cid,slot){const id=meta.equipment[cid]?.[slot];return id?GEAR[id]:null}

function saveManagement(){
 shell(`<h1 class="screen-title">Save Management</h1>
 <p class="muted">Delver saves locally on this device. Export a backup before major updates or moving to another phone.</p>
 <section class="panel"><div class="kicker">SAVE SCHEMA ${SAVE_SCHEMA}</div><h2>Backup & Transfer</h2>
 <div class="save-actions"><button class="primary" id="exportSave">Export Save File</button><label class="file-button">Import Save File<input id="importSave" type="file" accept=".json,application/json"></label></div>
 <p class="muted">Import replaces the active Delver save after first backing up the current one.</p></section>
 <section class="panel"><h2>Automatic Backups</h2><p>Delver now keeps three rotating local backups whenever progression is saved.</p><button class="ghost" id="restoreBackup" ${localStorage.getItem(BACKUP_KEYS[0])?'':'disabled'}>Restore Latest Local Backup</button></section>
 <section class="panel recovery-panel"><div class="kicker">V2.2 RECOVERY</div><h2>Restore My Previous Warrior</h2><p>Restores the playtest progression recorded before the V3 storage issue: 29 expeditions, 4 Ashen clears, and Warrior ranks Vitality 3 / Might 4 / Guard 5 / Recovery 2 / Mastery 3.</p><button class="danger-soft" id="recoverV22" ${meta.recoveryUsed?'disabled':''}>${meta.recoveryUsed?'Recovery Already Used':'Restore My V2.2 Progress'}</button></section>
 <button class="ghost" id="saveBack">Back to Emberfall</button>`);
 document.getElementById('exportSave').onclick=exportSave;
 document.getElementById('importSave').onchange=importSaveFile;
 document.getElementById('restoreBackup').onclick=restoreLatestBackup;
 document.getElementById('recoverV22').onclick=recoverV22;
 document.getElementById('saveBack').onclick=city;
}
function exportSave(){
 const payload={game:'Delver',schemaVersion:SAVE_SCHEMA,exportedAt:new Date().toISOString(),meta:normalizeMeta(meta)};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`delver-save-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function importSaveFile(ev){
 const file=ev.target.files?.[0];if(!file)return;
 const reader=new FileReader();
 reader.onload=()=>{try{
   const data=JSON.parse(reader.result);const incoming=data.meta||data;
   if(!incoming||typeof incoming!=='object'||!incoming.ranks)throw new Error('Invalid Delver save');
   const current=localStorage.getItem(SAVE_KEY);if(current)rotateBackup(current);
   meta=normalizeMeta(incoming);saveMeta();alert('Save imported successfully.');saveManagement();
 }catch(err){alert('That file is not a valid Delver save.')}};
 reader.readAsText(file);
}
function restoreLatestBackup(){
 const raw=localStorage.getItem(BACKUP_KEYS[0]);if(!raw)return;
 try{const current=localStorage.getItem(SAVE_KEY);if(current)rotateBackup(current);meta=normalizeMeta(JSON.parse(raw));saveMeta();alert('Latest backup restored.');saveManagement()}catch{alert('The latest backup could not be restored.')}
}
function recoverV22(){
 if(meta.recoveryUsed)return;
 const current=localStorage.getItem(SAVE_KEY);if(current)rotateBackup(current);
 const warrior={vitality:3,might:4,guard:5,recovery:2,mastery:3};
 meta.expeditions=Math.max(meta.expeditions,29);
 meta.wins=Math.max(meta.wins,4);meta.bossKills=Math.max(meta.bossKills,4);
 meta.losses=Math.max(meta.losses,25);meta.deaths=Math.max(meta.deaths,25);
 meta.ashenCleared=true;meta.bestFloor=Math.max(meta.bestFloor,9);
 meta.bestFloors.ashen=Math.max(meta.bestFloors.ashen||0,9);
 for(const [k,v] of Object.entries(warrior))meta.ranks.warrior[k]=Math.max(meta.ranks.warrior[k]||0,v);
 meta.recoveryUsed=true;saveMeta();alert('Your V2.2 Warrior progression has been restored.');saveManagement();
}
function city(){
 shell(`<h1 class="screen-title">Emberfall</h1><p class="story-lead">A frontier city built around the Sanctum. Delvers spend what they drag back from the dark, then prepare to descend again.</p><div class="wallet"><span>🪙 ${meta.gold} Gold</span><span>🧪 ${meta.potions} Potions</span></div><div class="city-grid"><button class="choice" id="smith"><strong>⚒️ Blacksmith</strong><span>Buy and equip persistent weapons and armor.</span></button><button class="choice" id="alchemist"><strong>🧪 Alchemist</strong><span>Buy healing potions consumed during expeditions.</span></button><button class="choice" id="saveManage"><strong>💾 Save Management</strong><span>Export, import, restore backups, or recover legacy progression.</span></button></div><button class="ghost" id="cityBack">Back to Dungeons</button>`);
 document.getElementById('smith').onclick=blacksmith;document.getElementById('alchemist').onclick=alchemist;document.getElementById('saveManage').onclick=saveManagement;document.getElementById('cityBack').onclick=menu;
}
function blacksmith(){
 shell(`<h1 class="screen-title">The Blacksmith</h1><div class="wallet">🪙 ${meta.gold} Gold</div><p class="muted">Purchased equipment is permanent. Each adventurer equips their own weapon and armor.</p><div class="shop">${Object.entries(GEAR).map(([id,g])=>{const owned=meta.inventory.includes(id);return `<button class="upgrade" data-buygear="${id}" ${owned||meta.gold<g.price?'disabled':''}><strong>${g.name} · ${g.slot}</strong><span>${g.desc}</span><span class="loot">${owned?'OWNED':`${g.price} 🪙`}</span></button>`}).join('')}</div><div class="section-label">Equipment</div>${Object.entries(CLASSES).map(([cid,c])=>`<section class="panel equipment-card"><strong>${c.icon} ${c.name}</strong><div class="equip-row"><button data-equip="${cid}:weapon">${equipped(cid,'weapon')?.name||'No Weapon'}</button><button data-equip="${cid}:armor">${equipped(cid,'armor')?.name||'No Armor'}</button></div></section>`).join('')}<button class="ghost" id="smithBack">Back to City</button>`);
 root.querySelectorAll('[data-buygear]').forEach(b=>b.onclick=()=>{const id=b.dataset.buygear,g=GEAR[id];if(meta.gold<g.price||meta.inventory.includes(id))return;meta.gold-=g.price;meta.inventory.push(id);saveMeta();blacksmith()});
 root.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{const [cid,slot]=b.dataset.equip.split(':');chooseEquipment(cid,slot)});
 document.getElementById('smithBack').onclick=city;
}
function chooseEquipment(cid,slot){
 const ids=meta.inventory.filter(id=>GEAR[id].slot===slot);
 shell(`<h1 class="screen-title">Equip ${slot}</h1><p class="muted">${CLASSES[cid].icon} ${CLASSES[cid].name}</p><div class="upgrades"><button class="upgrade" data-item=""><strong>None</strong><span>Unequip current ${slot}.</span></button>${ids.map(id=>`<button class="upgrade" data-item="${id}"><strong>${GEAR[id].name}</strong><span>${GEAR[id].desc}</span></button>`).join('')}</div><button class="ghost" id="equipBack">Back</button>`);
 root.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{meta.equipment[cid][slot]=b.dataset.item||null;saveMeta();blacksmith()});document.getElementById('equipBack').onclick=blacksmith;
}
function alchemist(){
 const price=28;shell(`<h1 class="screen-title">The Alchemist</h1><div class="wallet"><span>🪙 ${meta.gold} Gold</span><span>🧪 ${meta.potions} Potions</span></div><section class="panel"><h2>Healing Potion</h2><p>Restore 8 HP during an expedition. Potions are consumed permanently when used.</p><button class="primary" id="buyPotion" ${meta.gold<price?'disabled':''}>Buy · ${price} 🪙</button></section><button class="ghost" id="alchBack">Back to City</button>`);document.getElementById('buyPotion').onclick=()=>{if(meta.gold<price)return;meta.gold-=price;meta.potions++;saveMeta();alchemist()};document.getElementById('alchBack').onclick=city;
}
function menu(){const known=loreEntries().filter(e=>e.unlocked).length;shell(`<section class="panel hero"><div class="kicker">SOLO DUNGEON ROGUELITE • V3.1</div><h1>Delver</h1><p class="story-lead">Two seals now call from beneath the world. Every descent brings you closer to the truth—and gives the darkness another chance to learn your name.</p><div class="wallet"><span>🔥 ${meta.shards} Embers</span><span>🪙 ${meta.gold} Gold</span><span>🧪 ${meta.potions}</span></div><div class="hero-actions"><button class="primary" id="sanctum">Sanctum</button><button class="ghost" id="city">Emberfall</button><button class="ghost" id="chronicle">Chronicle ${known}/${loreEntries().length}</button></div></section><div class="section-label">Choose Dungeon</div><section class="dungeons">${Object.values(DUNGEONS).map(d=>{const locked=d.id==='verdant'&&!meta.ashenCleared||d.locked;return `<button class="dungeon ${locked?'locked':''}" data-d="${d.id}" ${locked?'disabled':''}><strong>${d.name}${d.coming?' · Coming Soon':''}</strong><span>${d.desc}</span><span class="story-tag">${d.chapter||''}</span>${d.id==='ashen'&&meta.ashenCleared?'<span class="loot">✓ Conquered</span>':''}${d.id==='verdant'&&meta.verdantCleared?'<span class="loot">✓ Conquered</span>':''}</button>`}).join('')}</section><section class="panel" style="margin-top:14px"><strong>Career</strong><p class="muted">Expeditions: ${meta.expeditions} • Deaths: ${meta.deaths} • Boss kills: ${meta.bossKills}<br>Ashen: ${meta.bestFloors.ashen}/9 • Verdant: ${meta.bestFloors.verdant}/11</p></section>`);document.getElementById('sanctum').onclick=sanctumClass;document.getElementById('city').onclick=city;document.getElementById('chronicle').onclick=chronicle;root.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>classSelect(b.dataset.d))}
function sanctumClass(){shell(`<h1 class="screen-title">The Sanctum</h1><p class="muted">Ember Shards survive death and carry forward into future dungeons. Choose an adventurer to strengthen permanently.</p><div class="shard-bank">🔥 ${meta.shards} Ember Shards</div><div class="classes">${Object.entries(CLASSES).map(([id,c])=>`<button class="class-card" data-s="${id}"><strong>${c.icon} ${c.name}</strong><span>Permanent ranks: ${Object.values(meta.ranks[id]).reduce((a,b)=>a+b,0)}</span></button>`).join('')}</div><button class="ghost" id="backMenu">Back</button>`);root.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>sanctum(b.dataset.s));document.getElementById('backMenu').onclick=menu}
function upgradeCost(k,r){const u=PERM[k];return u.base+u.step*r}
function sanctum(cid){const c=CLASSES[cid],r=meta.ranks[cid];shell(`<h1 class="screen-title">${c.icon} ${c.name} Sanctum</h1><div class="shard-bank">🔥 ${meta.shards} Ember Shards</div><p class="muted">These improvements persist across every dungeon. Each rank matters, but the price rises sharply as your adventurer grows.</p><div class="upgrades">${Object.entries(PERM).map(([k,u])=>{const rank=r[k],cost=upgradeCost(k,rank),max=rank>=u.max;return `<button class="upgrade" data-buy="${k}" ${max||meta.shards<cost?'disabled':''}><strong>${u.name} · Rank ${rank}/${u.max}</strong><span>${u.desc}</span><span class="loot">${max?'MAX':`Cost: ${cost} 🔥`}</span></button>`}).join('')}</div><button class="ghost" id="backSanctum">Choose Adventurer</button>`);root.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buyUpgrade(cid,b.dataset.buy));document.getElementById('backSanctum').onclick=sanctumClass}
function buyUpgrade(cid,k){const r=meta.ranks[cid][k],cost=upgradeCost(k,r);if(r>=PERM[k].max||meta.shards<cost)return;meta.shards-=cost;meta.ranks[cid][k]++;saveMeta();sanctum(cid)}
function classSelect(did){const d=DUNGEONS[did];shell(`<h1 class="screen-title">${d.name}</h1><p class="muted">A fresh delver is not expected to conquer this place. Bring back what you can.</p><div class="classes">${Object.entries(CLASSES).map(([id,c])=>{const r=meta.ranks[id];const w=equipped(id,'weapon'),a=equipped(id,'armor');const hp=c.hp+(r.vitality*2)+(a?.hp||0), dmg=c.damage+r.might+(w?.damage||0);return `<button class="class-card" data-c="${id}"><strong>${c.icon} ${c.name}</strong><span>${hp} HP • ${dmg} base damage</span><span>⚔ ${w?.name||'No weapon'} · 🛡 ${a?.name||'No armor'}</span><span class="ability">${c.passive}</span><span>${c.ability}</span><span class="loot">Permanent ranks: ${Object.values(r).reduce((a,b)=>a+b,0)}</span></button>`}).join('')}</div>`);root.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>start(did,b.dataset.c))}
function start(did,cid){const c=CLASSES[cid],r=meta.ranks[cid],w=equipped(cid,'weapon'),a=equipped(cid,'armor');const hp=c.hp+(r.vitality*2)+(a?.hp||0);meta.expeditions++;saveMeta();state={dungeon:did,classId:cid,floor:0,hp,maxHp:hp,damage:c.damage+r.might+(w?.damage||0),guard:6+r.guard+(a?.guard||0),campBonus:r.recovery*2,mastery:r.mastery,abilityCD:0,attackCount:0,upgrades:[],log:[],room:null,ap:2,block:0,avoid:false,firstAttack:true,openingBonus:0,firstHitReduce:0,firstEnemyHit:true,runShards:0,runGold:0,potions:meta.potions,poison:0,finished:false};choosePath()}
function hud(){return `<div class="stats"><div class="stat"><span>HP</span><strong>${state.hp}/${state.maxHp}</strong></div><div class="stat"><span>AP</span><strong>${state.ap}</strong></div><div class="stat"><span>Damage</span><strong>${state.damage}</strong></div><div class="stat"><span>Embers</span><strong>🔥${state.runShards}</strong></div><div class="stat"><span>Gold</span><strong>🪙${state.runGold}</strong></div><div class="stat"><span>Potions</span><strong>🧪${state.potions}</strong></div></div><div class="map">${Array.from({length:DUNGEONS[state.dungeon].floors},(_,i)=>`${i?'<i class="line"></i>':''}<span class="node ${i+1<state.floor?'done':i+1===state.floor?'current':''}">${i+1}</span>`).join('')}</div>${state.upgrades.length?`<div class="badges">${state.upgrades.map(x=>`<span class="badge">${x}</span>`).join('')}</div>`:''}`}
function choosePath(){state.floor++;meta.bestFloor=Math.max(meta.bestFloor,state.floor);meta.bestFloors[state.dungeon]=Math.max(meta.bestFloors[state.dungeon]||0,state.floor);saveMeta();if(state.floor===DUNGEONS[state.dungeon].floors){beginCombat(true);return}const types=pick(['combat','combat','combat','treasure','camp','mystery'],3);shell(`${hud()}<section class="panel"><div class="kicker">THE PATH DIVIDES</div><h2>Choose your next room</h2><div class="choices">${types.map(t=>roomChoice(t)).join('')}</div></section>`);root.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>enterRoom(b.dataset.room))}
function roomChoice(t){const m={combat:['⚔️','Battle','Fight for Ember Shards and a minor boon.'],treasure:['🗝️','Cache','Choose a minor boon for this run.'],camp:['🔥','Camp','Recover a modest amount of HP.'],mystery:['❓','Unknown','Risk an uncertain encounter.']}[t];return `<button class="choice" data-room="${t}"><strong>${m[0]} ${m[1]}</strong><span>${m[2]}</span></button>`}
function enterRoom(t){if(t==='combat')beginCombat(false);else if(t==='treasure')offerUpgrades(3,choosePath);else if(t==='camp'){const h=Math.ceil(state.maxHp*.16)+state.campBonus;state.hp=Math.min(state.maxHp,state.hp+h);messageRoom('🔥','A Thin Fire',`You recover ${h} HP. The crypt does not allow a comfortable rest.`)}else mystery()}
function messageRoom(icon,title,text){shell(`${hud()}<section class="panel result"><div class="big">${icon}</div><h2>${title}</h2><p>${text}</p><button class="primary" id="continue">Descend</button></section>`);document.getElementById('continue').onclick=choosePath}
function mystery(){const r=Math.random();if(r<.28){const h=Math.ceil(state.maxHp*.10)+state.campBonus;state.hp=Math.min(state.maxHp,state.hp+h);messageRoom('⛲','Bloodless Fountain',`The water barely helps. Recover ${h} HP.`)}else if(r<.78){const dmg=6+state.floor+Math.floor(Math.random()*4);state.hp-=dmg;if(state.hp<=0)return lose('A hidden mechanism ends your expedition.');messageRoom('🪤','A Cruel Mechanism',`Ancient blades catch you. Lose ${dmg} HP.`)}else offerUpgrades(2,choosePath)}
function makeEnemy(scale,boss=false){if(boss){if(state.dungeon==='verdant')return{name:'The Heartroot',hp:168,maxHp:168,atk:18,boss:true,shards:55,gold:70,regen:6,poison:2};return{name:'Ashen Warden',hp:96,maxHp:96,atk:13,boss:true,shards:30,gold:35}}const pool=state.dungeon==='verdant'?VERDANT_ENEMIES:ENEMIES;const maxIndex=Math.min(pool.length-1,1+Math.floor(scale*.7));const minIndex=Math.min(maxIndex,Math.max(0,Math.floor((scale-2)/2)));const base={...pool[minIndex+Math.floor(Math.random()*(maxIndex-minIndex+1))]};const hard=state.dungeon==='verdant'?1.45:1;base.hp=Math.round((base.hp+Math.max(0,scale-1)*3)*hard);base.atk=Math.round((base.atk+Math.floor(scale/2))*(state.dungeon==='verdant'?1.18:1));base.shards+=Math.floor(scale/2);base.gold=base.gold||Math.max(2,Math.floor(base.shards*.8));base.maxHp=base.hp;return base}
function beginCombat(boss){let count=1;if(!boss){const chance=.30+state.floor*.055;count=Math.random()<chance?2:1;if(state.floor>=6&&Math.random()<.18)count=3}state.room={type:'combat',boss,enemies:Array.from({length:count},()=>makeEnemy(state.floor,boss)),round:1};state.ap=2;state.block=0;state.avoid=false;state.firstAttack=true;state.firstEnemyHit=true;state.log=[];renderCombat()}
function renderCombat(msg=''){const c=CLASSES[state.classId];const alive=state.room.enemies.filter(e=>e.hp>0);shell(`${hud()}${msg?`<div class="message">${msg}</div>`:''}<section class="panel"><div class="kicker">${state.room.boss?'BOSS':'COMBAT'} • ROUND ${state.room.round}</div>${alive.map(e=>{const idx=state.room.enemies.indexOf(e);return `<div class="enemy"><div class="enemy-head"><h3>${e.boss?'👑 ':''}${e.name}</h3><strong>${e.hp}/${e.maxHp}</strong></div><div class="hpbar"><div class="hpfill" style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></div></div><div class="combat-actions"><button data-attack="${idx}" ${state.ap<1?'disabled':''}>Attack</button><button data-ability="${idx}" ${state.ap<1||state.abilityCD>0?'disabled':''}>${c.ability.split(':')[0]}${state.abilityCD?` (${state.abilityCD})`:''}</button></div></div>`}).join('')}<div class="combat-actions"><button id="defend" ${state.ap<1?'disabled':''}>Defend</button><button id="potion" ${state.potions<1?'disabled':''}>🧪 Potion (${state.potions})</button><button class="primary" id="endTurn">End Turn</button></div></section><section class="panel log"><strong>Combat Log</strong>${state.log.slice(-7).reverse().map(x=>`<div>${x}</div>`).join('')}</section>`);root.querySelectorAll('[data-attack]').forEach(b=>b.onclick=()=>attack(+b.dataset.attack));root.querySelectorAll('[data-ability]').forEach(b=>b.onclick=()=>ability(+b.dataset.ability));document.getElementById('defend').onclick=defend;document.getElementById('potion').onclick=usePotion;document.getElementById('endTurn').onclick=endTurn}
function attack(i){const e=state.room.enemies[i];if(!e||e.hp<=0||state.ap<1)return;let dmg=state.damage;if(state.firstAttack)dmg+=state.openingBonus;if(state.classId==='rogue'&&e.hp<e.maxHp)dmg+=2;if(state.classId==='ranger'&&state.firstAttack)dmg+=2;if(state.classId==='mage'){state.attackCount++;if(state.attackCount%3===0)dmg+=3}state.firstAttack=false;e.hp-=dmg;state.ap--;state.log.push(`You hit ${e.name} for ${dmg}.`);killed(e);checkCombat()}
function ability(i){if(state.ap<1||state.abilityCD>0)return;const e=state.room.enemies[i];if(!e)return;if(state.classId==='warrior'){const d=8+state.mastery;e.hp-=d;state.log.push(`Power Strike deals ${d} to ${e.name}.`);killed(e)}else if(state.classId==='rogue'){state.avoid=true;state.block+=state.mastery;state.log.push('You vanish into the dark.')}else if(state.classId==='ranger'){const d=4+state.mastery;state.room.enemies.filter(x=>x.hp>0).forEach(x=>{x.hp-=d;killed(x)});state.log.push(`Volley strikes every enemy for ${d}.`)}else{const d=10+state.mastery;e.hp-=d;state.log.push(`Fireball scorches ${e.name} for ${d}.`);killed(e)}state.abilityCD=3;state.ap--;checkCombat()}
function usePotion(){if(state.potions<1)return;state.potions--;meta.potions=Math.max(0,meta.potions-1);state.hp=Math.min(state.maxHp,state.hp+8);saveMeta();state.log.push('You drink a healing potion and recover 8 HP.');renderCombat()}
function defend(){if(state.ap<1)return;state.block+=state.guard;state.ap--;state.log.push(`You brace for ${state.guard} block.`);renderCombat()}
function killed(e){if(e.hp<=0&&!e.dead){e.dead=true;e.hp=0;state.runShards+=e.shards||2;const gold=e.gold||Math.max(2,Math.floor((e.shards||2)*.8));state.runGold+=gold;state.log.push(`${e.name} falls. +${e.shards||2} Ember Shards, +${gold} Gold.`)}}
function checkCombat(){if(state.room.enemies.every(e=>e.hp<=0)){if(state.room.boss)return win();return offerUpgrades(3,choosePath)}renderCombat()}
function endTurn(){let total=0;for(const e of state.room.enemies.filter(x=>x.hp>0)){if(state.avoid){state.log.push(`You evade ${e.name}'s attack.`);state.avoid=false;continue}let dmg=e.atk;if(state.firstEnemyHit&&state.firstHitReduce){dmg=Math.max(0,dmg-state.firstHitReduce);state.firstEnemyHit=false}if(state.block){const blocked=Math.min(state.block,dmg);state.block-=blocked;dmg-=blocked}state.hp-=dmg;total+=dmg;if(e.poison&&dmg>0){state.poison+=e.poison;state.log.push(`${e.name} poisons you (+${e.poison}).`)}state.log.push(`${e.name} hits for ${dmg}.`)}if(state.poison>0){state.hp-=state.poison;total+=state.poison;state.log.push(`Poison burns for ${state.poison}.`);state.poison=Math.max(0,state.poison-1)}for(const e of state.room.enemies.filter(x=>x.hp>0&&x.regen)){const h=Math.min(e.regen,e.maxHp-e.hp);e.hp+=h;if(h)state.log.push(`${e.name} regenerates ${h} HP.`)}if(state.hp<=0)return lose('The dungeon claims another delver.');state.room.round++;state.ap=2;state.block=0;state.firstAttack=true;if(state.abilityCD>0)state.abilityCD--;renderCombat(total?`Enemies deal ${total} damage.`:'You weather the enemy assault.')}
function offerUpgrades(n,next){const opts=pick(RUN_UPGRADES,n);shell(`${hud()}<section class="panel"><div class="kicker">MINOR BOON • THIS RUN ONLY</div><h2>Take what little help you can</h2><div class="upgrades">${opts.map((u,i)=>`<button class="upgrade" data-up="${i}"><strong>${u.name}</strong><span>${u.text}</span></button>`).join('')}</div></section>`);root.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const u=opts[+b.dataset.up];u.apply(state);state.upgrades.push(u.name);next()})}
function bankShards(){meta.shards+=state.runShards;meta.gold+=state.runGold;const earned={shards:state.runShards,gold:state.runGold};state.runShards=0;state.runGold=0;saveMeta();return earned}
function win(){meta.wins++;meta.bossKills++;if(state.dungeon==='verdant')meta.verdantCleared=true;else meta.ashenCleared=true;const earned=bankShards();const text=state.dungeon==='verdant'?'The Heartroot ruptures. Every tree in the Hollow screams at once—and then falls silent. Frost crawls across the broken Green Seal. Something in the north has answered.':'The Ashen Warden finally breaks apart. The crypt is conquered. Its Ember points toward a valley erased from every map.';endScreen(true,text,earned)}
function lose(text){meta.losses++;meta.deaths++;const earned=bankShards();endScreen(false,text,earned)}
function endScreen(won,text,earned){shell(`<section class="panel result"><div class="big">${won?'🏆':'☠️'}</div><div class="kicker">${won?'DUNGEON CONQUERED':'EXPEDITION ENDED'}</div><h2>${won?'Victory':'You Have Fallen'}</h2><p>${text}</p><div class="wallet"><span>🔥 ${earned.shards} Embers</span><span>🪙 ${earned.gold} Gold</span></div><p class="muted">${CLASSES[state.classId].name} • Reached floor ${state.floor}/${DUNGEONS[state.dungeon].floors} • ${state.upgrades.length} temporary boons</p><p>Return to the Sanctum. Spend what you recovered. Then descend again.</p><button class="primary" id="sanctumEnd">Visit Sanctum</button><button class="ghost" id="again">Return to Dungeons</button></section>`);document.getElementById('sanctumEnd').onclick=()=>sanctum(state.classId);document.getElementById('again').onclick=menu}
function pick(arr,n){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,Math.min(n,a.length))}
menu();
})();
