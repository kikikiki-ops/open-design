import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  closeDatabase,
  getRunFeedbackTelemetryAnchor,
  insertConversation,
  insertProject,
  openDatabase,
  setRunTelemetryAcceptedAnchor,
  upsertMessage,
} from '../src/db.js';
import {
  resolveFeedbackTraceId,
  resetAcceptedFinalTraceBodyIdsForTests,
  scopedTelemetryBodyId,
} from '../src/langfuse-trace.js';

describe('persisted telemetry accepted anchor', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'od-db-telemetry-anchor-'));
    resetAcceptedFinalTraceBodyIdsForTests();
  });

  afterEach(() => {
    closeDatabase();
    rmSync(tempDir, { recursive: true, force: true });
    resetAcceptedFinalTraceBodyIdsForTests();
  });

  function seedFailedAssistant(db: ReturnType<typeof openDatabase>, runId: string) {
    const now = Date.now();
    insertProject(db, {
      id: 'proj-1',
      name: 'Telemetry project',
      createdAt: now,
      updatedAt: now,
    });
    insertConversation(db, {
      id: 'conv-1',
      projectId: 'proj-1',
      title: 'Telemetry run',
      createdAt: now,
      updatedAt: now,
    });
    upsertMessage(db, 'conv-1', {
      id: 'assistant-1',
      role: 'assistant',
      content: 'partial',
      runId,
      runStatus: 'failed',
      telemetryFinalized: true,
      endedAt: now,
    });
  }

  it('survives restart: fallback accepted, final_message failed, feedback still targets runId:tf', () => {
    const runId = 'run-fallback-then-final-fail';
    const expectedBodyId = scopedTelemetryBodyId(runId, 'final', 'terminal_fallback');

    const db1 = openDatabase(tempDir, { dataDir: tempDir });
    seedFailedAssistant(db1, runId);
    expect(
      setRunTelemetryAcceptedAnchor(db1, {
        runId,
        assistantMessageId: 'assistant-1',
        bodyId: expectedBodyId,
        reportTrigger: 'terminal_fallback',
      }),
    ).toBe(true);
    // Simulate final_message failure: process memory cleared, no final accepted write.
    closeDatabase();
    resetAcceptedFinalTraceBodyIdsForTests();

    const db2 = openDatabase(tempDir, { dataDir: tempDir });
    const anchor = getRunFeedbackTelemetryAnchor(db2, runId, 'assistant-1');
    expect(anchor).toEqual({
      runStatus: 'failed',
      telemetryFinalized: true,
      acceptedTraceBodyId: expectedBodyId,
      acceptedReportTrigger: 'terminal_fallback',
    });
    expect(
      resolveFeedbackTraceId({
        runId,
        runStatus: anchor!.runStatus,
        telemetryFinalized: anchor!.telemetryFinalized,
        acceptedTraceBodyId: anchor!.acceptedTraceBodyId,
      }),
    ).toBe(expectedBodyId);
    // Without the persisted anchor, finalization alone would wrongly pick canonical runId.
    expect(
      resolveFeedbackTraceId({
        runId,
        runStatus: 'failed',
        telemetryFinalized: true,
      }),
    ).toBe(runId);
  });

  it('does not demote an accepted final_message anchor with a later terminal_fallback write', () => {
    const runId = 'run-final-wins';
    const db = openDatabase(tempDir, { dataDir: tempDir });
    seedFailedAssistant(db, runId);
    expect(
      setRunTelemetryAcceptedAnchor(db, {
        runId,
        assistantMessageId: 'assistant-1',
        bodyId: runId,
        reportTrigger: 'final_message',
      }),
    ).toBe(true);
    expect(
      setRunTelemetryAcceptedAnchor(db, {
        runId,
        assistantMessageId: 'assistant-1',
        bodyId: `${runId}:tf`,
        reportTrigger: 'terminal_fallback',
      }),
    ).toBe(false);
    const anchor = getRunFeedbackTelemetryAnchor(db, runId, 'assistant-1');
    expect(anchor?.acceptedTraceBodyId).toBe(runId);
    expect(anchor?.acceptedReportTrigger).toBe('final_message');
  });
});
