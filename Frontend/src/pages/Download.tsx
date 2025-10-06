import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, Clock, ArrowRight, Sparkles } from "lucide-react";

const DownloadPage = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
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

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Simular progresso do download
      const interval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsDownloading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Fazer download do arquivo
      const response = await fetch('/downloads/KontrollaPro-Setup-1.0.0.exe');
      if (!response.ok) {
        throw new Error('Erro ao baixar o arquivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'KontrollaPro-Setup-1.0.0.exe';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Erro no download:', error);
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 scroll-smooth">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200/60 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => window.history.back()}
            >
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="KontrollaPro Logo" 
                  className="h-12 w-12 rounded-xl shadow-sm"
                />
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-blue-500/20"
                  whileHover={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
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
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium px-6 py-2"
              >
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Voltar
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20"
      >
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop&crop=center')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90" />
          
          {/* Animated Grid */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              animate={heroInView ? "animate" : "initial"}
            >
              <motion.div variants={fadeInUp}>
                <div className="mb-6 bg-green-500/10 text-green-400 border border-green-500/20 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Versão Desktop Disponível
                </div>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight"
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
                className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed"
              >
                A versão desktop completa do seu sistema de gestão empresarial. 
                Instale e use offline com todas as funcionalidades.
              </motion.p>

              {/* Download Button */}
              <motion.div 
                variants={fadeInUp}
                className="text-center mb-8"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                  >
                    {isDownloading ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Baixando... {downloadProgress}%
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Download className="h-6 w-6" />
                        Baixar Agora (171 MB)
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </motion.div>

                {/* Progress Bar */}
                {isDownloading && (
                  <motion.div 
                    className="mt-4 w-full max-w-md mx-auto"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-gray-200 rounded-full h-2">
                      <motion.div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${downloadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      ></motion.div>
                    </div>
                  </motion.div>
                )}

                <motion.p 
                  className="text-sm text-slate-400 mt-4 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  viewport={{ once: true }}
                >
                  <Clock className="inline h-4 w-4 mr-1" />
                  Tempo estimado: 2-5 minutos (dependendo da conexão)
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
