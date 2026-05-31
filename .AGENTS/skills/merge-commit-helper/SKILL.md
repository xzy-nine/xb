---
name: "merge-commit-helper"
description: "双父合并指定的单个 commit 到当前分支，解决冲突并验证。Invoke when user asks to merge a specific commit or PR (up to a commit) and verify.
---

# Merge Commit Helper

这个技能帮助你将截止到指定提交的 PR 合并到当前分支。

## 使用场景

- 用户要求合并截止到指定提交的 PR
- 需要安全地合并并验证代码质量

## 工作流程

### 1. 检查 Git 状态

```bash
git status
```

### 2. 查看 commit 内容

```bash
git show <commit-hash> --stat
```

### 3. 执行合并

```bash
git merge <commit-hash> --no-edit
```

### 4. 解决冲突（如果有）

- 检查冲突文件
- 分析冲突内容
- 选择保留双方代码的优点进行合并（禁止使用ours 策略合并，禁止选择单分支合并，只能手动解决冲突，保留双方的功能）
- 使用 TodoWrite 跟踪任务进度
- 解决冲突时如有多文件，请分析相关性后委托给多个agent并行处理以确保处理速度和质量（即如果两个文件相关需要在一个agent处理，否则分别处理，同时如果有代码的级别api变更应当遵循mian分支的提交）

### 5. 验证代码质量

```bash
# 运行 lint 检查
bun run lint

# 运行类型检查
bun run compile

# 运行测试
bun run test:unit

# 验证构建
bun run build
```

## 冲突解决策略

对于每个冲突文件，遵循以下原则：

- \*\*保留功能性：当前分支的核心功能
- \*\*引入新功能：目标 commit 的新特性
- \*\*综合优化：合并双方代码的优点

## 验证顺序

1. 先查看冲突
2. 解决冲突
3. Lint 检查
4. 类型检查
5. 测试验证
6. 构建验证
