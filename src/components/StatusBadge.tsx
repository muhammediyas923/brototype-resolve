import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "pending" | "in_review" | "resolved";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getVariant = () => {
    switch (status) {
      case "pending":
        return "secondary";
      case "in_review":
        return "default";
      case "resolved":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStyles = () => {
    switch (status) {
      case "pending":
        return "bg-muted text-muted-foreground";
      case "in_review":
        return "bg-warning text-warning-foreground";
      case "resolved":
        return "bg-success text-success-foreground";
      default:
        return "";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in_review":
        return "In Review";
      case "resolved":
        return "Resolved";
      default:
        return status;
    }
  };

  return (
    <Badge variant={getVariant()} className={cn(getStyles(), className)}>
      {getLabel()}
    </Badge>
  );
};
