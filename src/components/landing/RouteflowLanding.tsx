import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from "framer-motion";

// ============================================
// CUSTOM CURSOR COMPONENT
// ============================================
function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const cursorScale = useMotionValue(1);
  
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };

    const handleMouseEnter = () => cursorScale.set(1.5);
    const handleMouseLeave = () => cursorScale.set(1);

    window.addEventListener("mousemove", moveCursor);
    
    const interactiveElements = document.querySelectorAll("button, a, [data-magnetic]");
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, [cursorX, cursorY, cursorScale]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9999] mix-blend-difference bg-white hidden lg:block"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
        scale: cursorScale,
      }}
    />
  );
}

// ============================================
// ANIMATED MAP COMPONENT (Hero)
// ============================================
function AnimatedMap() {
  const [routes, setRoutes] = useState<Array<{ id: number; path: string; delay: number }>>([]);

  useEffect(() => {
    // Generate random route paths
    const generateRoutes = () => {
      const newRoutes = [];
      for (let i = 0; i < 8; i++) {
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const midX = 50 + (Math.random() - 0.5) * 40;
        const midY = 50 + (Math.random() - 0.5) * 40;
        const endX = Math.random() * 100;
        const endY = Math.random() * 100;
        
        newRoutes.push({
          id: i,
          path: `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`,
          delay: i * 0.3,
        });
      }
      setRoutes(newRoutes);
    };
    generateRoutes();
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      {/* Grid background */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(251, 146, 60, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251, 146, 60, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />
      
      {/* Animated routes */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {routes.map((route) => (
          <motion.path
            key={route.id}
            d={route.path}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="0.3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 3, delay: route.delay, ease: "easeInOut" },
              opacity: { duration: 0.5, delay: route.delay },
            }}
          />
        ))}
        
        {/* Moving dots along routes */}
        {routes.map((route) => (
          <motion.circle
            key={`dot-${route.id}`}
            r="0.8"
            fill="#f97316"
            filter="url(#glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 3,
              delay: route.delay + 0.5,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              begin={`${route.delay + 0.5}s`}
              path={route.path}
            />
          </motion.circle>
        ))}
        
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#fb923c" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      {/* Floating location markers */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-orange-500/50"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// NOISE TEXTURE OVERLAY
// ============================================
function NoiseOverlay() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

// ============================================
// MAGNETIC BUTTON COMPONENT
// ============================================
function MagneticButton({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.3);
    y.set((e.clientY - centerY) * 0.3);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.button
      ref={ref}
      data-magnetic
      className={className}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
}

// ============================================
// SECTION COMPONENTS
// ============================================

// Hero Section
function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950" />
      
      {/* Animated Map */}
      <AnimatedMap />
      
      {/* Radial glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-orange-500/10 blur-[150px]" />
      </div>
      
      {/* Content */}
      <motion.div 
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        style={{ opacity, scale, y }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-8">
            Suporte Logistico em Tempo Real
          </span>
        </motion.div>
        
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight"
          initial={{ opacity: 0, y: 40, filter: "blur(15px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <span className="text-balance">Cada rota conta.</span>
          <br />
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            Cada motorista importa.
          </span>
        </motion.h1>
        
        <motion.p
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 text-pretty"
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          ROUTEFLOW conecta motoristas a suporte operacional instantaneo. 
          Problemas em rota sao resolvidos em segundos, nao em horas.
        </motion.p>
        
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <MagneticButton className="px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow">
            Comecar Agora
          </MagneticButton>
          <MagneticButton className="px-8 py-4 rounded-full bg-white/5 text-white font-medium text-lg border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            Ver Demonstracao
          </MagneticButton>
        </motion.div>
      </motion.div>
      
      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// Problem Section
function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [0.9, 1]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center py-32 overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      
      {/* Warning glow */}
      <motion.div 
        className="absolute inset-0"
        style={{ opacity }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-500/10 blur-[120px]" />
      </motion.div>
      
      <motion.div 
        className="relative z-10 max-w-6xl mx-auto px-6"
        style={{ opacity, scale }}
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <motion.span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-red-500/10 text-red-400 border border-red-500/20 mb-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              O Problema
            </motion.span>
            
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight text-balance"
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Quando a rota falha, o tempo para.
            </motion.h2>
            
            <motion.p
              className="text-lg text-zinc-400 mb-8 text-pretty"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Motoristas enfrentam problemas diarios: enderecos incorretos, clientes ausentes, 
              veiculos com defeito. Sem suporte rapido, cada minuto parado custa dinheiro e 
              compromete entregas.
            </motion.p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: "47min", label: "Tempo medio de espera por suporte" },
                { value: "23%", label: "Entregas atrasadas por falta de comunicacao" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                >
                  <div className="text-3xl font-bold text-red-400 mb-1">{stat.value}</div>
                  <div className="text-sm text-zinc-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Right visualization */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Slowing route animation */}
              <svg className="w-full h-full" viewBox="0 0 400 400">
                <defs>
                  <linearGradient id="failingRoute" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                
                {/* Route path */}
                <motion.path
                  d="M 50 350 Q 100 200 200 200 Q 300 200 350 50"
                  fill="none"
                  stroke="url(#failingRoute)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="10 5"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
                
                {/* Vehicle stuck */}
                <motion.g
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1 }}
                >
                  <circle cx="200" cy="200" r="30" fill="#ef4444" fillOpacity="0.2" />
                  <circle cx="200" cy="200" r="20" fill="#ef4444" fillOpacity="0.3" />
                  <circle cx="200" cy="200" r="10" fill="#ef4444" />
                  
                  {/* Pulse animation */}
                  <motion.circle
                    cx="200"
                    cy="200"
                    r="30"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.g>
                
                {/* Warning icon */}
                <motion.text
                  x="200"
                  y="210"
                  textAnchor="middle"
                  fill="white"
                  fontSize="24"
                  fontWeight="bold"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.2 }}
                >
                  !
                </motion.text>
              </svg>
              
              {/* Floating alert cards */}
              {[
                { text: "Endereco nao encontrado", top: "20%", left: "60%", delay: 1.5 },
                { text: "Cliente ausente", top: "50%", left: "70%", delay: 1.8 },
                { text: "Aguardando suporte...", top: "70%", left: "50%", delay: 2.1 },
              ].map((alert, i) => (
                <motion.div
                  key={i}
                  className="absolute px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm backdrop-blur-sm"
                  style={{ top: alert.top, left: alert.left }}
                  initial={{ opacity: 0, x: 20, filter: "blur(5px)" }}
                  whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  viewport={{ once: true }}
                  transition={{ delay: alert.delay, duration: 0.5 }}
                >
                  {alert.text}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

// Solution Section
function SolutionSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950" />
      
      {/* Success glow */}
      <motion.div 
        className="absolute inset-0"
        style={{ opacity }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-orange-500/10 blur-[150px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[100px]" />
      </motion.div>
      
      <motion.div 
        className="relative z-10 max-w-6xl mx-auto px-6"
        style={{ opacity }}
      >
        <div className="text-center mb-16">
          <motion.span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            A Solucao
          </motion.span>
          
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight text-balance"
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Suporte que chega antes do problema crescer.
          </motion.h2>
          
          <motion.p
            className="text-lg text-zinc-400 max-w-2xl mx-auto text-pretty"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            ROUTEFLOW conecta motoristas diretamente ao centro de operacoes. 
            Um clique, resposta imediata.
          </motion.p>
        </div>
        
        {/* UI Mockup */}
        <motion.div
          className="relative max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Phone frame */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative rounded-[3rem] bg-gradient-to-b from-zinc-800 to-zinc-900 p-2 shadow-2xl shadow-black/50">
              <div className="rounded-[2.5rem] bg-zinc-950 overflow-hidden">
                {/* Status bar */}
                <div className="flex items-center justify-between px-6 py-2 text-white text-xs">
                  <span>9:41</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-2 bg-white/80 rounded-sm" />
                    <div className="w-4 h-2 bg-white/80 rounded-sm" />
                    <div className="w-6 h-3 bg-green-400 rounded-sm" />
                  </div>
                </div>
                
                {/* App content */}
                <div className="px-4 pb-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <div className="text-white font-semibold text-lg">ROUTEFLOW</div>
                      <div className="text-zinc-500 text-sm">Joao Silva - Rota #247</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold">
                      JS
                    </div>
                  </div>
                  
                  {/* Status card */}
                  <motion.div
                    className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 font-medium">Conectado ao Suporte</span>
                    </div>
                    <div className="text-white text-sm">
                      Operador disponivel para atendimento imediato
                    </div>
                  </motion.div>
                  
                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: "📍", label: "Problema no Endereco" },
                      { icon: "📦", label: "Problema na Entrega" },
                      { icon: "🚗", label: "Problema no Veiculo" },
                      { icon: "💬", label: "Falar com Operador" },
                    ].map((action, i) => (
                      <motion.div
                        key={i}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.7 + i * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="text-2xl mb-1">{action.icon}</div>
                        <div className="text-white text-xs">{action.label}</div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Bottom CTA */}
                  <motion.button
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg shadow-orange-500/25"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Solicitar Suporte Agora
                  </motion.button>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <motion.div
              className="absolute -right-20 top-20 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.3 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                Resposta em 12s
              </div>
            </motion.div>
            
            <motion.div
              className="absolute -left-20 bottom-32 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.5 }}
            >
              <div className="flex items-center gap-2">
                <span className="text-orange-400">98.7%</span>
                Resolucao no primeiro contato
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// Technology Section
function TechnologySection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const metrics = [
    { value: "12s", label: "Tempo medio de resposta", icon: "⚡" },
    { value: "99.9%", label: "Uptime da plataforma", icon: "🔒" },
    { value: "50k+", label: "Chamados resolvidos/mes", icon: "✓" },
    { value: "4.9", label: "Avaliacao dos motoristas", icon: "⭐" },
  ];

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center py-32 overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      
      {/* Tech glow */}
      <motion.div 
        className="absolute inset-0"
        style={{ opacity }}
      >
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[120px]" />
      </motion.div>
      
      <motion.div 
        className="relative z-10 max-w-6xl mx-auto px-6"
        style={{ opacity }}
      >
        <div className="text-center mb-16">
          <motion.span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Tecnologia
          </motion.span>
          
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight text-balance"
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Construido para escala. Otimizado para velocidade.
          </motion.h2>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {metrics.map((metric, i) => (
            <motion.div
              key={i}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm overflow-hidden group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              whileHover={{ scale: 1.02, borderColor: "rgba(251, 146, 60, 0.3)" }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-amber-500/5 transition-all duration-500" />
              
              <div className="relative">
                <span className="text-2xl mb-3 block">{metric.icon}</span>
                <div className="text-4xl font-bold text-white mb-2">{metric.value}</div>
                <div className="text-sm text-zinc-500">{metric.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Live Chart Visualization */}
        <motion.div
          className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">Monitoramento em Tempo Real</h3>
              <p className="text-zinc-500 text-sm">Chamados resolvidos nas ultimas 24h</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Ao Vivo</span>
            </div>
          </div>
          
          {/* Animated chart bars */}
          <div className="flex items-end justify-between gap-2 h-40">
            {[...Array(24)].map((_, i) => {
              const height = 30 + Math.random() * 70;
              return (
                <motion.div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-orange-500/50 to-orange-400/80 rounded-t-sm"
                  initial={{ height: 0 }}
                  whileInView={{ height: `${height}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.03, ease: "easeOut" }}
                />
              );
            })}
          </div>
          
          <div className="flex justify-between mt-4 text-xs text-zinc-600">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// Trust Section
function TrustSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const testimonials = [
    {
      quote: "Antes eu perdia horas esperando resposta. Agora resolvo tudo em minutos.",
      author: "Carlos M.",
      role: "Motorista ha 3 anos",
    },
    {
      quote: "A interface e muito simples. Ate quem nao entende de tecnologia consegue usar.",
      author: "Ana Paula S.",
      role: "Coordenadora de Frota",
    },
    {
      quote: "Nosso NPS subiu 40 pontos depois que implementamos o ROUTEFLOW.",
      author: "Ricardo L.",
      role: "Gerente de Operacoes",
    },
  ];

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950" />
      
      <motion.div 
        className="relative z-10 max-w-6xl mx-auto px-6"
        style={{ opacity }}
      >
        <div className="text-center mb-16">
          <motion.span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Confianca
          </motion.span>
          
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight text-balance"
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Quem usa, recomenda.
          </motion.h2>
        </div>
        
        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-amber-400">★</span>
                ))}
              </div>
              <p className="text-zinc-300 mb-6 text-pretty">&quot;{testimonial.quote}&quot;</p>
              <div>
                <div className="text-white font-medium">{testimonial.author}</div>
                <div className="text-zinc-500 text-sm">{testimonial.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Trust badges */}
        <motion.div
          className="mt-16 flex flex-wrap items-center justify-center gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          {["ISO 27001", "LGPD Compliant", "SOC 2 Type II", "99.9% SLA"].map((badge, i) => (
            <div
              key={i}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-sm font-medium"
            >
              {badge}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

// CTA Section
function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [0.9, 1]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center py-32 overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      
      {/* Dramatic glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-orange-500/20 blur-[200px]" />
      </div>
      
      <motion.div 
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        style={{ opacity, scale }}
      >
        <motion.h2
          className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight"
          initial={{ opacity: 0, y: 40, filter: "blur(15px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-balance">Pronto para transformar sua operacao?</span>
        </motion.h2>
        
        <motion.p
          className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 text-pretty"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Junte-se a milhares de empresas que ja revolucionaram seu suporte logistico com ROUTEFLOW.
        </motion.p>
        
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <MagneticButton className="px-10 py-5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-shadow">
            Comecar Gratuitamente
          </MagneticButton>
          <MagneticButton className="px-10 py-5 rounded-full bg-white/5 text-white font-medium text-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            Agendar Demo
          </MagneticButton>
        </motion.div>
        
        <motion.p
          className="mt-8 text-zinc-600 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          Sem cartao de credito. Configuracao em 5 minutos.
        </motion.p>
      </motion.div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="relative py-12 border-t border-white/5">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-white font-semibold">ROUTEFLOW</span>
          </div>
          
          <div className="flex gap-8 text-sm text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>
          
          <p className="text-zinc-600 text-sm">
            © 2026 ROUTEFLOW. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// MAIN LANDING PAGE COMPONENT
// ============================================
export function RouteflowLanding() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <CustomCursor />
      <NoiseOverlay />
      
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-[100] bg-zinc-950 flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-4 mx-auto"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <span className="text-white font-bold text-2xl">R</span>
              </motion.div>
              <motion.div
                className="text-white font-semibold text-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                ROUTEFLOW
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="bg-zinc-950 text-white overflow-x-hidden">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <TechnologySection />
        <TrustSection />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}

export default RouteflowLanding;
