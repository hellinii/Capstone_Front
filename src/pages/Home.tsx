import { BasicInfo } from "./BasicInfo";
import { TestItems } from "./TestItems";
import { TCDetail } from "./TCDetail";
import { DataUpload } from "./DataUpload";
import { ColumnMapping } from "./ColumnMapping";
import { DataValidation } from "./DataValidation";
import { LandingPage } from "./LandingPage";

/**
 * Home page — redirects to the first workflow step.
 */
export function Home() {
  return <LandingPage />;
}

export { BasicInfo, TestItems, TCDetail, DataUpload, ColumnMapping, DataValidation };
