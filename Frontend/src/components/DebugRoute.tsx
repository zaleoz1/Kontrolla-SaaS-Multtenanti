import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface DebugRouteProps {
  children: React.ReactNode;
  routeName: string;
}

export function DebugRoute({ children, routeName }: DebugRouteProps) {
  const location = useLocation();

  useEffect(() => {
    console.log(`🔍 Rota ${routeName} carregada:`, location.pathname);
    console.log(`🔍 Hash:`, location.hash);
    console.log(`🔍 Search:`, location.search);
  }, [location, routeName]);

  return <>{children}</>;
}
