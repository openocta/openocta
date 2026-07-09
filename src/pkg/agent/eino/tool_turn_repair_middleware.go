package eino

import (
	"context"

	"github.com/cloudwego/eino/adk"
)

// toolTurnRepairMiddleware repairs assistant/tool message pairing before every model call.
// BuildAgentMessages only runs at turn start; in-turn tool loops and context middleware
// (reduction, summarization, preempt) can leave state that DeepSeek rejects with 400.
type toolTurnRepairMiddleware struct {
	*adk.BaseChatModelAgentMiddleware
}

func newToolTurnRepairMiddleware() adk.ChatModelAgentMiddleware {
	return &toolTurnRepairMiddleware{
		BaseChatModelAgentMiddleware: &adk.BaseChatModelAgentMiddleware{},
	}
}

func (m *toolTurnRepairMiddleware) BeforeModelRewriteState(
	ctx context.Context,
	state *adk.ChatModelAgentState,
	mc *adk.ModelContext,
) (context.Context, *adk.ChatModelAgentState, error) {
	if state == nil || len(state.Messages) == 0 {
		return ctx, state, nil
	}
	state.Messages = PrepareSchemaMessagesForModel(state.Messages)
	return ctx, state, nil
}
