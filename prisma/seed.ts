import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Seed — Dados iniciais para CB Suplementos
 *
 * Roda com: `npx prisma db seed`
 *
 * Estratégia:
 * - Idempotente: usa `upsert` para poder rodar várias vezes sem erro
 * - Cria categorias, produtos de exemplo e o usuário admin inicial
 * - Senha admin gerada via env var (NUNCA hardcode em produção)
 *
 * Dimensões de embalagem (peso/altura/largura/comprimento) são usadas
 * pelo cálculo de frete via Melhor Envio. Aqui usamos médias realistas
 * para cada categoria (pote de whey 900g, sachê de pré-treino 30g, etc).
 */

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed CB Suplementos...\n");

  // ==========================================================================
  // 1. USUÁRIO ADMIN
  // ==========================================================================
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cbsuplementos.com.br";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe@123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "CB Suplementos",
      password: passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin criado: ${admin.email}`);

  // ==========================================================================
  // 2. CATEGORIAS
  //   Dimensões de embalagem padrão por categoria (peso em gramas, dimensões em cm).
  //   Usadas pelo Melhor Envio para cotação de frete quando o produto não tem
  //   dimensões próprias.
  // ==========================================================================
  const categoriesData = [
    {
      name: "Proteínas",
      slug: "proteinas",
      description: "Whey Protein, Caseína, Albumina — base da hipertrofia",
      order: 1,
      defaultWeight: 1100, // pote 900g + embalagem
      defaultHeight: 18,
      defaultWidth: 14,
      defaultLength: 14,
    },
    {
      name: "Creatina",
      slug: "creatina",
      description: "Creatina monohidratada — força e performance",
      order: 2,
      defaultWeight: 400, // pote 300g
      defaultHeight: 12,
      defaultWidth: 9,
      defaultLength: 9,
    },
    {
      name: "Pré-Treino",
      slug: "pre-treino",
      description: "Energia, foco e bomba para o treino",
      order: 3,
      defaultWeight: 350, // pote 300g
      defaultHeight: 12,
      defaultWidth: 10,
      defaultLength: 10,
    },
    {
      name: "Aminoácidos",
      slug: "aminoacidos",
      description: "BCAA, Glutamina, Beta-Alanina — recuperação muscular",
      order: 4,
      defaultWeight: 350,
      defaultHeight: 13,
      defaultWidth: 9,
      defaultLength: 9,
    },
    {
      name: "Hipercalóricos",
      slug: "hipercaloricos",
      description: "Ganho de massa para quem precisa de calorias extras",
      order: 5,
      defaultWeight: 3500, // pote 3kg
      defaultHeight: 28,
      defaultWidth: 19,
      defaultLength: 19,
    },
    {
      name: "Termogênicos",
      slug: "termogenicos",
      description: "Queimadores e aceleradores de metabolismo",
      order: 6,
      defaultWeight: 200, // pote pequeno
      defaultHeight: 10,
      defaultWidth: 7,
      defaultLength: 7,
    },
    {
      name: "Vitaminas e Minerais",
      slug: "vitaminas",
      description: "Multivitamínicos, Vitamina D, Zinco, Magnésio",
      order: 7,
      defaultWeight: 150, // potinho de cápsulas
      defaultHeight: 10,
      defaultWidth: 6,
      defaultLength: 6,
    },
    {
      name: "Ômega 3 e Saúde",
      slug: "omega-saude",
      description: "Ômega 3, Colágeno, antioxidantes — saúde a longo prazo",
      order: 8,
      defaultWeight: 200,
      defaultHeight: 11,
      defaultWidth: 7,
      defaultLength: 7,
    },
    {
      name: "Barras e Snacks",
      slug: "barras",
      description: "Barras proteicas, cookies, pasta de amendoim",
      order: 9,
      defaultWeight: 100, // unidade
      defaultHeight: 3,
      defaultWidth: 6,
      defaultLength: 15,
    },
    {
      name: "Acessórios",
      slug: "acessorios",
      description: "Coqueteleiras, doseadores, camisetas e mais",
      order: 10,
      defaultWeight: 250,
      defaultHeight: 10,
      defaultWidth: 12,
      defaultLength: 22,
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categoriesData.length} categorias criadas`);

  // Recupera IDs para usar nos produtos
  const proteinas = await prisma.category.findUniqueOrThrow({ where: { slug: "proteinas" } });
  const creatina = await prisma.category.findUniqueOrThrow({ where: { slug: "creatina" } });
  const preTreino = await prisma.category.findUniqueOrThrow({ where: { slug: "pre-treino" } });
  const acessorios = await prisma.category.findUniqueOrThrow({ where: { slug: "acessorios" } });

  // ==========================================================================
  // 3. PRODUTOS DE EXEMPLO
  // ==========================================================================
  const productsData = [
    {
      name: "Whey Protein Concentrado 900g — Baunilha",
      slug: "whey-protein-concentrado-900g-baunilha",
      description:
        "Whey Protein concentrado com 24g de proteína por dose. Ideal para pós-treino e ganho de massa magra. Sabor baunilha cremoso, alta solubilidade.\n\nModo de uso: 1 scoop (30g) com 250ml de água ou leite após o treino.",
      price: 149.9,
      mainImage:
        "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800",
      categoryId: proteinas.id,
      featured: true,
      stock: 25,
      weight: 1100,
      height: 18,
      width: 14,
      length: 14,
    },
    {
      name: "Creatina Monohidratada 300g",
      slug: "creatina-monohidratada-300g",
      description:
        "Creatina monohidratada pura 100%. Aumenta força, potência e volume muscular. Sem sabor, fácil de misturar.\n\nModo de uso: 3g a 5g por dia, em qualquer horário.",
      price: 89.9,
      mainImage:
        "https://images.unsplash.com/photo-1579722821273-0f6c1b6e4d51?w=800",
      categoryId: creatina.id,
      featured: true,
      stock: 40,
      weight: 400,
      height: 12,
      width: 9,
      length: 9,
    },
    {
      name: "Pré-Treino Inferno 300g — Frutas Vermelhas",
      slug: "pre-treino-inferno-300g-frutas-vermelhas",
      description:
        "Pré-treino completo com cafeína, beta-alanina, citrulina e taurina. Energia intensa, foco mental e bomba muscular durante todo o treino.\n\nModo de uso: 1 dose (10g) 30 minutos antes do treino.",
      price: 109.9,
      mainImage:
        "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800",
      categoryId: preTreino.id,
      featured: true,
      stock: 18,
      weight: 350,
      height: 12,
      width: 10,
      length: 10,
    },
    {
      name: "Coqueteleira 600ml com Mola",
      slug: "coqueteleira-600ml-com-mola",
      description:
        "Coqueteleira premium com tampa rosqueável, mola interna para melhor mistura e marcação em ml/oz. Livre de BPA.",
      price: 39.9,
      mainImage:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
      categoryId: acessorios.id,
      featured: false,
      stock: 60,
      weight: 200,
      height: 22,
      width: 10,
      length: 10,
    },
  ];

  for (const product of productsData) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }
  console.log(`✅ ${productsData.length} produtos criados`);

  console.log("\n🎉 Seed concluído com sucesso!\n");
  console.log("📧 Login admin:", adminEmail);
  console.log("🔑 Senha admin:", adminPassword);
  console.log("\n⚠️  TROQUE A SENHA NO PRIMEIRO LOGIN!\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
