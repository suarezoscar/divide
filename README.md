# Divide

> Split expenses, settle up. 💸

Divide es una app web para dividir gastos entre grupos de personas. Crea un grupo, añade miembros, registra gastos compartidos y deja que la app calcule quién debe a quién con el mínimo de transacciones.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript |
| Build | Vite |
| Routing | React Router v7 |
| Backend | Firebase (Auth + Firestore) |
| Estilos | CSS Modules + design tokens |
| Iconos | Lucide React |
| QR | qrcode |
| Deploy | Netlify |
| Package manager | pnpm |

---

## Funcionalidades

### 🔐 Autenticación

- Registro con email y contraseña
- Inicio de sesión / cierre de sesión
- Sesión persistente (Firebase Auth)
- Rutas protegidas con redirect automático

### 👥 Grupos

- Crear un grupo con nombre, descripción y lista de miembros
- Ver todos tus grupos en el dashboard (tanto los que creaste como a los que te uniste)
- Añadir miembros a un grupo existente
- Navegar entre grupos con 3 pestañas: Gastos, Balances, Miembros

### 💸 Gastos

- Añadir un gasto con: descripción, importe total, quién pagó y fecha
- **Split equitativo**: el importe se reparte a partes iguales entre los miembros
- **Split personalizado**: cada miembro paga una cantidad distinta
- **Excluir miembros**: quita del split a quien no participó en ese gasto concreto (ej: 5 en el grupo, solo 3 cenaron)
- Historial de gastos ordenado por fecha
- Eliminar gastos

### ⚖️ Balances y deudas

- Cálculo automático del balance neto por miembro (dinero pagado − dinero debido)
- Indicador visual: verde = te deben, rojo = debes
- **Algoritmo de minimización de deudas**: calcula el mínimo número de transacciones necesarias para saldar todas las cuentas
- Registrar un pago entre miembros (marcar deuda como saldada)

### 🔗 Invitaciones

- **Enlace compartible**: URL única para invitar a otros al grupo
- **Código QR**: escanea y únete al instante
- **Código corto de 6 caracteres**: fácil de leer en voz alta o escribir (sin I/O/0/1 para evitar confusiones)
- **Unirse desde el dashboard**: introduce el código de invitación manualmente
- **Flujo para usuarios nuevos**: escanea QR → se registra → vuelve automáticamente al grupo
- **Reclamar miembro existente**: si ya apareces en la lista de miembros, puedes identificarte sin duplicar tu nombre ("Soy nuevo" / "Ya soy miembro")

### 🎨 Diseño

- Design system inspirado en [Glossar](https://www.awwwards.com/sites/glossar)
- Paleta: `#07819C` (teal) / `#F5F5F7` (fondo) / `#FFFFFF` (superficies)
- Tipografía: Inter (Google Fonts)
- Componentes UI reutilizables: Button, Input, Card, Modal, Avatar
- Mobile-first responsive
- Animaciones suaves en modales y transiciones

---

## Estructura del proyecto

```
src/
├── components/
│   ├── ui/          → Button, Input, Card, Modal, Avatar
│   ├── layout/      → Shell (layout principal + navbar)
│   ├── groups/      → InviteSection, JoinByCode
│   └── balances/    → BalanceSummary, SettlementList
├── pages/
│   ├── LoginPage        → /login
│   ├── DashboardPage    → /dashboard
│   ├── GroupDetailPage  → /group/:id
│   ├── AddExpensePage   → /group/:id/expense/new
│   └── JoinGroupPage    → /join/:id
├── hooks/
│   ├── useAuth.ts       → Firebase Auth context
│   ├── useGroups.ts     → CRUD grupos
│   ├── useExpenses.ts   → CRUD gastos
│   └── useBalances.ts   → cálculos de balances
├── services/
│   ├── firebase.ts      → init Firebase
│   ├── groups.ts        → Firestore: grupos
│   ├── expenses.ts      → Firestore: gastos
│   └── settlements.ts   → Firestore: pagos
├── types/index.ts       → Group, Member, Expense, Split, Settlement
├── utils/
│   ├── balances.ts      → algoritmo de minimización de deudas
│   └── format.ts        → formato de moneda y fechas
├── theme/tokens.ts      → colores, espaciado, tipografía, sombras
└── App.tsx              → router principal
```

---

## Firestore

### Colecciones

| Colección | Documento | Campos principales |
|-----------|-----------|-------------------|
| `groups` | `{groupId}` | `name`, `members[]`, `userIds[]`, `inviteCode`, `createdBy` |
| `expenses` | `{expenseId}` | `groupId`, `description`, `amount`, `paidBy`, `date`, `splits[]` |
| `settlements` | `{settlementId}` | `groupId`, `from`, `to`, `amount`, `date` |

### Reglas de seguridad

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=1:xxxx:web:xxxx
```

En Netlify, añade estas mismas variables en **Site settings → Environment variables**.

---

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev

# Build de producción
pnpm build

# Previsualizar build
pnpm preview
```

---

## Despliegue en Netlify

1. Conecta el repo a Netlify
2. Build command: `pnpm build`
3. Publish directory: `dist`
4. Añade las variables de entorno `VITE_FIREBASE_*`
5. El archivo `netlify.toml` ya incluye la configuración SPA necesaria

---

## AGENTS.md

El proyecto incluye [AGENTS.md](./AGENTS.md), una guía de buenas prácticas React (Vercel Engineering, enero 2026) con 40+ reglas de rendimiento para LLMs que trabajen en el código.
