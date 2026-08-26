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
const lastScoreEl = document.getElementById('lastScore');
const highScoreEl = document.getElementById('highScore');
const winsEl = document.getElementById('wins');
const lossesEl = document.getElementById('losses');
const gameOverScoreEl = document.getElementById('gameOverScore');
const combatDialog = document.getElementById('combatDialog');
const combatTitleEl = document.getElementById('combatTitle');
const combatTextEl = document.getElementById('combatText');
const barehandBtn = document.getElementById('barehandBtn');
const weaponAttackBtn = document.getElementById('weaponAttackBtn');
const combatCancelBtn = document.getElementById('combatCancelBtn');
let pendingMonsterIndex = null;

const STATS_KEY = 'scoundrel-stats-v1';
let careerStats = loadCareerStats();

function loadCareerStats(){
  try {
    return { highScore:null, lastScore:null, wins:0, losses:0, ...JSON.parse(localStorage.getItem(STATS_KEY) || '{}') };
  } catch {
    return { highScore:null, lastScore:null, wins:0, losses:0 };
  }
}
function saveCareerStats(){
  localStorage.setItem(STATS_KEY, JSON.stringify(careerStats));
}
function recordRun(score, won){
  careerStats.lastScore=score;
  careerStats.highScore = careerStats.highScore===null ? score : Math.max(careerStats.highScore, score);
  if(won) careerStats.wins++; else careerStats.losses++;
  saveCareerStats();
  renderCareerStats();
}
function renderCareerStats(){
  lastScoreEl.textContent = careerStats.lastScore===null ? '—' : formatScore(careerStats.lastScore);
  highScoreEl.textContent = careerStats.highScore===null ? '—' : formatScore(careerStats.highScore);
  winsEl.textContent = careerStats.wins;
  lossesEl.textContent = careerStats.losses;
}
function formatScore(score){ return score>0 ? `+${score}` : String(score); }

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
  combatDialog.close?.();
  pendingMonsterIndex=null;
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

  if(card.suit==='♠' || card.suit==='♣'){
    if(state.weapon){
      openCombatChoice(index);
      return;
    }
    resolveMonster(index, false);
    return;
  }

  if(card.suit==='♥') usePotion(card);
  else if(card.suit==='♦') equipWeapon(card);

  state.room.splice(index,1);
  state.resolved++;
  if(state.resolved>=3 || (state.deck.length===0 && state.room.length===0)) finishRoom();
  render();
}

function canUseWeaponOn(card){
  return Boolean(state.weapon && (state.lastKill===null || card.value < state.lastKill));
}

function openCombatChoice(index){
  const card=state.room[index];
  if(!card || !(card.suit==='♠' || card.suit==='♣')) return;
  pendingMonsterIndex=index;
  const weaponAllowed=canUseWeaponOn(card);
  const weaponDamage=Math.max(0,card.value-state.weapon.value);
  combatTitleEl.textContent=`Fight ${label(card)}`;
  combatTextEl.innerHTML = `Bare-handed: <strong>${card.value} damage</strong>.<br>` +
    (weaponAllowed
      ? `${label(state.weapon)}: <strong>${weaponDamage} damage</strong>.`
      : `${label(state.weapon)} cannot be used because this monster is not below your last weapon kill (${state.lastKill}).`);
  barehandBtn.textContent=`Fight Bare-Handed (${card.value} dmg)`;
  weaponAttackBtn.textContent=weaponAllowed ? `Use ${label(state.weapon)} (${weaponDamage} dmg)` : `Weapon Unavailable`;
  weaponAttackBtn.disabled=!weaponAllowed;
  combatDialog.showModal();
}

function resolveMonster(index, useWeapon){
  if(state.gameOver) return;
  const card=state.room[index];
  if(!card) return;

  let damage=card.value;
  if(useWeapon){
    if(!canUseWeaponOn(card)) return;
    damage=Math.max(0,card.value-state.weapon.value);
    state.lastKill=card.value;
    addLog(`Fought ${label(card)} with ${label(state.weapon)} and took ${damage} damage.`);
  } else {
    addLog(`Fought ${label(card)} bare-handed and took ${damage} damage.`);
  }

  state.hp-=damage;
  if(state.hp<=0){
    state.hp=0;
    loseGame(card);
    render();
    return;
  }

  state.room.splice(index,1);
  state.resolved++;
  if(state.resolved>=3 || (state.deck.length===0 && state.room.length===0)) finishRoom();
  render();
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
  if(state.gameOver) return;
  state.gameOver=true;
  const score=state.hp;
  recordRun(score,true);
  gameOverScoreEl.textContent=formatScore(score);
  document.getElementById('gameOverTitle').textContent='Dungeon Cleared';
  document.getElementById('gameOverText').textContent=`You survived with ${state.hp} HP remaining.`;
  gameOverDialog.showModal();
  addLog(`Victory! Cleared the dungeon with ${state.hp} HP.`);
}
function loseGame(card){
  if(state.gameOver) return;
  state.gameOver=true;
  const score=calculateLossScore(card);
  recordRun(score,false);
  gameOverScoreEl.textContent=formatScore(score);
  document.getElementById('gameOverTitle').textContent='You Died';
  document.getElementById('gameOverText').textContent=`The ${label(card)} ended your run.`;
  gameOverDialog.showModal();
  addLog(`Defeat. ${label(card)} reduced you to 0 HP.`);
}

function calculateLossScore(killer){
  // On a loss, score the unresolved monsters still in the dungeon as negatives.
  // resolveCard leaves the killing monster in the room when death occurs, so it is included here.
  const remaining=[...state.room,...state.deck].filter(c=>c.suit==='♠' || c.suit==='♣');
  let total=remaining.reduce((sum,c)=>sum+c.value,0);
  // Scoundrel's final-monster penalty: if the killing monster is the only monster left, count it twice.
  if(remaining.length===1 && remaining[0]===killer) total+=killer.value;
  return -total;
}

function cardImagePath(card){
  const suitName = {"♠":"Spades","♣":"Clubs","♥":"Hearts","♦":"Diamonds"}[card.suit];
  return `./cards/${suitName}-${card.rank}.webp`;
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
  renderCareerStats();
  messageEl.textContent = state.weapon
    ? `Weapon ${label(state.weapon)}${state.lastKill!==null?` can only be used on monsters below ${state.lastKill}`:' is ready for any monster'}.`
    : 'No weapon equipped. Monsters deal their full value as damage.';
  roomEl.innerHTML='';
  state.room.forEach((card,i)=>{
    const btn=document.createElement('button');
    const kind=(card.suit==='♠'||card.suit==='♣')?'monster':card.suit==='♦'?'weapon':'potion';
    btn.className=`card ${kind}`;
    btn.setAttribute('aria-label',`${label(card)}, ${NAMES[card.suit]}, value ${card.value}`);
    btn.innerHTML=`<img class="card-image" src="${cardImagePath(card)}" alt="${label(card)} ${NAMES[card.suit]} card" draggable="false">`;
    btn.addEventListener('click',()=>resolveCard(i));
    roomEl.appendChild(btn);
  });
}

document.getElementById('newGameBtn').addEventListener('click',startGame);
document.getElementById('restartBtn').addEventListener('click',startGame);
fleeBtn.addEventListener('click',fleeRoom);
barehandBtn.addEventListener('click',()=>{
  if(pendingMonsterIndex===null) return;
  const index=pendingMonsterIndex;
  pendingMonsterIndex=null;
  combatDialog.close();
  resolveMonster(index,false);
});
weaponAttackBtn.addEventListener('click',()=>{
  if(pendingMonsterIndex===null) return;
  const index=pendingMonsterIndex;
  pendingMonsterIndex=null;
  combatDialog.close();
  resolveMonster(index,true);
});
combatCancelBtn.addEventListener('click',()=>{
  pendingMonsterIndex=null;
  combatDialog.close();
});
combatDialog.addEventListener('cancel',()=>{ pendingMonsterIndex=null; });

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
startGame();
