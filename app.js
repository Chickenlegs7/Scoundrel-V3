const SUITS = ["♠","♣","♥","♦"];
const NAMES = {"♠":"Monster","♣":"Monster","♥":"Potion","♦":"Weapon"};
const VALUES = {A:14,K:13,Q:12,J:11};

let state;

const hpEl = document.getElementById('hp');
const weaponEl = document.getElementById('weapon');
const lastKillEl = document.getElementById('lastKill');
const deckCountEl = document.getElementById('deckCount');
const roomEl = document.getElementById('room');
const messageEl = document.getElementById('message');
const progressEl = document.getElementById('roomProgress');
const fleeBtn = document.getElementById('fleeBtn');
const logEl = document.getElementById('log');
const gameOverDialog = document.getElementById('gameOverDialog');

function cardValue(rank){ return VALUES[rank] ?? Number(rank); }
function buildDeck(){
  const deck=[];
  for(const suit of ["♠","♣"]){
    for(let n=2;n<=10;n++) deck.push({suit,rank:String(n),value:n});
    for(const r of ["J","Q","K","A"]) deck.push({suit,rank:r,value:cardValue(r)});
  }
  // Scoundrel uses hearts and diamonds 2-10 only; face cards and aces are removed.
  for(const suit of ["♥","♦"]){
    for(let n=2;n<=10;n++) deck.push({suit,rank:String(n),value:n});
  }
  return shuffle(deck);
}
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function startGame(){
  state={ hp:20,maxHp:20,weapon:null,lastKill:null,deck:buildDeck(),room:[],resolved:0, potionUsedThisRoom:false, fledLastRoom:false, gameOver:false };
  logEl.innerHTML='';
  addLog('Entered the dungeon with 20 HP.');
  dealRoom(true);
  gameOverDialog.close?.();
  render();
}
function dealRoom(first=false){
  const needed = first ? 4 : 4-state.room.length;
  for(let i=0;i<needed && state.deck.length;i++) state.room.push(state.deck.shift());
  state.resolved=0;
  state.potionUsedThisRoom=false;
  if(!first) state.fledLastRoom=false;
  if(state.room.length===0 && state.deck.length===0) winGame();
}
function resolveCard(index){
  if(state.gameOver) return;
  const card=state.room[index];
  if(!card) return;
  let resolved=true;
  if(card.suit==='♠' || card.suit==='♣') fightMonster(card);
  else if(card.suit==='♥') usePotion(card);
  else if(card.suit==='♦') equipWeapon(card);
  if(state.gameOver) { render(); return; }
  if(resolved){
    state.room.splice(index,1);
    state.resolved++;
    if(state.resolved>=3 || (state.deck.length===0 && state.room.length===0)) finishRoom();
    render();
  }
}
function fightMonster(card){
  let damage=card.value;
  let usedWeapon=false;
  if(state.weapon && (state.lastKill===null || card.value < state.lastKill)){
    damage=Math.max(0,card.value-state.weapon.value);
    usedWeapon=true;
    state.lastKill=card.value;
  }
  state.hp-=damage;
  if(usedWeapon) addLog(`Fought ${label(card)} with ${label(state.weapon)} and took ${damage} damage.`);
  else if(state.weapon) addLog(`Could not use ${label(state.weapon)} on ${label(card)}; fought barehanded for ${damage} damage.`);
  else addLog(`Fought ${label(card)} barehanded and took ${damage} damage.`);
  if(state.hp<=0){ state.hp=0; loseGame(card); }
}
function usePotion(card){
  if(state.potionUsedThisRoom){ addLog(`${label(card)} was discarded; only one potion can heal you per room.`); return; }
  const healed=Math.min(card.value,state.maxHp-state.hp);
  state.hp+=healed;
  state.potionUsedThisRoom=true;
  addLog(`Drank ${label(card)} and healed ${healed} HP.`);
}
function equipWeapon(card){
  state.weapon=card;
  state.lastKill=null;
  addLog(`Equipped ${label(card)}. Weapon restriction reset.`);
}
function finishRoom(){
  if(state.room.length===0 && state.deck.length===0){ winGame(); return; }
  dealRoom(false);
}
function fleeRoom(){
  if(state.gameOver || state.fledLastRoom || state.room.length===0) return;
  state.deck.push(...state.room);
  addLog(`Fled the room. ${state.room.length} card${state.room.length===1?'':'s'} moved to the bottom of the dungeon.`);
  state.room=[];
  state.fledLastRoom=true;
  state.resolved=0;
  state.potionUsedThisRoom=false;
  for(let i=0;i<4 && state.deck.length;i++) state.room.push(state.deck.shift());
  render();
}
function winGame(){
  state.gameOver=true;
  document.getElementById('gameOverTitle').textContent='Dungeon Cleared';
  document.getElementById('gameOverText').textContent=`You survived with ${state.hp} HP remaining.`;
  gameOverDialog.showModal();
  addLog(`Victory! Cleared the dungeon with ${state.hp} HP.`);
}
function loseGame(card){
  state.gameOver=true;
  document.getElementById('gameOverTitle').textContent='You Died';
  document.getElementById('gameOverText').textContent=`The ${label(card)} ended your run.`;
  gameOverDialog.showModal();
  addLog(`Defeat. ${label(card)} reduced you to 0 HP.`);
}

function cardTier(card){
  if(card.value <= 4) return 1;
  if(card.value <= 7) return 2;
  if(card.value <= 10) return 3;
  return 4;
}
function tierName(card){
  const tier=cardTier(card);
  if(card.suit==='♠' || card.suit==='♣') return ['','Lurker','Hunter','Brute','Dungeon Horror'][tier];
  if(card.suit==='♦') return ['','Light Weapon','Martial Weapon','Heavy Weapon','Relic Weapon'][tier];
  return ['','Minor Potion','Potion','Greater Potion','Grand Potion'][tier];
}
function visualFor(card){
  const tier=cardTier(card);
  if(card.suit==='♠' || card.suit==='♣') return monsterVisual(tier, card.suit);
  if(card.suit==='♦') return weaponVisual(tier);
  return potionVisual(tier, card.value);
}
function monsterVisual(tier,suit){
  const extra = suit==='♣' ? '<path class="detail" d="M31 59 19 70M69 59 81 70"/>' : '<path class="detail" d="M32 63 23 78M68 63 77 78"/>';
  if(tier===1) return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="fill" d="M27 67Q20 49 32 37L25 22 42 31Q50 27 58 31L75 22 68 37Q80 49 73 67Q64 78 50 78T27 67Z"/><circle class="eye" cx="40" cy="51" r="3"/><circle class="eye" cx="60" cy="51" r="3"/>${extra}</svg>`;
  if(tier===2) return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="horn" d="M35 34 19 12 23 42M65 34 81 12 77 42"/><path class="fill" d="M25 67Q18 47 31 34Q39 26 50 26T69 34Q82 47 75 67Q66 82 50 82T25 67Z"/><path class="detail" d="M38 63Q50 71 62 63"/><circle class="eye" cx="39" cy="50" r="4"/><circle class="eye" cx="61" cy="50" r="4"/>${extra}</svg>`;
  if(tier===3) return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="horn" d="M34 35 10 9 18 45M66 35 90 9 82 45"/><path class="fill" d="M19 65Q14 40 31 29Q39 22 50 22T69 29Q86 40 81 65Q75 85 50 87Q25 85 19 65Z"/><path class="detail" d="M34 66 43 61 50 72 57 61 66 66"/><circle class="eye" cx="37" cy="48" r="5"/><circle class="eye" cx="63" cy="48" r="5"/>${extra}</svg>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="horn" d="M31 37 6 7 12 48M69 37 94 7 88 48M39 28 50 5 61 28"/><path class="fill" d="M15 65Q10 37 29 25Q38 18 50 18T71 25Q90 37 85 65Q79 90 50 92Q21 90 15 65Z"/><path class="detail" d="M29 68 39 59 50 76 61 59 71 68M31 40 41 44M69 40 59 44"/><circle class="eye" cx="36" cy="49" r="6"/><circle class="eye" cx="64" cy="49" r="6"/>${extra}</svg>`;
}
function weaponVisual(tier){
  if(tier===1) return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="metal" d="M64 18 72 26 45 62 38 55Z"/><path class="guard" d="M34 54 48 68 42 74 28 60Z"/><path class="grip" d="M35 68 25 78 20 73 30 63Z"/></svg>`;
  if(tier===2) return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="metal" d="M59 10 67 18 45 63 37 55Z"/><path class="metal edge" d="M59 10 75 7 67 18Z"/><path class="guard" d="M28 54 48 69 43 76 23 61Z"/><path class="grip" d="M35 68 22 84 15 78 29 62Z"/></svg>`;
  if(tier===3) return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="metal" d="M55 8 67 16 47 62 36 55Z"/><path class="metal edge" d="M55 8 78 5 67 16Z"/><path class="guard" d="M22 51 51 69 44 79 16 60Z"/><path class="grip" d="M35 69 19 91 10 84 27 62Z"/></svg>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="metal" d="M52 4 68 15 48 63 34 54Z"/><path class="metal edge" d="M52 4 82 3 68 15Z"/><path class="guard" d="M15 48 53 69 44 82 7 60Z"/><path class="grip" d="M34 70 18 96 6 88 25 61Z"/><path class="rune" d="M50 24 59 20M45 35 55 31M40 46 50 42"/></svg>`;
}
function potionVisual(tier,value){
  const fillY = 76 - Math.min(32, value*3);
  const width = [0,30,38,46,54][tier];
  const x=50-width/2;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="glass" d="M42 12h16v17l${tier>=3?'10 10':''}${tier>=4?' 6 8':''}v${tier>=4?'30':'34'}Q74 86 50 88Q26 86 26 ${tier>=4?'47':'39'}${tier>=4?' 6-8 10-10':''}V29h16Z"/><path class="cork" d="M40 9h20v10H40Z"/><path class="liquid" d="M${x} ${fillY} Q50 ${fillY-5} ${100-x} ${fillY}V76Q50 84 ${x} 76Z"/><path class="shine" d="M36 38Q31 50 35 61"/></svg>`;
}

function label(card){ return `${card.rank}${card.suit}`; }
function addLog(text){ const row=document.createElement('div'); row.textContent=text; logEl.prepend(row); }
function render(){
  hpEl.textContent=state.hp;
  weaponEl.textContent=state.weapon?label(state.weapon):'None';
  lastKillEl.textContent=state.lastKill??'—';
  deckCountEl.textContent=state.deck.length;
  progressEl.textContent=`Resolve ${Math.max(0,3-state.resolved)} more`;
  fleeBtn.disabled=state.fledLastRoom || state.gameOver;
  messageEl.textContent = state.weapon
    ? `Weapon ${label(state.weapon)}${state.lastKill!==null?` can only be used on monsters below ${state.lastKill}`:' is ready for any monster'}.`
    : 'No weapon equipped. Monsters deal their full value as damage.';
  roomEl.innerHTML='';
  state.room.forEach((card,i)=>{
    const btn=document.createElement('button');
    const tier=cardTier(card);
    const kind=(card.suit==='♠'||card.suit==='♣')?'monster':card.suit==='♦'?'weapon':'potion';
    btn.className=`card ${kind} tier-${tier}`;
    btn.setAttribute('aria-label',`${label(card)}, ${NAMES[card.suit]}, value ${card.value}`);
    btn.innerHTML=`
      <div class="card-corner"><div class="rank">${card.rank}</div><div class="suit">${card.suit}</div></div>
      <div class="card-art">${visualFor(card)}</div>
      <div class="card-info"><div class="card-type">${tierName(card)}</div><div class="card-value">${NAMES[card.suit]} · ${card.value}</div></div>`;
    btn.addEventListener('click',()=>resolveCard(i));
    roomEl.appendChild(btn);
  });
}

document.getElementById('newGameBtn').addEventListener('click',startGame);
document.getElementById('restartBtn').addEventListener('click',startGame);
fleeBtn.addEventListener('click',fleeRoom);

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
startGame();
