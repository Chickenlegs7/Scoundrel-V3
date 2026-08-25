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
    btn.className='card'+((card.suit==='♥'||card.suit==='♦')?' red':'');
    btn.innerHTML=`<div><div class="rank">${card.rank}</div><div class="suit">${card.suit}</div></div><div><div class="card-type">${NAMES[card.suit]}</div><div class="card-value">Value ${card.value}</div></div>`;
    btn.addEventListener('click',()=>resolveCard(i));
    roomEl.appendChild(btn);
  });
}

document.getElementById('newGameBtn').addEventListener('click',startGame);
document.getElementById('restartBtn').addEventListener('click',startGame);
fleeBtn.addEventListener('click',fleeRoom);

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
startGame();
