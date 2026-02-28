// Package test provides protocol compatibility tests for the Gateway.
package test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/gorilla/websocket"
	gatewayhttp "github.com/openocta/openocta/pkg/gateway/http"
	"github.com/openocta/openocta/pkg/gateway/protocol"
)

func TestGatewayProtocol_ConnectHelloOk(t *testing.T) {
	t.Setenv("OPENOCTA_SKIP_CHANNELS", "1")
	t.Setenv("OPENOCTA_SKIP_CRON", "1")

	srv := gatewayhttp.NewServer(":0", "test-0.0.0")
	ts := httptest.NewServer(srv.Handler())
	defer ts.Close()

	wsURL := "ws" + ts.URL[4:]
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer conn.Close()

	// Send connect
	connectReq := protocol.RequestFrame{
		Type:   "req",
		ID:     "1",
		Method: "connect",
		Params: protocol.ConnectParams{
			MinProtocol: 3,
			MaxProtocol: 3,
			Client: protocol.ConnectClientInfo{
				ID:       "test-client",
				Version:  "1.0",
				Platform: "test",
				Mode:     "cli",
			},
		},
	}
	if err := conn.WriteJSON(connectReq); err != nil {
		t.Fatalf("write connect: %v", err)
	}

	var res protocol.ResponseFrame
	if err := conn.ReadJSON(&res); err != nil {
		t.Fatalf("read response: %v", err)
	}
	if !res.OK {
		t.Errorf("connect failed: %v", res.Error)
	}
	if res.ID != "1" {
		t.Errorf("wrong id: %s", res.ID)
	}
	// Payload should be hello-ok
	payload, _ := json.Marshal(res.Payload)
	var hello protocol.HelloOk
	if err := json.Unmarshal(payload, &hello); err != nil {
		t.Fatalf("unmarshal hello: %v", err)
	}
	if hello.Type != "hello-ok" || hello.Protocol != protocol.PROTOCOL_VERSION {
		t.Errorf("hello: type=%s protocol=%d", hello.Type, hello.Protocol)
	}
}

func TestGatewayProtocol_HealthRequest(t *testing.T) {
	t.Setenv("OPENOCTA_SKIP_CHANNELS", "1")
	t.Setenv("OPENOCTA_SKIP_CRON", "1")

	srv := gatewayhttp.NewServer(":0", "test-0.0.0")
	ts := httptest.NewServer(srv.Handler())
	defer ts.Close()

	wsURL := "ws" + ts.URL[4:]
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer conn.Close()

	// Connect first
	connectReq := protocol.RequestFrame{
		Type:   "req",
		ID:     "1",
		Method: "connect",
		Params: protocol.ConnectParams{
			MinProtocol: 3,
			MaxProtocol: 3,
			Client: protocol.ConnectClientInfo{
				ID:       "test",
				Version:  "1.0",
				Platform: "test",
				Mode:     "cli",
			},
		},
	}
	if err := conn.WriteJSON(connectReq); err != nil {
		t.Fatalf("write connect: %v", err)
	}
	var connectRes protocol.ResponseFrame
	if err := conn.ReadJSON(&connectRes); err != nil {
		t.Fatalf("read connect res: %v", err)
	}
	if !connectRes.OK {
		t.Fatalf("connect failed: %v", connectRes.Error)
	}

	// Request health
	healthReq := protocol.RequestFrame{
		Type:   "req",
		ID:     "2",
		Method: "health",
	}
	if err := conn.WriteJSON(healthReq); err != nil {
		t.Fatalf("write health: %v", err)
	}
	var healthRes protocol.ResponseFrame
	if err := conn.ReadJSON(&healthRes); err != nil {
		t.Fatalf("read health res: %v", err)
	}
	if !healthRes.OK {
		t.Errorf("health failed: %v", healthRes.Error)
	}
	if healthRes.ID != "2" {
		t.Errorf("wrong id: %s", healthRes.ID)
	}
}

func TestGatewayHTTP_Health(t *testing.T) {
	t.Setenv("OPENOCTA_SKIP_CHANNELS", "1")
	t.Setenv("OPENOCTA_SKIP_CRON", "1")

	srv := gatewayhttp.NewServer(":0", "test-0.0.0")
	ts := httptest.NewServer(srv.Handler())
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/health")
	if err != nil {
		t.Fatalf("get health: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("status: %d", resp.StatusCode)
	}
}

func TestGatewayHTTP_HealthAPIPath(t *testing.T) {
	t.Setenv("OPENOCTA_SKIP_CHANNELS", "1")
	t.Setenv("OPENOCTA_SKIP_CRON", "1")

	srv := gatewayhttp.NewServer(":0", "test-0.0.0")
	ts := httptest.NewServer(srv.Handler())
	defer ts.Close()

	u, _ := url.Parse(ts.URL)
	u.Path = "/api/health"
	resp, err := http.Get(u.String())
	if err != nil {
		t.Fatalf("get api health: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("status: %d", resp.StatusCode)
	}
}

func TestGatewayProtocol_Frames(t *testing.T) {
	// Unit test: verify frame JSON marshaling matches protocol
	req := protocol.RequestFrame{
		Type:   "req",
		ID:     "1",
		Method: "connect",
		Params: map[string]interface{}{
			"minProtocol": 3,
			"maxProtocol": 3,
			"client": map[string]interface{}{
				"id":       "test",
				"version":  "1.0",
				"platform": "test",
				"mode":     "cli",
			},
		},
	}
	b, err := json.Marshal(req)
	if err != nil {
		t.Fatal(err)
	}
	var decoded protocol.RequestFrame
	if err := json.Unmarshal(b, &decoded); err != nil {
		t.Fatal(err)
	}
	if decoded.Type != "req" || decoded.Method != "connect" {
		t.Errorf("decoded: type=%s method=%s", decoded.Type, decoded.Method)
	}
}

func TestGatewayProtocol_ResponseFrame(t *testing.T) {
	res := protocol.ResponseFrame{
		Type: "res",
		ID:   "1",
		OK:   true,
		Payload: protocol.HelloOk{
			Type:     "hello-ok",
			Protocol: protocol.PROTOCOL_VERSION,
			Server: protocol.HelloServer{
				Version: "test",
				ConnID:  "conn-1",
			},
			Features: protocol.HelloFeatures{
				Methods: []string{"health", "status"},
				Events:  []string{"tick"},
			},
		},
	}
	b, err := json.Marshal(res)
	if err != nil {
		t.Fatal(err)
	}
	var decoded protocol.ResponseFrame
	if err := json.Unmarshal(b, &decoded); err != nil {
		t.Fatal(err)
	}
	if !decoded.OK {
		t.Error("expected OK=true")
	}
	if payload, ok := decoded.Payload.(map[string]interface{}); ok {
		if payload["type"] != "hello-ok" {
			t.Errorf("payload type: %v", payload["type"])
		}
	}
}

func TestGatewayProtocol_AgentInvalidParams(t *testing.T) {
	t.Setenv("OPENOCTA_SKIP_CHANNELS", "1")
	t.Setenv("OPENOCTA_SKIP_CRON", "1")

	srv := gatewayhttp.NewServer(":0", "test-0.0.0")
	ts := httptest.NewServer(srv.Handler())
	defer ts.Close()

	wsURL := "ws" + ts.URL[4:]
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer conn.Close()

	// Connect
	connectReq := protocol.RequestFrame{
		Type:   "req",
		ID:     "1",
		Method: "connect",
		Params: protocol.ConnectParams{
			MinProtocol: 3,
			MaxProtocol: 3,
			Client: protocol.ConnectClientInfo{
				ID: "test", Version: "1.0", Platform: "test", Mode: "cli",
			},
		},
	}
	if err := conn.WriteJSON(connectReq); err != nil {
		t.Fatalf("write connect: %v", err)
	}
	var connectRes protocol.ResponseFrame
	if err := conn.ReadJSON(&connectRes); err != nil {
		t.Fatalf("read connect: %v", err)
	}
	if !connectRes.OK {
		t.Fatalf("connect failed")
	}

	// Agent with empty message -> invalid_request
	agentReq := protocol.RequestFrame{
		Type:   "req",
		ID:     "2",
		Method: "agent",
		Params: map[string]interface{}{"message": ""},
	}
	if err := conn.WriteJSON(agentReq); err != nil {
		t.Fatalf("write agent: %v", err)
	}
	var agentRes protocol.ResponseFrame
	if err := conn.ReadJSON(&agentRes); err != nil {
		t.Fatalf("read agent res: %v", err)
	}
	if agentRes.OK {
		t.Error("expected agent to fail with empty message")
	}
	if agentRes.Error == nil || agentRes.Error.Code != "invalid_request" {
		t.Errorf("expected invalid_request, got: %v", agentRes.Error)
	}
}
