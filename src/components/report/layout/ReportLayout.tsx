import { useNavigate } from "react-router";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "../../ui/button";

interface ReportLayoutProps {
  children: React.ReactNode;
  onDownload: () => void;
}

export function ReportLayout({ children, onDownload }: ReportLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1.5 text-slate-600"
        >
          <ArrowLeft className="size-4" />
          뒤로가기
        </Button>

        <Button size="sm" onClick={onDownload} className="gap-1.5">
          <Download className="size-4" />
          PDF 다운로드
        </Button>
      </header>

      {/* Report body */}
      <main className="mx-auto max-w-4xl px-6 py-10">
        {children}
      </main>
    </div>
  );
}
