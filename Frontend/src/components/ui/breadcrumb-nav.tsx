import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  const location = useLocation();

  // Adiciona o dashboard como primeiro item se não estiver na raiz
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/", icon: Home },
    ...items,
  ];

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const Icon = item.icon;

        if (isLast) {
          return (
            <div key={index} className="flex items-center space-x-1">
              {Icon && <Icon className="h-4 w-4" />}
              <span className="font-medium text-foreground">{item.label}</span>
            </div>
          );
        }

        return (
          <div key={index} className="flex items-center space-x-1">
            {item.href ? (
              <Link
                to={item.href}
                className="flex items-center space-x-1 hover:text-foreground transition-colors"
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <div className="flex items-center space-x-1">
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </div>
            )}
            <ChevronRight className="h-4 w-4" />
          </div>
        );
      })}
    </nav>
  );
}

// Hook para gerar breadcrumbs automaticamente baseado na rota atual
export function useBreadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const breadcrumbItems: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = segment
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return {
      label,
      href: index === pathSegments.length - 1 ? undefined : href,
    };
  });

  return breadcrumbItems;
}
