# 💪 CB Suplementos — Loja Virtual

Site profissional com painel administrativo integrado. Stack moderna: Next.js 15 (App Router) + Prisma + PostgreSQL + Tailwind CSS.

**Loja 100% online** — Suplementos esportivos com entrega para todo o Brasil.

---

## ⚡ Início Rápido (TL;DR)

```bash
npm install
cp .env.example .env  # depois edite com sua DATABASE_URL do Railway
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Abra http://localhost:3000 🎉

---

## 🎨 Identidade Visual

| | |
|---|---|
| **Paleta** | Preto (#0A0A0A) + Verde neon (#39FF14) |
| **Fontes** | Bebas Neue (display) + Oswald (acentos) + Inter (corpo) |
| **Estilo** | Performance escuro / atlético |

Tokens em `app/globals.css` e `tailwind.config.ts`.

---

## 📦 Categorias do Seed Inicial

1. Proteínas (Whey, Caseína, Albumina)
2. Creatina
3. Pré-Treino
4. Aminoácidos (BCAA, Glutamina, Beta-Alanina)
5. Hipercalóricos
6. Termogênicos
7. Vitaminas e Minerais
8. Ômega 3 e Saúde
9. Barras e Snacks
10. Acessórios (coqueteleiras, doseadores)

Cada categoria já vem com dimensões realistas de embalagem para o cálculo de frete via Melhor Envio.

---

## 🛠️ Stack Técnico

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Linguagem | TypeScript 5.6 |
| Estilização | Tailwind CSS 3.4 + CSS variables |
| ORM/Banco | Prisma 5 + PostgreSQL |
| Auth admin | NextAuth v5 (JWT) |
| Auth cliente | JWT custom (`jose`) |
| Hash | bcryptjs |
| Imagens | Cloudinary (pasta `cb-suplementos/`) |
| Pagamento | Mercado Pago (Pix + Cartão) |
| Frete | Melhor Envio (com fallback por UF) + ViaCEP |
| Hospedagem | Railway |

---

## 🔐 Variáveis de Ambiente (.env)

```env
# Banco (Railway)
DATABASE_URL="postgresql://..."

# Admin inicial (apenas seed)
ADMIN_EMAIL="admin@cbsuplementos.com.br"
ADMIN_PASSWORD="TrocarNoPrimeiroLogin@2026"

# Auth (gere com: openssl rand -base64 32)
AUTH_SECRET="..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Mercado Pago
MP_ACCESS_TOKEN="..."
MP_PUBLIC_KEY="..."

# Melhor Envio
MELHOR_ENVIO_TOKEN="..."
ME_SANDBOX="true"        # true em dev, false em produção

# Site
NEXT_PUBLIC_SITE_URL="https://cbsuplementos.up.railway.app"
```

---

## 📚 Passo a Passo Completo (Do Zero ao Site Publicado)

### PARTE 1 — Banco de Dados (Railway)

1. Acesse https://railway.app e faça login com GitHub
2. **+ New Project** → **Provision PostgreSQL**
3. Aguarde o banco ser criado
4. Vá em **Variables** → copie a `DATABASE_URL`

### PARTE 2 — Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env (copiar e editar com a DATABASE_URL do passo anterior)
cp .env.example .env

# 3. Criar tabelas no banco
npx prisma migrate dev --name init

# 4. Popular com dados iniciais
npm run db:seed

# 5. Rodar
npm run dev
```

Abra http://localhost:3000

### PARTE 3 — Deploy no Railway

1. Suba o código no GitHub
2. No Railway: **+ New** → **GitHub Repo** → escolha o repositório
3. Em **Variables** do serviço, adicione todas as env vars
4. Use `${{Postgres.DATABASE_URL}}` (com colchetes duplos) para referenciar o banco
5. Em **Settings** → **Networking** → **Generate Domain**
6. No Shell do Railway, rode:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

---

## 🔧 Scripts Disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Roda o site localmente |
| `npm run build` | Compila para produção |
| `npm start` | Roda a versão de produção |
| `npm run db:migrate` | Cria/aplica migração (dev) |
| `npm run db:deploy` | Aplica migrações (produção) |
| `npm run db:seed` | Popula com dados iniciais |
| `npm run db:studio` | UI visual do banco (localhost:5555) |
| `npm run db:reset` | ⚠️ APAGA tudo e recria o banco |

---

## 📂 Estrutura

```
cb-suplementos/
├── app/
│   ├── (site)/                  # Site público
│   │   ├── page.tsx             # Home
│   │   ├── produtos/            # Catálogo
│   │   ├── carrinho/
│   │   ├── checkout/
│   │   ├── conta/               # Login/cadastro cliente
│   │   ├── minha-conta/         # Área do cliente
│   │   ├── sobre/, contato/, politica-privacidade/
│   ├── admin/                   # Painel administrativo
│   │   ├── dashboard/, produtos/, categorias/, hero/, pedidos/
│   └── api/                     # Route handlers
├── components/
│   ├── site/                    # Header, Footer, Hero, BenefitsSection, etc
│   ├── produtos/                # ProductCard, VariantSelector, etc
│   └── admin/                   # ProductForm, Sidebar, etc
├── lib/                         # auth, db, mercadopago, correios, cloudinary
├── prisma/                      # schema, migrations, seed
└── middleware.ts                # Proteção de rotas
```

---

## 🐛 Troubleshooting Rápido

| Erro | Solução |
|---|---|
| `Cannot find module '@prisma/client'` | `npx prisma generate` |
| `Environment variable not found: DATABASE_URL` | Confirme `.env` e formato com aspas |
| `P1001: Can't reach database` | Verifique referência `${{Postgres.DATABASE_URL}}` |
| `Image hostname not configured` | Adicione em `next.config.ts > remotePatterns` |
| Página em branco produção | `npx prisma migrate deploy` no Shell Railway |

---

## 🎯 Funcionalidades

✅ Catálogo com categorias e filtros  
✅ Carrinho persistente por cliente  
✅ Checkout completo (Pix + Cartão via Mercado Pago)  
✅ Cálculo real de frete (Melhor Envio: PAC, SEDEX, Jadlog etc.)  
✅ Área do cliente (pedidos, endereços, perfil)  
✅ Painel admin (produtos, categorias, banners, pedidos)  
✅ SEO completo (metadata dinâmica, sitemap, schema.org)  
✅ Mobile-first  

---

**CB Suplementos — Viva o seu melhor corpo 💪**
