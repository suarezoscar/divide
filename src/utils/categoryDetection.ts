import Fuse from "fuse.js";
import {
  FOOD_KEYWORDS,
  TRANSPORT_KEYWORDS,
  HOUSING_KEYWORDS,
  LEISURE_KEYWORDS,
  SHOPPING_KEYWORDS,
  NIGHTLIFE_KEYWORDS,
} from "./categoryKeywords";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  nightlife: NIGHTLIFE_KEYWORDS,
  food: FOOD_KEYWORDS,
  transport: TRANSPORT_KEYWORDS,
  housing: HOUSING_KEYWORDS,
  leisure: LEISURE_KEYWORDS,
  shopping: SHOPPING_KEYWORDS,
};

/** Flat search database for Fuse: every keyword paired with its category. */
const fuseDb = Object.entries(CATEGORY_KEYWORDS).flatMap(([cat, kws]) =>
  kws.map((kw) => ({ keyword: kw.toLowerCase(), category: cat }))
);

/** Fuse instance — initialised once at module level, never rebuilt. */
const fuse = new Fuse(fuseDb, {
  keys: ["keyword"],
  threshold: 0.35,
  includeScore: true,
});

/** Words ignored during fuzzy search to prevent false positives. */
/**
 * Stop words: functional/grammatical words that should never influence
 * category detection.  Grouped by language for clarity.
 *
 * Words that ARE valid expense keywords (e.g. "bar", "pan", "gas",
 * "mar", "sol", "vino", "copa", "pipa") are intentionally excluded.
 */
const STOP_WORDS = new Set([
  // ── Spanish ──────────────────────────────────────────────────
  // Articles & determiners
  "el", "la", "lo", "los", "las", "un", "una", "unos", "unas",
  "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas",
  "aquel", "aquella", "aquellos", "aquellas",
  // Prepositions
  "a", "ante", "bajo", "cabe", "con", "contra", "de", "desde",
  "durante", "en", "entre", "hacia", "hasta", "mediante",
  "para", "por", "segun", "según", "sin", "so", "sobre", "tras",
  // Conjunctions
  "y", "e", "ni", "o", "u", "pero", "mas", "sino", "aunque",
  "porque", "pues", "mientras", "que", "como", "cual", "cuando",
  "donde", "segun", "según",
  // Pronouns
  "yo", "me", "mi", "ti", "te", "el", "ella", "ello", "se",
  "nos", "os", "les", "sus",
  // Common verb forms (auxiliary / non-category)
  "he", "has", "ha", "han", "haya", "hayas", "hayan",
  "habra", "habrá", "habria", "habría", "habre", "habré",
  "ser", "soy", "eres", "es", "somos", "sois", "son",
  "sea", "seas", "seamos", "seais", "seáis", "sean",
  "era", "eras", "eramos", "éramos", "erais", "eran",
  "fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron",
  "fuera", "fueras", "fueramos", "fuéramos", "fuerais", "fueran",
  "estoy", "estas", "estás", "esta", "está", "estamos",
  "estais", "estáis", "estan", "están",
  "estaba", "estabas", "estabamos", "estábamos",
  "estuve", "estuviste", "estuvo", "estuvimos",
  "tener", "tengo", "tienes", "tiene", "tenemos", "tienen",
  "tuve", "tuviste", "tuvo", "tuvimos", "tuvieron",
  "hacer", "hago", "haces", "hace", "hacemos", "hacen",
  "hice", "hiciste", "hizo", "hicimos", "hicieron",
  "poder", "puedo", "puedes", "puede", "podemos", "pueden",
  "pude", "pudiste", "pudo", "pudimos", "pudieron",
  "poner", "pongo", "pones", "pone", "ponemos", "ponen",
  "puse", "pusiste", "puso", "pusimos", "pusieron",
  "saber", "sé", "sabes", "sabe", "sabemos", "saben",
  "supe", "supiste", "supo", "supimos", "supieron",
  "querer", "quiero", "quieres", "quiere", "queremos", "quieren",
  "quise", "quisiste", "quiso", "quisimos", "quisieron",
  "decir", "digo", "dices", "dice", "decimos", "dicen",
  "dije", "dijiste", "dijo", "dijimos", "dijeron",
  "dar", "doy", "das", "da", "damos", "dan",
  "di", "diste", "dio", "dimos", "dieron",
  "ir", "voy", "vas", "va", "vamos", "van",
  "iba", "ibas", "ibamos", "íbamos", "ibais", "iban",
  // Adverbs & other functionals
  "no", "si", "sí", "tambien", "también", "tampoco",
  "ya", "aun", "aún", "todavia", "todavía",
  "siempre", "nunca", "jamas", "jamás",
  "aqui", "aquí", "alli", "allí", "alla", "allá", "ahi", "ahí",
  "ahora", "hoy", "ayer", "manana", "mañana",
  "pronto", "tarde", "temprano", "despues", "después",
  "luego", "antes", "dentro", "fuera",
  "arriba", "abajo", "cerca", "lejos",
  "asi", "así", "bien", "mal",
  "apenas", "casi", "acaso", "quizas", "quizás",
  "mucho", "poca", "poco", "muy", "bastante", "demasiado",
  "algo", "nada", "alguien", "nadie",
  "cada", "todo", "toda", "todos", "todas",
  "mismo", "misma", "mismos", "mismas",
  "otro", "otra", "otros", "otras",
  "tan", "tanto", "tanta", "tantos", "tantas",
  "mas", "más", "menos", "ademas", "además",
  "incluso", "solo", "solo", "sólo", "solamente",
  "justo", "precisamente", "seguro", "claro", "vale",
  "tal", "tales",

  // ── Galician ──────────────────────────────────────────────────
  // Articles, prepositions & conjunctions (3+ letters)
  "ata", "baixo", "dende", "mais", "mais",
  "aínda", "inda", "mentres",
  "cando", "onde", "onte", "hoxe",
  "tamen", "tamén", "tampouco",
  "sempre", "nunca", "quizais",
  "moito", "pouco",
  "alguen", "alguén", "ninguen", "ninguén",
  "cada", "todo", "mesmo", "outro",
  "asi", "así", "xa", "ben", "mal",
  "case", "quizais",
  "aquel", "aquelas", "aqueles",

  // ── English ───────────────────────────────────────────────────
  // Determiners
  "the", "this", "that", "these", "those",
  "some", "any", "every", "each", "all", "both",
  "few", "many", "much", "more", "most", "such",
  // Prepositions
  "about", "above", "across", "after", "against", "along",
  "among", "around", "at", "before", "behind", "below",
  "beneath", "beside", "between", "beyond", "by",
  "despite", "down", "during", "except", "for", "from",
  "in", "inside", "into", "near", "of", "on", "onto",
  "out", "outside", "over", "through", "throughout",
  "to", "toward", "towards", "under", "underneath",
  "until", "up", "upon", "with", "within", "without",
  // Conjunctions
  "and", "but", "or", "nor", "yet", "so",
  "because", "since", "although", "though",
  "while", "whereas", "if", "unless",
  "once", "than", "that", "whether",
  "when", "where", "how", "why",
  "what", "which", "who", "whom", "whose",
  // Pronouns
  "i", "you", "he", "she", "it", "we", "they",
  "me", "him", "her", "us", "them",
  "my", "your", "his", "its", "our", "their",
  "mine", "yours", "hers", "ours", "theirs",
  "myself", "yourself", "himself", "herself", "itself",
  "ourselves", "yourselves", "themselves",
  // Common verbs (auxiliary / non-category)
  "am", "is", "are", "was", "were",
  "be", "been", "being",
  "have", "has", "had", "having",
  "do", "does", "did", "doing",
  "will", "would", "shall", "should",
  "may", "might", "must", "can", "could",
  "need", "dare", "ought",
  "get", "gets", "got", "gotten",
  "make", "makes", "made",
  "take", "takes", "took", "taken",
  "come", "comes", "came", "come",
  "see", "sees", "saw", "seen",
  "know", "knows", "knew", "known",
  "think", "thinks", "thought",
  "want", "wants", "wanted",
  "give", "gives", "gave", "given",
  "use", "uses", "used",
  "say", "says", "said",
  "find", "finds", "found",
  "tell", "tells", "told",
  "ask", "asks", "asked",
  "work", "works", "worked",
  "call", "calls", "called",
  // Adverbs & other functionals
  "not", "no", "never",
  "always", "sometimes", "often", "usually",
  "here", "there", "everywhere",
  "now", "then", "today", "tonight",
  "already", "still", "yet", "again",
  "just", "almost", "nearly",
  "very", "quite", "too", "really",
  "also", "only", "even", "well",
  "ago", "away", "back",
]);

/** Normalize: lowercase, remove accents, split into words. */
function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[\s,.;:!?]+/)
    .filter(Boolean);
}

/**
 * Detect category from description text using fuzzy search (Fuse.js).
 *
 * Algorithm:
 *  1. Exact multi-word match (more reliable for phrases like "escape room").
 *  2. Fuzzy per-word search against the full keyword database.
 *
 * Returns category ID or `null` if no match is found.
 */
export function detectCategory(text: string): string | null {
  if (!text?.trim()) return null;

  const normalized = normalize(text);
  if (normalized.length === 0) return null;

  const lowerText = text.toLowerCase();

  // Phase 1: exact multi-word keywords (more specific, e.g. "escape room")
  for (const { keyword, category } of fuseDb) {
    if (keyword.includes(" ") && lowerText.includes(keyword)) {
      return category;
    }
  }

  // Phase 2: fuzzy per-word
  for (const word of normalized) {
    if (STOP_WORDS.has(word) || word.length <= 2) continue;
    const results = fuse.search(word);
    if (results.length > 0) {
      return results[0].item.category;
    }
  }

  return null;
}
