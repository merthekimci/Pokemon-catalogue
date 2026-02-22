const sp = (n) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${n}.png`;

// Test dataset: 8 representative cards covering types, rarities, stages, and special categories
export const initialCards = [
  // Ot (Grass), Common, 1. Aşama, with trainer
  { id:1, kartNo:"002/080", nameEN:"Gloom", type:"Ot", hp:70, stage:"1. Aşama", attack1:"침뿌리기 (Tükürmek)", dmg1:"20", attack2:"", dmg2:"", weakness:"Ateş ×2", retreat:"0", rarity:"C", ability:"", copies:3, img:sp(44), marketValue:0.15, trainer:"ash-ketchum" },
  // Ateş (Fire), RR, Temel ex, with ability
  { id:15, kartNo:"018/080", nameEN:"Oricorio ex", type:"Ateş", hp:190, stage:"Temel ex", attack1:"불꽃날개 (Flame Wing)", dmg1:"110", attack2:"", dmg2:"", weakness:"Su ×2", retreat:"1", rarity:"RR", ability:"익사이팅 터보 (Exciting Turbo)", copies:1, img:sp(741), marketValue:8.00, trainer:"ash-ketchum" },
  // Su (Water), Rare, Temel
  { id:23, kartNo:"026/080", nameEN:"Suicune", type:"Su", hp:130, stage:"Temel", attack1:"크리스탈풀 (Crystal Pool)", dmg1:"30+", attack2:"", dmg2:"", weakness:"Elektrik ×2", retreat:"1", rarity:"R", ability:"", copies:1, img:sp(245), marketValue:5.00, trainer:"lance" },
  // Elektrik (Lightning), Holo Rare (M), 1. Aşama
  { id:27, kartNo:"031/080", nameEN:"Boltund", type:"Elektrik", hp:130, stage:"1. Aşama", attack1:"일렉트릭런 (Elektrik Koşusu)", dmg1:"70+", attack2:"", dmg2:"", weakness:"Dövüş ×2", retreat:"2", rarity:"M", ability:"", copies:3, img:sp(836), marketValue:2.00, trainer:"ash-ketchum" },
  // Psişik (Psychic), Uncommon
  { id:95, kartNo:"-", nameEN:"Scream Tail", type:"Psişik", hp:90, stage:"Temel", attack1:"Supportive Singing", dmg1:"-", attack2:"Hyper Voice", dmg2:"40", weakness:"Çelik ×2", retreat:"-30", rarity:"U", ability:"", copies:1, img:sp(10265), marketValue:0.75, trainer:"ash-ketchum" },
  // Normal, RR, Mega ex
  { id:60, kartNo:"057/080", nameEN:"Mega Lopunny ex", type:"Normal", hp:330, stage:"Mega ex", attack1:"질풍찌르기 (Rüzgar Sapması)", dmg1:"60+", attack2:"스파이크호퍼 (Diken Sıçrayış)", dmg2:"160", weakness:"Dövüş ×2", retreat:"0", rarity:"RR", ability:"", copies:1, img:sp(428), marketValue:12.00, trainer:"cynthia" },
  // Ateş (Fire), SR (Secret Rare)
  { id:81, kartNo:"087/080", nameEN:"Reshiram", type:"Ateş", hp:130, stage:"Temel", attack1:"화염 (Flame)", dmg1:"30", attack2:"버닝플레어 (Burning Flare)", dmg2:"240", weakness:"Su ×2", retreat:"2", rarity:"SR", ability:"", copies:1, img:sp(643), marketValue:20.00, trainer:"n" },
  // Destekçi (Trainer/Supporter), no trainer link
  { id:77, kartNo:"102/080", nameEN:"Heat Burner (SR)", type:"Destekçi", hp:0, stage:"Eşya", attack1:"", dmg1:"", attack2:"", dmg2:"", weakness:"-", retreat:"-", rarity:"SR", ability:"Secret Rare Eşya", copies:1, img:"", marketValue:25.00, trainer:null },
];
