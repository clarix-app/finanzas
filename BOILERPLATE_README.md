# 🚀 SaaS Boilerplate — Dashboard Multi-País

Stack: React + TypeScript + Vite + Tailwind + shadcn/ui + Supabase + Netlify

## 📁 Estructura

```
src/
├── lib/
│   ├── supabase.ts          ← Cliente Supabase (cambiar URL y KEY)
│   ├── calculations.ts      ← Helpers de formato y cálculo
│   └── utils.ts             ← Utilidades generales
├── context/
│   ├── AuthContext.tsx      ← Sesión de usuario
│   └── AppContext.tsx       ← Estado global (mes, año, país)
├── hooks/
│   ├── useDailyRecords.ts   ← CRUD registros diarios ← NÚCLEO
│   ├── useUsdtPurchases.ts  ← Widget $$$ por mes/país
│   ├── useCurrencyConfig.ts ← Tasa de cambio
│   └── useProducts.ts       ← Productos/categorías
├── components/
│   ├── auth/AuthGate.tsx    ← Protección de rutas
│   ├── dashboard/           ← KPICard, DayRow, AddRecordModal
│   ├── layout/              ← AppLayout, AppSidebar, AppHeader
│   └── UsdtWidget.tsx       ← Widget editable $$$ 
├── pages/
│   ├── LoginPage.tsx        ← Auth
│   ├── DashboardPage.tsx    ← PÁGINA PRINCIPAL
│   ├── GlobalPage.tsx       ← Vista todos los países
│   ├── ImportPage.tsx       ← Importar Excel
│   └── ConfigPage.tsx       ← Configuración
└── types/index.ts           ← Tipos TypeScript
```

## 🗄 Supabase — Tablas requeridas

```sql
-- 1. Perfiles de usuario
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  plan TEXT DEFAULT 'pro',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Productos / categorías
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  price_usd NUMERIC,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Registros diarios ← NÚCLEO DE TODO
CREATE TABLE daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  product_id UUID REFERENCES products(id),
  date DATE,
  revenue_original NUMERIC DEFAULT 0,
  ad_spend_original NUMERIC DEFAULT 0,
  variable_cost_original NUMERIC DEFAULT 0,
  currency_code TEXT DEFAULT 'USD',
  revenue_usd NUMERIC DEFAULT 0,
  ad_spend_usd NUMERIC DEFAULT 0,
  variable_cost_usd NUMERIC DEFAULT 0,
  gross_profit_usd NUMERIC DEFAULT 0,
  net_profit_usd NUMERIC DEFAULT 0,
  roas NUMERIC DEFAULT 0,
  margin_pct NUMERIC DEFAULT 0,
  units_sold INTEGER DEFAULT 0,
  notes TEXT,
  country TEXT DEFAULT 'CL',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Configuración de moneda
CREATE TABLE currency_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  currency_code TEXT,
  rate_to_usd NUMERIC
);

-- 5. Widget $$$ por mes/país
CREATE TABLE usdt_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  year INTEGER,
  month INTEGER,
  country TEXT,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month, country)
);

-- Desactivar RLS (app de un solo usuario)
ALTER TABLE daily_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE currency_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE usdt_purchases DISABLE ROW LEVEL SECURITY;

-- Foreign key
ALTER TABLE daily_records 
ADD CONSTRAINT daily_records_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id);
```

## ⚙️ Setup paso a paso

### 1. Clonar y configurar
```bash
git clone <repo>
npm install
```

### 2. Configurar Supabase
Editar `src/lib/supabase.ts`:
```ts
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co'
const SUPABASE_ANON_KEY = 'TU_ANON_KEY'
```

### 3. Crear usuario en Supabase
Authentication → Users → Add user → Create new user

### 4. Ejecutar SQL de tablas
Copiar y pegar el SQL de arriba en Supabase SQL Editor

### 5. Build y deploy
```bash
npm run build
# Subir carpeta dist/ a Netlify arrastrando
```

## 🌍 Países disponibles
Editar en `src/context/AppContext.tsx`:
```ts
export const COUNTRIES = [
  { code: 'CL', name: 'Chile' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'PY', name: 'Paraguay' },
  // Agregar más aquí
]
```

## 💰 Lógica de negocio (núcleo)
```
PROFIT = revenue_original - ad_spend_original
ROAS   = revenue_original / ad_spend_original
ESTADO:
  ROAS ≥ 3x → Excelente (verde)
  ROAS ≥ 2x → Bueno (azul)
  ROAS ≥ 1x → Alerta (amarillo)
  ROAS < 1x → Crítico (rojo)
  Sin ads   → Sin ads (gris)
```

## 🎨 Monedas por país
```ts
// En src/lib/calculations.ts
// Chile (CL) → mostrar en K CLP (dividir por 1000)
// Resto      → mostrar en USD directo
```

## 📦 Deploy en Netlify
1. `npm run build`
2. Netlify → Deploy manually → arrastrar carpeta `dist/`
3. Listo — sin configurar build commands

## 🔄 Para adaptar a otro nicho
1. Cambiar nombre app en `src/components/layout/AppSidebar.tsx`
2. Cambiar labels de KPIs en `src/pages/DashboardPage.tsx`
3. Cambiar columnas de la tabla en `src/components/dashboard/DayRow.tsx`
4. Cambiar importador en `src/components/ImportadorBancoEstado.tsx`
5. Ajustar fórmulas en `src/lib/calculations.ts`
La estructura de base de datos NO cambia — solo cambian los labels.
