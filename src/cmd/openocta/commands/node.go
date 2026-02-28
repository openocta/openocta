package commands

import (
	"github.com/spf13/cobra"
)

func init() {
	RootCmd.AddCommand(nodeCmd)
}

var nodeCmd = &cobra.Command{
	Use:   "node",
	Short: "Node control",
	Long:  "Install, start, or stop the OpenOcta node.",
}

var nodeInstallCmd = &cobra.Command{
	Use:   "install",
	Short: "Install node",
	RunE: func(cmd *cobra.Command, _ []string) error {
		cmd.Println("Node install: not yet implemented")
		return nil
	},
}

var nodeStartCmd = &cobra.Command{
	Use:   "start",
	Short: "Start node",
	RunE: func(cmd *cobra.Command, _ []string) error {
		cmd.Println("Node start: not yet implemented")
		return nil
	},
}

var nodeStopCmd = &cobra.Command{
	Use:   "stop",
	Short: "Stop node",
	RunE: func(cmd *cobra.Command, _ []string) error {
		cmd.Println("Node stop: not yet implemented")
		return nil
	},
}

func init() {
	nodeCmd.AddCommand(nodeInstallCmd, nodeStartCmd, nodeStopCmd)
}
