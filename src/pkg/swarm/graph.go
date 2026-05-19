package swarm

// BuildGraph constructs nodes and edges for a workspace member tree.
func BuildGraph(workspaceID string, members []*Member, includeHuman bool) Graph {
	nodes := make([]GraphNode, 0, len(members)+2)
	edges := make([]GraphEdge, 0, len(members)+1)

	if includeHuman {
		nodes = append(nodes, GraphNode{ID: "human", Label: "human", Status: MemberStatusIdle, Kind: "human"})
	}

	roots := make([]*Member, 0)
	byParent := map[string][]*Member{}
	for _, m := range members {
		if m.ParentID == "" {
			roots = append(roots, m)
		} else {
			byParent[m.ParentID] = append(byParent[m.ParentID], m)
		}
	}

	// Assistant root node when we have root members
	if len(roots) > 0 {
		nodes = append(nodes, GraphNode{ID: "assistant", Label: "assistant", Status: MemberStatusIdle, Kind: "assistant"})
		if includeHuman {
			edges = append(edges, GraphEdge{From: "human", To: "assistant"})
		}
	}

	var walk func(parentGraphID string, m *Member)
	walk = func(parentGraphID string, m *Member) {
		nodes = append(nodes, GraphNode{
			ID:     m.ID,
			Label:  m.Label,
			Status: m.Status,
			Kind:   "member",
		})
		edges = append(edges, GraphEdge{From: parentGraphID, To: m.ID})
		for _, child := range byParent[m.ID] {
			walk(m.ID, child)
		}
	}

	for _, root := range roots {
		parent := "assistant"
		if !includeHuman && len(roots) == 1 {
			parent = root.ParentID
			if parent == "" {
				parent = "assistant"
			}
		}
		if parent == "" {
			parent = "assistant"
		}
		if _, hasAssistant := findNode(nodes, "assistant"); !hasAssistant && parent == "assistant" {
			nodes = append(nodes, GraphNode{ID: "assistant", Label: "assistant", Status: MemberStatusIdle, Kind: "assistant"})
		}
		walk(parent, root)
	}

	_ = workspaceID
	return Graph{Nodes: nodes, Edges: edges}
}

func findNode(nodes []GraphNode, id string) (GraphNode, bool) {
	for _, n := range nodes {
		if n.ID == id {
			return n, true
		}
	}
	return GraphNode{}, false
}
