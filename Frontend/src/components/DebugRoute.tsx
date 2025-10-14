import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface DebugRouteProps {
  children: React.ReactNode;
  routeName: string;
}

export function DebugRoute({ children, routeName }: DebugRouteProps) {
  const location = useLocation();

  useEffect(() => {
    // Debug route information removed for security
  }, [location, routeName]);

  return <>{children}</>;
}
