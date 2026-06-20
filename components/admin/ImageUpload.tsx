"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploadProps {
  /** URL atual da imagem (se já tiver) */
  value?: string;
  /** Chamado quando o upload completa com sucesso */
  onChange: (url: string) => void;
  /** Chamado quando o usuário remove a imagem */
  onRemove?: () => void;
  /** Label exibido acima do upload */
  label?: string;
  /** Texto auxiliar */
  hint?: string;
  /** Tamanho do preview (default: aspect 1:1) */
  aspectRatio?: "square" | "portrait" | "landscape";
}

/**
 * Componente de upload de imagem para Cloudinary
 *
 * UX:
 * - Click ou drag-and-drop para selecionar arquivo
 * - Preview imediato com loading state
 * - Botão de remover (X) quando há imagem
 * - Erro inline se algo falhar
 *
 * Fluxo:
 * 1. Usuário seleciona arquivo
 * 2. Envia para /api/upload (FormData)
 * 3. API faz upload no Cloudinary e retorna URL
 * 4. onChange(url) → form pai atualiza o estado
 */
export default function ImageUpload({
  value,
  onChange,
  onRemove,
  label = "Imagem",
  hint = "JPG, PNG ou WebP — máximo 10MB",
  aspectRatio = "portrait",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  };

  async function handleFileSelect(file: File) {
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleRemove() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    onRemove?.();
  }

  return (
    <div>
      {label && (
        <label className="block text-xs uppercase tracking-widest text-noir/70 mb-2">
          {label}
        </label>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`
          relative ${aspectClasses[aspectRatio]}
          border-2 border-dashed border-noir/20
          bg-white
          hover:border-gold transition-colors duration-300
          ${isUploading ? "opacity-50" : ""}
        `}
      >
        {/* Imagem atual */}
        {value ? (
          <>
            <Image
              src={value}
              alt="Preview"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
            />
            {onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                aria-label="Remover imagem"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </>
        ) : (
          /* Placeholder de upload */
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-noir/40 hover:text-gold-dark transition-colors"
          >
            {isUploading ? (
              <p className="text-sm">Enviando...</p>
            ) : (
              <>
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-xs uppercase tracking-widest">
                  Clique ou arraste
                </p>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {hint && !error && (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
