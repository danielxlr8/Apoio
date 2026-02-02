import React, { useState, useEffect } from "react";

// MAPEAMENTO COMPLETO (Antigos + Novos)
const MOODS = {
  // --- ANTIGOS ---
  welcome: [
    "/mascots/Shopito-Acenando/wave-1.png",
    "/mascots/Shopito-Acenando/wave-2.png",
  ],
  angry: [
    "/mascots/Shopito-Brabo/angry-1.png",
    "/mascots/Shopito-Brabo/angry-2.png",
  ],
  ok: ["/mascots/Shopito-Ok/ok-1.png", "/mascots/Shopito-Ok/ok-2.png"],
  "point-right": ["/mascots/Shopito-Apontando/point-right.png"],
  "point-left": ["/mascots/Shopito-Apontando/point-left.png"],
  chicken: ["/mascots/Galinha-Bot/Galinha.png"],

  // --- NOVOS (Adicionados Agora) ---
  map: [
    "/mascots/ShoppitoMapa/ShoppitoProf-1.png",
    "/mascots/ShoppitoMapa/ShoppitoProf-2.png",
    "/mascots/ShoppitoMapa/ShoppitoProf-3.png",
  ],
  ranking: [
    "/mascots/ShoppitoRanking/ShopitoCorredor-1.png",
    "/mascots/ShoppitoRanking/ShopitoCorredor-2.png",
    "/mascots/ShoppitoRanking/ShopitoCorredor-3.png",
  ],
  // ✅ ALTERADO: Renomeei de 'celebrate' para 'finale' para bater com o Tour
  finale: [
    "/mascots/ShoppitoComemoracao/ShoppitoComemoracao-1.png",
    "/mascots/ShoppitoComemoracao/ShoppitoComemoracao-2.png",
    "/mascots/ShoppitoComemoracao/ShopitoComemoracao-3.png",
  ],
};

interface ShopitoMascotProps {
  mood?: string;
  customImages?: string[];
}

export const ShopitoMascot = ({
  mood = "welcome",
  customImages,
}: ShopitoMascotProps) => {
  const [frame, setFrame] = useState(0);

  // Lógica de Seleção:
  // 1. Se vier customImages (passado pelo DriverInterface), usa.
  // 2. Se não, tenta pegar do MOODS pelo nome (ex: 'finale', 'map').
  // 3. Se não achar, usa 'welcome' como fallback.
  // Conversão forçada de tipo para garantir que acesse o objeto MOODS
  const images =
    customImages && customImages.length > 0
      ? customImages
      : (MOODS as any)[mood] || MOODS["welcome"];

  const isAnimated = images.length > 1;

  useEffect(() => {
    // Reseta o frame para 0 sempre que o conjunto de imagens mudar
    setFrame(0);
  }, [images]);

  useEffect(() => {
    if (!isAnimated) return;

    // Intervalo de animação (700ms)
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % images.length);
    }, 700);

    return () => clearInterval(interval);
  }, [isAnimated, images.length]);

  return (
    <div className="relative w-28 h-28 sm:w-40 sm:h-40 flex-shrink-0 z-50 mx-auto">
      <img
        src={images[frame]}
        alt={`Mascote ${mood}`}
        className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          console.error(`ERRO: Imagem não encontrada: ${images[frame]}`);
          // Opcional: pode esconder a imagem quebrada
          // e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
};
