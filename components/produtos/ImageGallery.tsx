"use client";

import { useState } from "react";
import Image from "next/image";

interface GalleryImage {
  url: string;
  alt: string;
}

interface ImageGalleryProps {
  mainImage: string;
  productName: string;
  images: GalleryImage[];
}

/**
 * ImageGallery — Galeria de imagens do produto
 *
 * UX pensada para conversão:
 * - Imagem principal grande (hero do produto)
 * - Thumbnails clicáveis embaixo (scroll horizontal no mobile)
 * - Transição suave ao trocar imagem
 * - Zoom não implementado (complexidade vs. valor no site vitrine)
 *
 * Performance:
 * - priority na imagem principal (LCP)
 * - Thumbnails com sizes menores (não carrega imagem full pra 60x60)
 */
export default function ImageGallery({
  mainImage,
  productName,
  images,
}: ImageGalleryProps) {
  // Monta array completo: principal + galeria
  const allImages: GalleryImage[] = [
    { url: mainImage, alt: productName },
    ...images,
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentImage = allImages[selectedIndex];

  return (
    <div className="space-y-3">
      {/* Imagem principal */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-neutral-100">
        <Image
          src={currentImage.url}
          alt={currentImage.alt || productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-opacity duration-300"
          key={currentImage.url}
        />
      </div>

      {/* Thumbnails — só aparece se tiver mais de 1 imagem */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {allImages.map((img, index) => (
            <button
              key={img.url + index}
              onClick={() => setSelectedIndex(index)}
              className={`
                relative flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-md overflow-hidden
                transition-all duration-200
                ${selectedIndex === index
                  ? "ring-2 ring-amber-500 ring-offset-2"
                  : "ring-1 ring-neutral-200 hover:ring-amber-300 opacity-70 hover:opacity-100"
                }
              `}
              aria-label={`Ver imagem ${index + 1}`}
            >
              <Image
                src={img.url}
                alt={img.alt || `${productName} - foto ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
