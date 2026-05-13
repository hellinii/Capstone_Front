interface PrintLayoutProps {
  children: React.ReactNode;
}

export function PrintLayout({ children }: PrintLayoutProps) {
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          body { background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
      <div className="bg-white px-[20mm] py-[15mm] text-slate-900">
        {children}
      </div>
    </>
  );
}
