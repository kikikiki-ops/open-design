import { describe, expect, it } from "vitest";

import { extractDownloadAttributionTokenFromUrl } from "../src/download-attribution.js";

describe("download attribution token extraction", () => {
  it("extracts the token from the distributor path segment", () => {
    expect(
      extractDownloadAttributionTokenFromUrl(
        "https://download.open-design.ai/mac/arm64/oddl_Abc12345/Open-Design.dmg",
      ),
    ).toBe("oddl_Abc12345");
    expect(
      extractDownloadAttributionTokenFromUrl(
        "https://download.open-design.ai/windows/x64/token-123456/Open%20Design-setup.exe",
      ),
    ).toBe("token-123456");
  });

  it("does not treat GitHub release paths as attributed download URLs", () => {
    expect(
      extractDownloadAttributionTokenFromUrl(
        "https://github.com/nexu-io/open-design/releases/download/open-design-v1/Open-Design-mac-arm64.dmg",
      ),
    ).toBeNull();
  });
});
