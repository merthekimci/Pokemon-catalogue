// Per-Pokemon metadata: bio, lore, affiliations, friends, foes
// Keyed by card ID (number). Cards without an entry here will simply not show these sections.

export const pokemonMeta = {
  // === OT (GRASS) ===
  1: { // Gloom
    japaneseName: "クサイハナ · Kusaihana",
    bio: "Gloom, başından süzülen yapışkan, tatlı kokulu bir nectar ile tanınan Ot/Zehir tipi bir Pokemon'dur. Bu nectar çoğu insana dayanılmaz kötü kokarken, bir avuç kişi bu kokuyu çekici bulmaktadır.",
    lore: "Vileplume'a veya Bellossom'a evrimleşme potansiyeli taşıyan Gloom, Kanto bölgesinin nemli ormanlarında sıkça rastlanan bir Pokemon'dur. Eğitmenler arasında sabırlı yetiştiricilerin tercihi olarak bilinir.",
    affiliations: [
      { label: "Ot Ailesi", icon: "leaf", color: "#00c853" },
      { label: "Kanto Bölgesi", icon: "map-pin", color: "#0d9488" },
      { label: "Evrim Zinciri", icon: "sparkles", color: "#7b61ff" },
    ],
    friends: [{ cardId: 2, reason: "Ot Tipi" }],
    foes: [{ cardId: 10, reason: "Tip dezavantaji" }],
  },

  2: { // Vileplume
    japaneseName: "ラフレシア · Rafflesia",
    bio: "Vileplume, dünyanın en büyük yapraklarına sahip bir Ot/Zehir tipi Pokemon'dur. Dev çiçeğinden saçtığı zehirli polenler, etrafındaki canlıları uyuşturma gücüne sahiptir.",
    lore: "Gloom'dan evrimleşen Vileplume, tropikal ormanların hakimi olarak kabul edilir. Çiçeği ne kadar büyükse, o kadar güçlü polenler üretir. Yağmurdan sonra dans eden bir Vileplume görmek, şans getirdiğine inanılır.",
    affiliations: [
      { label: "Ot Ailesi", icon: "leaf", color: "#00c853" },
      { label: "Zehir Usta", icon: "sparkles", color: "#ab47bc" },
    ],
    friends: [{ cardId: 1, reason: "Ot Tipi" }],
    foes: [{ cardId: 10, reason: "Tip dezavantaji" }],
  },

  // === ATEŞ (FIRE) ===
  10: { // Charmander
    japaneseName: "ヒトカゲ · Hitokage",
    bio: "Charmander, kuyrugundaki alev ile tanınan bir Ateş tipi Pokemon'dur. Doğduğu andan itibaren kuyrugunda yanan alev, yaşam enerjisinin bir göstergesidir. Alev soğurse, bu Pokemon'un sağlık durumunun kötüleştiği anlamına gelir.",
    lore: "Kanto bölgesinin en popüler başlangıç Pokemon'larından biri olan Charmander, eğitmenler arasında cesareti ve sadakati ile bilinir. Profesör Oak tarafından yeni eğitmenlere verilen üç Pokemon'dan biridir. Zamanla Charmeleon'a ve ardından güçlü Charizard'a evrilen bu Pokemon, ateş tipi eğitmenlerin vazgeçilmez tercihidir.",
    affiliations: [
      { label: "Ateş Ailesi", icon: "flame", color: "#ff4444" },
      { label: "Kanto Başlangıç", icon: "map-pin", color: "#0d9488" },
      { label: "Evrim Zinciri", icon: "sparkles", color: "#7b61ff" },
    ],
    friends: [
      { cardId: 11, reason: "Evrim Zinciri" },
      { cardId: 1, reason: "Başlangıç Dostları" },
    ],
    foes: [
      { cardId: 24, reason: "Tip dezavantajı" },
    ],
  },

  11: { // Charmeleon
    japaneseName: "リザード · Lizardo",
    bio: "Charmeleon, savaş tutkusu yüksek ve agresif bir Ateş tipi Pokemon'dur. Güçlü rakipler buldukça kuyruk alevi daha parlak yanar ve mavi-beyaz bir ton alır.",
    lore: "Charmander'ın evrimi olan Charmeleon, eğitmenine itaat etmekte zorlanan vahşi bir doğaya sahiptir. Ancak güvenini kazanan eğitmenlere sonsuz sadakat gösterir. Charizard'a evrilmeye hazırlanan bu Pokemon, Kanto'nun en güçlü orta evre Pokemon'larından biridir.",
    affiliations: [
      { label: "Ateş Ailesi", icon: "flame", color: "#ff4444" },
      { label: "Evrim Zinciri", icon: "sparkles", color: "#7b61ff" },
    ],
    friends: [{ cardId: 10, reason: "Evrim Zinciri" }],
    foes: [{ cardId: 24, reason: "Tip dezavantajı" }],
  },

  15: { // Oricorio ex
    japaneseName: "オドリドリ · Odoridori",
    bio: "Oricorio, dans stilleriyle tipi değiştirebilen zarif bir Pokemon'dur. Ateş formu olan Baile Stili, İspanyol flamenko dansından ilham alır ve tutkulu hareketleriyle alevler saçar.",
    lore: "Alola bölgesinden gelen bu egzotik Pokemon, her adanın özel nektarını içerek farklı formlara bürünür. Savaş arenasında dansıyla hem estetik hem yıkıcı bir performans sergiler.",
    affiliations: [
      { label: "Ateş Ailesi", icon: "flame", color: "#ff4444" },
      { label: "Alola Bölgesi", icon: "map-pin", color: "#0d9488" },
    ],
    friends: [{ cardId: 10, reason: "Ateş Tipi" }],
    foes: [{ cardId: 23, reason: "Tip dezavantajı" }],
  },

  81: { // Reshiram
    japaneseName: "レシラム · Reshiram",
    bio: "Reshiram, Unova bölgesinin efsanevi Ateş/Ejderha tipi Pokemon'udur. Kuyruğundaki türbin benzeri organ, muazzam miktarda ısı üreterek atmosferi değiştirebilir.",
    lore: "Gerçeği arayan insanlara yardım ettiğine inanılan Reshiram, kardeşi Zekrom ile birlikte Unova'nın kuruluş efsanesinin merkezinde yer alır. İki kardeş arasındaki çatışma, bölgeyi ikiye bölen büyük savaşı başlatmıştır.",
    affiliations: [
      { label: "Ateş Ailesi", icon: "flame", color: "#ff4444" },
      { label: "Efsanevi", icon: "sparkles", color: "#ffd166" },
      { label: "Unova Bölgesi", icon: "map-pin", color: "#0d9488" },
    ],
    friends: [],
    foes: [],
  },

  90: { // Arcanine
    japaneseName: "ウインディ · Windie",
    bio: "Arcanine, Çin efsanelerindeki asil köpeklerden esinlenen görkemli bir Ateş tipi Pokemon'dur. 10.000 mil boyunca koşabilen bu Pokemon, hem sadakati hem hızıyla ünlüdür.",
    lore: "Kanto bölgesinde 'Efsanevi Pokemon' olarak sınıflandırılan nadir türlerden biri olan Arcanine, Blaine'in imza Pokemon'udur. Yelesi rüzgârda dalgalanan bu yüce yaratık, eğitmenine sonsuz bağlılık gösterir.",
    affiliations: [
      { label: "Ateş Ailesi", icon: "flame", color: "#ff4444" },
      { label: "Kanto Efsanesi", icon: "sparkles", color: "#ffd166" },
    ],
    friends: [{ cardId: 10, reason: "Ateş Tipi" }],
    foes: [{ cardId: 23, reason: "Tip dezavantajı" }],
  },

  // === SU (WATER) ===
  23: { // Suicune
    japaneseName: "スイクン · Suikun",
    bio: "Suicune, rüzgâr gibi esen ve suyun arılığını simgeleyen efsanevi bir Su tipi Pokemon'dur. Kirli suları bir bakışta arındırabildiğine inanılır.",
    lore: "Ecruteak Şehri'ndeki Pirinç Kulesi yangınında hayatını kaybeden üç Pokemon'dan biri olan Suicune, Ho-Oh tarafından diriltilmiştir. Johto bölgesi genelinde göl kenarlarında ve şelalelerde belirip kaybolan gizemli bir varlık olarak bilinir.",
    affiliations: [
      { label: "Su Ailesi", icon: "droplet", color: "#2196f3" },
      { label: "Efsanevi", icon: "sparkles", color: "#ffd166" },
      { label: "Johto Bölgesi", icon: "map-pin", color: "#0d9488" },
    ],
    friends: [{ cardId: 24, reason: "Su Tipi" }],
    foes: [{ cardId: 27, reason: "Tip dezavantajı" }],
  },

  24: { // Piplup
    japaneseName: "ポッチャマ · Pocchama",
    bio: "Piplup, Sinnoh bölgesinin gururlu ve inatçı Su tipi başlangıç Pokemon'udur. Küçük boyuna rağmen büyük bir özgüvene sahip olan bu penguen Pokemon, eğitmeninden yardım kabul etmekte zorlanır.",
    lore: "Dawn'ın ilk Pokemon'u olan Piplup, koordinatör gösterilerdeki zarafeti ve savaştaki kararlılığıyla tanınır. Empoleon'a kadar uzanan evrim zincirinin başlangıç noktasıdır.",
    affiliations: [
      { label: "Su Ailesi", icon: "droplet", color: "#2196f3" },
      { label: "Sinnoh Başlangıç", icon: "map-pin", color: "#0d9488" },
      { label: "Evrim Zinciri", icon: "sparkles", color: "#7b61ff" },
    ],
    friends: [
      { cardId: 26, reason: "Evrim Zinciri" },
    ],
    foes: [
      { cardId: 27, reason: "Tip dezavantajı" },
    ],
  },

  26: { // Empoleon ex
    japaneseName: "エンペルト · Emperte",
    bio: "Empoleon, Su/Çelik tipi bir Pokemon olup imparator penguenlerinden ilham alan görkemli bir görünüme sahiptir. Kanatlarındaki bıçak keskinliğindeki yüzgeçlerle savaşır.",
    lore: "Piplup'ın son evrimi olan Empoleon, Dawn'ın en güçlü Pokemon'udur. İmparator gibi duruşu ve çelik zırhı, onu hem yarışmalarda hem savaşta formidable bir rakip yapar.",
    affiliations: [
      { label: "Su Ailesi", icon: "droplet", color: "#2196f3" },
      { label: "Çelik Zırh", icon: "sparkles", color: "#78909c" },
      { label: "Evrim Zinciri", icon: "sparkles", color: "#7b61ff" },
    ],
    friends: [{ cardId: 24, reason: "Evrim Zinciri" }],
    foes: [{ cardId: 27, reason: "Tip dezavantajı" }],
  },

  // === ELEKTRİK (LIGHTNING) ===
  27: { // Boltund
    japaneseName: "パルスワン · Parusuan",
    bio: "Boltund, inanılmaz hızıyla bilinen bir Elektrik tipi Pokemon'dur. Bacaklarındaki kaslar elektrik enerjisi üreterek saatte 100 km'den fazla hıza ulaşmasını sağlar.",
    lore: "Galar bölgesinden gelen Boltund, sadakati ve enerjisiyle eğitmenler arasında popüler bir seçimdir. Yamper'dan evrimleşen bu Pokemon, Elektrik tipi uzmanların favorisi haline gelmiştir.",
    affiliations: [
      { label: "Elektrik Ailesi", icon: "zap", color: "#ffd600" },
      { label: "Galar Bölgesi", icon: "map-pin", color: "#0d9488" },
      { label: "Evrim Zinciri", icon: "sparkles", color: "#7b61ff" },
    ],
    friends: [],
    foes: [{ cardId: 90, reason: "Tip avantajı" }],
  },

  // === PSİŞİK (PSYCHIC) ===
  91: { // Gengar
    japaneseName: "ゲンガー · Gengar",
    bio: "Gengar, gölgelerden beslenen ve karanlıkta avlanan bir Hayalet/Zehir tipi Pokemon'dur. Odanın sıcaklığı aniden düşerse, yakınlarda bir Gengar olduğu söylenir.",
    lore: "Gastly'den Haunter'a, Haunter'dan Gengar'a uzanan evrim zincirinin zirvesi olan bu Pokemon, gece vakti en güçlü halindedir. Eğitmeniyle arasındaki bağ güçlendikçe şakaları daha zararsız hale gelir — ama asla tamamen durmaz.",
    affiliations: [
      { label: "Hayalet Ailesi", icon: "ghost", color: "#455a64" },
      { label: "Zehir Usta", icon: "sparkles", color: "#ab47bc" },
      { label: "Evrim Zinciri", icon: "sparkles", color: "#7b61ff" },
    ],
    friends: [],
    foes: [],
  },

  95: { // Scream Tail
    japaneseName: "テツノツツミ · Tetsuno Tsutsumi",
    bio: "Scream Tail, Jigglypuff'ın antik bir formu olduğu düşünülen gizemli bir Psişik tipi Pokemon'dur. Area Zero'nun derinliklerinde keşfedilmiş olup modern bilimin açıklayamadığı özellikler taşır.",
    lore: "Paldea bölgesinin Area Zero'sunda bulunan Paradoks Pokemon'larından biri olan Scream Tail, geçmişin bir yansıması mı yoksa başka bir boyutun ziyaretçisi mi olduğu hâlâ tartışılmaktadır.",
    affiliations: [
      { label: "Psişik Ailesi", icon: "sparkles", color: "#ab47bc" },
      { label: "Paradoks Pokemon", icon: "sparkles", color: "#ffd166" },
      { label: "Paldea Bölgesi", icon: "map-pin", color: "#0d9488" },
    ],
    friends: [],
    foes: [],
  },

  // === NORMAL ===
  60: { // Mega Lopunny ex
    japaneseName: "メガミミロップ · Mega Mimilop",
    bio: "Mega Lopunny, Mega Evrim ile Normal/Dövüş tipine dönüşen zarif ama yıkıcı bir Pokemon'dur. Kulak tüyleri geriye doğru sertleşerek savaş moduna girdiğinin işareti olur.",
    lore: "Sinnoh Şampiyonu Cynthia'nın koleksiyonundaki en güçlü Mega Pokemon'lardan biri olan Mega Lopunny, zarafet ve ham güç arasındaki dengeyi mükemmel bir şekilde temsil eder. 330 HP değeriyle koleksiyondaki en dayanıklı kartlardan biridir.",
    affiliations: [
      { label: "Mega Evrim", icon: "sparkles", color: "#7b61ff" },
      { label: "Dövüş Sanatı", icon: "fist", color: "#ff6d00" },
    ],
    friends: [],
    foes: [],
  },
};
