package commands

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/daemon"
	gatewayclient "github.com/openocta/openocta/pkg/gateway/client"
	gatewayhttp "github.com/openocta/openocta/pkg/gateway/http"
	"github.com/openocta/openocta/pkg/infra"
	"github.com/openocta/openocta/pkg/logging"
	"github.com/openocta/openocta/pkg/paths"
	"github.com/openocta/openocta/pkg/version"
	"github.com/spf13/cobra"
)

func init() {
	RootCmd.AddCommand(gatewayCmd)
}

var gatewayCmd = &cobra.Command{
	Use:   "gateway",
	Short: "Gateway control",
	Long:  "Control the OpenOcta gateway (run, stop, install, restart, status, health).",
}

var gatewayPort int

func init() {
	gatewayCmd.AddCommand(gatewayRunCmd)
	gatewayRunCmd.Flags().IntVarP(&gatewayPort, "port", "p", 0, "Gateway port (default 18789)")
	gatewayRunCmd.Flags().BoolP("verbose", "v", false, "Verbose logging to stdout")
	gatewayRunCmd.Flags().Bool("force", false, "Kill existing listener on port before starting")

	gatewayCmd.AddCommand(gatewayStatusCmd)
	gatewayStatusCmd.Flags().String("url", "", "Gateway WebSocket URL")
	gatewayStatusCmd.Flags().String("token", "", "Gateway token")
	gatewayStatusCmd.Flags().String("password", "", "Gateway password")
	gatewayStatusCmd.Flags().Bool("no-probe", false, "Skip RPC probe")
	gatewayStatusCmd.Flags().Bool("json", false, "Output JSON")

	gatewayCmd.AddCommand(gatewayHealthCmd)
	gatewayHealthCmd.Flags().String("url", "", "Gateway WebSocket URL")
	gatewayHealthCmd.Flags().String("token", "", "Gateway token")
	gatewayHealthCmd.Flags().String("password", "", "Gateway password")
	gatewayHealthCmd.Flags().Bool("json", false, "Output JSON")

	gatewayCmd.AddCommand(gatewayCallCmd)
	gatewayCallCmd.Flags().String("url", "", "Gateway WebSocket URL")
	gatewayCallCmd.Flags().String("token", "", "Gateway token")
	gatewayCallCmd.Flags().String("password", "", "Gateway password")
	gatewayCallCmd.Flags().String("params", "{}", "JSON params")
	gatewayCallCmd.Flags().Bool("json", false, "Output JSON")

	gatewayCmd.AddCommand(gatewayInstallCmd)
	gatewayInstallCmd.Flags().Int("port", 0, "Gateway port")
	gatewayInstallCmd.Flags().Bool("force", false, "Reinstall if already installed")

	gatewayCmd.AddCommand(gatewayStopCmd)
	gatewayCmd.AddCommand(gatewayRestartCmd)
}

var gatewayRunCmd = &cobra.Command{
	Use:   "run",
	Short: "Start the gateway server",
	RunE:  runGateway,
}

func runGateway(cmd *cobra.Command, _ []string) error {
	env := func(k string) string { return os.Getenv(k) }
	// Init global logger: console + /tmp/openocta/openocta-YYYY-MM-DD.log (JSON, daily rolling)
	settings := logging.GetResolvedLoggerSettings(env, "")
	logDir := filepath.Dir(settings.File)
	opts := logging.GlobalOpts{LogDir: logDir, Level: logging.LevelInfo, ConsoleLevel: logging.LevelInfo}
	if verbose, _ := cmd.Flags().GetBool("verbose"); verbose {
		opts.ConsoleLevel = logging.LevelDebug
	}
	logging.InitGlobal(logDir, opts)

	port := paths.ResolveGatewayPort(nil, env)
	if gatewayPort > 0 {
		port = gatewayPort
	}
	force, _ := cmd.Flags().GetBool("force")
	if force {
		killed, err := infra.ForceFreePort(port)
		if err != nil {
			return fmt.Errorf("force: %w", err)
		}
		for _, p := range killed {
			cmd.Printf("force: killed pid %d (port %d)\n", p.PID, port)
		}
		if len(killed) > 0 {
			time.Sleep(300 * time.Millisecond)
		}
	}
	verbose, _ := cmd.Flags().GetBool("verbose")
	if verbose {
		os.Setenv("OPENOCTA_VERBOSE", "1")
	}
	addr := fmt.Sprintf(":%d", port)
	cmd.Printf("Starting Gateway on %s (OpenOcta %s)\n", addr, version.Version)
	logging.Info("Gateway starting addr=%s version=%s", addr, version.Version)
	srv := gatewayhttp.NewServer(addr, version.Version)

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != context.Canceled {
			cmd.PrintErrln("Gateway error:", err)
		}
	}()
	ctx, stop := signal.NotifyContext(cmd.Context(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()
	cmd.Println("Shutting down...")
	return srv.Shutdown(context.Background())
}

// --- status ---

var gatewayStatusCmd = &cobra.Command{
	Use:   "status",
	Short: "Show gateway service status and probe",
	RunE:  runGatewayStatus,
}

func runGatewayStatus(cmd *cobra.Command, _ []string) error {
	env := func(k string) string { return os.Getenv(k) }
	stateDir := paths.ResolveStateDir(env)
	configPath := paths.ResolveConfigPath(env, stateDir)
	port := paths.ResolveGatewayPort(nil, env)

	urlOverride, _ := cmd.Flags().GetString("url")
	noProbe, _ := cmd.Flags().GetBool("no-probe")
	outputJSON, _ := cmd.Flags().GetBool("json")

	gatewayURL := urlOverride
	if gatewayURL == "" {
		gatewayURL = fmt.Sprintf("ws://127.0.0.1:%d", port)
	}
	token, _ := cmd.Flags().GetString("token")
	password, _ := cmd.Flags().GetString("password")
	if token == "" {
		token = os.Getenv("OPENOCTA_GATEWAY_TOKEN")
	}
	if password == "" {
		password = os.Getenv("OPENOCTA_GATEWAY_PASSWORD")
	}

	// Service status (launchd on macOS)
	loaded := false
	if _, err := exec.LookPath("launchctl"); err == nil {
		loaded, _ = daemon.IsLoaded(daemon.GatewayLaunchAgentLabel)
	}

	status := map[string]interface{}{
		"configPath": configPath,
		"port":       port,
		"url":        gatewayURL,
		"service": map[string]interface{}{
			"loaded": loaded,
			"label":  daemon.GatewayLaunchAgentLabel,
		},
	}

	if !noProbe {
		ctx, cancel := context.WithTimeout(cmd.Context(), 10*time.Second)
		defer cancel()
		cli := gatewayclient.New(gatewayURL, token, password)
		if err := cli.Connect(ctx); err != nil {
			status["rpc"] = map[string]interface{}{"ok": false, "error": err.Error()}
		} else {
			defer cli.Close()
			payload, err := cli.Call(ctx, "status", nil)
			if err != nil {
				status["rpc"] = map[string]interface{}{"ok": false, "error": err.Error()}
			} else {
				status["rpc"] = map[string]interface{}{"ok": true, "status": payload}
			}
		}
	}

	if outputJSON {
		enc := json.NewEncoder(cmd.OutOrStdout())
		enc.SetIndent("", "  ")
		return enc.Encode(status)
	}

	// Human-readable output
	cmd.Printf("Config: %s\n", configPath)
	cmd.Printf("Port: %d\n", port)
	cmd.Printf("URL: %s\n", gatewayURL)
	if loaded {
		cmd.Println("Service: loaded")
	} else {
		cmd.Println("Service: not loaded")
	}
	if rpc, ok := status["rpc"].(map[string]interface{}); ok {
		if rpc["ok"] == true {
			cmd.Println("RPC probe: ok")
		} else if err := rpc["error"]; err != nil {
			cmd.Printf("RPC probe: %v\n", err)
		}
	}
	return nil
}

// --- health ---

var gatewayHealthCmd = &cobra.Command{
	Use:   "health",
	Short: "Fetch gateway health",
	RunE:  runGatewayHealth,
}

func runGatewayHealth(cmd *cobra.Command, _ []string) error {
	env := func(k string) string { return os.Getenv(k) }
	port := paths.ResolveGatewayPort(nil, env)

	urlOverride, _ := cmd.Flags().GetString("url")
	outputJSON, _ := cmd.Flags().GetBool("json")

	gatewayURL := urlOverride
	if gatewayURL == "" {
		gatewayURL = fmt.Sprintf("ws://127.0.0.1:%d", port)
	}
	token, _ := cmd.Flags().GetString("token")
	password, _ := cmd.Flags().GetString("password")
	if token == "" {
		token = os.Getenv("OPENOCTA_GATEWAY_TOKEN")
	}
	if password == "" {
		password = os.Getenv("OPENOCTA_GATEWAY_PASSWORD")
	}

	ctx, cancel := context.WithTimeout(cmd.Context(), 10*time.Second)
	defer cancel()
	cli := gatewayclient.New(gatewayURL, token, password)
	if err := cli.Connect(ctx); err != nil {
		return fmt.Errorf("connect: %w", err)
	}
	defer cli.Close()

	payload, err := cli.Call(ctx, "health", nil)
	if err != nil {
		return fmt.Errorf("health: %w", err)
	}

	if outputJSON {
		enc := json.NewEncoder(cmd.OutOrStdout())
		enc.SetIndent("", "  ")
		return enc.Encode(payload)
	}
	cmd.Println("OK")
	if m, ok := payload.(map[string]interface{}); ok {
		if ch, ok := m["channels"].(map[string]interface{}); ok {
			for k, v := range ch {
				cmd.Printf("  %s: %v\n", k, v)
			}
		}
	}
	return nil
}

// --- call ---

var gatewayCallCmd = &cobra.Command{
	Use:   "call [method]",
	Short: "Call a gateway method",
	Args:  cobra.ExactArgs(1),
	RunE:  runGatewayCall,
}

func runGatewayCall(cmd *cobra.Command, args []string) error {
	method := args[0]
	env := func(k string) string { return os.Getenv(k) }
	port := paths.ResolveGatewayPort(nil, env)

	urlOverride, _ := cmd.Flags().GetString("url")
	paramsStr, _ := cmd.Flags().GetString("params")
	outputJSON, _ := cmd.Flags().GetBool("json")

	gatewayURL := urlOverride
	if gatewayURL == "" {
		gatewayURL = fmt.Sprintf("ws://127.0.0.1:%d", port)
	}
	token, _ := cmd.Flags().GetString("token")
	password, _ := cmd.Flags().GetString("password")
	if token == "" {
		token = os.Getenv("OPENOCTA_GATEWAY_TOKEN")
	}
	if password == "" {
		password = os.Getenv("OPENOCTA_GATEWAY_PASSWORD")
	}

	var params interface{}
	if err := json.Unmarshal([]byte(paramsStr), &params); err != nil {
		return fmt.Errorf("params: %w", err)
	}

	ctx, cancel := context.WithTimeout(cmd.Context(), 30*time.Second)
	defer cancel()
	cli := gatewayclient.New(gatewayURL, token, password)
	if err := cli.Connect(ctx); err != nil {
		return fmt.Errorf("connect: %w", err)
	}
	defer cli.Close()

	payload, err := cli.Call(ctx, method, params)
	if err != nil {
		return fmt.Errorf("call %s: %w", method, err)
	}

	if outputJSON {
		enc := json.NewEncoder(cmd.OutOrStdout())
		enc.SetIndent("", "  ")
		return enc.Encode(payload)
	}
	cmd.Println(jsonString(payload))
	return nil
}

func jsonString(v interface{}) string {
	b, _ := json.MarshalIndent(v, "", "  ")
	return string(b)
}

// --- install ---

var gatewayInstallCmd = &cobra.Command{
	Use:   "install",
	Short: "Install gateway service (launchd on macOS)",
	RunE:  runGatewayInstall,
}

func runGatewayInstall(cmd *cobra.Command, _ []string) error {
	if runtime.GOOS != "darwin" {
		return fmt.Errorf("gateway install only supported on macOS (launchd)")
	}
	env := func(k string) string { return os.Getenv(k) }
	stateDir := paths.ResolveStateDir(env)
	configPath := paths.ResolveConfigPath(env, stateDir)
	port := paths.ResolveGatewayPort(nil, env)

	portOverride, _ := cmd.Flags().GetInt("port")
	force, _ := cmd.Flags().GetBool("force")

	if portOverride > 0 {
		port = portOverride
	} else if cfg, err := config.Load(env); err == nil && cfg.Gateway != nil && cfg.Gateway.Port != nil && *cfg.Gateway.Port > 0 {
		port = *cfg.Gateway.Port
	}

	label := daemon.GatewayLaunchAgentLabel
	plistPath := daemon.ResolvePlistPath(label)

	if daemon.PlistExists(label) && !force {
		loaded, _ := daemon.IsLoaded(label)
		if loaded {
			cmd.Printf("Gateway service already loaded. Reinstall with --force.\n")
			return nil
		}
	}

	exe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("executable: %w", err)
	}
	logDir := filepath.Join(stateDir, "logs")
	_ = os.MkdirAll(logDir, 0755)
	stdoutPath := filepath.Join(logDir, "gateway.log")
	stderrPath := filepath.Join(logDir, "gateway.err.log")

	plist := daemon.BuildLaunchAgentPlist(struct {
		Label            string
		Comment          string
		ProgramArguments []string
		WorkingDirectory string
		StdoutPath       string
		StderrPath       string
		Environment      map[string]string
	}{
		Label:            label,
		Comment:          "OpenOcta Gateway",
		ProgramArguments: []string{exe, "gateway", "run", "--port", strconv.Itoa(port)},
		WorkingDirectory: filepath.Dir(stateDir),
		StdoutPath:       stdoutPath,
		StderrPath:       stderrPath,
		Environment: map[string]string{
			"OPENOCTA_CONFIG_PATH": configPath,
			"OPENOCTA_STATE_DIR":   stateDir,
		},
	})

	if err := daemon.WritePlist(plistPath, plist); err != nil {
		return fmt.Errorf("write plist: %w", err)
	}
	cmd.Printf("Installed %s\n", plistPath)
	// Unload if already running, then bootstrap
	_ = daemon.Bootout(label)
	if err := daemon.Bootstrap(label); err != nil {
		cmd.Printf("Plist written; start with: openocta gateway restart\n")
		return nil
	}
	cmd.Printf("Gateway service started.\n")
	return nil
}

// --- stop ---

var gatewayStopCmd = &cobra.Command{
	Use:   "stop",
	Short: "Stop the gateway service",
	RunE:  runGatewayStop,
}

func runGatewayStop(cmd *cobra.Command, _ []string) error {
	if err := daemon.Bootout(daemon.GatewayLaunchAgentLabel); err != nil {
		if strings.Contains(err.Error(), "launchd only") {
			return fmt.Errorf("gateway stop only supported on macOS")
		}
		return err
	}
	cmd.Println("Gateway stopped")
	return nil
}

// --- restart ---

var gatewayRestartCmd = &cobra.Command{
	Use:   "restart",
	Short: "Restart the gateway service",
	RunE:  runGatewayRestart,
}

func runGatewayRestart(cmd *cobra.Command, _ []string) error {
	if runtime.GOOS != "darwin" {
		return fmt.Errorf("gateway restart only supported on macOS")
	}
	label := daemon.GatewayLaunchAgentLabel
	plistPath := daemon.ResolvePlistPath(label)
	if _, err := os.Stat(plistPath); os.IsNotExist(err) {
		return fmt.Errorf("gateway not installed; run openocta gateway install first")
	}
	loaded, _ := daemon.IsLoaded(label)
	if !loaded {
		if err := daemon.Bootstrap(label); err != nil {
			return fmt.Errorf("bootstrap: %w", err)
		}
		cmd.Println("Gateway started")
		return nil
	}
	if err := daemon.Kickstart(label); err != nil {
		return fmt.Errorf("kickstart: %w", err)
	}
	cmd.Println("Gateway restarted")
	return nil
}
