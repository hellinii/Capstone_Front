import { Badge } from "../../ui/badge";
import { cn } from "../../../utils/styling/styles";

type Verdict = "pass" | "fail" | "warning";

const config: Record<Verdict, { label: string; className: string }> = {
  pass:    { label: "합격",      className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  warning: { label: "조건부합격", className: "border-amber-200 bg-amber-50 text-amber-700" },
  fail:    { label: "불합격",    className: "border-red-200 bg-red-50 text-red-700" },
};

interface PassBadgeProps {
  verdict: Verdict;
  className?: string;
}

export function PassBadge({ verdict, className }: PassBadgeProps) {
  const { label, className: variantClass } = config[verdict];
  return (
    <Badge className={cn(variantClass, className)}>
      {label}
    </Badge>
  );
}
