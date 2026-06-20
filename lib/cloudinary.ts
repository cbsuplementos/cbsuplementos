import { v2 as cloudinary } from "cloudinary";

/**
 * Configuração do Cloudinary
 *
 * Cloudinary é uma CDN especializada em imagens:
 * - Otimiza automaticamente (WebP, AVIF, redimensionamento)
 * - CDN global (carregamento rápido em qualquer lugar)
 * - 25GB grátis no plano free
 *
 * Variáveis necessárias no .env e no Railway:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // sempre HTTPS
});

export { cloudinary };

/**
 * Helper para upload de imagem.
 * Recebe um arquivo (buffer/base64) e retorna a URL pública otimizada.
 */
export async function uploadImage(
  file: string,
  folder: string = "cb-suplementos"
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    // Transformações automáticas:
    // - quality auto: melhor qualidade vs tamanho
    // - fetch_format auto: serve WebP/AVIF quando suportado
    transformation: [
      { quality: "auto:good", fetch_format: "auto" },
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

/**
 * Deleta uma imagem do Cloudinary pelo public_id.
 * Útil quando o usuário remove uma foto do produto.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Extrai o public_id de uma URL completa do Cloudinary.
 * Necessário porque salvamos só a URL no banco, mas precisamos
 * do public_id para deletar.
 *
 * Exemplo:
 * https://res.cloudinary.com/root/image/upload/v123/cb-suplementos/abc.jpg
 * → cb-suplementos/abc
 */
export function extractPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match ? match[1] : null;
}
