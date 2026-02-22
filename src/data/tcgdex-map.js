// TCGdex Card Image Mapping
// Maps card.id → actual physical card scan URL from TCGdex API

const me02 = (n) => `https://assets.tcgdex.net/en/me/me02/${n}/high.png`;
const sv04 = (n) => `https://assets.tcgdex.net/en/sv/sv04/${n}/high.png`;
const sv01 = (n) => `https://assets.tcgdex.net/en/sv/sv01/${n}/high.png`;
const sv02 = (n) => `https://assets.tcgdex.net/en/sv/sv02/${n}/high.png`;
const sv03 = (n) => `https://assets.tcgdex.net/en/sv/sv03/${n}/high.png`;
const sv035 = (n) => `https://assets.tcgdex.net/en/sv/sv03.5/${n}/high.png`;
const sv05 = (n) => `https://assets.tcgdex.net/en/sv/sv05/${n}/high.png`;
const sv06 = (n) => `https://assets.tcgdex.net/en/sv/sv06/${n}/high.png`;
const sv065 = (n) => `https://assets.tcgdex.net/en/sv/sv06.5/${n}/high.png`;
const sv085 = (n) => `https://assets.tcgdex.net/en/sv/sv08.5/${n}/high.png`;
const swsh = (set, n) => `https://assets.tcgdex.net/en/swsh/${set}/${n}/high.png`;
const sm = (set, n) => `https://assets.tcgdex.net/en/sm/${set}/${n}/high.png`;
const xy = (set, n) => `https://assets.tcgdex.net/en/xy/${set}/${n}/high.png`;

export const tcgdexImageMap = {
  // === OT (GRASS) ===
  1:  me02("002"),    // Gloom
  2:  me02("003"),    // Vileplume
  3:  me02("005"),    // Lotad
  4:  me02("006"),    // Lombre
  5:  me02("007"),    // Ludicolo
  6:  me02("008"),    // Genesect
  7:  sv05("006"),    // Shroomish (not in ME02, use SV05)
  8:  me02("047"),    // Brambleghast
  9:  sv04("121"),    // Morpeko (not in ME02, use SV04)
  80: me02("053"),    // Flygon

  // === ATEŞ (FIRE) ===
  10: me02("011"),    // Charmander
  11: me02("012"),    // Charmeleon
  12: me02("014"),    // Moltres
  13: sv04("023"),    // Fuecoco (not in ME02, use SV04)
  14: sv04("024"),    // Crocalor (not in ME02, use SV04)
  15: me02("018"),    // Oricorio ex
  16: sv05("093"),    // Rolycoly (not in ME02, use SV05)
  17: sv01("038"),    // Skeledirge (ME02-020 is Ceruledge, not Skeledirge)
  81: me02("017"),    // Reshiram (SR)
  90: swsh("swsh2", "28"),  // Arcanine
  96: sm("sm5", "18"),      // Magmar
  99: sv03("037"),          // Lampent

  // === SU (WATER) ===
  18: me02("021"),    // Seel
  19: me02("022"),    // Dewgong
  20: me02("023"),    // Swinub
  21: me02("024"),    // Piloswine
  22: me02("025"),    // Mamoswine
  23: me02("026"),    // Suicune
  24: me02("027"),    // Piplup
  25: me02("028"),    // Prinplup
  26: me02("070"),    // Empoleon ex

  // === ELEKTRİK (LIGHTNING) ===
  27: me02("031"),    // Boltund
  28: me02("033"),    // Pawmo
  29: me02("034"),    // Pawmot
  82: me02("034"),    // Pawmot (Stage 2, same card)

  // === PSİŞİK (PSYCHIC) ===
  40: me02("035"),    // Misdreavus
  41: swsh("swsh11", "079"), // Comfey (not in ME02)
  42: me02("045"),    // Zacian
  43: swsh("swsh2", "84"),   // Hattrem (not in ME02)
  44: sv03("012"),           // Trevenant (not in ME02)
  91: swsh("swsh6", "57"),   // Gengar
  93: swsh("swsh9", "054"),  // Clefable
  94: sv065("073"),          // Fezandipiti
  95: sv04("086"),           // Scream Tail
  100: sv04("077"),          // Pumpkaboo

  // === DÖVÜŞ (FIGHTING) ===
  30: me02("048"),    // Paldean Tauros
  31: me02("049"),    // Gligar
  32: me02("050"),    // Gliscor
  33: me02("051"),    // Trapinch
  34: me02("052"),    // Vibrava
  92: sv035("027"),   // Sandshrew

  // === KARANLIK (DARK) ===
  45: sv02("133"),    // Sneasel (not in ME02)
  46: swsh("swsh10", "093"), // Sneasler (not in ME02)
  47: me02("060"),    // Carvanha
  48: me02("062"),    // Seviper
  49: sv02("114"),    // Croagunk (not in ME02)
  50: swsh("swsh1", "122"),  // Drapion (not in ME02)
  51: swsh("swsh1", "122"),  // Drapion Stage 1 (same image)
  52: me02("067"),    // Toxel
  53: me02("068"),    // Toxtricity
  83: sv03("136"),    // Darkrai
  84: me02("061"),    // Mega Sharpedo ex (IS in ME02!)
  97: sv05("105"),    // Poochyena

  // === ÇELİK (STEEL) ===
  55: me02("071"),    // Bronzor
  56: me02("072"),    // Bronzong
  57: me02("073"),    // Togedemaru
  58: me02("074"),    // Duraludon
  59: me02("075"),    // Archaludon
  85: sv04("158"),    // Iron Jugulis

  // === NORMAL ===
  60: me02("084"),    // Mega Lopunny ex
  61: me02("076"),    // Jigglypuff
  62: me02("077"),    // Wigglytuff
  63: me02("078"),    // Aipom
  64: me02("079"),    // Ambipom
  65: me02("080"),    // Smeargle
  66: me02("081"),    // Zigzagoon
  67: swsh("swsh3.5", "37"), // Obstagoon (not in ME02)
  68: me02("083"),    // Buneary
  69: me02("080"),    // Smeargle (AR) — same base card
  86: sv05("015"),    // Whimsicott (not in ME02)
  98: xy("xy0", "25"),       // Farfetch'd

  // === DESTEKÇİ (TRAINER/ITEM/STADIUM) ===
  70: me02("087"),    // Dawn (Supporter)
  71: me02("091"),    // Jumbo Ice Cream (Item)
  72: me02("086"),    // Heat Burner / Blowtorch (Item)
  73: me02("093"),    // Sacred Charm (Tool)
  74: me02("089"),    // Ball Player / Firebreather (Supporter)
  75: me02("090"),    // Blaine's Strategy / Grimsley's Move (Supporter)
  76: me02("088"),    // Dizzying Valley (Stadium)
  77: me02("117"),    // Heat Burner SR / Blowtorch SR
  // 101: Big Balloon — not in ME02, no good match found
};

export function resolveCardImage(card) {
  return tcgdexImageMap[card.id] || card.img || "";
}
