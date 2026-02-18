import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, Clock, ArrowRight, Sparkles } from "lucide-react";
import { useImagePath } from "@/hooks/useImagePath";

const DownloadPage = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const logoPath = useImagePath('logo.png');
  
  // Refs para animações
  const heroRef = useRef(null);
  
  // Hooks de animação
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  
  // Variantes de animação
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
  };
  
  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };
  
  const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
  };

  const handleDownload = () => {
    window.open('https://www.mediafire.com/file/ifd86wd0u5ent8v/KontrollaPro-Setup-1.0.0.exe/file', '_blank');
  };

  const handleManualDownload = () => {
    window.open('https://www.mediafire.com/file/7u59hkzaa8jaelm/KontrollaPro-win32-x64.rar/file', '_blank');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 scroll-smooth overflow-x-hidden touch-optimized">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200/60 z-50 shadow-sm safe-area-top"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer"
              onClick={() => window.history.back()}
            >
              <div className="relative">
                <img 
                  src={logoPath} 
                  alt="KontrollaPro Logo" 
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shadow-sm"
                />
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-blue-500/20"
                  whileHover={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                KontrollaPro
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
            >
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium px-3 sm:px-6 py-2 text-sm sm:text-base"
              >
                <ArrowRight className="mr-1 sm:mr-2 h-4 w-4 rotate-180" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16 sm:pt-20"
      >
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop&crop=center')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90" />
          
          {/* Animated Grid */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] sm:bg-[size:50px_50px]" />
          
          {/* Floating Elements - Reduzidos no mobile */}
          <motion.div
            className="absolute top-20 left-5 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, -25, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 right-5 sm:right-10 w-64 h-64 sm:w-96 sm:h-96 bg-green-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, -50, 0],
              y: [0, 25, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24 safe-area-bottom">
          <div className="text-center">
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              animate={heroInView ? "animate" : "initial"}
              className="no-select"
            >
              <motion.div variants={fadeInUp}>
                <div className="mb-4 sm:mb-6 bg-green-500/10 text-green-400 border border-green-500/20 inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="whitespace-nowrap">Versão Desktop Disponível</span>
                </div>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2"
              >
                Baixe o
                <motion.span 
                  className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent block"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  Kontrolla Pro Desktop
                </motion.span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-base sm:text-xl text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4"
              >
                A versão desktop completa do seu sistema de gestão empresarial. 
                Instale e use offline com todas as funcionalidades.
              </motion.p>

              {/* Download Buttons */}
              <motion.div 
                variants={fadeInUp}
                className="text-center mb-6 sm:mb-8 px-4 flex flex-col gap-4 items-center"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-full sm:w-auto"
                >
                  <Button
                    onClick={handleDownload}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 w-full sm:w-auto max-w-sm mx-auto"
                  >
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span className="text-sm sm:text-base whitespace-nowrap">Instalador Automático (EXE)</span>
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-full sm:w-auto"
                >
                  <Button
                    onClick={handleManualDownload}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 w-full sm:w-auto max-w-sm mx-auto"
                  >
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span className="text-sm sm:text-base whitespace-nowrap">Instalação Manual (RAR)</span>
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </Button>
                </motion.div>

                <motion.p 
                  className="text-xs sm:text-sm text-slate-400 mt-4 flex items-center justify-center px-4"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  viewport={{ once: true }}
                >
                  <Clock className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-center">Tempo estimado: 2-5 minutos (dependendo da conexão)</span>
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

    </div>
  );
};

export default DownloadPage;
