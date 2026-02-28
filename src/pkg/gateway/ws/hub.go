// Package ws provides WebSocket connection management and req/res dispatch.
package ws

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/openocta/openocta/pkg/gateway/handlers"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/logging"
)

var wsLog = logging.Sub("ws")

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Phase 2d: allow all origins; tighten in Phase 2e with config
		return true
	},
}

// Client represents a connected WebSocket client.
type Client struct {
	ConnID   string
	Conn     *websocket.Conn
	Send     chan []byte
	Hub      *Hub
	Handlers *handlers.Registry
	Context  *handlers.Context
	// ConnectParams set after successful handshake
	Connect *protocol.ConnectParams
	mu      sync.RWMutex
}

// Hub manages WebSocket clients.
type Hub struct {
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	methods    []string
	events     []string
	version    string
	handlers   *handlers.Registry
	context    *handlers.Context
	mu         sync.RWMutex // Protects clients map
	seq        int64        // Event sequence counter
}

const (
	// MaxBufferedBytes matches TypeScript MAX_BUFFERED_BYTES (4MB)
	maxBufferedBytes = 4 << 20
)

// NewHub creates a new Hub.
func NewHub(version string, h *handlers.Registry, ctx *handlers.Context) *Hub {
	// Aligned with src/gateway/server-methods-list.ts BASE_METHODS
	methods := []string{
		"health", "logs.tail", "channels.status", "channels.logout", "status",
		"usage.status", "usage.cost",
		"tts.status", "tts.providers", "tts.enable", "tts.disable", "tts.convert", "tts.setProvider",
		"config.get", "config.set", "config.apply", "config.patch", "config.schema",
		"exec.approvals.get", "exec.approvals.set", "exec.approvals.node.get", "exec.approvals.node.set",
		"exec.approval.request", "exec.approval.resolve",
		"wizard.start", "wizard.next", "wizard.cancel", "wizard.status",
		"talk.mode", "models.list",
		"agents.list", "agents.create", "agents.update", "agents.delete",
		"agents.files.list", "agents.files.get", "agents.files.set",
		"skills.status", "skills.bins", "skills.install", "skills.update",
		"update.run", "voicewake.get", "voicewake.set",
		"sessions.list", "sessions.preview", "sessions.patch", "sessions.reset", "sessions.delete", "sessions.compact", "sessions.usage", "sessions.usage.timeseries", "sessions.usage.logs",
		"last-heartbeat", "set-heartbeats", "wake",
		"node.pair.request", "node.pair.list", "node.pair.approve", "node.pair.reject", "node.pair.verify",
		"device.pair.list", "device.pair.approve", "device.pair.reject",
		"device.token.rotate", "device.token.revoke",
		"node.rename", "node.list", "node.describe", "node.invoke", "node.invoke.result", "node.event",
		"system-presence", "system-event", "send", "agent",
		"agent.identity.get", "agent.wait", "browser.request",
		"chat.history", "chat.abort", "chat.send", "chat.inject",
		"web.login.start", "web.login.wait",
		"cron.list", "cron.status", "cron.add", "cron.remove", "cron.update", "cron.run", "cron.runs",
	}
	events := []string{"connect.challenge", "agent", "chat", "presence", "tick", "talk.mode", "shutdown", "health", "heartbeat", "cron",
		"node.pair.requested", "node.pair.resolved", "node.invoke.request",
		"device.pair.requested", "device.pair.resolved", "voicewake.changed",
		"exec.approval.requested", "exec.approval.resolved"}
	return &Hub{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		methods:    methods,
		events:     events,
		version:    version,
		handlers:   h,
		context:    ctx,
		seq:        0,
	}
}

// SetContext updates the hub's context (used for circular dependency resolution).
func (h *Hub) SetContext(ctx *handlers.Context) {
	h.context = ctx
}

// SetHandlers updates the hub's handlers registry (used for circular dependency resolution).
func (h *Hub) SetHandlers(reg *handlers.Registry) {
	h.handlers = reg
}

// Run starts the hub loop.
func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			h.clients[c] = true
			h.mu.Unlock()
		case c := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[c]; ok {
				delete(h.clients, c)
				close(c.Send)
			}
			h.mu.Unlock()
		}
	}
}

// BroadcastOptions configures broadcast behavior.
type BroadcastOptions struct {
	DropIfSlow   bool
	StateVersion *protocol.StateVersion
}

// Broadcast sends an event to all connected clients.
func (h *Hub) Broadcast(event string, payload interface{}, opts *BroadcastOptions) {
	h.broadcastInternal(event, payload, opts, nil)
}

// BroadcastToConnIds sends an event to specific client connection IDs.
func (h *Hub) BroadcastToConnIds(event string, payload interface{}, connIds map[string]bool, opts *BroadcastOptions) {
	if len(connIds) == 0 {
		return
	}
	h.broadcastInternal(event, payload, opts, connIds)
}

// broadcastInternal is the internal broadcast implementation.
func (h *Hub) broadcastInternal(event string, payload interface{}, opts *BroadcastOptions, targetConnIds map[string]bool) {
	h.mu.RLock()
	clients := make([]*Client, 0, len(h.clients))
	for c := range h.clients {
		clients = append(clients, c)
	}
	h.mu.RUnlock()

	isTargeted := targetConnIds != nil
	var eventSeq *int64
	if !isTargeted {
		h.mu.Lock()
		h.seq++
		seq := h.seq
		h.mu.Unlock()
		eventSeq = &seq
	}
	if opts == nil {
		opts = &BroadcastOptions{
			DropIfSlow: true,
		}
	}

	eventFrame := protocol.EventFrame{
		Type:         "event",
		Event:        event,
		Payload:      payload,
		Seq:          eventSeq,
		StateVersion: opts.StateVersion,
	}

	frameJSON, err := json.Marshal(eventFrame)
	if err != nil {
		wsLog.Error("failed to marshal event frame event=%s err=%v", event, err)
		return
	}

	sentCount := 0
	droppedCount := 0
	for _, c := range clients {
		// Filter by target connection IDs if specified
		if targetConnIds != nil && !targetConnIds[c.ConnID] {
			continue
		}

		// Check buffered amount (simplified - use channel length as proxy)
		buffered := len(c.Send) * 256 // Rough estimate: each queued message ~256 bytes
		slow := buffered > maxBufferedBytes

		if slow && opts != nil && opts.DropIfSlow {
			droppedCount++
			continue
		}

		if slow {
			// Close slow consumer
			wsLog.Warn("closing slow consumer connId=%s buffered=%d", c.ConnID, buffered)
			c.Conn.Close()
			continue
		}

		// Send event frame
		select {
		case c.Send <- frameJSON:
			sentCount++
		default:
			// Channel full - treat as slow consumer
			wsLog.Warn("event channel full, closing connection connId=%s", c.ConnID)
			c.Conn.Close()
		}
	}

	wsLog.Debug("broadcast event event=%s seq=%d clients=%d targets=%d sent=%d dropped=%d", event, eventSeq, len(clients), len(targetConnIds), sentCount, droppedCount)
}

// ServeWS upgrades HTTP to WebSocket and handles the connection.
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		wsLog.Warn("ws upgrade failed err=%v", err)
		return
	}
	connID := uuid.New().String()
	client := &Client{
		ConnID:   connID,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		Hub:      h,
		Handlers: h.handlers,
		Context:  h.context,
	}
	h.register <- client
	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	for {
		_, data, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				wsLog.Debug("ws read error connId=%s err=%v", c.ConnID, err)
			}
			break
		}
		c.handleMessage(data)
	}
}

func (c *Client) handleMessage(data []byte) {
	var raw map[string]interface{}
	if err := json.Unmarshal(data, &raw); err != nil {
		c.sendError("", protocol.ErrCodeInvalidRequest, "invalid JSON")
		return
	}
	typ, _ := raw["type"].(string)
	if typ != "req" {
		c.sendError("", protocol.ErrCodeInvalidRequest, "expected req frame")
		return
	}
	id, _ := raw["id"].(string)
	method, _ := raw["method"].(string)
	params := raw["params"]

	// First message must be connect (handshake)
	c.mu.RLock()
	connected := c.Connect != nil
	c.mu.RUnlock()
	if !connected {
		if method != "connect" {
			c.sendError(id, protocol.ErrCodeInvalidRequest, "first request must be connect")
			return
		}
		c.handleConnect(id, params)
		return
	}

	// Dispatch to handler
	req := protocol.RequestFrame{Type: "req", ID: id, Method: method, Params: params}
	respond := func(ok bool, payload interface{}, err *protocol.ErrorShape, _ map[string]interface{}) {
		res := protocol.ResponseFrame{
			Type:    "res",
			ID:      id,
			OK:      ok,
			Payload: payload,
			Error:   err,
		}
		b, marshalErr := json.Marshal(res)
		if marshalErr != nil {
			wsLog.Error("failed to marshal response connId=%s id=%s method=%s err=%v", c.ConnID, id, method, marshalErr)
			// Send error response instead
			errorRes := protocol.ResponseFrame{
				Type: "res",
				ID:   id,
				OK:   false,
				Error: &protocol.ErrorShape{
					Code:    protocol.ErrCodeInternal,
					Message: "failed to marshal response: " + marshalErr.Error(),
				},
			}
			if errorBytes, err := json.Marshal(errorRes); err == nil {
				select {
				case c.Send <- errorBytes:
					// Successfully sent
				default:
					wsLog.Warn("response channel full, dropping message connId=%s id=%s", c.ConnID, id)
				}
			}
			return
		}
		select {
		case c.Send <- b:
			// Successfully sent
			wsLog.Debug("response sent connId=%s id=%s method=%s ok=%v", c.ConnID, id, method, ok)
		default:
			wsLog.Warn("response channel full, dropping message connId=%s id=%s method=%s", c.ConnID, id, method)
		}
	}
	opts := handlers.HandlerOpts{
		Req:     req,
		Client:  &handlers.Client{Connect: *c.Connect, ConnID: c.ConnID},
		Respond: respond,
		Context: c.Context,
	}
	if err := (*c.Handlers).Dispatch(opts); err != nil {
		respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
	}
}

func (c *Client) handleConnect(id string, params interface{}) {
	// Minimal validation: expect params with client.minProtocol, client.maxProtocol, client
	b, err := json.Marshal(params)
	if err != nil {
		c.sendError(id, protocol.ErrCodeInvalidRequest, "invalid connect params")
		return
	}
	var cp protocol.ConnectParams
	if err := json.Unmarshal(b, &cp); err != nil {
		c.sendError(id, protocol.ErrCodeInvalidRequest, "invalid connect params")
		return
	}
	if cp.Client.ID == "" || cp.Client.Version == "" || cp.Client.Platform == "" || cp.Client.Mode == "" {
		c.sendError(id, protocol.ErrCodeInvalidRequest, "connect params missing required client fields")
		return
	}
	minP, maxP := cp.MinProtocol, cp.MaxProtocol
	if maxP < protocol.PROTOCOL_VERSION || minP > protocol.PROTOCOL_VERSION {
		c.sendError(id, protocol.ErrCodeInvalidRequest, "protocol mismatch")
		c.Conn.Close()
		return
	}
	// Accept role; default operator
	role := cp.Role
	if role == "" {
		role = "operator"
	}
	if role != "operator" && role != "node" {
		c.sendError(id, protocol.ErrCodeInvalidRequest, "invalid role: "+role)
		return
	}
	cp.Role = role
	if cp.Scopes == nil {
		cp.Scopes = []string{}
	}

	c.mu.Lock()
	c.Connect = &cp
	c.mu.Unlock()

	// Send hello-ok
	hello := protocol.HelloOk{
		Type:     "hello-ok",
		Protocol: protocol.PROTOCOL_VERSION,
		Server: protocol.HelloServer{
			Version: c.Hub.version,
			ConnID:  c.ConnID,
		},
		Features: protocol.HelloFeatures{
			Methods: c.Hub.methods,
			Events:  c.Hub.events,
		},
		Snapshot: protocol.Snapshot{
			Presence:     []protocol.PresenceEntry{},
			Health:       map[string]interface{}{},
			StateVersion: protocol.StateVersion{0, 0},
			UptimeMs:     0,
		},
		Policy: protocol.HelloPolicy{
			MaxPayload:       1 << 20,
			MaxBufferedBytes: 4 << 20,
			TickIntervalMs:   5000,
		},
	}
	res := protocol.ResponseFrame{
		Type:    "res",
		ID:      id,
		OK:      true,
		Payload: hello,
	}
	msg, err := json.Marshal(res)
	if err != nil {
		wsLog.Error("failed to marshal hello-ok connId=%s id=%s err=%v", c.ConnID, id, err)
		return
	}
	select {
	case c.Send <- msg:
		// Successfully sent
	default:
		wsLog.Warn("hello-ok channel full, dropping message connId=%s id=%s", c.ConnID, id)
	}
}

func (c *Client) sendError(id string, code string, msg string) {
	res := protocol.ResponseFrame{
		Type:  "res",
		ID:    id,
		OK:    false,
		Error: &protocol.ErrorShape{Code: code, Message: msg},
	}
	b, err := json.Marshal(res)
	if err != nil {
		wsLog.Error("failed to marshal error response connId=%s id=%s err=%v", c.ConnID, id, err)
		return
	}
	select {
	case c.Send <- b:
		// Successfully sent
	default:
		wsLog.Warn("error response channel full, dropping message connId=%s id=%s", c.ConnID, id)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
