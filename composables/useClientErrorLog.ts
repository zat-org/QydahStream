import {
  clientErrorEntries,
  clearClientErrors,
  exportClientErrorsJson,
  pushClientError,
  pushClientErrorFromUnknown,
  type ClientErrorCategory,
  type ClientErrorEntry,
} from "~/utils/client-error-log";

export function useClientErrorLog() {
  return {
    entries: clientErrorEntries as Readonly<typeof clientErrorEntries>,
    push: pushClientError,
    pushFromUnknown: pushClientErrorFromUnknown,
    clear: clearClientErrors,
    exportJson: exportClientErrorsJson,
  };
}
