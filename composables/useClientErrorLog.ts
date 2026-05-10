import { computed } from "vue";
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
    entries: computed(() => clientErrorEntries.value),
    push: pushClientError,
    pushFromUnknown: pushClientErrorFromUnknown,
    clear: clearClientErrors,
    exportJson: exportClientErrorsJson,
  };
}
