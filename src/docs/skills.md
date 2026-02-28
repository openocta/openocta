# Skills 使用说明

OctopusClaw 的 Skills 系统基于 [`agentsdk-go` 的 Skills 抽象](https://docs.openocta.ai/zh-CN/tools/skills) 扩展而来，用于为大模型会话注入领域知识、工具和工作流能力。Skills 通常以 `SKILL.md` 文件形式存在，支持从多个位置加载与合并。

本文主要说明：

- Skills 的加载与优先级（对应 `pkg/agent/skills/loader.go`）
- 在对话中 Skills 的匹配与使用方式
- 如何新增个人 Skill（单文件 / 目录结构）

---

## 一、Skills 加载与优先级

Skill 加载入口：`LoadWorkspaceEntries`（`pkg/agent/skills/loader.go`），结合运行时的 `BuildSkillRegistrationsFromThreeLocations` 使用，将 Skills 注册到 agentsdk-go Runtime。

### 1.1 加载来源

Skills 会从多个位置按优先级加载并合并（后加载覆盖前加载）：

1. **额外目录**：`config.skills.load.extraDirs` 中配置的路径（**最低优先级**）
2. **内置 Skills**：安装包自带的 `skills` 目录（`OPENOCTA_BUNDLED_SKILLS_DIR` 或可执行文件旁的 `skills/`）（低优先级）
3. **托管 Skills**：`~/.openocta/skills`（中等优先级）
4. **工作区 Skills**：`<workspace>/skills`（最高优先级，通常是项目自身的 Skills）

同名 Skill（以 `Entry.Name` 为准）会遵循以下覆盖规则：

> workspace > managed > bundled > extraDirs

### 1.2 目录扫描规则

`loadSkillsFromDir(dir, source)` 会按以下规则扫描：

- 如果 `dir` 不存在或不是目录，返回空列表。
- 对每个条目：
  - 如果是子目录，且其下存在 `SKILL.md` 文件，则视为一个 Skill 目录；
  - 如果是 `.md` 文件，则视为一个**单文件 Skill**。

举例：

```text
skills/
├── k8s/
│   └── SKILL.md    # 目录型 Skill
└── db.md           # 单文件 Skill
```

上述目录会加载出两个 Skill：`k8s` 与 `db`。

### 1.3 Skill 名称与 Frontmatter

`loadSkillFromFile` 会：

1. 默认以**所在目录名**作为 Skill 名称：
   - `.../k8s/SKILL.md` → `k8s`
   - `.../db.md` → `db`
2. 解析 Markdown 内容中的 YAML frontmatter（`---` 包围的部分），提取基础键值对：

   ```yaml
   ---
   name: "Kubernetes"
   emoji: "☸️"
   homepage: "https://kubernetes.io"
   ---
   ```

   若 frontmatter 中存在 `name` 字段，则覆盖默认名称：

   ```go
   frontmatter := parseFrontmatter(string(data))
   if nameFromFM, ok := frontmatter["name"]; ok && nameFromFM != "" {
       name = nameFromFM
   }
   ```

3. 构造 `Entry`：
   - `Name`：最终 Skill 名称
   - `Source`：来源标记，如 `openocta-workspace`、`openocta-managed` 等
   - `FilePath`：`SKILL.md` 的绝对路径
   - `BaseDir`：Skill 所在目录
   - `Metadata`：从 frontmatter 解析出的元数据（当前实现为基础结构，预留扩展）
   - `Frontmatter`：全量 frontmatter 键值对

---

## 二、Skill 在会话中的匹配与使用

### 2.1 注册到 Runtime

在创建 Runtime 时，如果 `EnableSkills = true`，则会通过：

```go
regs := BuildSkillRegistrationsFromThreeLocations(projectRoot, opts.Config)
apiOpts.Skills = regs
```

将 Skill 条目转换为 agentsdk-go 的 `SkillRegistration`，并注入到 Runtime 中。

这意味着：

- 大模型在运行时可以“看到”这些技能的描述与说明；
- Runtime 会根据用户输入、上下文、Skill 的元数据等决定是否激活某个 Skill（匹配逻辑在 agentsdk-go 内部，遵循 [`skills` 文档](https://docs.openocta.ai/zh-CN/tools/skills) 中的通用规则）。

### 2.2 Skill 匹配规则（概念层面）

结合 agentsdk-go 的设计，Skill 匹配通常遵循以下原则：

- **显式触发**：用户提示中直接提到某个 Skill 名称或关键词；
- **领域匹配**：根据 Skill frontmatter 中的领域标签、环境要求、依赖等进行过滤；
- **环境约束**：
  - OS 限制（例如 `os: [darwin, linux]`）；
  - 环境变量/配置是否满足；
  - 必要的二进制是否存在（`Requires.Bins / AnyBins`）；
- **优先级与 Always 标记**：
  - 某些 Skill 可以声明为 `always: true`，在每轮对话中作为默认主题注入；
  - 也可以通过 metadata 控制 Skill 仅在特定上下文中激活。

> 具体匹配实现位于 agentsdk-go 的 Runtime/Skills 模块中，本项目侧重于 Skill 的发现、加载与注册，遵循其匹配行为。

### 2.3 会话中的表现形式

当 Skill 被选中或激活后，通常会以以下方式发挥作用：

- 向系统 Prompt 注入特定领域的说明和约束；
- 为 Agent 提供特定领域的工具或命令约定（例如 K8s 操作、告警分析指南等）；
- 指导 Agent 输出更结构化、贴近领域场景的回答。

---

## 三、如何新增个人 Skill

你可以通过两种方式新增个人 Skill：

1. 在项目工作区（推荐）：`<project-root>/skills/...`
2. 在全局托管目录：`~/.openocta/skills/...`

只要目录结构满足前述规则，Runtime 启动时就会自动发现并注册。

### 3.1 单目录 Skill（推荐）

适合一个领域一个目录，包含 `SKILL.md` 及附属文件（脚本、示例等）。

示例目录：

```text
skills/
└── my-sre/
    ├── SKILL.md
    └── runbook-examples/
        └── cpu-high.md
```

`SKILL.md` 示例：

```md
---
name: "MySRE"
emoji: "🚨"
homepage: "https://internal-wiki/sre"
---

# MySRE 运行手册 Skill

你是一个专注于我们公司内部系统的 SRE 助手，具备以下能力：

- 识别常见的告警类型（CPU、内存、磁盘、延迟等）
- 根据内部约定给出排查步骤与升级路径
- 当信息不足时，明确指出需要补充哪些观测数据

在回答中，请：

1. 用简体中文回答；
2. 使用小标题分段说明「现象 / 可能原因 / 建议操作」；
3. 如果告警来自我们的监控系统，请优先按照内部 runbook 的风格输出。
```

只要该目录位于：

- `<project-root>/skills/my-sre/`，或
- `~/.openocta/skills/my-sre/`

Runtime 启动时就会将其视为名为 `"MySRE"` 的 Skill，并在会话中按匹配规则使用。

### 3.2 单文件 Skill

当你只需要一个轻量级 Skill 时，可以直接在某个 `skills` 目录下放一个 `.md` 文件：

```text
skills/
└── db.md
```

`db.md` 示例：

```md
---
name: "DBHelper"
emoji: "🗄️"
---

# 数据库排查助手

你擅长帮助定位常见的数据库问题，例如连接数过高、慢查询、锁等待等。

回答时请：

- 先确认数据库类型（MySQL/PostgreSQL/其他）；
- 根据类型提示可能需要查看的指标或日志；
- 输出一份分步骤排查建议。
```

此文件会被视为一个名为 `"DBHelper"` 的 Skill。

### 3.3 使用配置扩展 Skill 目录

如果你希望将个人 Skill 存放在自定义路径（例如团队共享目录），可以通过配置：

```json5
{
  "skills": {
    "load": {
      "extraDirs": [
        "~/my-shared-skills",
        "/opt/company/skills"
      ]
    }
  }
}
```

这些目录中的 Skills 会按**最低优先级**加载，仍然可以被 workspace/managed/bundled 中的同名 Skill 覆盖。

---

## 四、最佳实践建议

- **按领域拆分目录**：一个领域一个 Skill 目录，便于维护与替换。
- **充分利用 frontmatter**：为 Skill 提供清晰的名称、emoji、homepage，以及未来可能扩展的元数据（OS/Requires 等）。
- **本地开发优先使用 workspace Skills**：将项目专用 Skill 放在 `<project-root>/skills` 下，避免影响全局环境。
- **团队共享通过 extraDirs/managedSkills**：将公共 Skill 放到 `~/.openocta/skills` 或配置的 `extraDirs`，在多个项目间复用。

