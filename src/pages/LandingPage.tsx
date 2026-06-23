import { useRef, useState, type ReactNode, type PointerEvent, type WheelEvent } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Database,
  Download,
  FileText,
  Gauge,
  Layers3,
  LineChart,
  MousePointer2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "../utils/styling/styles";
import "../styles/landing.css";

const processSteps = [
  { label: "Basic info", icon: ClipboardCheck },
  { label: "Metrics", icon: Gauge },
  { label: "Metric details", icon: Layers3 },
  { label: "Data upload", icon: Upload },
  { label: "Column mapping", icon: Database },
  { label: "Validation", icon: ShieldCheck },
  { label: "Report", icon: FileText },
];

const reportHighlights = [
  {
    title: "Evaluation overview",
    description:
      "Model information, evaluation purpose, dataset summary, and test environment are organized at the top of the report.",
  },
  {
    title: "Metric results",
    description:
      "Selected metrics show target criteria, measured values, pass status, and charts reviewers can inspect quickly.",
  },
  {
    title: "Validation and recommendations",
    description:
      "Data validation results, interpretation, conclusions, and recommended actions are included in the same document.",
  },
];

const showcaseScreens = [
  {
    step: "01",
    title: "Evaluation setup",
    description:
      "Start by defining the model, evaluation purpose, task type, and environment so every following step uses the right context.",
    route: "/app/basic-info",
    highlight: "Task type and model information shape the metric set and report structure.",
  },
  {
    step: "02",
    title: "Metric selection",
    description:
      "Choose the performance metrics that matter for the model, from Accuracy and Precision to Recall, F1 Score, AUROC, and class-wise checks.",
    route: "/app/metrics",
    highlight: "Selected metrics become the evaluation criteria used throughout validation and reporting.",
  },
  {
    step: "03",
    title: "Data upload",
    description:
      "Upload evaluation data with fields like id, y_true, y_pred, and score so the system can compare the correct answer with the model prediction.",
    route: "/app/data-upload",
    highlight: "The same step also records the training dataset used to build the model, including sample counts and representative examples.",
  },
  {
    step: "04",
    title: "Data validation",
    description:
      "Check whether the uploaded data is ready for evaluation before any score is calculated.",
    route: "/app/data-validation",
    highlight: "Validation reviews required columns, missing values, label formats, prediction values, score ranges, and metric-specific rules.",
  },
] as const;

function ProductShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full max-w-full overflow-hidden rounded-lg border border-border bg-card shadow-[0_18px_45px_rgba(15,23,42,0.10)]",
        className,
      )}
    >
      <div className="flex h-10 items-center gap-2 border-b border-border bg-muted/40 px-4">
        <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
        <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
        <span className="h-3 w-3 rounded-full bg-[#22C55E]" />
        <span className="ml-3 text-xs text-muted-foreground">
          app.ml-evaluation.io
        </span>
      </div>
      {children}
    </div>
  );
}

function HeroPreview() {
  return (
    <ProductShell className="landing-preview mx-auto w-full max-w-5xl">
      <div className="grid min-h-[420px] min-w-0 grid-cols-[220px_1fr] bg-[#FAFAFA] max-md:grid-cols-1">
        <aside className="border-r border-border bg-card p-5 max-md:hidden">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <LineChart className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">ML Evaluation</p>
              <p className="text-xs text-muted-foreground">Workspace</p>
            </div>
          </div>
          <div className="space-y-2">
            {processSteps.slice(0, 6).map((step, index) => (
              <div
                key={step.label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  index === 1
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                <step.icon className="h-4 w-4" />
                {step.label}
              </div>
            ))}
          </div>
        </aside>
        <div className="min-w-0 p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">
                Document Classification Model
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Evaluation workflow
              </h2>
            </div>
            <span className="rounded-md border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-xs font-medium text-[#047857]">
              Ready
            </span>
          </div>
          <div className="grid min-w-0 gap-4 md:grid-cols-3">
            {[
              ["Accuracy", "94.2%", "+2.8"],
              ["F1-score", "91.7%", "+1.9"],
              ["Latency", "42 ms", "-11"],
            ].map(([label, value, delta]) => (
              <div key={label} className="rounded-lg border bg-card p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="text-xs font-medium text-[#047857]">{delta}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 min-w-0 rounded-lg border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-medium">Selected metrics</p>
              <p className="text-xs text-muted-foreground">3 of 6 selected</p>
            </div>
            <div className="space-y-3">
              {["Accuracy", "Precision", "F1-score"].map((metric, index) => (
                <div key={metric} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${82 - index * 12}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm text-muted-foreground">
                    {92 - index * 3}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProductShell>
  );
}

function LiveProcessDemo() {
  const stepLabels = [
    "Basic info",
    "Metrics",
    "Metric details",
    "Data upload",
    "Column mapping",
    "Validation",
    "Final report",
  ];

  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-lg border border-border bg-[#FAFAFA] shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
      <div className="h-14 border-b border-border bg-card">
        <div className="flex h-full items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <LineChart className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-base font-semibold leading-none">ML Evaluation</p>
              <p className="text-xs text-muted-foreground">ISO/IEC 4213 based</p>
            </div>
          </div>
          <span className="rounded-md border bg-card px-3 py-1 text-xs text-muted-foreground">
            Live workflow
          </span>
        </div>
      </div>
      <div className="h-12 border-b border-border bg-card">
        <div className="grid h-full grid-cols-7 max-md:grid-cols-4 max-sm:grid-cols-2">
          {stepLabels.map((label, index) => (
            <div
              key={label}
              className="landing-live-tab relative flex items-center justify-center gap-2 text-sm text-muted-foreground"
              style={{ animationDelay: `${index * 4.2}s` }}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-xs">
                {index + 1}
              </span>
              <span className="hidden md:inline">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="landing-live-stage relative min-h-[620px] overflow-hidden">
        <BasicInfoDemo />
        <MetricsDemo />
        <MetricDetailsDemo />
        <DataUploadDemo />
        <ColumnMappingDemo />
        <ValidationDemo />
        <ReportDemo />
      </div>
    </div>
  );
}

function DemoPanel({
  index,
  children,
  action,
}: {
  index: number;
  children: ReactNode;
  action: string;
}) {
  return (
    <div
      className="landing-live-panel absolute inset-0 overflow-hidden px-8 pb-10 pt-8"
      style={{ animationDelay: `${index * 4.2}s` }}
    >
      <div className={cn("landing-demo-cursor", `landing-demo-cursor-${index}`)}>
        <MousePointer2 className="h-5 w-5 fill-primary text-primary" />
        <span>{action}</span>
      </div>
      {children}
    </div>
  );
}

function DemoField({
  label,
  value,
  typing = false,
}: {
  label: string;
  value: string;
  typing?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label} <span className="text-red-600">*</span>
      </label>
      <div className={cn("rounded-md border bg-input-background px-3 py-2 text-sm", typing && "landing-type")}>
        {value}
      </div>
    </div>
  );
}

function BasicInfoDemo() {
  return (
    <DemoPanel index={0} action="typing">
      <div className="landing-basic-scroll space-y-6">
        <div>
          <h3 className="mb-2 text-2xl font-bold text-foreground">Basic information</h3>
          <p className="text-sm text-muted-foreground">
            Fill in the organization, model, and evaluation request details used throughout the workflow.
          </p>
        </div>
        <div className="rounded-xl border bg-card">
          <div className="px-6 pt-6">
            <h4 className="text-lg font-semibold">Organization</h4>
          </div>
          <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
            <DemoField label="Company name" value="Apex AI Lab" typing />
            <DemoField label="Representative" value="Jane Lee" />
            <DemoField label="Business number" value="123-45-67890" />
            <DemoField label="Phone" value="02-1234-5678" />
          </div>
        </div>
        <div className="rounded-xl border bg-card">
          <div className="px-6 pt-6">
            <h4 className="text-lg font-semibold">Model information</h4>
          </div>
          <div className="space-y-6 px-6 py-6">
            <div className="grid gap-5 md:grid-cols-2">
              <DemoField label="Model name" value="ReviewClassifier-B" typing />
              <DemoField label="Version" value="v1.0.0" />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Classifier type <span className="text-red-600">*</span>
              </label>
              <div className="grid gap-3 md:grid-cols-3">
                {["Binary", "Multi-class", "Multi-label"].map((label, index) => (
                  <div
                    key={label}
                    className={cn(
                      "landing-click-target rounded-lg border-2 p-5",
                      index === 0 ? "border-primary bg-blue-50" : "border-border bg-card",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className={cn("mt-0.5 h-4 w-4 rounded-full border", index === 0 && "border-primary bg-primary")} />
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          {index === 0 ? "One of two classes per sample" : "Alternative classifier type"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoPanel>
  );
}

function MetricsDemo() {
  return (
    <DemoPanel index={1} action="click metrics">
      <div className="mb-6">
        <h3 className="mb-2 text-2xl font-bold text-foreground">Metric selection</h3>
        <p className="text-sm text-muted-foreground">
          Choose the evaluation metrics that should be included in the report.
        </p>
      </div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm"><span className="font-semibold">2</span> selected</p>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-secondary px-3 py-1 text-sm">15 matching metrics</span>
          <span className="rounded-md border px-3 py-1 text-sm text-muted-foreground">Reset columns</span>
        </div>
      </div>
      <div className="landing-metrics-scroll grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          ["M1", "Accuracy", true],
          ["M2", "Precision", true],
          ["M3", "Recall", false],
          ["M4", "F1 Score", false],
          ["M5", "F-beta Score", false],
          ["M6", "KL Divergence", false],
          ["M7", "Specificity", false],
          ["M8", "FPR", false],
        ].map(([code, name, selected]) => (
          <div
            key={name as string}
            className={cn(
              "landing-click-target min-h-[172px] rounded-lg border-2 p-5",
              selected ? "border-primary bg-blue-50" : "border-border bg-card",
            )}
          >
            <div className="mb-3 flex items-start gap-2">
              <span className={cn("mt-0.5 h-4 w-4 rounded border", selected && "border-primary bg-primary")} />
              <div className="ml-auto rounded border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">y_true</div>
            </div>
            <p className="font-mono text-xs uppercase text-muted-foreground">{code}</p>
            <h4 className="mt-2 text-base font-semibold">{name}</h4>
            <p className="mt-2 text-xs leading-5 text-[#6B7280]">
              Evaluates binary classification performance using confirmed labels and predictions.
            </p>
          </div>
        ))}
      </div>
    </DemoPanel>
  );
}

function MetricDetailsDemo() {
  return (
    <DemoPanel index={2} action="typing 0.95">
      <div className="mb-6">
        <h3 className="mb-2 text-2xl font-bold text-foreground">Metric details</h3>
        <p className="text-sm text-muted-foreground">Set target values and any extra inputs required by each selected metric.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border bg-card">
          <div className="px-6 pt-6"><h4 className="text-lg font-semibold">Selected metrics</h4></div>
          <div className="space-y-2 px-6 py-6">
            {["M1 Accuracy", "M2 Precision"].map((metric, index) => (
              <div key={metric} className={cn("rounded-lg border p-3", index === 0 ? "border-primary bg-blue-50" : "bg-card")}>
                <p className="font-mono text-xs text-muted-foreground">{metric.split(" ")[0]}</p>
                <p className="text-sm font-semibold">{metric.replace(/^M\d /, "")}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card">
          <div className="px-6 pt-6">
            <h4 className="text-lg font-semibold">M1: Accuracy</h4>
            <p className="text-sm text-muted-foreground">Overall proportion of correct predictions.</p>
          </div>
          <div className="space-y-6 px-6 py-6">
            <DemoField label="Target value" value="0.95" typing />
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-950">Required columns for this metric</p>
              <div className="mt-3 flex gap-2">
                <span className="rounded-md bg-secondary px-2 py-1 text-xs">y_true</span>
                <span className="rounded-md bg-secondary px-2 py-1 text-xs">y_pred</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoPanel>
  );
}

function DataUploadDemo() {
  return (
    <DemoPanel index={3} action="scroll & upload">
      <div className="mb-6">
        <h3 className="mb-2 text-2xl font-bold text-foreground">Data upload</h3>
        <p className="text-sm text-muted-foreground">
          Upload the evaluation data first, then enter the training dataset information used to build the model.
        </p>
      </div>
      <div className="landing-upload-scroll space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-primary bg-blue-50 p-4">
          <p className="text-sm font-semibold">1. Evaluation data</p>
          <p className="mt-1 text-xs text-muted-foreground">File with id, ground truth, prediction, and optional latency</p>
        </div>
        <div className="rounded-lg border border-primary bg-blue-50 p-4">
          <p className="text-sm font-semibold">2. Training dataset</p>
          <p className="mt-1 text-xs text-muted-foreground">Dataset summary and example file for the final report</p>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="landing-file-pick rounded-xl border-2 border-dashed bg-card p-6">
          <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
          <h4 className="text-base font-semibold">Click to choose evaluation data</h4>
          <p className="mt-1 text-sm text-muted-foreground">eval_result_1775625159458.json</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h4 className="text-lg font-semibold">Training dataset information</h4>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <DemoField label="Training dataset name" value="Binary review dataset" />
            <DemoField label="Training samples" value="100" />
            <DemoField label="Evaluation samples" value="100" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <h4 className="text-lg font-semibold">Training data example</h4>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {["Representative valid example", "Edge or unsuitable example"].map((title) => (
            <div key={title} className="rounded-lg border p-4">
              <p className="text-sm font-semibold">{title}</p>
              <div className="mt-4 flex min-h-[92px] items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground">
                Choose example file
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </DemoPanel>
  );
}

function ColumnMappingDemo() {
  return (
    <DemoPanel index={4} action="scroll & select">
      <div className="landing-mapping-scroll space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="mb-2 text-2xl font-bold text-foreground">Column mapping review</h3>
          <p className="text-sm text-muted-foreground">
            Review and adjust the mapped roles to ensure your dataset is correctly interpreted for evaluation.
          </p>
        </div>
        <span className="rounded-md border px-3 py-1 text-sm">Binary workflow</span>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <h4 className="text-lg font-semibold">Required Columns</h4>
        <p className="mt-3 text-sm text-muted-foreground">
          These are the columns required by your selected evaluation metrics.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {["id", "y_true", "y_pred"].map((role) => (
            <div key={role} className="rounded-lg border p-5">
              <p className="text-lg font-semibold">
                {role} <span className="rounded-md bg-secondary px-2 py-1 text-xs">Mapped</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Required by Accuracy and Precision</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <h4 className="text-lg font-semibold">Binary classification settings</h4>
        <div className="mt-5 flex items-center gap-4">
          <span className="text-sm font-medium">Positive class value:</span>
          <button className="landing-dropdown-click flex h-10 w-48 items-center justify-between rounded-md border bg-input-background px-3 text-left">
            1
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="rounded-lg border bg-card">
        <div className="grid grid-cols-[1fr_1fr_1fr] border-b bg-muted/40 px-4 py-3 text-sm font-medium">
          <span>Uploaded column</span>
          <span>Sample values</span>
          <span>Role</span>
        </div>
        {[
          ["row_id", "S001, S002, S003", "id"],
          ["actual_result", "1, 0, 1", "y_true"],
          ["predicted_result", "1, 1, 1", "y_pred"],
          ["positive_score", "0.92, 0.67, 0.88", "score"],
          ["comment", "pass, review, retry", "ignore"],
        ].map(([column, values, role]) => (
          <div key={column} className="grid grid-cols-[1fr_1fr_1fr] items-center border-b px-4 py-3 text-sm">
            <span className="font-medium">{column}</span>
            <span className="text-muted-foreground">{values}</span>
            <button className="flex h-9 w-40 items-center justify-between rounded-md border bg-input-background px-3 text-left">
              {role}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-green-200 bg-[#F0FDF4] p-4 text-sm text-slate-700">
        All required settings are satisfied. You can confirm this mapping and continue to validation.
      </div>
      </div>
    </DemoPanel>
  );
}

function ValidationDemo() {
  return (
    <DemoPanel index={5} action="scroll checks">
      <div className="mb-6">
        <h3 className="mb-2 text-2xl font-bold text-foreground">Data validation</h3>
        <p className="text-sm text-muted-foreground">Review the backend validation result before running the evaluation.</p>
      </div>
      <div className="mb-5 rounded-lg border bg-card p-4 text-sm">
        <CheckCircle2 className="mr-2 inline h-4 w-4 text-green-600" />
        All validation checks passed. You can proceed to run the evaluation.
      </div>
      <div className="landing-validation-scroll rounded-xl border bg-card">
        <div className="px-6 pt-6"><h4 className="text-lg font-semibold">Validation Details</h4></div>
        <div className="space-y-5 px-6 py-6">
          {["Common Checks", "Binary Checks", "Latency Checks"].map((group) => (
            <div key={group} className="overflow-hidden rounded-lg border">
              <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                <p className="text-sm font-semibold">{group}</p>
                <span className="text-xs font-medium text-muted-foreground">3 Passed</span>
              </div>
              <div className="grid grid-cols-[1fr_1fr_90px] px-4 py-3 text-sm">
                <span className="font-medium">Required values</span>
                <span className="text-muted-foreground">No missing values found</span>
                <span className="rounded-md bg-secondary px-2 py-1 text-center text-xs">Pass</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DemoPanel>
  );
}

function OldReportDemo() {
  return (
    <DemoPanel index={6} action="mouse wheel">
      <div className="rounded-lg bg-slate-50">
        <div className="mb-5 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <span className="text-sm text-slate-600">Final report</span>
          <button className="inline-flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-sm text-primary-foreground">
            <Download className="h-4 w-4" />
            PDF Download
          </button>
        </div>
        <div className="landing-report-scroll mx-auto max-h-[520px] max-w-4xl space-y-5 overflow-hidden px-6 pb-10">
          <section className="rounded-lg border bg-white p-8">
            <p className="text-sm text-slate-500">AI Model Evaluation Report</p>
            <h3 className="mt-2 text-3xl font-semibold">ReviewClassifier-B</h3>
            <p className="mt-2 text-slate-600">Binary classification · v1.0.0</p>
          </section>
          {[
            ["Evaluation Scope", "Binary classifier evaluation based on Accuracy and F1-score."],
            ["Dataset", "Binary review dataset · training 100 · evaluation 100"],
            ["KPI Results", "Accuracy target 0.95 · F1-score target 0.95"],
            ["Data Validation", "All validation checks passed before report generation."],
          ].map(([title, body]) => (
            <section key={title} className="rounded-lg border bg-white p-6">
              <h4 className="text-lg font-semibold">{title}</h4>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </DemoPanel>
  );
}

function ReportDemo() {
  return (
    <DemoPanel index={6} action="mouse wheel">
      <div className="rounded-lg bg-slate-50">
        <div className="mb-5 flex items-center justify-end border-b border-slate-200 bg-white px-6 py-3">
          <button className="inline-flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-sm text-primary-foreground">
            <Download className="h-4 w-4" />
            PDF 다운로드
          </button>
        </div>
        <div className="landing-report-scroll mx-auto max-h-[520px] max-w-4xl space-y-8 overflow-hidden px-6 pb-10 text-slate-700">
          <section className="bg-slate-50 px-10 py-8">
            <p className="text-center text-xs font-semibold tracking-wide text-slate-400">
              기준 표준: ISO/IEC TS 4213:2022
            </p>
            <h3 className="mt-6 text-center text-3xl font-bold text-slate-900">
              기계학습 분류 성능 시험결과서
            </h3>
            <div className="mx-auto mt-8 grid max-w-md grid-cols-[100px_1fr] gap-y-2 text-sm">
              <span>문서 번호</span>
              <strong>RPT-2025-0001</strong>
              <span>평가 유형</span>
              <strong>이진 분류 (Binary Classification)</strong>
              <span>평가 대상</span>
              <strong>ReviewClassifier-B</strong>
            </div>
          </section>
          {[
            [
              "SECTION 01",
              "1. 개요",
              "본 시험결과서는 ReviewClassifier-B를 대상으로 ISO/IEC TS 4213:2022 기준에 따른 이진 분류 성능 및 신뢰성 시험을 수행한 결과를 기술한 문서이다.",
            ],
            [
              "SECTION 02",
              "2. 데이터셋 정보",
              "학습 데이터 100건, 평가 데이터 100건을 기준으로 시험을 수행했으며 평가 데이터는 id, y_true, y_pred, score 컬럼을 포함한다.",
            ],
            [
              "SECTION 03",
              "3. 평가 지표",
              "Accuracy와 Precision을 주요 지표로 선정했으며 각 지표의 목표값은 0.95로 설정했다.",
            ],
            [
              "SECTION 04",
              "4. 데이터 검증 결과",
              "필수 컬럼, 결측치, 이진 클래스 값, 점수 범위 검증을 모두 통과했다.",
            ],
          ].map(([section, title, body]) => (
            <section key={title} className="border-t border-slate-200 bg-slate-50 py-7">
              <p className="text-xs font-semibold tracking-[0.28em] text-slate-400">
                {section}
              </p>
              <h4 className="mt-2 text-2xl font-bold text-slate-900">{title}</h4>
              <p className="mt-6 text-sm leading-7 text-slate-700">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </DemoPanel>
  );
}

function ShowcaseScreenCard({
  screen,
  index,
  className,
}: {
  screen: (typeof showcaseScreens)[number];
  index: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card shadow-[0_18px_42px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-xl font-semibold text-foreground">{screen.title}</h3>
      </div>
      <div
        className={cn(
          "landing-showcase-frame bg-[#FAFAFA] p-6",
          index === 1 && "landing-showcase-metrics-frame",
          `landing-showcase-frame-${index}`,
        )}
      >
        {index === 1 ? (
          <MetricSelectionPreview />
        ) : (
          <iframe
            title={`${screen.title} preview`}
            src={`${screen.route}?showcase=1`}
            className={cn(
              "landing-showcase-iframe border-0",
              `landing-showcase-iframe-${index}`,
            )}
          />
        )}
      </div>
    </div>
  );
}

function MetricSelectionPreview() {
  const metrics = [
    ["M1", "Accuracy", "Overall correctness", ["id", "y_true", "y_pred"]],
    ["M2", "Precision", "Positive predictive value", ["id", "y_true", "y_pred"]],
    ["M3", "Recall", "Sensitivity", ["id", "y_true", "y_pred"]],
    ["M4", "F1 Score", "Harmonic mean", ["id", "y_true", "y_pred"]],
    ["M5", "F-beta Score", "Weighted F score", ["id", "y_true", "y_pred", "beta"]],
    ["M6", "KL Divergence", "Distribution divergence", ["id", "y_true", "score"]],
    ["M7", "Specificity", "True negative rate", ["id", "y_true", "y_pred"]],
    ["M8", "FPR", "False positive rate", ["id", "y_true", "y_pred"]],
  ] as const;

  return (
    <div className="h-full overflow-hidden">
      <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 min-w-[190px] items-center rounded-md border bg-input-background px-3 text-sm text-muted-foreground">
            Search metrics
          </div>
          {["id", "y_true", "y_pred", "score"].map((column) => (
            <span
              key={column}
              className="rounded-md border bg-card px-3 py-2 font-mono text-xs text-muted-foreground"
            >
              {column}
            </span>
          ))}
        </div>
        <span className="shrink-0 rounded-md bg-secondary px-3 py-2 text-sm font-medium">
          15 matching metrics
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([code, name, subtitle, columns], index) => (
          <div
            key={code}
            className={cn(
              "min-h-[176px] rounded-lg border-2 bg-card p-5 shadow-sm",
              index < 4 ? "border-primary/50 bg-blue-50/60" : "border-border",
            )}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <span className="h-5 w-5 rounded border border-border bg-card" />
              <div className="flex flex-wrap justify-end gap-1">
                {columns.map((column) => (
                  <span
                    key={column}
                    className="rounded border bg-card px-2 py-1 font-mono text-[10px] leading-none"
                  >
                    {column}
                  </span>
                ))}
              </div>
            </div>
            <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
              {code}
            </p>
            <h4 className="mt-2 text-xl font-semibold leading-tight text-foreground">
              {name}
            </h4>
            <p className="mt-2 text-base text-foreground">{subtitle}</p>
            <p className="mt-3 text-sm leading-5 text-muted-foreground">
              {name === "Accuracy"
                ? "Measures how often predictions match the correct label."
                : name === "Precision"
                  ? "Checks how many positive predictions are actually correct."
                  : name === "Recall"
                    ? "Checks how many true positives the model finds."
                    : name === "F1 Score"
                      ? "Balances precision and recall in one score."
                      : "Uses selected columns to calculate model performance."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShowcaseText({ screen }: { screen: (typeof showcaseScreens)[number] }) {
  return (
    <div className="max-w-2xl">
      <p className="text-base font-medium text-primary">{screen.step}</p>
      <h3 className="mt-4 text-4xl font-semibold leading-tight text-foreground md:text-5xl">
        {screen.title}
      </h3>
      <p className="mt-6 text-xl leading-9 text-muted-foreground">
        {screen.description}
      </p>
      <div className="mt-7 flex gap-3 text-base leading-7 text-muted-foreground">
        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
        <span>{screen.highlight}</span>
      </div>
    </div>
  );
}

function ScreenShowcase() {
  return (
    <div className="space-y-24">
      {showcaseScreens.map((screen, index) => {
        const imageFirst = index % 2 === 0;

        return (
          <div
            key={screen.route}
            className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
          >
            <div className={cn(!imageFirst && "lg:order-2")}>
              <ShowcaseScreenCard screen={screen} index={index} />
            </div>
            <div className={cn(!imageFirst && "lg:order-1")}>
              <ShowcaseText screen={screen} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WhatYouCanEvaluate() {
  const items = [
    {
      title: "Binary classification",
      description: "Evaluate models that choose between two classes, such as pass/fail, positive/negative, or normal/abnormal.",
      icon: Gauge,
    },
    {
      title: "Multiclass classification",
      description: "Evaluate models that assign one class from many possible categories, such as product type or document topic.",
      icon: Layers3,
    },
    {
      title: "Multilabel classification",
      description: "Evaluate models that can assign multiple labels to one sample, such as tags, attributes, or detected issues.",
      icon: Database,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="rounded-lg border bg-card p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <item.icon className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function ReportPreview() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-hidden rounded-lg border bg-card shadow-[0_18px_42px_rgba(15,23,42,0.12)]">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-xl font-semibold text-foreground">Final report preview</h3>
        </div>
        <div className="landing-report-preview-frame bg-[#F8FAFC]">
          <ScrollableReportPreview />
        </div>
      </div>
      <div className="space-y-4">
        {reportHighlights.map((item, index) => (
          <div key={item.title} className="rounded-lg border bg-card p-6">
            <p className="text-sm font-medium text-primary">0{index + 1}</p>
            <h4 className="mt-3 text-lg font-semibold text-foreground">
              {item.title}
            </h4>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScrollableReportPreview() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    iframeRef.current?.contentWindow?.scrollBy({
      top: event.deltaY,
      left: event.deltaX,
      behavior: "auto",
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const previous = lastPointerRef.current;
    const deltaX = previous.x - event.clientX;
    const deltaY = previous.y - event.clientY;

    iframeRef.current?.contentWindow?.scrollBy({
      top: deltaY,
      left: deltaX,
      behavior: "auto",
    });

    lastPointerRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="relative h-full">
      <iframe
        ref={iframeRef}
        title="Final report preview"
        src="/report/preview"
        className="landing-report-preview-iframe border-0"
      />
      <div
        className={cn(
          "absolute inset-0 cursor-grab touch-none",
          isDragging && "cursor-grabbing",
        )}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        aria-label="Scrollable final report preview"
      />
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAFA] text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <LineChart className="h-4 w-4" />
            </div>
            <div>
              <p className="text-base font-semibold leading-none">
                ML Evaluation
              </p>
              <p className="text-xs text-muted-foreground">
                ISO/IEC 4213 based
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#process" className="hover:text-foreground">
              Process
            </a>
            <a href="#showcase" className="hover:text-foreground">
              Preview
            </a>
            <a href="#report" className="hover:text-foreground">
              Report
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto flex max-w-[1200px] flex-col justify-center gap-12 px-6 py-20">
          <div className="landing-fade-up mx-auto max-w-3xl text-center">
            <h1 className="mt-4 max-w-full text-3xl font-semibold leading-tight text-foreground sm:text-4xl md:text-6xl">
              Evaluate ML models from dataset to final report.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              ML Evaluation helps teams configure metrics, validate data, and
              produce a structured report through one guided workflow.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/workspaces">
                  Create Workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/app/basic-info">Start Evaluation</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="process" className="border-t border-border bg-card py-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mx-auto mb-16 max-w-5xl text-center">
              <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-5xl">
                See the full evaluation flow in motion.
              </h2>
            </div>
            <LiveProcessDemo />
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mx-auto mb-16 max-w-5xl text-center">
              <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-5xl">
                What you can evaluate
              </h2>
              <p className="mt-6 text-xl leading-8 text-primary md:text-2xl">
                Evaluate binary, multiclass, and multilabel classification models with the right metrics and data checks.
              </p>
            </div>
            <WhatYouCanEvaluate />
          </div>
        </section>

        <section id="showcase" className="py-24">
          <div className="mx-auto max-w-[1600px] px-6">
            <div className="mx-auto mb-20 max-w-5xl text-center">
              <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-5xl">
                How you can evaluate
              </h2>
              <p className="mt-6 text-xl leading-8 text-primary md:text-2xl">
                Configure the model, choose metrics, upload datasets, and validate the data before generating the final report.
              </p>
            </div>
            <ScreenShowcase />
          </div>
        </section>

        <section id="report" className="border-y border-border bg-card py-24">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mx-auto mb-16 max-w-5xl text-center">
              <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-5xl">
                Generate the final report
              </h2>
              <p className="mt-6 text-xl leading-8 text-primary md:text-2xl">
                Results, criteria, data quality, and recommendations are
                organized in one report view.
              </p>
            </div>
            <ReportPreview />
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-3xl font-semibold">
              Start organizing model evaluations.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Create a workspace or go directly into the evaluation workflow.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/workspaces">Create Workspace</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/app/basic-info">Start Evaluation</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
