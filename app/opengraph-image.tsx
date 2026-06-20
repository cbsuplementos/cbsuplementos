import { ImageResponse } from "next/og";

/**
 * opengraph-image.tsx — Imagem de preview ao compartilhar o site
 *
 * Aparece em WhatsApp, Instagram, Facebook, X etc.
 *
 * Identidade: dourado #D4A24C sobre preto #0A0A0A, com slogans
 * oficiais da marca ("Viva seu melhor corpo" + "Supere seus limites").
 */

export const runtime = "edge";
export const alt = "CB Suplementos — Viva seu melhor corpo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GOLD = "#D4A24C";
const GOLD_LIGHT = "#F2C94C";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0A0A",
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(212,162,76,0.22) 0%, transparent 55%), radial-gradient(circle at 80% 75%, rgba(212,162,76,0.16) 0%, transparent 55%)",
          position: "relative",
          fontFamily: "system-ui",
        }}
      >
        {/* Borda decorativa dourada */}
        <div
          style={{
            position: "absolute",
            top: "28px",
            left: "28px",
            right: "28px",
            bottom: "28px",
            border: `2px solid ${GOLD}`,
            opacity: 0.5,
            display: "flex",
          }}
        />

        {/* Conteúdo central */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            zIndex: 1,
          }}
        >
          {/* Tagline pequena topo */}
          <div
            style={{
              fontSize: "18px",
              color: GOLD,
              letterSpacing: "12px",
              textTransform: "uppercase",
              display: "flex",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Suplementação Premium
          </div>

          {/* Decoração superior */}
          <div
            style={{
              width: "120px",
              height: "3px",
              backgroundColor: GOLD,
              display: "flex",
            }}
          />

          {/* Nome da loja — bem grande */}
          <div
            style={{
              fontSize: "150px",
              fontWeight: 900,
              color: GOLD,
              letterSpacing: "8px",
              display: "flex",
              textTransform: "uppercase",
              lineHeight: 1,
              fontStyle: "italic",
              textShadow: `0 0 30px rgba(212,162,76,0.4)`,
            }}
          >
            CB
          </div>

          {/* SUPLEMENTOS */}
          <div
            style={{
              fontSize: "58px",
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "14px",
              display: "flex",
              fontStyle: "italic",
              textTransform: "uppercase",
              marginTop: "-12px",
            }}
          >
            SUPLEMENTOS
          </div>

          {/* Linha + slogan oficial */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginTop: "24px",
            }}
          >
            <div style={{ width: "60px", height: "2px", backgroundColor: GOLD, display: "flex" }} />
            <div
              style={{
                fontSize: "28px",
                color: "#FFFFFF",
                letterSpacing: "6px",
                display: "flex",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Viva seu melhor corpo
            </div>
            <div style={{ width: "60px", height: "2px", backgroundColor: GOLD, display: "flex" }} />
          </div>

          {/* Slogan secundário */}
          <div
            style={{
              fontSize: "16px",
              color: GOLD_LIGHT,
              marginTop: "30px",
              display: "flex",
              letterSpacing: "10px",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            Supere seus limites
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
