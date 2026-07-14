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

  it('ignores a stale or foreign assistantMessageId and falls back to the run row', () => {
    const runId = 'run-target';
    const otherRunId = 'run-other';
    const expectedBodyId = scopedTelemetryBodyId(runId, 'final', 'terminal_fallback');
    const db = openDatabase(tempDir, { dataDir: tempDir });
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
    // Foreign terminal assistant (different run) — must not steer the URL run.
    upsertMessage(db, 'conv-1', {
      id: 'assistant-foreign',
      role: 'assistant',
      content: 'other run',
      runId: otherRunId,
      runStatus: 'succeeded',
      telemetryFinalized: true,
      endedAt: now,
    });
    // User message id (no terminal run_status) — same trap as a stale client id.
    upsertMessage(db, 'conv-1', {
      id: 'user-1',
      role: 'user',
      content: 'prompt',
    });
    // Canonical terminal assistant for the feedback URL run.
    upsertMessage(db, 'conv-1', {
      id: 'assistant-target',
      role: 'assistant',
      content: 'partial',
      runId,
      runStatus: 'failed',
      telemetryFinalized: false,
      endedAt: now,
    });
    expect(
      setRunTelemetryAcceptedAnchor(db, {
        runId,
        assistantMessageId: 'assistant-target',
        bodyId: expectedBodyId,
        reportTrigger: 'terminal_fallback',
      }),
    ).toBe(true);

    for (const staleId of ['assistant-foreign', 'user-1', 'missing-id'] as const) {
      const anchor = getRunFeedbackTelemetryAnchor(db, runId, staleId);
      expect(anchor).toEqual({
        runStatus: 'failed',
        telemetryFinalized: false,
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
    }

    // Matching id + run_id + terminal status still wins.
    expect(getRunFeedbackTelemetryAnchor(db, runId, 'assistant-target')).toEqual({
      runStatus: 'failed',
      telemetryFinalized: false,
      acceptedTraceBodyId: expectedBodyId,
      acceptedReportTrigger: 'terminal_fallback',
    });
  });

  it('setRunTelemetryAcceptedAnchor ignores foreign message ids and writes the run row', () => {
    const runId = 'run-target-write';
    const otherRunId = 'run-other-write';
    const expectedBodyId = scopedTelemetryBodyId(runId, 'final', 'terminal_fallback');
    const foreignBodyId = scopedTelemetryBodyId(otherRunId, 'final', 'final_message');
    const db = openDatabase(tempDir, { dataDir: tempDir });
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
      id: 'assistant-foreign',
      role: 'assistant',
      content: 'other run',
      runId: otherRunId,
      runStatus: 'succeeded',
      telemetryFinalized: true,
      endedAt: now,
    });
    upsertMessage(db, 'conv-1', {
      id: 'assistant-target',
      role: 'assistant',
      content: 'partial',
      runId,
      runStatus: 'failed',
      telemetryFinalized: false,
      endedAt: now,
    });

    // Foreign id must not write the anchor onto the other run's row.
    expect(
      setRunTelemetryAcceptedAnchor(db, {
        runId,
        assistantMessageId: 'assistant-foreign',
        bodyId: expectedBodyId,
        reportTrigger: 'terminal_fallback',
      }),
    ).toBe(true);
    expect(getRunFeedbackTelemetryAnchor(db, runId)).toEqual({
      runStatus: 'failed',
      telemetryFinalized: false,
      acceptedTraceBodyId: expectedBodyId,
      acceptedReportTrigger: 'terminal_fallback',
    });
    expect(getRunFeedbackTelemetryAnchor(db, otherRunId, 'assistant-foreign')).toEqual({
      runStatus: 'succeeded',
      telemetryFinalized: true,
      acceptedTraceBodyId: null,
      acceptedReportTrigger: null,
    });

    // Matching id still writes the intended row.
    expect(
      setRunTelemetryAcceptedAnchor(db, {
        runId: otherRunId,
        assistantMessageId: 'assistant-foreign',
        bodyId: foreignBodyId,
        reportTrigger: 'final_message',
      }),
    ).toBe(true);
    expect(
      getRunFeedbackTelemetryAnchor(db, otherRunId, 'assistant-foreign')
        ?.acceptedTraceBodyId,
    ).toBe(foreignBodyId);
  });
});
