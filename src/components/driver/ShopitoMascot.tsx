import React, { useState, useEffect } from "react";

// MAPEAMENTO ATUALIZADO (Incluindo a pasta Galinha-bot)
const MOODS = {
  // Pasta: Shopito-Acenando
  welcome: [
    "/mascots/Shopito-Acenando/wave-1.png",
    "/mascots/Shopito-Acenando/wave-2.png",
  ],

  // Pasta: Shopito-Brabo
  angry: [
    "/mascots/Shopito-Brabo/angry-1.png",
    "/mascots/Shopito-Brabo/angry-2.png",
  ],

  // Pasta: Shopito-Ok
  ok: ["/mascots/Shopito-Ok/ok-1.png", "/mascots/Shopito-Ok/ok-2.png"],

  // Pasta: Shopito-Acenando (Festa)
  celebrate: ["/mascots/Shopito-Acenando/wave-3.png"],

  // Pasta: Shopito-Apontando
  "point-right": ["/mascots/Shopito-Apontando/point-right.png"],
  "point-left": ["/mascots/Shopito-Apontando/point-left.png"],

  // --- AQUI ESTÁ A ALTERAÇÃO ---
  // Pasta: Galinha-bot -> Arquivo: Galinha.png
  chicken: ["/mascots/Galinha-Bot/Galinha.png"],
};

export const ShopitoMascot = ({ mood = "welcome" }: { mood?: string }) => {
  const [frame, setFrame] = useState(0);

  // Se o mood "chicken" for chamado, ele pega o array acima
  const images = MOODS[mood as keyof typeof MOODS] || MOODS["welcome"];
  const isAnimated = images.length > 1;

  useEffect(() => {
    if (!isAnimated) return;
    const interval = setInterval(() => {
      setFrame((prev) => (prev === 0 ? 1 : 0));
    }, 700);
    return () => clearInterval(interval);
  }, [mood, isAnimated]);

  return (
    <div className="relative w-28 h-28 sm:w-40 sm:h-40 flex-shrink-0 z-50 mx-auto">
      <img
        src={images[frame]}
        alt={`Mascote ${mood}`}
        className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          console.error(`ERRO: Imagem não encontrada: ${images[frame]}`);
          // Se a galinha falhar, fallback para o Shopito acenando para não quebrar o layout
          if (mood === "chicken") {
            // e.currentTarget.src = '/mascots/Shopito-Acenando/wave-1.png'; // Descomente para ativar fallback
          }
        }}
      />
    </div>
  );
};
