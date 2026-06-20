# CB Suplementos — Arquitetura & Setup

## 🏛️ Arquitetura de Pastas (App Router)

A separação entre **site público** e **painel admin** é feita via **Route Groups** do App Router (pastas entre parênteses). Route Groups não aparecem na URL, mas permitem ter **layouts completamente isolados**.

```
app/
├── (site)/                          ← Site público — agrupamento
│   ├── layout.tsx                   ← Layout do site (header, footer, WhatsApp)
│   ├── page.tsx                     ← Home /
│   ├── sobre/page.tsx               ← /sobre
│   ├── contato/page.tsx             ← /contato
│   ├── produtos/
│   │   ├── page.tsx                 ← /produtos
│   │   └── [slug]/page.tsx          ← /produtos/vestido-midi-floral
│   └── categoria/
│       └── [slug]/page.tsx          ← /categoria/joias
│
├── (admin)/                         ← Painel admin — agrupamento
│   ├── layout.tsx                   ← Layout admin (sidebar, header próprio)
│   ├── admin/
│   │   ├── page.tsx                 ← /admin (redirect → /admin/dashboard)
│   │   ├── dashboard/page.tsx       ← /admin/dashboard
│   │   ├── produtos/
│   │   │   ├── page.tsx             ← Lista de produtos
│   │   │   ├── novo/page.tsx        ← Criar produto
│   │   │   └── [id]/page.tsx        ← Editar produto
│   │   ├── categorias/page.tsx      ← Gerenciar categorias
│   │   └── configuracoes/page.tsx   ← Configurações da loja
│   └── login/page.tsx               ← /login (página de login do admin)
│
├── api/                             ← Route Handlers (APIs)
│   ├── auth/[...nextauth]/route.ts  ← Autenticação
│   ├── products/route.ts            ← CRUD produtos
│   └── upload/route.ts              ← Upload de imagens
│
├── layout.tsx                       ← Root layout (já criado)
├── globals.css                      ← Estilos globais (já criado)
└── not-found.tsx                    ← 404 customizado

components/
├── site/                            ← Componentes APENAS do site público
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── ProductCard.tsx
│   └── ...
├── admin/                           ← Componentes APENAS do admin
│   ├── Sidebar.tsx
│   ├── ProductForm.tsx
│   ├── DataTable.tsx
│   └── ...
├── ui/                              ← Componentes compartilhados (botões, inputs)
│   ├── Button.tsx
│   ├── Input.tsx
│   └── ...
└── WhatsAppButton.tsx               ← (já criado)

lib/
├── db.ts                            ← Prisma Client singleton (já criado)
├── auth.ts                          ← Configuração de autenticação
├── utils.ts                         ← Helpers (formatPrice, slugify, etc)
└── validators/                      ← Schemas Zod para validação
    ├── product.ts
    └── category.ts

prisma/
├── schema.prisma                    ← Schema do banco (já criado)
├── seed.ts                          ← Dados iniciais (já criado)
└── migrations/                      ← Histórico de migrações

middleware.ts                        ← Protege rotas /admin/*
```

### 🔑 Por que Route Groups?

| Vantagem | Impacto |
|---|---|
| Layouts **completamente isolados** | Header/footer do site NÃO aparecem no admin |
| **URLs limpas** | `(site)` e `(admin)` não aparecem na URL |
| **Bundles separados** | Site público não carrega JS do admin |
| **Permissões claras** | Middleware protege só o que está em `(admin)` |

---

## 🚀 Setup do Projeto

### 1. Inicializar projeto Next.js
```bash
npx create-next-app@latest cb-suplementos --typescript --tailwind --app --no-src-dir
cd cb-suplementos
```

### 2. Instalar dependências
```bash
# Prisma + auth + utilitários
npm install @prisma/client bcryptjs
npm install -D prisma @types/bcryptjs tsx
```

### 3. Inicializar Prisma
```bash
npx prisma init
```
Depois, copiar o `schema.prisma` deste projeto para `prisma/schema.prisma`.

### 4. Configurar variáveis de ambiente

Crie `.env` na raiz:
```env
# Banco de dados (Railway fornece essa URL)
DATABASE_URL="postgresql://user:pass@host:port/db"

# Admin inicial (apenas para o seed)
ADMIN_EMAIL="contato@cbsuplementos.com.br"
ADMIN_PASSWORD="UmaSenhaForte@2026"

# Auth secret (gere com: openssl rand -base64 32)
NEXTAUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Configurar o seed no `package.json`
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 6. Rodar a primeira migração
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 7. Verificar o banco
```bash
npx prisma studio  # abre uma UI web em localhost:5555
```

---

## 🚂 Deploy no Railway

1. Crie um projeto no Railway → adicione PostgreSQL
2. Copie a `DATABASE_URL` do plugin PostgreSQL
3. Adicione todas as variáveis de ambiente no Railway
4. Conecte o repositório GitHub
5. No build command, configure:
   ```bash
   prisma generate && prisma migrate deploy && next build
   ```

> **⚠️ Atenção:** `migrate deploy` (produção) ≠ `migrate dev` (desenvolvimento).
> O `dev` cria migrations interativamente. O `deploy` apenas APLICA as que já existem.

---

## 🔐 Próximos passos lógicos

1. ✅ Schema do banco — **feito**
2. ✅ Prisma Client + seed — **feito**
3. ⏭️ Layout do site público `app/(site)/layout.tsx` (header + footer)
4. ⏭️ Hero Section da Home
5. ⏭️ Sistema de autenticação (NextAuth + middleware)
6. ⏭️ Layout do admin `app/(admin)/layout.tsx` (sidebar)
7. ⏭️ CRUD de produtos no admin
