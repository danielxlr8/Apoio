import React from "react";
import Joyride, {
  ACTIONS,
  EVENTS,
  STATUS,
  CallBackProps,
  Step,
  TooltipRenderProps,
} from "react-joyride";
import { Button } from "../ui/button"; // Seus componentes existentes
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"; // Seus componentes existentes
import { X, ChevronRight, ChevronLeft, MapPin } from "lucide-react";

interface AdminTourProps {
  run: boolean;
  setRun: (run: boolean) => void;
}

// --- CONFIGURAÇÃO DOS PASSOS ---
const tourSteps: Step[] = [
  {
    target: "body",
    content: (
      <div>
        <p className="mb-2">
          Bem-vindo à <strong>Central SPX</strong>!
        </p>
        <p>
          Este é o seu painel de comando logístico. Vamos fazer um tour rápido
          para você dominar todas as ferramentas de gestão.
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: "#tour-sidebar",
    title: "Navegação Principal",
    content:
      "Navegue entre o Quadro Geral, Lixeira, Histórico e Perfil. Você pode recolher este menu para ganhar mais espaço.",
    placement: "right",
  },
  {
    target: "#tour-admin-card",
    title: "Seu Painel Pessoal",
    content:
      "Visualize informações rápidas, data/hora local e a previsão do tempo para sua operação. Personalize as cores clicando no ícone de paleta.",
    placement: "bottom",
  },
  {
    target: "#tour-summary-cards",
    title: "Métricas em Tempo Real",
    content:
      "Tenha uma visão instantânea da operação: chamados na fila, pendências e motoristas disponíveis.",
    placement: "bottom",
  },
  {
    target: "#tour-config-panel",
    title: "Organize seu Quadro",
    content:
      "Oculte colunas que não usa ou reordene-as arrastando. Adapte o Kanban ao seu fluxo de trabalho.",
    placement: "bottom",
  },
  {
    target: "#tour-kanban-board",
    title: "Quadro Operacional",
    content:
      "O coração do sistema. Arraste cards para mudar status, clique para ver detalhes ou use os botões rápidos de ação.",
    placement: "top",
  },
  {
    target: "#tour-filter-urgency",
    title: "Filtros Rápidos",
    content:
      "Precisa focar no que é crítico? Filtre rapidamente por nível de urgência aqui.",
    placement: "bottom",
  },
  {
    target: "#tour-header-actions",
    title: "Controles Globais",
    content:
      "Force uma atualização dos dados ou alterne entre os modos Claro e Escuro conforme sua preferência.",
    placement: "left",
  },
  {
    target: "#tour-nav-history",
    title: "Auditoria e Histórico",
    content:
      "Precisa recuperar algo antigo? O histórico completo de operações fica salvo aqui.",
    placement: "right",
  },
];

// --- COMPONENTE DE TOOLTIP CUSTOMIZADO (O "BALÃO") ---
const CustomTooltip = ({
  index,
  step,
  tooltipProps,
  backProps,
  primaryProps,
  skipProps,
  isLastStep,
  size,
}: TooltipRenderProps) => {
  return (
    <Card
      {...tooltipProps}
      className="w-[350px] max-w-[90vw] shadow-2xl border-orange-500/30 bg-card text-card-foreground relative z-[100]"
    >
      <CardHeader className="pb-2 bg-gradient-to-r from-orange-500/10 to-transparent rounded-t-xl">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/20 rounded-full text-orange-600 dark:text-orange-400">
              <MapPin size={18} />
            </div>
            <CardTitle className="text-lg font-bold">
              {step.title || "Tour Guiado"}
            </CardTitle>
          </div>
          {/* Botão de Fechar (Skip) no canto */}
          <button
            {...skipProps}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Sair do tour"
          >
            <X size={18} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="py-4 text-sm leading-relaxed text-muted-foreground">
        {step.content}
      </CardContent>

      <CardFooter className="flex justify-between items-center pt-2 pb-4 border-t bg-muted/20 rounded-b-xl">
        <div className="text-xs font-medium text-muted-foreground">
          Passo {index + 1} de {size}
        </div>
        <div className="flex gap-2">
          {index > 0 && (
            <Button
              {...backProps}
              variant="outline"
              size="sm"
              className="h-8 text-xs"
            >
              <ChevronLeft size={14} className="mr-1" /> Voltar
            </Button>
          )}
          <Button
            {...primaryProps}
            size="sm"
            className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white border-none shadow-md"
          >
            {isLastStep ? (
              "Concluir"
            ) : (
              <>
                Próximo <ChevronRight size={14} className="ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// --- COMPONENTE PRINCIPAL DO TOUR ---
export const AdminTour: React.FC<AdminTourProps> = ({ run, setRun }) => {
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      tooltipComponent={CustomTooltip} // Aqui conectamos o design customizado
      callback={handleJoyrideCallback}
      scrollOffset={100}
      disableOverlayClose={true} // Obriga a usar os botões
      floaterProps={{
        disableAnimation: false, // Mantém a animação suave do floater
      }}
      styles={{
        options: {
          zIndex: 10000, // Garante que fique acima de tudo
          arrowColor: "hsl(var(--card))", // Cor da setinha do balão (theme aware)
          overlayColor: "rgba(0, 0, 0, 0.6)", // Fundo escuro focado
        },
        spotlight: {
          borderRadius: "12px", // Arredondamento do foco
        },
      }}
    />
  );
};
