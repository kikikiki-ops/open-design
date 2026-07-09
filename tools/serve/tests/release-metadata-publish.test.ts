import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { startReleaseStorageFixtureServer } from "../src/release-storage-fixture.js";

function runNode(args: string[], options: { cwd: string; env: NodeJS.ProcessEnv }): Promise<void> {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, args, options);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) {
        resolveRun();
      } else {
        rejectRun(new Error(`node ${args.join(" ")} exited ${String(code)}\n${stdout}\n${stderr}`));
      }
    });
  });
}

describe("shared release metadata publisher", () => {
  it("publishes complete beta, prerelease, preview, and stable metadata through the release storage fixture", async () => {
    const repoRoot = resolve(import.meta.dirname, "../../..");
    const root = await mkdtemp(join(tmpdir(), "od-release-metadata-publish-"));
    const server = await startReleaseStorageFixtureServer();
    try {
      for (const [channel, version] of [
        ["beta", "1.2.3-beta.4"],
        ["prerelease", "1.2.3-prerelease.4"],
        ["preview", "1.2.3-preview.4"],
        ["stable", "1.2.3"],
      ] as const) {
        const changelogRoot = join(root, channel, "CHANGELOG");
        const manifestDir = join(root, channel, "manifests");
        const metadataDir = join(root, channel, "metadata");
        const releaseNotesDir = join(changelogRoot, `v${version}`);
        await mkdir(manifestDir, { recursive: true });
        await mkdir(releaseNotesDir, { recursive: true });
        await writeFile(join(releaseNotesDir, "en.md"), `# Open Design ${version}\n\nEnglish notes.\n`, "utf8");
        await writeFile(join(releaseNotesDir, "zh-CN.md"), `# Open Design ${version}\n\n中文说明。\n`, "utf8");
        await writeFile(join(releaseNotesDir, "en.html"), `<h1>Open Design ${version}</h1>\n`, "utf8");
        const base = {
          channel,
          enabled: true,
          github: { commit: "abc123", runId: 42 },
          r2: { versionPrefix: `${channel}/versions/${version}` },
          releaseVersion: version,
          status: "published",
          version: 1,
        };
        await writeFile(
          join(manifestDir, "mac_arm64.json"),
          JSON.stringify(
            {
              ...base,
              arch: "arm64",
              artifacts: { dmg: { url: "https://example.test/dmg" }, payload: { url: "https://example.test/mac-payload" } },
              feed: null,
              legacyPlatformKey: "mac",
              platformKey: "mac_arm64",
              releaseTarget: "mac_arm64",
              signed: true,
            },
            null,
            2,
          ),
          "utf8",
        );
        await writeFile(
          join(manifestDir, "win_x64.json"),
          JSON.stringify(
            {
              ...base,
              arch: "x64",
              artifacts: { installer: { url: "https://example.test/exe" }, payload: { url: "https://example.test/win-payload" } },
              feed: null,
              legacyPlatformKey: "win",
              platformKey: "win_x64",
              releaseTarget: "win_x64",
              signed: false,
            },
            null,
            2,
          ),
          "utf8",
        );

        const env = {
          ...process.env,
          BASE_VERSION: "1.2.3",
          ENABLE_LINUX_X64: "false",
          ENABLE_MAC_ARM64: "true",
          ENABLE_MAC_X64: "false",
          ENABLE_WIN_X64: "true",
          MAC_ARM64_RESULT: "success",
          OPEN_DESIGN_RELEASE_NOTES_ROOT: changelogRoot,
          RELEASE_ASSET_SUFFIX: "",
          RELEASE_CHANNEL: channel,
          RELEASE_COMMIT: "abc123",
          RELEASE_MANIFEST_DIR: manifestDir,
          RELEASE_METADATA_DIR: metadataDir,
          RELEASE_OUTPUTS_PATH: join(metadataDir, "outputs.json"),
          RELEASE_PUBLIC_ORIGIN: "https://releases.example.test",
          RELEASE_RUN_ID: "42",
          RELEASE_SIGNED: "true",
          RELEASE_STORAGE_ACCESS_KEY_ID: "ak",
          RELEASE_STORAGE_BUCKET: server.info.bucket,
          RELEASE_STORAGE_ENDPOINT: server.info.endpointUrl,
          RELEASE_STORAGE_REGION: "auto",
          RELEASE_STORAGE_SECRET_ACCESS_KEY: "sk",
          RELEASE_VERSION: version,
          STATE_SOURCE: "local-tools-serve",
          WIN_X64_RESULT: "success",
          ...(channel === "beta" ? { RELEASE_LATEST_CAS_REQUIRED: "true" } : {}),
        };
        await runNode(["--experimental-strip-types", "tools/release/src/storage/publish-metadata.ts"], {
          cwd: repoRoot,
          env,
        });

        const metadata = JSON.parse(await readFile(join(metadataDir, "metadata.json"), "utf8")) as {
          channel?: string;
          releaseState?: string;
          releaseTargets?: {
            mac_arm64?: { artifacts?: { payload?: { url?: string } } };
            win_x64?: { artifacts?: { payload?: { url?: string } } };
          };
          releaseNotes?: {
            files?: Record<string, {
              html?: { contentType?: string; url?: string };
              markdown?: { contentType?: string; url?: string };
            }>;
          };
          allReadyTargetsSigned?: boolean;
          signed?: boolean;
          stableVersion?: string;
          github?: { commit?: string };
        };
        expect(metadata.channel).toBe(channel);
        expect(metadata.releaseState).toBe("complete");
        expect(metadata.signed).toBe(true);
        expect(metadata.allReadyTargetsSigned).toBe(false);
        expect(metadata.releaseTargets?.mac_arm64?.artifacts?.payload?.url).toBe("https://example.test/mac-payload");
        expect(metadata.releaseTargets?.win_x64?.artifacts?.payload?.url).toBe("https://example.test/win-payload");
        // github attribution must round-trip from the RELEASE_* env the workflow
        // passes; the stable promotion gate checks metadata.github.commit.
        expect(metadata.github?.commit).toBe("abc123");
        if (channel === "stable") {
          expect(metadata.stableVersion).toBe("1.2.3");
          expect(metadata.releaseNotes?.files?.en?.html?.url).toBe("https://releases.example.test/stable/versions/1.2.3/release-notes/en.html");
          expect(metadata.releaseNotes?.files?.en?.markdown?.contentType).toBe("text/markdown; charset=utf-8");
          expect(metadata.releaseNotes?.files?.["zh-CN"]?.markdown?.url).toBe("https://releases.example.test/stable/versions/1.2.3/release-notes/zh-CN.md");
          expect(server.getObject("stable/versions/1.2.3/release-notes/en.md")).not.toBeNull();
          expect(server.getObject("stable/versions/1.2.3/release-notes/zh-CN.md")).not.toBeNull();
          expect(server.getObject("stable/versions/1.2.3/release-notes/en.html")).not.toBeNull();
        }
        expect(server.getObject(`${channel}/latest/metadata.json`)).not.toBeNull();
      }
    } finally {
      await server.close();
    }
  });
});
