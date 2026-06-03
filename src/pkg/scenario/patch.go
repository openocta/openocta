package scenario

import (
	"fmt"
	"strings"
)

// MergePatch deep-merges patch into base. nil values delete keys.
func MergePatch(base, patch map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{})
	for k, v := range base {
		result[k] = v
	}
	for k, v := range patch {
		if v == nil {
			delete(result, k)
			continue
		}
		baseVal, baseOk := result[k].(map[string]interface{})
		patchVal, patchOk := v.(map[string]interface{})
		if baseOk && patchOk {
			result[k] = MergePatch(baseVal, patchVal)
		} else {
			result[k] = v
		}
	}
	return result
}

// SetPath sets a dotted path (e.g. "database.host") on a config map.
func SetPath(root map[string]interface{}, path string, value interface{}) error {
	if root == nil {
		return fmt.Errorf("nil config")
	}
	keys := splitPath(path)
	if len(keys) == 0 {
		return fmt.Errorf("empty path")
	}
	cur := root
	for i := 0; i < len(keys)-1; i++ {
		k := keys[i]
		next, ok := cur[k].(map[string]interface{})
		if !ok {
			next = map[string]interface{}{}
			cur[k] = next
		}
		cur = next
	}
	cur[keys[len(keys)-1]] = value
	return nil
}

// GetSubtree returns the value at a dotted path.
func GetSubtree(root map[string]interface{}, path string) (interface{}, bool) {
	if root == nil || path == "" {
		return root, path == ""
	}
	cur := interface{}(root)
	for _, k := range splitPath(path) {
		m, ok := cur.(map[string]interface{})
		if !ok {
			return nil, false
		}
		v, ok := m[k]
		if !ok {
			return nil, false
		}
		cur = v
	}
	return cur, true
}

func splitPath(path string) []string {
	var parts []string
	for _, p := range strings.Split(path, ".") {
		p = strings.TrimSpace(p)
		if p != "" {
			parts = append(parts, p)
		}
	}
	return parts
}
