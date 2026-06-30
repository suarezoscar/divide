// Comida, supermercado, restaurantes, delivery, bebidas, cocina
// Canonical form: unaccented (Fuse.js + normalize se encargan)
export const FOOD_KEYWORDS: string[] = [
  // ── Comidas básicas ──────────────────────────────────────────────
  // ES
  "cena", "cenar", "comida", "comer", "almuerzo", "almorzar", "desayuno", "desayunar",
  "aperitivo", "picar", "tapear", "brunch", "buffet", "bufet", "autoservicio",
  // EN
  "dinner", "lunch", "breakfast", "brunch", "meal", "eat", "dine", "snack",
  // GL
  "cea", "cear", "xantar", "almorzo", "almorzar",

  // ── Restaurantes ─────────────────────────────────────────────────
  // ES
  "restaurante", "restaurant", "bar", "cafeteria", "cafe",
  "tasca", "venta", "meson", "asadero",
  "freiduria", "marisqueria", "hamburgueseria", "creperia",
  "heladeria", "churreria", "pasticceria",
  "osteria", "trattoria", "bodegon", "taberna", "cantina",
  "comedor", "fondita", "puestos",
  // EN
  "restaurant", "cafe", "diner", "bistro", "tavern", "deli", "buffet",
  "eatery", "food court", "cafeteria", "canteen",
  // GL
  "taberna", "meson", "tasca", "bar", "cafeteria",

  // ── Tapas / raciones ─────────────────────────────────────────────
  // ES
  "tapa", "raciones", "pincho", "montadito", "banderilla", "gilda",
  "menu", "carta", "plato", "racion",
  "bocadillo", "bocata", "sandwich",
  // EN
  "tapas", "appetizer", "starter", "main course", "dessert", "menu",
  // GL
  "tapas", "pincho", "bocado",

  // ── Fast food ────────────────────────────────────────────────────
  // ES
  "burger", "hamburguesa", "perrito", "hotdog", "perro caliente",
  "patata", "fritas", "bravas", "croquetas", "ensalada",
  "mcdonalds", "burgerking", "kfc", "tacobell", "dominos", "domino's",
  "pizzahut", "telepizza", "papajohns", "papajohn's",
  "vips", "ginos", "rodilla", "pansandcompany", "100 montaditos", "la sureña",
  // EN
  "fast food", "fries", "chips", "nuggets", "wrap", "kebab",
  "mcdonald's", "burger king", "kfc", "subway",
  // GL
  "hamburguesa", "patacas fritas", "cachorro", "perrito",

  // ── Cocina internacional ─────────────────────────────────────────
  // ES
  "pizza", "pizzeria", "italiano", "italiana", "pasta", "lasana",
  "sushi", "japones", "ramen", "yakisoba", "gyoza", "nigiri", "maki",
  "chino", "china", "arroz", "wok", "dimsum", "rollito", "primavera", "fideos",
  "mexicano", "mexicana", "taco", "burrito", "nachos", "guacamole", "fajita", "quesadilla",
  "indio", "india", "curry", "tikka", "masala", "naan", "samosa",
  "kebab", "turco", "falafel", "hummus", "shawarma", "doner",
  "thai", "tailandes", "pad thai", "vietnamita", "pho",
  "coreano", "coreana", "bibimbap", "kimchi", "bulgogi", "kbbq",
  "griego", "griega", "musaka", "tzatziki", "souvlaki", "feta",
  "marroqui", "cuscus", "tajin", "pastela", "harira",
  "etiope", "injera", "brasileno", "brasilena", "feijoada", "rodizio",
  // EN
  "italian", "chinese", "japanese", "mexican", "indian", "thai",
  "sushi", "pizza", "pasta", "burger",
  // GL
  "italiano", "chino", "xapones", "mexicano",

  // ── Cocina española ──────────────────────────────────────────────
  // ES
  "cocido", "potaje", "lentejas", "garbanzos", "fabada", "migas", "gazpacho",
  "salmorejo", "ajo blanco", "pisto", "tortilla", "cachopo", "callos", "caracoles",
  "rabo de toro", "cochinillo", "secreto", "presa iberica",
  "pan con tomate", "pan tumaca", "butifarra", "fuet",
  "pimientos de padron", "huevos rotos", "setas", "revuelto",
  "merluza", "bacalao", "bonito", "anchoas",
  "pulpo a la gallega", "zamburinas", "vieiras",
  "centollo", "necora", "bogavante", "langosta",
  "cabrito", "lechazo", "cordero lechal", "conejo", "perdiz", "codorniz",
  "foie", "piquillos", "caballa",
  "pescaito", "fritura", "espeto", "sardinas", "boquerones", "calamares",
  "chipirones", "pulpo", "gambas", "langostinos", "quisquilla", "cigalas",
  "almejas", "mejillones", "navajas", "berberechos", "ostras", "percebes",
  "jamon", "serrano", "iberico", "bellota", "cecina",
  "lomo", "chorizo", "salchichon", "sobrasada", "morcilla",
  "queso", "manchego", "curado", "semicurado", "fresco", "cabra", "oveja",
  "aceituna", "oliva", "encurtido",
  "barbacoa", "bbq", "parrillada", "picnic", "asado", "paella", "fideua",
  "marisco", "pescado", "carne", "chuleton", "entrecot", "solomillo",
  // GL
  "polbo", "lacon", "filloa", "chourizo", "caldo", "empanada",
  "orella", "raxo", "zetas", "pementos", "froita", "leite", "queixo",
  "pan", "auga", "cebolas", "patacas", "lombarda",

  // ── Cocina latina ────────────────────────────────────────────────
  // ES
  "arepa", "empanada", "ceviche", "causa", "tiradito", "anticucho",
  "choripan", "milanesa", "alfajor", "mate",
  "pupusa", "tamal", "mole", "pozole", "enchilada", "tostada", "flauta",
  "sope", "huarache", "carnitas", "cochinita", "pibil",
  "ajiaco", "bandeja paisa", "sancocho", "mofongo", "tostones", "maduros",
  "yuca", "platano", "frijoles", "porotos", "habichuelas",

  // ── Bebidas no alcohólicas ───────────────────────────────────────
  // ES
  "refresco", "cocacola", "coca", "cola", "fanta", "sprite", "nestea", "agua", "zumo",
  // EN
  "soda", "pop", "soft drink", "juice", "water", "coffee", "tea", "milkshake",
  // GL
  "refrixerante", "zume", "auga", "cafe", "te",

  // ── Panadería / postres ──────────────────────────────────────────
  // ES
  "pan", "croissant", "cruasan", "napolitana", "bolleria",
  "churros", "porras", "gofre", "crepe", "tortita", "pancake",
  "postre", "helado", "tarta", "pastel", "chocolate", "dulce", "galleta", "flan",
  "natillas", "brownie", "tiramisu",
  // EN
  "bread", "pastry", "cake", "ice cream", "cookie", "dessert", "sweet",
  // GL
  "pan", "pastel", "torta", "helado", "chocolate", "doces",

  // ── Supermercado ─────────────────────────────────────────────────
  // ES
  "super", "mercadona", "carrefour", "lidl", "aldi", "dia", "compra", "despensa",
  "nevera", "congelado", "preparado", "eroski", "alcampo", "consum", "ahorramas",
  "hipercor", "el corte ingles",
  "fruta", "verdura", "mercado", "fruteria",
  "naranja", "manzana", "pera", "uva", "fresa", "melon", "sandia",
  "cereza", "kiwi", "mango", "papaya", "maracuya", "aguacate", "palta",
  "tomate", "lechuga", "cebolla", "ajo", "pimiento", "zanahoria", "patata",
  "calabacin", "berenjena", "esparrago", "espinaca", "brocoli",
  // EN
  "supermarket", "grocery", "groceries", "costco", "walmart", "tesco",
  "sainsbury", "asda", "waitrose", "morrisons", "whole foods", "trader joe's",
  "aldi", "lidl",
  // GL
  "supermercado", "compra", "mercado", "feira", "froitas", "verduras",

  // ── Delivery ─────────────────────────────────────────────────────
  // ES
  "delivery", "glovo", "ubereats", "justeat", "deliveroo", "rappi", "pedidosya",
  "domicilio", "pedido", "encargar", "takeaway", "take away",
  // EN
  "takeout", "takeaway", "food delivery", "doordash", "grubhub",
  "uber eats", "just eat", "deliveroo",
  // GL
  "recolleita", "levar", "domicilio",

  // ── Menaje / cocina ──────────────────────────────────────────────
  // ES
  "sarten", "cacerola", "cazuela", "puchero", "olla expres",
  "batidora", "thermomix", "tupper", "tupperware", "fiambrera",
  "papel aluminio", "film transparente", "servilleta", "mantel",
  "estofado", "guiso", "ropa vieja", "caldero", "caldereta", "marmita",
  // EN
  "kitchen", "cookware", "pan", "pot", "utensils",
  // GL
  "cocina", "tarteira", "potas",
];
