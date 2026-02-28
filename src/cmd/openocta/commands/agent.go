package commands

import (
	"fmt"

	"github.com/cexll/agentsdk-go/pkg/api"
	"github.com/openocta/openocta/pkg/agent/runtime"
	"github.com/openocta/openocta/pkg/agent/tools"
	"github.com/spf13/cobra"
)

func init() {
	RootCmd.AddCommand(agentCmd)
	agentCmd.Flags().StringP("message", "m", "", "Message body for the agent")
	agentCmd.MarkFlagRequired("message")
}

var agentCmd = &cobra.Command{
	Use:   "agent",
	Short: "Run an agent",
	Long:  "Execute the OpenOcta agent with optional message and thinking mode.",
	RunE:  runAgent,
}

func runAgent(cmd *cobra.Command, _ []string) error {
	msg, _ := cmd.Flags().GetString("message")
	if msg == "" {
		return fmt.Errorf("message (--message) is required")
	}
	ctx := cmd.Context()
	rt, err := runtime.New(ctx, runtime.Options{
		Tools: tools.DefaultTools(),
	})
	if err != nil {
		return fmt.Errorf("create runtime: %w", err)
	}
	defer rt.Close()

	req := api.Request{
		Prompt: msg,
	}
	resp, err := rt.Run(ctx, req)
	if err != nil {
		return fmt.Errorf("agent run: %w", err)
	}
	if resp != nil && resp.Result != nil && resp.Result.Output != "" {
		cmd.Println(resp.Result.Output)
	}
	return nil
}
