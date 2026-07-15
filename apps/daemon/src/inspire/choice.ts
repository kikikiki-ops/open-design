import {
  applyFlowMarker,
  type FlowInspireChoice,
  type FlowSnapshot,
  type InspireChoiceRequest,
} from '@open-design/contracts';

export type InspireChoiceUpdateResult =
  | { status: 'updated'; flow: FlowSnapshot }
  | { status: 'unchanged'; flow: FlowSnapshot }
  | { status: 'conflict'; flow: FlowSnapshot };

function storedChoice(request: InspireChoiceRequest): FlowInspireChoice {
  return request.action === 'apply'
    ? {
        templateId: request.templateId ?? null,
        designSystemId: request.designSystemId ?? null,
        skipped: false,
      }
    : { templateId: null, designSystemId: null, skipped: true };
}

function choicesEqual(
  left: FlowInspireChoice | undefined,
  right: FlowInspireChoice,
): boolean {
  return left?.templateId === right.templateId
    && (left?.designSystemId ?? null) === right.designSystemId
    && left?.skipped === right.skipped;
}

function appliedChoiceDetail(choice: FlowInspireChoice): string {
  const parts = [
    choice.templateId ? `Template ${choice.templateId}` : null,
    choice.designSystemId ? `Design system ${choice.designSystemId}` : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? `Using ${parts.join(' · ')}` : 'Using the default style';
}

/**
 * Applies one durable inspiration decision. The first decision wins; exact
 * retries return the original snapshot so callers can persist only real changes.
 */
export function applyInspireChoice(
  snapshot: FlowSnapshot,
  request: InspireChoiceRequest,
  now: number,
): InspireChoiceUpdateResult {
  const choice = storedChoice(request);
  if (snapshot.inspireChoice && !choicesEqual(snapshot.inspireChoice, choice)) {
    return { status: 'conflict', flow: snapshot };
  }

  const targetState = choice.skipped ? 'skipped' : 'complete';
  const inspire = snapshot.stages.find((stage) => stage.id === 'inspire');
  if (!inspire) return { status: 'conflict', flow: snapshot };
  if (
    (inspire.state === 'complete' || inspire.state === 'skipped' || inspire.state === 'error')
    && inspire.state !== targetState
  ) {
    return { status: 'conflict', flow: snapshot };
  }
  if (choicesEqual(snapshot.inspireChoice, choice) && inspire.state === targetState) {
    return { status: 'unchanged', flow: snapshot };
  }

  let flow = snapshot;
  if (inspire.state === 'pending') {
    flow = applyFlowMarker(
      flow,
      { stage: 'inspire', state: 'active' },
      now,
    );
  }
  if (flow.stages.find((stage) => stage.id === 'inspire')?.state === 'active') {
    flow = applyFlowMarker(
      flow,
      {
        stage: 'inspire',
        state: targetState,
        detail: choice.skipped
          ? 'Skipped · Using the default style'
          : appliedChoiceDetail(choice),
      },
      now,
    );
  }
  if (flow.stages.find((stage) => stage.id === 'inspire')?.state !== targetState) {
    return { status: 'conflict', flow: snapshot };
  }

  return {
    status: 'updated',
    flow: {
      ...flow,
      inspireChoice: choice,
      updatedAt: now,
    },
  };
}
