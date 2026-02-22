import { useState, useMemo, useRef, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { trainers } from "./data/trainers";
import TrainerDetail from "./components/TrainerDetail";

const TCG_LOGO = `${import.meta.env.BASE_URL}app-images/pokemon-trading-card-game-seeklogo.png`;

/* ── Type colors with neon glow variants ── */
const typeColors = {
  "Ot":       { bg: "#00c853", glow: "rgba(0,200,83,0.35)", dark: "#0a2e16", emoji: "🌿" },
  "Ateş":     { bg: "#ff4444", glow: "rgba(255,68,68,0.35)", dark: "#2e0a0a", emoji: "🔥" },
  "Su":       { bg: "#2196f3", glow: "rgba(33,150,243,0.35)", dark: "#0a1a2e", emoji: "💧" },
  "Elektrik": { bg: "#ffd600", glow: "rgba(255,214,0,0.35)", dark: "#2e2a0a", emoji: "⚡" },
  "Dövüş":    { bg: "#ff6d00", glow: "rgba(255,109,0,0.35)", dark: "#2e1a0a", emoji: "👊" },
  "Çelik":    { bg: "#78909c", glow: "rgba(120,144,156,0.35)", dark: "#1a1e22", emoji: "⚙️" },
  "Normal":   { bg: "#a1887f", glow: "rgba(161,136,127,0.35)", dark: "#221e1c", emoji: "⭐" },
  "Destekçi": { bg: "#ab47bc", glow: "rgba(171,71,188,0.35)", dark: "#1e0a22", emoji: "🃏" },
  "Karanlık": { bg: "#455a64", glow: "rgba(69,90,100,0.35)", dark: "#0e1215", emoji: "🌑" },
  "Psişik":   { bg: "#ab47bc", glow: "rgba(168,85,247,0.35)", dark: "#1e0a22", emoji: "🔮" },
};

const rarityLabels = { C: "Common", U: "Uncommon", M: "Holo Rare", RR: "Double Rare", R: "Rare", SR: "Secret Rare" };
const rarityOrder = { C: 1, U: 2, R: 3, M: 4, RR: 5, SR: 6 };
const rarityColors = { C: "#5a566e", U: "#00c896", M: "#7b61ff", RR: "#ffd166", R: "#8b5cf6", SR: "#ec4899" };
const rarityGlow = { C: "none", U: "0 0 8px rgba(0,200,150,0.3)", M: "0 0 12px rgba(123,97,255,0.4)", RR: "0 0 16px rgba(255,209,102,0.5)", R: "0 0 10px rgba(139,92,246,0.4)", SR: "0 0 16px rgba(236,72,153,0.5)" };

const sp = (n) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${n}.png`;

const STORAGE_KEY = "pokemon_katalog_cards";
function loadCards() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return initialCards;
}

const initialCards = [
  // === OT (GRASS) ===
  { id:1, kartNo:"002/080", nameEN:"Gloom", type:"Ot", hp:70, stage:"1. Aşama", attack1:"침뿌리기 (Tükürmek)", dmg1:"20", attack2:"", dmg2:"", weakness:"Ateş ×2", retreat:"0", rarity:"C", ability:"", copies:3, img:sp(44), marketValue:0.15, trainer:"ash-ketchum" },
  { id:2, kartNo:"003/080", nameEN:"Vileplume", type:"Ot", hp:150, stage:"2. Aşama", attack1:"꽃가루폭탄 (Polen Bombası)", dmg1:"30", attack2:"발달플라워 (Gelişim Çiçeği)", dmg2:"60+", weakness:"Ateş ×2", retreat:"2", rarity:"U", ability:"", copies:4, img:sp(45), marketValue:0.50, trainer:"ash-ketchum" },
  { id:3, kartNo:"005/080", nameEN:"Lotad", type:"Ot", hp:70, stage:"Temel", attack1:"박치기 (Kafa Vuruşu)", dmg1:"30", attack2:"", dmg2:"", weakness:"Ateş ×2", retreat:"2", rarity:"C", ability:"", copies:1, img:sp(270), marketValue:0.10, trainer:"ash-ketchum" },
  { id:4, kartNo:"006/080", nameEN:"Lombre", type:"Ot", hp:90, stage:"1. Aşama", attack1:"메가드레인 (Mega Drain)", dmg1:"30", attack2:"", dmg2:"", weakness:"Ateş ×2", retreat:"2", rarity:"C", ability:"", copies:3, img:sp(271), marketValue:0.10, trainer:"ash-ketchum" },
  { id:5, kartNo:"007/080", nameEN:"Ludicolo", type:"Ot", hp:160, stage:"2. Aşama", attack1:"넘어뜨리기 (Devirme)", dmg1:"120", attack2:"", dmg2:"", weakness:"Ateş ×2", retreat:"2", rarity:"U", ability:"익사이팅 힐 (Exciting Heal)", copies:1, img:sp(272), marketValue:0.35, trainer:"ash-ketchum" },
  { id:6, kartNo:"008/080", nameEN:"Genesect", type:"Ot", hp:120, stage:"Temel", attack1:"벅스캐논 (Bug Cannon)", dmg1:"-", attack2:"스피드어택 (Speed Attack)", dmg2:"110", weakness:"Ateş ×2", retreat:"2", rarity:"R", ability:"", copies:1, img:sp(649), marketValue:4.00, trainer:"red" },
  { id:7, kartNo:"009/080", nameEN:"Shroomish", type:"Ot", hp:50, stage:"Temel", attack1:"마구 튀기 (Rasgele Sıçrama)", dmg1:"10×", attack2:"", dmg2:"", weakness:"Ateş ×2", retreat:"2", rarity:"C", ability:"", copies:2, img:sp(285), marketValue:0.10, trainer:"ash-ketchum" },
  { id:8, kartNo:"010/080", nameEN:"Brambleghast", type:"Ot", hp:120, stage:"1. Aşama", attack1:"안다리걸기 (Çelme)", dmg1:"30", attack2:"점프숏 (Sıçrama Atışı)", dmg2:"150", weakness:"Ateş ×2", retreat:"2", rarity:"M", ability:"", copies:2, img:sp(971), marketValue:1.50, trainer:"ash-ketchum" },
  { id:9, kartNo:"030/080", nameEN:"Morpeko", type:"Ot", hp:70, stage:"Temel", attack1:"치근거리기 (Yakınlaşma)", dmg1:"20+", attack2:"", dmg2:"", weakness:"Ateş ×2", retreat:"1", rarity:"C", ability:"", copies:2, img:sp(877), marketValue:0.10, trainer:"ash-ketchum" },
  { id:80, kartNo:"047/080", nameEN:"Flygon", type:"Ot", hp:150, stage:"2. Aşama", attack1:"커터윈드 (Cutter Wind)", dmg1:"130", attack2:"", dmg2:"", weakness:"Ateş ×2", retreat:"1", rarity:"M", ability:"모래의 날갯짓 (Sand Flap)", copies:1, img:sp(330), marketValue:3.50, trainer:"cynthia" },
  // === ATEŞ (FIRE) ===
  { id:10, kartNo:"011/080", nameEN:"Charmander", type:"Ateş", hp:80, stage:"Temel", attack1:"불씨 (Kıvılcım)", dmg1:"20", attack2:"", dmg2:"", weakness:"Su ×2", retreat:"1", rarity:"C", ability:"날렘 (Çeviklik)", copies:2, img:sp(4), marketValue:0.25, trainer:"red" },
  { id:11, kartNo:"012/080", nameEN:"Charmeleon", type:"Ateş", hp:110, stage:"1. Aşama", attack1:"볼토하기 (Ateş Kusmak)", dmg1:"40", attack2:"", dmg2:"", weakness:"Su ×2", retreat:"2", rarity:"C", ability:"", copies:2, img:sp(5), marketValue:0.50, trainer:"red" },
  { id:12, kartNo:"014/080", nameEN:"Moltres", type:"Ateş", hp:120, stage:"Temel", attack1:"투지의날개 (Cesaret Kanatları)", dmg1:"20+", attack2:"", dmg2:"", weakness:"Su ×2", retreat:"2", rarity:"M", ability:"", copies:2, img:sp(146), marketValue:3.00, trainer:"lance" },
  { id:13, kartNo:"015/080", nameEN:"Fuecoco", type:"Ateş", hp:80, stage:"Temel", attack1:"블레이즈볼 (Alev Topu)", dmg1:"10+", attack2:"", dmg2:"", weakness:"Su ×2", retreat:"2", rarity:"C", ability:"", copies:2, img:sp(909), marketValue:0.15, trainer:"ash-ketchum" },
  { id:14, kartNo:"016/080", nameEN:"Crocalor", type:"Ateş", hp:150, stage:"1. Aşama", attack1:"블레이즈볼 (Alev Topu)", dmg1:"40+", attack2:"", dmg2:"", weakness:"Su ×2", retreat:"2", rarity:"M", ability:"", copies:2, img:sp(910), marketValue:2.00, trainer:"ash-ketchum" },
  { id:15, kartNo:"018/080", nameEN:"Oricorio ex", type:"Ateş", hp:190, stage:"Temel ex", attack1:"불꽃날개 (Flame Wing)", dmg1:"110", attack2:"", dmg2:"", weakness:"Su ×2", retreat:"1", rarity:"RR", ability:"익사이팅 터보 (Exciting Turbo)", copies:1, img:sp(741), marketValue:8.00, trainer:"ash-ketchum" },
  { id:16, kartNo:"019/080", nameEN:"Rolycoly", type:"Ateş", hp:70, stage:"Temel", attack1:"힘모으기 (Güç Toplama)", dmg1:"-", attack2:"줍 (Toplama)", dmg2:"10", weakness:"Su ×2", retreat:"2", rarity:"C", ability:"", copies:2, img:sp(837), marketValue:0.10, trainer:"brock" },
  { id:17, kartNo:"020/080", nameEN:"Skeledirge", type:"Ateş", hp:140, stage:"1. Aşama", attack1:"연옥참 (Araf Kılıcı)", dmg1:"220", attack2:"", dmg2:"", weakness:"Su ×2", retreat:"2", rarity:"M", ability:"", copies:1, img:sp(911), marketValue:2.50, trainer:"ash-ketchum" },
  { id:81, kartNo:"087/080", nameEN:"Reshiram", type:"Ateş", hp:130, stage:"Temel", attack1:"화염 (Flame)", dmg1:"30", attack2:"버닝플레어 (Burning Flare)", dmg2:"240", weakness:"Su ×2", retreat:"2", rarity:"SR", ability:"", copies:1, img:sp(643), marketValue:20.00, trainer:"n" },
  { id:90, kartNo:"-", nameEN:"Arcanine", type:"Ateş", hp:150, stage:"1. Aşama", attack1:"あつくたぎる (Overheat)", dmg1:"30", attack2:"ダイナマイトファング (Dynamite Fang)", dmg2:"240", weakness:"Su ×2", retreat:"2", rarity:"R", ability:"", copies:1, img:sp(59), marketValue:4.00, trainer:"blaine" },
  { id:96, kartNo:"-", nameEN:"Magmar", type:"Ateş", hp:90, stage:"Temel", attack1:"ひだね (Ember)", dmg1:"10", attack2:"フレアコンボ (Flare Combo)", dmg2:"80+", weakness:"Su ×2", retreat:"2", rarity:"C", ability:"", copies:1, img:sp(126), marketValue:0.15, trainer:"blaine" },
  { id:99, kartNo:"-", nameEN:"Lampent", type:"Ateş", hp:80, stage:"1. Aşama", attack1:"Live Coal", dmg1:"20", attack2:"Burn It All Up", dmg2:"60", weakness:"Su ×2", retreat:"1", rarity:"C", ability:"", copies:1, img:sp(608), marketValue:0.15, trainer:"ash-ketchum" },
  // === SU (WATER) ===
  { id:18, kartNo:"021/080", nameEN:"Seel", type:"Su", hp:80, stage:"Temel", attack1:"버블드레인 (Bubble Drain)", dmg1:"20", attack2:"", dmg2:"", weakness:"Elektrik ×2", retreat:"2", rarity:"C", ability:"", copies:2, img:sp(86), marketValue:0.10, trainer:"misty" },
  { id:19, kartNo:"022/080", nameEN:"Dewgong", type:"Su", hp:130, stage:"1. Aşama", attack1:"힘껏치기 (Full Swing)", dmg1:"70×", attack2:"", dmg2:"", weakness:"Elektrik ×2", retreat:"2", rarity:"C", ability:"두꺼운지방 (Thick Fat)", copies:1, img:sp(87), marketValue:0.15, trainer:"misty" },
  { id:20, kartNo:"023/080", nameEN:"Swinub", type:"Su", hp:70, stage:"Temel", attack1:"밟기 (Step)", dmg1:"10", attack2:"스노아이스 (Snow Ice)", dmg2:"20", weakness:"Elektrik ×2", retreat:"2", rarity:"C", ability:"", copies:1, img:sp(220), marketValue:0.10, trainer:"dawn" },
  { id:21, kartNo:"024/080", nameEN:"Piloswine", type:"Su", hp:100, stage:"1. Aşama", attack1:"밀어올리기 (Push Up)", dmg1:"30+", attack2:"프로스트 스매시 (Frost Smash)", dmg2:"70", weakness:"Elektrik ×2", retreat:"2", rarity:"C", ability:"", copies:1, img:sp(221), marketValue:0.15, trainer:"dawn" },
  { id:22, kartNo:"025/080", nameEN:"Mamoswine", type:"Su", hp:180, stage:"2. Aşama", attack1:"때려부수기 (Smash)", dmg1:"120+", attack2:"블리자드에지 (Blizzard Edge)", dmg2:"200", weakness:"Elektrik ×2", retreat:"2", rarity:"M", ability:"", copies:1, img:sp(473), marketValue:1.50, trainer:"dawn" },
  { id:23, kartNo:"026/080", nameEN:"Suicune", type:"Su", hp:130, stage:"Temel", attack1:"크리스탈풀 (Crystal Pool)", dmg1:"30+", attack2:"", dmg2:"", weakness:"Elektrik ×2", retreat:"1", rarity:"R", ability:"", copies:1, img:sp(245), marketValue:5.00, trainer:"lance" },
  { id:24, kartNo:"027/080", nameEN:"Piplup", type:"Su", hp:70, stage:"Temel", attack1:"프렌드콜 (Friend Call)", dmg1:"-", attack2:"몸통박치기 (Body Slam)", dmg2:"20", weakness:"Elektrik ×2", retreat:"1", rarity:"C", ability:"", copies:1, img:sp(393), marketValue:0.20, trainer:"dawn" },
  { id:25, kartNo:"028/080", nameEN:"Prinplup", type:"Su", hp:100, stage:"1. Aşama", attack1:"쪼기 (Peck)", dmg1:"20", attack2:"노려서다이브 (Target Dive)", dmg2:"70", weakness:"Elektrik ×2", retreat:"2", rarity:"C", ability:"", copies:3, img:sp(394), marketValue:0.35, trainer:"dawn" },
  { id:26, kartNo:"058/080", nameEN:"Empoleon ex", type:"Su", hp:320, stage:"Mega ex", attack1:"아이언패더 (Demir Kanat)", dmg1:"210", attack2:"", dmg2:"", weakness:"Elektrik ×2", retreat:"0", rarity:"RR", ability:"황제의 자태 (İmparator Duruşu)", copies:1, img:sp(395), marketValue:18.00, trainer:"dawn" },
  // === ELEKTRİK (LIGHTNING) ===
  { id:27, kartNo:"031/080", nameEN:"Boltund", type:"Elektrik", hp:130, stage:"1. Aşama", attack1:"일렉트릭런 (Elektrik Koşusu)", dmg1:"70+", attack2:"", dmg2:"", weakness:"Dövüş ×2", retreat:"2", rarity:"M", ability:"", copies:3, img:sp(836), marketValue:2.00, trainer:"ash-ketchum" },
  { id:28, kartNo:"032/080", nameEN:"Pawmo", type:"Elektrik", hp:60, stage:"Temel", attack1:"울음소리 (Çığlık)", dmg1:"-", attack2:"프티전기 (Mini Elektrik)", dmg2:"10", weakness:"Dövüş ×2", retreat:"2", rarity:"C", ability:"", copies:2, img:sp(922), marketValue:0.15, trainer:"ash-ketchum" },
  { id:29, kartNo:"033/080", nameEN:"Pawmot", type:"Elektrik", hp:90, stage:"1. Aşama", attack1:"찌리리펀치 (Çatırtı Yumruğu)", dmg1:"60", attack2:"", dmg2:"", weakness:"Dövüş ×2", retreat:"2", rarity:"C", ability:"", copies:3, img:sp(923), marketValue:0.25, trainer:"ash-ketchum" },
  { id:82, kartNo:"034/080", nameEN:"Pawmot (Stage 2)", type:"Elektrik", hp:140, stage:"2. Aşama", attack1:"볼티지피스트 (Voltage Fist)", dmg1:"130", attack2:"", dmg2:"", weakness:"Dövüş ×2", retreat:"1", rarity:"M", ability:"", copies:1, img:sp(923), marketValue:2.00, trainer:"ash-ketchum" },
  // === PSİŞİK (PSYCHIC) ===
  { id:40, kartNo:"035/080", nameEN:"Misdreavus", type:"Psişik", hp:70, stage:"Temel", attack1:"조금원망하기 (Slight Grudge)", dmg1:"20", attack2:"", dmg2:"", weakness:"Karanlık ×2", retreat:"-30", rarity:"C", ability:"", copies:2, img:sp(200), marketValue:0.15, trainer:"team-rocket" },
  { id:41, kartNo:"037/040", nameEN:"Comfey", type:"Psişik", hp:60, stage:"Temel", attack1:"가져오기 (Fetch)", dmg1:"-", attack2:"", dmg2:"", weakness:"Çelik ×2", retreat:"1", rarity:"C", ability:"", copies:3, img:sp(764), marketValue:0.20, trainer:"ash-ketchum" },
  { id:42, kartNo:"039/080", nameEN:"Zacian", type:"Psişik", hp:130, stage:"Temel", attack1:"리밋브레이크 (Limit Break)", dmg1:"50+", attack2:"", dmg2:"", weakness:"Çelik ×2", retreat:"2", rarity:"R", ability:"", copies:1, img:sp(888), marketValue:4.50, trainer:"red" },
  { id:43, kartNo:"040/080", nameEN:"Hattrem", type:"Psişik", hp:50, stage:"Temel", attack1:"살짝올리기 (Light Lift)", dmg1:"-", attack2:"", dmg2:"", weakness:"Çelik ×2", retreat:"-30", rarity:"C", ability:"", copies:3, img:sp(857), marketValue:0.15, trainer:"cynthia" },
  { id:44, kartNo:"041/080", nameEN:"Trevenant", type:"Psişik", hp:100, stage:"1. Aşama", attack1:"염동탄 (Psycho Bomb)", dmg1:"80", attack2:"", dmg2:"", weakness:"Karanlık ×2", retreat:"-30", rarity:"M", ability:"패닉 프리즌 (Panic Prison)", copies:2, img:sp(709), marketValue:2.00, trainer:"ash-ketchum" },
  { id:91, kartNo:"-", nameEN:"Gengar", type:"Psişik", hp:130, stage:"2. Aşama", attack1:"폴터가이스트 (Poltergeist)", dmg1:"50×", attack2:"홀로우다이브 (Hollow Dive)", dmg2:"110", weakness:"Karanlık ×2", retreat:"-30", rarity:"M", ability:"", copies:1, img:sp(94), marketValue:4.50, trainer:"ash-ketchum" },
  { id:93, kartNo:"-", nameEN:"Clefable", type:"Psişik", hp:100, stage:"1. Aşama", attack1:"このゆびとまれ (Follow Me)", dmg1:"-", attack2:"アディショナルムーン (Additional Moon)", dmg2:"50", weakness:"Çelik ×2", retreat:"2", rarity:"M", ability:"", copies:1, img:sp(36), marketValue:2.50, trainer:"red" },
  { id:94, kartNo:"-", nameEN:"Fezandipiti", type:"Psişik", hp:120, stage:"Temel", attack1:"Energy Feather", dmg1:"30×", attack2:"", dmg2:"", weakness:"Çelik ×2", retreat:"1", rarity:"R", ability:"Adrena-Pheromone", copies:1, img:sp(10277), marketValue:4.00, trainer:"ash-ketchum" },
  { id:95, kartNo:"-", nameEN:"Scream Tail", type:"Psişik", hp:90, stage:"Temel", attack1:"Supportive Singing", dmg1:"-", attack2:"Hyper Voice", dmg2:"40", weakness:"Çelik ×2", retreat:"-30", rarity:"U", ability:"", copies:1, img:sp(10265), marketValue:0.75, trainer:"ash-ketchum" },
  { id:100, kartNo:"-", nameEN:"Pumpkaboo", type:"Psişik", hp:60, stage:"Temel", attack1:"Seed Bomb", dmg1:"10", attack2:"Reckless Charge", dmg2:"40", weakness:"Karanlık ×2", retreat:"1", rarity:"C", ability:"", copies:1, img:sp(710), marketValue:0.15, trainer:"ash-ketchum" },
  // === DÖVÜŞ (FIGHTING) ===
  { id:30, kartNo:"042/080", nameEN:"Paldean Tauros", type:"Dövüş", hp:130, stage:"Temel", attack1:"분노의돌진 (Öfke Saldırısı)", dmg1:"40×", attack2:"이판사판태클 (Son Hamle)", dmg2:"70", weakness:"Ateş ×2", retreat:"2", rarity:"C", ability:"", copies:4, img:sp(10250), marketValue:0.10, trainer:"ash-ketchum" },
  { id:31, kartNo:"043/080", nameEN:"Gligar", type:"Dövüş", hp:70, stage:"Temel", attack1:"독찌르기 (Zehir Saplama)", dmg1:"10", attack2:"", dmg2:"", weakness:"Ot ×2", retreat:"2", rarity:"C", ability:"", copies:2, img:sp(207), marketValue:0.10, trainer:"ash-ketchum" },
  { id:32, kartNo:"044/080", nameEN:"Gliscor", type:"Dövüş", hp:120, stage:"1. Aşama", attack1:"포이즌서클 (Zehir Çemberi)", dmg1:"50", attack2:"", dmg2:"", weakness:"Ot ×2", retreat:"2", rarity:"M", ability:"", copies:2, img:sp(472), marketValue:1.50, trainer:"ash-ketchum" },
  { id:33, kartNo:"045/080", nameEN:"Trapinch", type:"Dövüş", hp:70, stage:"Temel", attack1:"두번박치기 (İkili Kafa Vuruşu)", dmg1:"10×", attack2:"", dmg2:"", weakness:"Ot ×2", retreat:"2", rarity:"C", ability:"", copies:3, img:sp(328), marketValue:0.10, trainer:"cynthia" },
  { id:34, kartNo:"046/080", nameEN:"Vibrava", type:"Dövüş", hp:90, stage:"1. Aşama", attack1:"초진동 (Süper Titreşim)", dmg1:"60", attack2:"", dmg2:"", weakness:"Ot ×2", retreat:"2", rarity:"C", ability:"", copies:3, img:sp(329), marketValue:0.15, trainer:"cynthia" },
  { id:92, kartNo:"-", nameEN:"Sandshrew", type:"Dövüş", hp:60, stage:"Temel", attack1:"ひっかく (Scratch)", dmg1:"30", attack2:"", dmg2:"", weakness:"Ot ×2", retreat:"1", rarity:"C", ability:"すなでかくす (Sand Veil)", copies:1, img:sp(27), marketValue:0.15, trainer:"brock" },
  // === KARANLIK (DARK) ===
  { id:45, kartNo:"048/080", nameEN:"Sneasel", type:"Karanlık", hp:70, stage:"Temel", attack1:"발톱세우기 (Claw Sharpen)", dmg1:"10", attack2:"할퀴기 (Slash)", dmg2:"30", weakness:"Ot ×2", retreat:"1", rarity:"C", ability:"", copies:2, img:sp(215), marketValue:0.20, trainer:"cynthia" },
  { id:46, kartNo:"049/080", nameEN:"Sneasler", type:"Karanlık", hp:90, stage:"1. Aşama", attack1:"응보의발톱 (Vengeance Claw)", dmg1:"20+", attack2:"풀베기 (Grass Cut)", dmg2:"60", weakness:"Dövüş ×2", retreat:"1", rarity:"U", ability:"", copies:2, img:sp(903), marketValue:0.75, trainer:"cynthia" },
  { id:47, kartNo:"050/080", nameEN:"Carvanha", type:"Karanlık", hp:70, stage:"Temel", attack1:"돌격 (Charge)", dmg1:"30", attack2:"", dmg2:"", weakness:"Ot ×2", retreat:"1", rarity:"C", ability:"", copies:2, img:sp(318), marketValue:0.15, trainer:"team-rocket" },
  { id:48, kartNo:"052/080", nameEN:"Seviper", type:"Karanlık", hp:120, stage:"Temel", attack1:"칠흑엄니 (Dark Fang)", dmg1:"120", attack2:"", dmg2:"", weakness:"Dövüş ×2", retreat:"2", rarity:"M", ability:"익사이팅 파워 (Exciting Power)", copies:2, img:sp(336), marketValue:1.50, trainer:"team-rocket" },
  { id:49, kartNo:"053/080", nameEN:"Croagunk", type:"Karanlık", hp:70, stage:"Temel", attack1:"부딧치기 (Headbutt)", dmg1:"10", attack2:"뒤로 차기 (Back Kick)", dmg2:"20", weakness:"Dövüş ×2", retreat:"1", rarity:"C", ability:"", copies:2, img:sp(453), marketValue:0.10, trainer:"brock" },
  { id:50, kartNo:"054/080", nameEN:"Drapion", type:"Karanlık", hp:100, stage:"Temel", attack1:"물기 (Bite)", dmg1:"30", attack2:"진검승부 (Serious Match)", dmg2:"60", weakness:"Dövüş ×2", retreat:"2", rarity:"C", ability:"", copies:1, img:sp(452), marketValue:0.10, trainer:"team-rocket" },
  { id:51, kartNo:"055/080", nameEN:"Drapion (Stage 1)", type:"Karanlık", hp:170, stage:"1. Aşama", attack1:"리벤지팬 (Revenge Fang)", dmg1:"60+", attack2:"한방 먹이기 (One-Shot)", dmg2:"160", weakness:"Dövüş ×2", retreat:"2", rarity:"U", ability:"", copies:1, img:sp(452), marketValue:0.40, trainer:"team-rocket" },
  { id:52, kartNo:"056/080", nameEN:"Toxel", type:"Karanlık", hp:70, stage:"Temel", attack1:"동로부르기 (Call for Friend)", dmg1:"-", attack2:"개구쟁이킥 (Naughty Kick)", dmg2:"20", weakness:"Dövüş ×2", retreat:"1", rarity:"C", ability:"", copies:1, img:sp(848), marketValue:0.15, trainer:"ash-ketchum" },
  { id:53, kartNo:"057/080", nameEN:"Toxtricity", type:"Karanlık", hp:140, stage:"1. Aşama", attack1:"세계때리기 (World Slam)", dmg1:"100", attack2:"", dmg2:"", weakness:"Dövüş ×2", retreat:"2", rarity:"M", ability:"배드 어피 (Bad Aura)", copies:3, img:sp(849), marketValue:2.00, trainer:"ash-ketchum" },
  { id:83, kartNo:"-", nameEN:"Darkrai", type:"Karanlık", hp:130, stage:"Temel", attack1:"Dark Slumber", dmg1:"20", attack2:"Night Cyclone", dmg2:"120", weakness:"Ot ×2", retreat:"2", rarity:"R", ability:"", copies:1, img:sp(491), marketValue:5.00, trainer:"cynthia" },
  { id:84, kartNo:"-", nameEN:"Mega Sharpedo ex", type:"Karanlık", hp:330, stage:"Mega ex", attack1:"욕심내기엄니 (Greedy Fang)", dmg1:"70", attack2:"헝그리조 (Hungry Jaw)", dmg2:"120+", weakness:"Ot ×2", retreat:"1", rarity:"RR", ability:"", copies:1, img:sp(319), marketValue:14.00, trainer:"team-rocket" },
  { id:97, kartNo:"-", nameEN:"Poochyena", type:"Karanlık", hp:60, stage:"Temel", attack1:"Gnaw", dmg1:"10", attack2:"Slight Intrusion", dmg2:"30", weakness:"Ot ×2", retreat:"1", rarity:"C", ability:"", copies:1, img:sp(261), marketValue:0.10, trainer:"team-rocket" },
  // === ÇELİK (STEEL) ===
  { id:55, kartNo:"059/080", nameEN:"Bronzor", type:"Çelik", hp:80, stage:"Temel", attack1:"철벽 (Demir Duvar)", dmg1:"-", attack2:"구르기 (Yuvarlanma)", dmg2:"30", weakness:"Ateş ×2", retreat:"-30", rarity:"C", ability:"", copies:2, img:sp(436), marketValue:0.10, trainer:"steven-stone" },
  { id:56, kartNo:"060/080", nameEN:"Bronzong", type:"Çelik", hp:140, stage:"1. Aşama", attack1:"트리플드로 (Üçlü Çekiş)", dmg1:"-", attack2:"도구털구기 (Araç Silkeleme)", dmg2:"40×", weakness:"Ateş ×2", retreat:"-30", rarity:"U", ability:"", copies:1, img:sp(437), marketValue:0.50, trainer:"steven-stone" },
  { id:57, kartNo:"061/080", nameEN:"Togedemaru", type:"Çelik", hp:80, stage:"Temel", attack1:"친구찾기 (Arkadaş Bulma)", dmg1:"-", attack2:"감기 (Sarma)", dmg2:"30", weakness:"Ateş ×2", retreat:"-30", rarity:"C", ability:"", copies:5, img:sp(777), marketValue:0.15, trainer:"ash-ketchum" },
  { id:58, kartNo:"062/080", nameEN:"Duraludon", type:"Çelik", hp:130, stage:"Temel", attack1:"파괴광선 (Yıkım Işını)", dmg1:"70", attack2:"", dmg2:"", weakness:"Ateş ×2", retreat:"-30", rarity:"C", ability:"", copies:3, img:sp(884), marketValue:0.15, trainer:"steven-stone" },
  { id:59, kartNo:"063/080", nameEN:"Archaludon", type:"Çelik", hp:180, stage:"1. Aşama", attack1:"코팅어택 (Kaplama Saldırısı)", dmg1:"120", attack2:"", dmg2:"", weakness:"Ateş ×2", retreat:"-30", rarity:"M", ability:"", copies:2, img:sp(1018), marketValue:2.00, trainer:"steven-stone" },
  { id:85, kartNo:"-", nameEN:"Iron Jugulis", type:"Çelik", hp:130, stage:"Temel", attack1:"Blasting Wind", dmg1:"110", attack2:"", dmg2:"", weakness:"Ateş ×2", retreat:"2", rarity:"R", ability:"Automated Combat", copies:1, img:sp(10264), marketValue:3.50, trainer:"steven-stone" },
  // === NORMAL ===
  { id:60, kartNo:"057/080", nameEN:"Mega Lopunny ex", type:"Normal", hp:330, stage:"Mega ex", attack1:"질풍찌르기 (Rüzgar Sapması)", dmg1:"60+", attack2:"스파이크호퍼 (Diken Sıçrayış)", dmg2:"160", weakness:"Dövüş ×2", retreat:"0", rarity:"RR", ability:"", copies:1, img:sp(428), marketValue:12.00, trainer:"cynthia" },
  { id:61, kartNo:"064/080", nameEN:"Jigglypuff", type:"Normal", hp:70, stage:"Temel", attack1:"구슬구르기 (Bilye Yuvarlatma)", dmg1:"20×", attack2:"", dmg2:"", weakness:"Dövüş ×2", retreat:"2", rarity:"C", ability:"", copies:2, img:sp(39), marketValue:0.15, trainer:"misty" },
  { id:62, kartNo:"065/080", nameEN:"Wigglytuff", type:"Normal", hp:120, stage:"1. Aşama", attack1:"돌림노래 (Dönüş Şarkısı)", dmg1:"40×", attack2:"지구던지기 (Dünya Fırlatma)", dmg2:"100", weakness:"Dövüş ×2", retreat:"2", rarity:"U", ability:"", copies:3, img:sp(40), marketValue:0.50, trainer:"misty" },
  { id:63, kartNo:"066/080", nameEN:"Aipom", type:"Normal", hp:70, stage:"Temel", attack1:"놀래키키 (Korkutma)", dmg1:"20", attack2:"", dmg2:"", weakness:"Dövüş ×2", retreat:"2", rarity:"C", ability:"", copies:3, img:sp(190), marketValue:0.15, trainer:"ash-ketchum" },
  { id:64, kartNo:"067/080", nameEN:"Ambipom", type:"Normal", hp:110, stage:"1. Aşama", attack1:"뺨치기 (Tokat)", dmg1:"50", attack2:"듀얼테일 (Çift Kuyruk)", dmg2:"-", weakness:"Dövüş ×2", retreat:"2", rarity:"M", ability:"", copies:1, img:sp(424), marketValue:1.50, trainer:"ash-ketchum" },
  { id:65, kartNo:"068/080", nameEN:"Smeargle", type:"Normal", hp:80, stage:"Temel", attack1:"에너지스케치 (Enerji Çizimi)", dmg1:"-", attack2:"걸기 (Asma)", dmg2:"40", weakness:"Dövüş ×2", retreat:"2", rarity:"C", ability:"", copies:1, img:sp(235), marketValue:0.25, trainer:"red" },
  { id:66, kartNo:"069/080", nameEN:"Zigzagoon", type:"Normal", hp:70, stage:"Temel", attack1:"허찌르기 (Saplama)", dmg1:"30", attack2:"", dmg2:"", weakness:"Dövüş ×2", retreat:"2", rarity:"C", ability:"", copies:3, img:sp(263), marketValue:0.10, trainer:"ash-ketchum" },
  { id:67, kartNo:"070/080", nameEN:"Obstagoon", type:"Normal", hp:100, stage:"1. Aşama", attack1:"베어가르기 (Kesme)", dmg1:"70", attack2:"", dmg2:"", weakness:"Dövüş ×2", retreat:"0", rarity:"M", ability:"익사이팅 대시 (Heyecan Koşusu)", copies:1, img:sp(862), marketValue:2.00, trainer:"ash-ketchum" },
  { id:68, kartNo:"071/080", nameEN:"Buneary", type:"Normal", hp:70, stage:"Temel", attack1:"들뜸 (Heyecan)", dmg1:"-", attack2:"킥 (Tekme)", dmg2:"20", weakness:"Dövüş ×2", retreat:"2", rarity:"C", ability:"", copies:4, img:sp(427), marketValue:0.15, trainer:"dawn" },
  { id:69, kartNo:"072/080", nameEN:"Smeargle (AR)", type:"Normal", hp:80, stage:"Temel", attack1:"에너지스케치 (Enerji Çizimi)", dmg1:"-", attack2:"걸기 (Asma)", dmg2:"40", weakness:"Dövüş ×2", retreat:"2", rarity:"RR", ability:"", copies:1, img:sp(235), marketValue:15.00, trainer:"red" },
  { id:86, kartNo:"058/080", nameEN:"Whimsicott", type:"Normal", hp:90, stage:"1. Aşama", attack1:"치유솜털 (Healing Cotton)", dmg1:"-", attack2:"유턴 (U-Turn)", dmg2:"50", weakness:"Çelik ×2", retreat:"1", rarity:"M", ability:"", copies:1, img:sp(547), marketValue:1.50, trainer:"ash-ketchum" },
  { id:98, kartNo:"-", nameEN:"Farfetch'd", type:"Normal", hp:90, stage:"Temel", attack1:"しょってくる (Carry)", dmg1:"-", attack2:"ネギでぶつ (Leek Slap)", dmg2:"30", weakness:"Elektrik ×2", retreat:"1", rarity:"C", ability:"", copies:1, img:sp(83), marketValue:0.25, trainer:"blue" },
  // === DESTEKÇİ (TRAINER) ===
  { id:70, kartNo:"078/080", nameEN:"Dawn (Supporter)", type:"Destekçi", hp:0, stage:"Destekçi", attack1:"", dmg1:"", attack2:"", dmg2:"", weakness:"-", retreat:"-", rarity:"U", ability:"Destekçi Kart", copies:2, img:sp(393), marketValue:0.75, trainer:"dawn" },
  { id:71, kartNo:"073/080", nameEN:"Jumbo Ice (Item)", type:"Destekçi", hp:0, stage:"Eşya", attack1:"", dmg1:"", attack2:"", dmg2:"", weakness:"-", retreat:"-", rarity:"U", ability:"Eşya Kartı", copies:1, img:"", marketValue:0.50, trainer:null },
  { id:72, kartNo:"074/080", nameEN:"Heat Burner (Item)", type:"Destekçi", hp:0, stage:"Eşya", attack1:"", dmg1:"", attack2:"", dmg2:"", weakness:"-", retreat:"-", rarity:"U", ability:"Eşya Kartı", copies:2, img:"", marketValue:0.50, trainer:null },
  { id:73, kartNo:"075/080", nameEN:"Sacred Charm (Tool)", type:"Destekçi", hp:0, stage:"Araç", attack1:"", dmg1:"", attack2:"", dmg2:"", weakness:"-", retreat:"-", rarity:"U", ability:"Pokémon Aracı", copies:3, img:"", marketValue:0.50, trainer:null },
  { id:74, kartNo:"076/080", nameEN:"Ball Player (Supporter)", type:"Destekçi", hp:0, stage:"Destekçi", attack1:"", dmg1:"", attack2:"", dmg2:"", weakness:"-", retreat:"-", rarity:"U", ability:"Destekçi Kart", copies:1, img:"", marketValue:0.60, trainer:null },
  { id:75, kartNo:"077/080", nameEN:"Blaine's Strategy (Supporter)", type:"Destekçi", hp:0, stage:"Destekçi", attack1:"", dmg1:"", attack2:"", dmg2:"", weakness:"-", retreat:"-", rarity:"U", ability:"Destekçi Kart", copies:1, img:"", marketValue:0.60, trainer:"blaine" },
  { id:76, kartNo:"080/080", nameEN:"Dizzying Valley (Stadium)", type:"Destekçi", hp:0, stage:"Stadyum", attack1:"", dmg1:"", attack2:"", dmg2:"", weakness:"-", retreat:"-", rarity:"U", ability:"Stadyum Kartı", copies:1, img:"", marketValue:0.50, trainer:null },
  { id:77, kartNo:"102/080", nameEN:"Heat Burner (SR)", type:"Destekçi", hp:0, stage:"Eşya", attack1:"", dmg1:"", attack2:"", dmg2:"", weakness:"-", retreat:"-", rarity:"SR", ability:"Secret Rare Eşya", copies:1, img:"", marketValue:25.00, trainer:null },
  { id:101, kartNo:"-", nameEN:"Big Balloon (Tool)", type:"Destekçi", hp:0, stage:"Araç", attack1:"", dmg1:"", attack2:"", dmg2:"", weakness:"-", retreat:"-", rarity:"U", ability:"Pokémon Aracı", copies:1, img:"", marketValue:0.50, trainer:null },
];

/* ── Sub-components ── */

function TypeBadge({ type, size }) {
  const t = typeColors[type] || typeColors["Normal"];
  const isLg = size === "lg";
  return (
    <span style={{
      background: t.bg,
      color: "#fff",
      borderRadius: 20,
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: isLg ? "4px 14px" : "3px 10px",
      fontSize: isLg ? 13 : 11,
      boxShadow: `0 0 10px ${t.glow}`,
      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      letterSpacing: "0.02em",
    }}>
      {t.emoji} {type}
    </span>
  );
}

function RarityBadge({ rarity }) {
  return (
    <span style={{
      background: rarityColors[rarity] || "#5a566e",
      color: (rarity === "RR" || rarity === "SR") ? "#07060b" : "#fff",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      boxShadow: rarityGlow[rarity],
      letterSpacing: "0.03em",
    }}>
      {rarity}
    </span>
  );
}

function CardTile({ card, compareMode, isSelected, onToggle, index, scrollRef, onDelete }) {
  const [imgErr, setImgErr] = useState(false);
  const t = typeColors[card.type] || typeColors["Normal"];
  const rarityClass = `rarity-${card.rarity}`;

  return (
    <div
      className={`poke-card ${rarityClass} ${isSelected ? "selected" : ""}`}
      style={{ animationDelay: `${Math.min(index * 0.04, 0.8)}s` }}
    >
      <div className="holo-overlay" />
      <div className="shimmer-streak" />

      {compareMode && (
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
          <input type="checkbox" className="holo-checkbox" checked={isSelected} onChange={() => onToggle(card.id)} />
        </div>
      )}

      <div style={{
        position: "absolute", top: 10, right: 10, zIndex: 10,
        background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)",
        color: "#e8e6f0", padding: "2px 9px", borderRadius: 20,
        fontSize: 11, fontWeight: 700, backdropFilter: "blur(8px)",
      }}>
        ×{card.copies}
      </div>

      {!compareMode && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(card); }}
          className="card-delete-btn"
          title="Kartı Sil"
          style={{
            position: "absolute", top: 10, left: 10, zIndex: 10,
            width: 28, height: 28,
            background: "rgba(247,37,133,0.15)",
            border: "1px solid rgba(247,37,133,0.3)",
            borderRadius: "50%",
            color: "#ff4d6d",
            fontSize: 13, fontWeight: 700,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
        >
          ✕
        </button>
      )}

      <div style={{
        padding: "20px 16px 12px", display: "flex", justifyContent: "center",
        alignItems: "center", minHeight: 180,
        background: `radial-gradient(ellipse at 50% 80%, ${t.glow}, transparent 70%)`,
        position: "relative",
      }}>
        {card.img && !imgErr ? (
          <img src={card.img} alt={card.nameEN} onError={() => setImgErr(true)}
            style={{ maxHeight: 155, maxWidth: "85%", objectFit: "contain",
              filter: `drop-shadow(0 6px 20px ${t.glow})`,
              transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
            }} crossOrigin="anonymous" />
        ) : (
          <div style={{ fontSize: 64, opacity: 0.4 }}>{t.emoji}</div>
        )}
      </div>

      <div style={{ padding: "10px 14px 14px", borderTop: `1px solid ${t.bg}22` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#e8e6f0",
              fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.01em" }}>
              {card.nameEN}
            </div>
            {card.trainer && trainers[card.trainer] && (
              <Link
                to={`/trainer/${card.trainer}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (scrollRef) scrollRef.current = window.scrollY;
                }}
                className="trainer-link"
              >
                🎯 {trainers[card.trainer].name}
              </Link>
            )}
          </div>
          {card.hp > 0 && (
            <span style={{
              fontWeight: 800, fontSize: 16, fontFamily: "'Rajdhani', sans-serif",
              color: card.hp >= 150 ? "#ff4d6d" : card.hp >= 100 ? "#ffd166" : "#00f5d4",
              whiteSpace: "nowrap",
              textShadow: card.hp >= 150 ? "0 0 12px rgba(255,77,109,0.4)" : "none",
            }}>
              HP {card.hp}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
          <TypeBadge type={card.type} />
          <RarityBadge rarity={card.rarity} />
          <span style={{ fontSize: 10, color: "#5a566e", fontFamily: "monospace" }}>{card.kartNo}</span>
        </div>

        {card.attack1 && (
          <div style={{ fontSize: 12, color: "#8b87a0", marginBottom: 2 }}>
            <span style={{ color: "#ff4d6d" }}>&#x2694;</span>{" "}
            {card.attack1} — <b style={{ color: "#ff4d6d" }}>{card.dmg1 || "—"}</b>
          </div>
        )}
        {card.attack2 && (
          <div style={{ fontSize: 12, color: "#8b87a0" }}>
            <span style={{ color: "#ff4d6d" }}>&#x2694;</span>{" "}
            {card.attack2} — <b style={{ color: "#ff4d6d" }}>{card.dmg2 || "—"}</b>
          </div>
        )}

        {card.ability && (
          <div style={{
            marginTop: 6, background: "rgba(123,97,255,0.1)",
            border: "1px solid rgba(123,97,255,0.2)", padding: "4px 8px",
            borderRadius: 8, fontSize: 11, color: "#c4b5fd", fontWeight: 600,
          }}>
            &#x2728; {card.ability}
          </div>
        )}

        <div style={{ marginTop: 6, fontSize: 11, color: "#5a566e" }}>
          Zayıflık: <span style={{ color: "#ff4d6d", fontWeight: 600 }}>{card.weakness}</span>
          {" · "}Çekilme: {card.retreat}
        </div>

        {card.marketValue > 0 && (
          <div style={{
            marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "rgba(0,245,212,0.06)", border: "1px solid rgba(0,245,212,0.15)",
            padding: "4px 8px", borderRadius: 8,
          }}>
            <span style={{ fontSize: 11, color: "#5a566e" }}>Piyasa Değeri</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#00f5d4", fontFamily: "'Rajdhani', sans-serif" }}>
              ${card.marketValue.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CompareView({ cards, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 1000, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'Rajdhani', sans-serif", color: "#e8e6f0" }}>
            &#x2694; Kart Karşılaştırma
          </h2>
          <button className="btn-danger" onClick={onClose}>&#x2715; Kapat</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, 1fr)`, gap: 16 }}>
          {cards.map((card) => {
            const t = typeColors[card.type] || typeColors["Normal"];
            return (
              <div key={card.id} style={{
                border: `2px solid ${t.bg}`, borderRadius: 16, overflow: "hidden",
                background: `linear-gradient(180deg, ${t.dark}, var(--bg-card))`,
                boxShadow: `0 0 20px ${t.glow}`,
              }}>
                <div style={{ padding: 16, display: "flex", justifyContent: "center",
                  background: `radial-gradient(ellipse at 50% 80%, ${t.glow}, transparent 70%)` }}>
                  {card.img ? (
                    <img src={card.img} alt={card.nameEN}
                      style={{ maxHeight: 110, objectFit: "contain", filter: `drop-shadow(0 4px 16px ${t.glow})` }}
                      crossOrigin="anonymous" />
                  ) : (
                    <div style={{ fontSize: 48, padding: 20 }}>{t.emoji}</div>
                  )}
                </div>
                <div style={{ padding: "0 14px 14px" }}>
                  <div style={{ textAlign: "center", marginBottom: 10 }}>
                    <TypeBadge type={card.type} size="lg" />
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: "8px 0 2px", fontFamily: "'Rajdhani', sans-serif", color: "#e8e6f0" }}>
                      {card.nameEN}
                    </h3>
                    <div style={{ fontSize: 11, color: "#5a566e" }}>{card.kartNo}</div>
                  </div>
                  {[["HP", card.hp > 0 ? card.hp : "-"], ["Aşama", card.stage],
                    ["Nadirlik", `${card.rarity} (${rarityLabels[card.rarity] || ""})`],
                    ["Zayıflık", card.weakness], ["Çekilme", card.retreat], ["Kopya", `×${card.copies}`],
                    ["Piyasa Değeri", `$${(card.marketValue || 0).toFixed(2)}`],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                      <span style={{ color: "#5a566e" }}>{l}</span>
                      <span style={{ fontWeight: 700, color: l === "HP" && v >= 150 ? "#ff4d6d" : l === "Piyasa Değeri" ? "#00f5d4" : "#e8e6f0" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: "#8b87a0" }}>Saldırılar</div>
                    {card.attack1 && <div style={{ fontSize: 11, color: "#8b87a0" }}>{card.attack1}: <b style={{ color: "#ff4d6d" }}>{card.dmg1 || "—"}</b></div>}
                    {card.attack2 && <div style={{ fontSize: 11, color: "#8b87a0" }}>{card.attack2}: <b style={{ color: "#ff4d6d" }}>{card.dmg2 || "—"}</b></div>}
                  </div>
                  {card.ability && (
                    <div style={{ marginTop: 6, background: "rgba(123,97,255,0.1)", border: "1px solid rgba(123,97,255,0.2)",
                      padding: "4px 8px", borderRadius: 8, fontSize: 11, color: "#c4b5fd" }}>
                      &#x2728; {card.ability}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PhotoUploadModal({ onClose, onAdd, nextId }) {
  const [phase, setPhase] = useState("upload");
  const [preview, setPreview] = useState(null);
  const [imageBase64, setImageBase64] = useState("");
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [extractedCards, setExtractedCards] = useState([]);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Lutfen bir gorsel dosyasi secin.");
      return;
    }
    if (file.size > 15_000_000) {
      setError("Dosya boyutu 15MB'dan kucuk olmali.");
      return;
    }
    setError("");
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setPreview(dataUrl);
      setImageBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const analyzeImage = async () => {
    if (!imageBase64) return;
    setPhase("analyzing");
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analiz basarisiz");
      if (!data.cards || data.cards.length === 0) {
        setError("Fotograf uzerinde kart bulunamadi. Tekrar deneyin.");
        setPhase("upload");
        return;
      }
      const withIds = data.cards.map((c, i) => ({
        ...c,
        id: nextId + i,
        hp: +c.hp || 0,
        copies: +c.copies || 1,
        marketValue: +c.marketValue || 0,
      }));
      setExtractedCards(withIds);
      setPhase("review");
    } catch (err) {
      setError(err.message);
      setPhase("upload");
    }
  };

  const updateCard = (idx, field, value) =>
    setExtractedCards((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );

  const removeCard = (idx) =>
    setExtractedCards((prev) => prev.filter((_, i) => i !== idx));

  const confirmAdd = () => {
    const cleaned = extractedCards.map((c) => ({
      ...c,
      hp: +c.hp || 0,
      copies: +c.copies || 1,
      marketValue: +c.marketValue || 0,
    }));
    onAdd(cleaned);
    onClose();
  };

  const lbl = { fontSize: 12, fontWeight: 600, color: "#8b87a0", marginBottom: 4, display: "block" };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 700, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <img
            src={TCG_LOGO}
            alt=""
            style={{
              height: 28, width: "auto",
              filter: "drop-shadow(0 0 6px rgba(123,97,255,0.4))",
            }}
          />
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'Rajdhani', sans-serif", color: "#e8e6f0" }}>
            Fotoğraftan Kart Ekle
          </h2>
        </div>

        {/* ── Upload Phase ── */}
        {phase === "upload" && (
          <>
            <div
              className={`upload-zone ${isDragging ? "dragging" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById("card-photo-input").click()}
            >
              <input
                id="card-photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFile(e.target.files[0])}
                style={{ display: "none" }}
              />
              {preview ? (
                <img src={preview} alt="Preview" style={{ maxHeight: 280, maxWidth: "100%", borderRadius: 12, objectFit: "contain" }} />
              ) : (
                <div>
                  <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>&#x1F4F7;</div>
                  <div style={{ color: "#8b87a0", fontSize: 14, fontWeight: 600 }}>
                    Kart fotografini surukleyin veya tiklayin
                  </div>
                  <div style={{ color: "#5a566e", fontSize: 12, marginTop: 6 }}>
                    Tek kart veya kart sayfasi fotografi yukleyebilirsiniz
                  </div>
                </div>
              )}
            </div>
            {error && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(247,37,133,0.1)", border: "1px solid rgba(247,37,133,0.3)", borderRadius: 10, color: "#ff4d6d", fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn-glow" onClick={onClose}>Iptal</button>
              {preview && (
                <button className="btn-emerald" onClick={analyzeImage}>&#x1F50D; Analiz Et</button>
              )}
            </div>
          </>
        )}

        {/* ── Analyzing Phase ── */}
        {phase === "analyzing" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="spinner" />
            <div style={{ color: "#8b87a0", fontSize: 14, fontWeight: 600 }}>
              Kartlar analiz ediliyor...
            </div>
            <div style={{ color: "#5a566e", fontSize: 12, marginTop: 6 }}>
              Bu islem birkaç saniye surebilir
            </div>
          </div>
        )}

        {/* ── Review Phase ── */}
        {phase === "review" && (
          <>
            <div style={{ color: "#8b87a0", fontSize: 13, marginBottom: 14 }}>
              {extractedCards.length} kart bulundu. Bilgileri kontrol edip duzenleyebilirsiniz.
            </div>
            <div style={{ maxHeight: "55vh", overflowY: "auto", paddingRight: 4 }}>
              {extractedCards.map((card, idx) => (
                <div key={idx} className="review-card-row">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: "#e8e6f0", fontFamily: "'Rajdhani', sans-serif", fontSize: 16 }}>
                      #{idx + 1} {card.nameEN || "—"}
                    </span>
                    <button className="btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => removeCard(idx)}>&#x2715;</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={lbl}>Ad</label>
                      <input className="holo-input" style={{ width: "100%" }} value={card.nameEN} onChange={(e) => updateCard(idx, "nameEN", e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Tur</label>
                      <select className="holo-select" style={{ width: "100%" }} value={card.type} onChange={(e) => updateCard(idx, "type", e.target.value)}>
                        {Object.keys(typeColors).map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>HP</label>
                      <input className="holo-input" style={{ width: "100%" }} type="number" value={card.hp} onChange={(e) => updateCard(idx, "hp", e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Nadirlik</label>
                      <select className="holo-select" style={{ width: "100%" }} value={card.rarity} onChange={(e) => updateCard(idx, "rarity", e.target.value)}>
                        {Object.entries(rarityLabels).map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Asama</label>
                      <select className="holo-select" style={{ width: "100%" }} value={card.stage} onChange={(e) => updateCard(idx, "stage", e.target.value)}>
                        {["Temel", "1. Aşama", "2. Aşama", "Mega ex", "Temel ex", "Destekçi", "Eşya", "Araç", "Stadyum"].map((v) => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Kart No</label>
                      <input className="holo-input" style={{ width: "100%" }} value={card.kartNo} onChange={(e) => updateCard(idx, "kartNo", e.target.value)} />
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="btn-glow"
                      style={{ padding: "4px 12px", fontSize: 11 }}
                      onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    >
                      {expandedIdx === idx ? "▲ Detaylari Gizle" : "▼ Detaylar"}
                    </button>
                    {expandedIdx === idx && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                        {[["Saldiri 1", "attack1"], ["Hasar 1", "dmg1"], ["Saldiri 2", "attack2"], ["Hasar 2", "dmg2"],
                          ["Zayiflik", "weakness"], ["Cekilme", "retreat"], ["Yetenek", "ability"],
                        ].map(([l, k]) => (
                          <div key={k}><label style={lbl}>{l}</label>
                            <input className="holo-input" style={{ width: "100%" }} value={card[k]} onChange={(e) => updateCard(idx, k, e.target.value)} />
                          </div>
                        ))}
                        <div><label style={lbl}>Kopya</label>
                          <input className="holo-input" style={{ width: "100%" }} type="number" value={card.copies} onChange={(e) => updateCard(idx, "copies", e.target.value)} />
                        </div>
                        <div><label style={lbl}>Piyasa Degeri (USD)</label>
                          <input className="holo-input" style={{ width: "100%" }} type="number" step="0.01" value={card.marketValue} onChange={(e) => updateCard(idx, "marketValue", e.target.value)} placeholder="0.00" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {error && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(247,37,133,0.1)", border: "1px solid rgba(247,37,133,0.3)", borderRadius: 10, color: "#ff4d6d", fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn-glow" onClick={onClose}>Iptal</button>
              {extractedCards.length > 0 && (
                <button className="btn-emerald" onClick={confirmAdd}>
                  &#x2795; {extractedCards.length} Kart Ekle
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DeleteConfirmModal({ card, onConfirm, onClose }) {
  const t = typeColors[card.type] || typeColors["Normal"];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 420, width: "100%", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{
          fontSize: 22, fontWeight: 700, marginBottom: 16,
          fontFamily: "'Rajdhani', sans-serif", color: "#e8e6f0",
        }}>
          🗑️ Kartı Sil
        </h2>

        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          marginBottom: 20, padding: 16,
          background: `radial-gradient(ellipse at 50% 80%, ${t.glow}, transparent 70%)`,
          borderRadius: 12,
        }}>
          {card.img && (
            <img src={card.img} alt={card.nameEN}
              style={{
                maxHeight: 120, objectFit: "contain",
                filter: `drop-shadow(0 4px 16px ${t.glow})`,
                marginBottom: 12,
              }} crossOrigin="anonymous" />
          )}
          <div style={{
            fontWeight: 700, fontSize: 18, color: "#e8e6f0",
            fontFamily: "'Rajdhani', sans-serif",
          }}>
            {card.nameEN}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <TypeBadge type={card.type} />
            <RarityBadge rarity={card.rarity} />
          </div>
        </div>

        <p style={{ color: "#8b87a0", fontSize: 14, marginBottom: 24 }}>
          Bu kartı koleksiyonunuzdan silmek istediğinize emin misiniz?
          <br />
          <span style={{ color: "#ff4d6d", fontSize: 12 }}>Bu işlem geri alınamaz.</span>
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn-glow" onClick={onClose}>İptal</button>
          <button className="btn-danger" onClick={() => onConfirm(card.id)}>
            🗑️ Sil
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryView({ stats }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 28px 120px",
      position: "relative",
      zIndex: 1,
    }}>
      <img
        src={TCG_LOGO}
        alt=""
        style={{
          width: 200, height: "auto", marginBottom: 20, opacity: 0.3,
          filter: "grayscale(0.3) drop-shadow(0 0 20px rgba(123,97,255,0.3))",
          userSelect: "none", pointerEvents: "none",
        }}
      />
      <h2 style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 28,
        fontWeight: 700,
        margin: "0 0 8px",
        background: "linear-gradient(135deg, #e8e6f0, #7b61ff)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>Özet</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center" }}>
        Koleksiyon özeti yakında burada olacak.
      </p>
      <div style={{
        marginTop: 24, padding: "16px 24px",
        background: "var(--bg-card)", border: "1px solid var(--border-dim)",
        borderRadius: 16, textAlign: "center", minWidth: 220,
      }}>
        <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 4 }}>Toplam Kart</div>
        <div style={{
          fontFamily: "'Rajdhani', sans-serif", fontSize: 36, fontWeight: 700, color: "var(--holo-1)",
        }}>{stats.total}</div>
      </div>
    </div>
  );
}

function BottomTabBar({ onAddClick }) {
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname.startsWith("/trainer");
  const isSummary = location.pathname === "/ozet";

  const tabStyle = (active) => ({
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 4, flex: 1, padding: "8px 0", cursor: "pointer", background: "transparent",
    border: "none", textDecoration: "none", position: "relative",
    transition: "color 0.2s ease", fontFamily: "'DM Sans', sans-serif",
    fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
    color: active ? "var(--holo-1)" : "var(--text-muted)",
  });

  const indicator = (
    <span style={{
      position: "absolute", bottom: 0, width: 32, height: 2,
      background: "var(--holo-1)", borderRadius: 2,
      boxShadow: "0 0 8px rgba(0,245,212,0.6)",
    }} />
  );

  return (
    <nav className="bottom-tab-bar" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      height: 64, display: "flex", alignItems: "stretch",
      background: "rgba(14, 13, 20, 0.92)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(20px) saturate(1.5)",
      WebkitBackdropFilter: "blur(20px) saturate(1.5)",
      boxShadow: "0 -4px 24px rgba(0,0,0,0.5), 0 -1px 0 rgba(123,97,255,0.15)",
    }}>
      <Link to="/" style={tabStyle(isHome)}>
        <span style={{ fontSize: 20 }}>🃏</span>
        Kartlarım
        {isHome && indicator}
      </Link>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <button onClick={onAddClick} className="tab-add-btn" style={{
          width: 52, height: 52, borderRadius: "50%", border: "none",
          background: "linear-gradient(135deg, #00c896, #00f5d4)",
          color: "#07060b", fontSize: 24, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 20px rgba(0,245,212,0.35), 0 4px 16px rgba(0,0,0,0.4)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          flexShrink: 0, marginBottom: 8,
        }} aria-label="Kart Ekle">
          📷
        </button>
      </div>

      <Link to="/ozet" style={tabStyle(isSummary)}>
        <span style={{ fontSize: 20 }}>📊</span>
        Özet
        {isSummary && indicator}
      </Link>
    </nav>
  );
}

/* ── Main App ── */

function CatalogueView({ scrollRef, children }) {
  useEffect(() => {
    if (scrollRef.current > 0) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollRef.current);
      });
    }
  }, []);
  return <>{children}</>;
}

export default function App() {
  const [cards, setCards] = useState(loadCards);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tümü");
  const [rarityFilter, setRarityFilter] = useState("Tümü");
  const [sortBy, setSortBy] = useState("rarity");
  const [sortDir, setSortDir] = useState("desc");
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)); } catch (_) {}
  }, [cards]);

  const filtered = useMemo(() => {
    let r = cards.filter((c) => {
      const q = search.toLowerCase();
      return (
        (!q || c.nameEN.toLowerCase().includes(q) || c.kartNo.includes(q)) &&
        (typeFilter === "Tümü" || c.type === typeFilter) &&
        (rarityFilter === "Tümü" || c.rarity === rarityFilter)
      );
    });
    const dir = sortDir === "asc" ? 1 : -1;
    r.sort((a, b) => {
      let cmp;
      if (sortBy === "rarity") {
        cmp = (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
      } else if (sortBy === "dmg1" || sortBy === "dmg2" || sortBy === "retreat") {
        cmp = (parseFloat(a[sortBy]) || 0) - (parseFloat(b[sortBy]) || 0);
      } else if (typeof a[sortBy] === "number") {
        cmp = a[sortBy] - b[sortBy];
      } else {
        cmp = String(a[sortBy]).localeCompare(String(b[sortBy]));
      }
      return cmp * dir;
    });
    return r;
  }, [cards, search, typeFilter, rarityFilter, sortBy, sortDir]);

  const toggle = (id) =>
    setCompareList((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : p));

  const handleDeleteCard = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setDeleteTarget(null);
  };

  const stats = useMemo(() => {
    const types = {};
    cards.forEach((c) => { types[c.type] = (types[c.type] || 0) + 1; });
    return {
      total: cards.length,
      copies: cards.reduce((s, c) => s + c.copies, 0),
      maxHP: Math.max(...cards.map((c) => c.hp)),
      totalValue: cards.reduce((s, c) => s + (c.marketValue || 0) * c.copies, 0),
      types,
    };
  }, [cards]);

  const catalogueContent = (
    <>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10, padding: "16px 28px 14px",
        background: "linear-gradient(180deg, rgba(7,6,11,0.92) 0%, rgba(7,6,11,0.85) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
          <img
            src={TCG_LOGO}
            alt="Pokémon Trading Card Game"
            style={{
              height: 48, width: "auto",
              filter: "drop-shadow(0 0 10px rgba(123,97,255,0.5)) drop-shadow(0 0 20px rgba(0,245,212,0.2))",
            }}
          />
          <div>
            <h1 style={{
              fontSize: 20, fontWeight: 700, margin: 0,
              fontFamily: "'Rajdhani', sans-serif",
              background: "linear-gradient(135deg, #e8e6f0, #7b61ff)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              letterSpacing: "0.02em", lineHeight: 1.1,
            }}>
              Kart Kataloğu
            </h1>
            <p style={{ margin: 0, color: "#5a566e", fontSize: 12 }}>
              Japonca/İngilizce Baskı —{" "}
              <span style={{ color: "#8b87a0" }}>{stats.total}</span> tekil{" · "}
              <span style={{ color: "#8b87a0" }}>{stats.copies}</span> toplam{" · "}
              Max HP: <span style={{ color: "#ff4d6d", fontWeight: 700 }}>{stats.maxHP}</span>{" · "}
              Koleksiyon: <span style={{ color: "#00f5d4", fontWeight: 700 }}>${stats.totalValue.toFixed(2)}</span>
            </p>
          </div>
        </div>
        <div className="type-filter-row" style={{ display: "flex", gap: 8, marginTop: 14, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: 4 }}>
          {Object.entries(stats.types).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
            const isActive = typeFilter === type;
            const t = typeColors[type];
            return (
              <span key={type} className={`type-chip ${isActive ? "active" : ""}`}
                onClick={() => setTypeFilter(typeFilter === type ? "Tümü" : type)}
                style={{
                  flexShrink: 0,
                  background: isActive ? `${t.bg}22` : "rgba(255,255,255,0.03)",
                  color: isActive ? t.bg : "#8b87a0",
                  borderColor: isActive ? `${t.bg}55` : "transparent",
                }}>
                {t?.emoji} {type} ({count})
              </span>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        position: "relative", zIndex: 1, padding: "12px 28px",
        display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(14,13,20,0.6)", backdropFilter: "blur(12px)",
      }}>
        <input className="holo-input" placeholder="&#x1F50D; Kart ara..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} />
        <select className="holo-select" value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}>
          <option value="Tümü">Tüm Nadirlikler</option>
          {Object.entries(rarityLabels).map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#8b87a0", whiteSpace: "nowrap" }}>Sırala:</span>
          <select className="holo-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="rarity">Nadirlik</option>
            <option value="kartNo">Kart No</option>
            <option value="hp">HP</option>
            <option value="nameEN">İsim</option>
            <option value="copies">Kopya</option>
            <option value="marketValue">Piyasa Değeri</option>
            <option value="type">Tip</option>
            <option value="stage">Aşama</option>
            <option value="dmg1">Saldırı 1 Hasar</option>
            <option value="dmg2">Saldırı 2 Hasar</option>
            <option value="weakness">Zayıflık</option>
            <option value="retreat">Geri Çekilme</option>
          </select>
          <button className="holo-select" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
            style={{ cursor: "pointer", minWidth: 38, textAlign: "center", padding: "6px 10px" }}
            title={sortDir === "asc" ? "Artan" : "Azalan"}>
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <button className={`btn-glow ${compareMode ? "active" : ""}`}
          onClick={() => { setCompareMode(!compareMode); setCompareList([]); }}>
          &#x2694; Karşılaştır{compareMode && compareList.length > 0 ? ` (${compareList.length}/4)` : ""}
        </button>
        {compareMode && compareList.length >= 2 && (
          <button className="btn-accent" onClick={() => setShowCompare(true)}>Göster &#x2192;</button>
        )}
        <button className="btn-emerald" onClick={() => setShowAdd(true)}>&#x1F4F7; Fotoğraf ile Ekle</button>
      </div>

      {/* Card Grid */}
      <div style={{ position: "relative", zIndex: 1, padding: "24px 28px" }}>
        <div style={{ fontSize: 12, color: "#5a566e", marginBottom: 14 }}>
          {filtered.length} kart gösteriliyor
        </div>
        {filtered.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "60px 20px", textAlign: "center",
          }}>
            <img
              src={TCG_LOGO}
              alt=""
              style={{
                width: 180, height: "auto", opacity: 0.15,
                filter: "grayscale(0.5)", marginBottom: 20,
                userSelect: "none", pointerEvents: "none",
              }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
              Aramanızla eşleşen kart bulunamadı.
            </p>
          </div>
        ) : (
          <div className="card-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 18,
          }}>
            {filtered.map((c, i) => (
              <CardTile key={c.id} card={c} compareMode={compareMode}
                isSelected={compareList.includes(c.id)} onToggle={toggle} index={i} scrollRef={scrollRef}
                onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </div>

      {showCompare && <CompareView cards={cards.filter((c) => compareList.includes(c.id))} onClose={() => setShowCompare(false)} />}
      <div className="bottom-tab-bar-spacer" />
    </>
  );

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <div className="grain-overlay" />
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at 20% 0%, rgba(123,97,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(0,245,212,0.04) 0%, transparent 50%)",
      }} />
      <Routes>
        <Route path="/" element={<CatalogueView scrollRef={scrollRef}>{catalogueContent}</CatalogueView>} />
        <Route path="/trainer/:trainerSlug" element={<TrainerDetail cards={cards} typeColors={typeColors} />} />
        <Route path="/ozet" element={<SummaryView stats={stats} />} />
      </Routes>
      <BottomTabBar onAddClick={() => setShowAdd(true)} />
      {showAdd && <PhotoUploadModal onClose={() => setShowAdd(false)} onAdd={(newCards) => setCards((p) => [...p, ...(Array.isArray(newCards) ? newCards : [newCards])])} nextId={Math.max(0, ...cards.map((c) => c.id)) + 1} />}
      {deleteTarget && <DeleteConfirmModal card={deleteTarget} onConfirm={handleDeleteCard} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}
