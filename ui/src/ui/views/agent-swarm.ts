import { html } from "lit";
import { t } from "../strings.js";

export function renderAgentSwarm() {
  return html`
    <div class="agent-swarm">
      <div class="agent-swarm__mock">
        <aside class="agent-swarm__sidebar">
          <div class="agent-swarm__workspace">Workspace</div>
          <div class="agent-swarm__tree">
            <div class="agent-swarm__tree-node agent-swarm__tree-node--parent">
              <div class="agent-swarm__tree-node__header agent-swarm__tree-node__header--assistant">
                <span class="agent-swarm__tree-node__name">Assistant</span>
                <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--idle">IDLE</span>
              </div>
              <div class="agent-swarm__tree-children">
                <div class="agent-swarm__tree-node agent-swarm__tree-node--parent agent-swarm__tree-node--active">
                  <div class="agent-swarm__tree-node__header">
                    <span class="agent-swarm__tree-node__name">SRE高级运维工程师</span>
                    <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--busy">BUSY</span>
                  </div>
                  <div class="agent-swarm__tree-children">
                    <div class="agent-swarm__tree-node agent-swarm__tree-node--leaf">
                      <span class="agent-swarm__tree-node__name">日志采集 Agent</span>
                      <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--idle">IDLE</span>
                    </div>
                    <div class="agent-swarm__tree-node agent-swarm__tree-node--leaf">
                      <span class="agent-swarm__tree-node__name">指标采集 Agent</span>
                      <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--busy">BUSY</span>
                    </div>
                  </div>
                  <div class="agent-swarm__context">
                    <div class="agent-swarm__context-bar" style="width: 62%"></div>
                    <span class="agent-swarm__context-text">152,589 / 256,000 token</span>
                  </div>
                </div>
                <div class="agent-swarm__tree-node agent-swarm__tree-node--parent">
                  <div class="agent-swarm__tree-node__header">
                    <span class="agent-swarm__tree-node__name">故障分析工程师</span>
                    <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--busy">BUSY</span>
                  </div>
                  <div class="agent-swarm__tree-children">
                    <div class="agent-swarm__tree-node agent-swarm__tree-node--leaf">
                      <span class="agent-swarm__tree-node__name">根因分析 Agent</span>
                      <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--busy">BUSY</span>
                    </div>
                  </div>
                  <div class="agent-swarm__context">
                    <div class="agent-swarm__context-bar" style="width: 45%"></div>
                    <span class="agent-swarm__context-text">98,200 / 256,000 token</span>
                  </div>
                </div>
                <div class="agent-swarm__tree-node agent-swarm__tree-node--leaf">
                  <span class="agent-swarm__tree-node__name">安全分析工程师</span>
                  <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--idle">IDLE</span>
                </div>
                <div class="agent-swarm__tree-node agent-swarm__tree-node--leaf">
                  <span class="agent-swarm__tree-node__name">网络分析工程师</span>
                  <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--idle">IDLE</span>
                </div>
                <div class="agent-swarm__tree-node agent-swarm__tree-node--leaf">
                  <span class="agent-swarm__tree-node__name">云原生运维工程师</span>
                  <span class="agent-swarm__tree-node__status agent-swarm__tree-node__status--busy">BUSY</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main class="agent-swarm__main">
          <div class="agent-swarm__docs">
            <div class="agent-swarm__section-title">故障处理文档</div>
            <ul class="agent-swarm__doc-list">
              <li class="agent-swarm__doc agent-swarm__doc--done">INCIDENT-2024-0218_timeline.md ✓</li>
              <li class="agent-swarm__doc agent-swarm__doc--done">pod-api-gateway-7d8f9_logs.md ✓</li>
              <li class="agent-swarm__doc agent-swarm__doc--done">root_cause_analysis.md ✓</li>
              <li class="agent-swarm__doc agent-swarm__doc--done">rollback_verification.md ✓</li>
            </ul>
          </div>
          <div class="agent-swarm__actions">
            <div class="agent-swarm__section-title">下一步行动</div>
            <ol class="agent-swarm__action-list">
              <li>云原生运维: 执行 deployment 回滚至 v1.2.3</li>
              <li>故障分析: 输出最终根因报告并归档</li>
              <li>SRE: 更新 runbook 与告警规则</li>
              <li>安全/网络: 待命，如有异常立即介入</li>
            </ol>
            <div class="agent-swarm__status agent-swarm__status--ok">
              根因已定位，回滚方案已确认，执行中 🚀
            </div>
          </div>
          <div class="agent-swarm__viz">
            <div class="agent-swarm__graph">
              <div class="agent-swarm__graph-controls">
                <span class="agent-swarm__graph-zoom">缩放 70%</span>
                <button class="agent-swarm__graph-btn" disabled>+</button>
                <button class="agent-swarm__graph-btn" disabled>-</button>
                <button class="agent-swarm__graph-btn" disabled>Reset</button>
                <span class="agent-swarm__graph-hint">Ctrl/⌘ + 滚轮缩放</span>
              </div>
              <div class="agent-swarm__graph-canvas">
                <svg class="agent-swarm__graph-svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
                  <path class="agent-swarm__graph-line" d="M 40 60 L 200 60" />
                  <path class="agent-swarm__graph-line" d="M 200 60 L 200 92" />
                  <path class="agent-swarm__graph-line" d="M 40 92 L 360 92" />
                  <path class="agent-swarm__graph-line" d="M 40 92 L 40 155" />
                  <path class="agent-swarm__graph-line" d="M 120 92 L 120 155" />
                  <path class="agent-swarm__graph-line" d="M 200 92 L 200 155" />
                  <path class="agent-swarm__graph-line" d="M 280 92 L 280 155" />
                  <path class="agent-swarm__graph-line" d="M 360 92 L 360 155" />
                </svg>
                <div class="agent-swarm__graph-nodes">
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--human" style="left: 10%; top: 30%;">
                    <div class="agent-swarm__graph-node__circle agent-swarm__graph-node__circle--human"></div>
                    <div class="agent-swarm__graph-node__label">human</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--idle">IDLE</div>
                  </div>
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--assistant" style="left: 50%; top: 30%;">
                    <div class="agent-swarm__graph-node__circle agent-swarm__graph-node__circle--assistant"></div>
                    <div class="agent-swarm__graph-node__label">assistant</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--idle">IDLE</div>
                  </div>
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--child agent-swarm__graph-node--busy" style="left: 10%; top: 78%;">
                    <div class="agent-swarm__graph-node__circle"></div>
                    <div class="agent-swarm__graph-node__label">SRE高级运维</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--busy">BUSY</div>
                  </div>
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--child agent-swarm__graph-node--busy" style="left: 30%; top: 78%;">
                    <div class="agent-swarm__graph-node__circle"></div>
                    <div class="agent-swarm__graph-node__label">故障分析</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--busy">BUSY</div>
                  </div>
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--child agent-swarm__graph-node--idle" style="left: 50%; top: 78%;">
                    <div class="agent-swarm__graph-node__circle"></div>
                    <div class="agent-swarm__graph-node__label">安全分析</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--idle">IDLE</div>
                  </div>
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--child agent-swarm__graph-node--idle" style="left: 70%; top: 78%;">
                    <div class="agent-swarm__graph-node__circle"></div>
                    <div class="agent-swarm__graph-node__label">网络分析</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--idle">IDLE</div>
                  </div>
                  <div class="agent-swarm__graph-node agent-swarm__graph-node--child agent-swarm__graph-node--busy" style="left: 90%; top: 78%;">
                    <div class="agent-swarm__graph-node__circle"></div>
                    <div class="agent-swarm__graph-node__label">云原生运维</div>
                    <div class="agent-swarm__graph-node__status agent-swarm__graph-node__status--busy">BUSY</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="agent-swarm__events">
              <div class="agent-swarm__section-title">事件流</div>
              <div class="agent-swarm__event agent-swarm__event--ok">16:05:22 故障已解决，服务恢复</div>
              <div class="agent-swarm__event agent-swarm__event--ok">16:04:58 回滚验证通过，健康检查 OK</div>
              <div class="agent-swarm__event">16:04:15 云原生运维: 执行 kubectl rollout undo</div>
              <div class="agent-swarm__event">16:03:40 故障分析: 根因报告已输出</div>
              <div class="agent-swarm__event">16:02:18 SRE: 定位到 api-gateway OOM，建议回滚</div>
              <div class="agent-swarm__event">16:01:45 故障分析: 解析 pod 日志完成</div>
              <div class="agent-swarm__event">16:00:30 SRE: 采集 api-gateway-7d8f9 日志</div>
              <div class="agent-swarm__event">15:59:12 告警触发: api-gateway pod CrashLoopBackOff</div>
              <div class="agent-swarm__event">15:58:50 监控: 收到 P1 告警 INCIDENT-2024-0218</div>
            </div>
          </div>
        </main>

        <aside class="agent-swarm__detail">
          <div class="agent-swarm__section-title">Agent Details</div>
          <div class="agent-swarm__stream-from">Streaming from: 故障分析工程师 (a7f2c1-...)</div>
          <div class="agent-swarm__llm">
            <span class="agent-swarm__llm-tag">SYSTEM</span>
            #1 - You are a fault analysis agent. Analyze logs, identify root cause, output report.
          </div>
          <div class="agent-swarm__realtime">
            <div class="agent-swarm__realtime-title">Realtime reasoning</div>
            <div class="agent-swarm__realtime-item">
              收到 SRE 采集的 api-gateway 日志，开始解析 OOM 相关堆栈与内存指标...
            </div>
            <div class="agent-swarm__realtime-title">Realtime content</div>
            <div class="agent-swarm__realtime-item agent-swarm__realtime-item--ok">
              root_cause_analysis.md 已生成 ✓
            </div>
            <div class="agent-swarm__realtime-item agent-swarm__realtime-item--ok">
              根因: 内存泄漏，建议回滚至 v1.2.3 ✓
            </div>
            <div class="agent-swarm__realtime-title">Realtime tools</div>
            <div class="agent-swarm__realtime-item agent-swarm__realtime-item--mono">
              tool_result [parse-logs]: {"oom": true, "heap": "512Mi/512Mi"}
            </div>
            <div class="agent-swarm__realtime-item agent-swarm__realtime-item--mono">
              tool_result [kubectl-get-pod]: api-gateway-7d8f9 CrashLoopBackOff
            </div>
          </div>
        </aside>
      </div>

      <div class="agent-swarm__input-bar">
        <input
          class="agent-swarm__input"
          type="text"
          placeholder="Type a message... (Ctrl/Cmd+Enter to send)"
          disabled
        />
        <button class="agent-swarm__send-btn" disabled>Send</button>
      </div>

      <div class="agent-swarm__overlay">
        <div class="agent-swarm__badge">${t("agentSwarmDevBadge")}</div>
      </div>
    </div>
  `;
}
