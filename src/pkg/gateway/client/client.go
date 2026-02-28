// Package client provides a Gateway WebSocket RPC client for CLI use.
package client

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/openocta/openocta/pkg/gateway/protocol"
)

// Client connects to Gateway via WebSocket and sends req/res.
type Client struct {
	url      string
	token    string
	password string
	conn     *websocket.Conn
}

// New creates a new client (does not connect).
func New(gatewayURL, token, password string) *Client {
	return &Client{
		url:      gatewayURL,
		token:    token,
		password: password,
	}
}

// Connect establishes WebSocket connection and performs handshake.
func (c *Client) Connect(ctx context.Context) error {
	u, err := url.Parse(c.url)
	if err != nil {
		return fmt.Errorf("parse url: %w", err)
	}
	if u.Scheme == "http" {
		u.Scheme = "ws"
	} else if u.Scheme == "https" {
		u.Scheme = "wss"
	}
	if u.Scheme == "" {
		u.Scheme = "ws"
	}
	wsURL := u.String()

	dialer := websocket.Dialer{HandshakeTimeout: 10 * time.Second}
	conn, _, err := dialer.DialContext(ctx, wsURL, nil)
	if err != nil {
		return fmt.Errorf("dial: %w", err)
	}
	c.conn = conn

	// Send connect
	auth := (*protocol.ConnectAuth)(nil)
	if c.token != "" || c.password != "" {
		auth = &protocol.ConnectAuth{
			Token:    c.token,
			Password: c.password,
		}
	}
	connectReq := protocol.RequestFrame{
		Type:   "req",
		ID:     uuid.New().String(),
		Method: "connect",
		Params: protocol.ConnectParams{
			MinProtocol: 3,
			MaxProtocol: 3,
			Client: protocol.ConnectClientInfo{
				ID:       "openocta-cli",
				Version:  "0.0.0",
				Platform: "cli",
				Mode:     "cli",
			},
			Auth: auth,
		},
	}
	if err := conn.WriteJSON(connectReq); err != nil {
		conn.Close()
		return fmt.Errorf("write connect: %w", err)
	}

	// Read hello-ok
	var res protocol.ResponseFrame
	if err := conn.ReadJSON(&res); err != nil {
		conn.Close()
		return fmt.Errorf("read hello: %w", err)
	}
	if !res.OK {
		conn.Close()
		msg := "connect failed"
		if res.Error != nil {
			msg = res.Error.Message
		}
		return fmt.Errorf("%s", msg)
	}
	return nil
}

// Call sends a method request and returns the payload.
func (c *Client) Call(ctx context.Context, method string, params interface{}) (interface{}, error) {
	if c.conn == nil {
		return nil, fmt.Errorf("not connected")
	}
	req := protocol.RequestFrame{
		Type:   "req",
		ID:     uuid.New().String(),
		Method: method,
		Params: params,
	}
	if err := c.conn.WriteJSON(req); err != nil {
		return nil, fmt.Errorf("write request: %w", err)
	}
	var res protocol.ResponseFrame
	if err := c.conn.ReadJSON(&res); err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}
	if !res.OK {
		msg := "request failed"
		if res.Error != nil {
			msg = res.Error.Message
		}
		return nil, fmt.Errorf("%s", msg)
	}
	return res.Payload, nil
}

// CallJSON marshals params as JSON and returns parsed payload.
func (c *Client) CallJSON(ctx context.Context, method string, params interface{}) ([]byte, error) {
	payload, err := c.Call(ctx, method, params)
	if err != nil {
		return nil, err
	}
	return json.Marshal(payload)
}

// Close closes the connection.
func (c *Client) Close() error {
	if c.conn == nil {
		return nil
	}
	err := c.conn.Close()
	c.conn = nil
	return err
}
