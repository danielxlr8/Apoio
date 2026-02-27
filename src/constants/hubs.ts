export const HUBS = [
  "LM Hub_PR_Londrina_Parque ABC II",
  "LM Hub_PR_Maringa",
  "LM Hub_PR_Foz do Iguaçu",
  "LM Hub_PR_Cascavel",
  "LM Hub_PR_Curitiba",
] as const;

export type Hub = (typeof HUBS)[number];

export const getCityFromHub = (hubString: string): string => {
  if (!hubString) return "Curitiba"; // Fallback padrão

  // Divide a string pelo underline "_"
  const parts = hubString.split("_");

  // O formato é LM Hub_ESTADO_CIDADE_SUFIXO
  // A cidade está no índice 2
  if (parts.length >= 3) {
    return parts[2].trim();
  }

  return hubString; // Retorna original se não seguir o padrão
};

export const normalizeHub = (hubValue: string) => {
  if (!hubValue) return "";

  // Lógica para limpar o nome do Hub (ex: pegar apenas a cidade)
  const parts = hubValue.split("_");

  // Se o formato for "LM Hub_PR_Cidade_...", pega a cidade (parte 3)
  if (parts.length >= 3) {
    return parts[2];
  }

  return hubValue;
};
