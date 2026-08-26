# End-to-End Flow: Issue → Claude → PR → CI → E2E → Production

```mermaid
flowchart TD
    A["🎫 GitHub Issue<br/>assigned to me"] -->|"issues: assigned<br/>(claude-auto-implement.yml)"| B["🤖 Claude runs in the cloud<br/>anthropics/claude-code-action"]

    B --> C{"Issue labelled<br/>'ATDD'?"}
    C -->|yes| D["Write Gherkin .feature<br/>→ gen step defs<br/>→ fail for right reason<br/>→ implement until green"]
    C -->|no| E["Implement change<br/>on new branch"]
    D --> F["📤 Push branch<br/>+ open PR (Closes #issue)"]
    E --> F

    F --> G["✅ PR-gate CI (ci.yml)<br/>Steiger · typecheck · lint<br/>jsx-a11y · vitest · Playwright"]
    G -->|"@claude in comments<br/>(claude-pr-review.yml)"| H["🤖 Claude iterates<br/>on the PR"]
    H --> G

    G -->|green + review| I["🔀 Merge to main"]

    I -->|"push: main<br/>(e2e-deployed.yml)"| J["▲ Deploy Vercel preview<br/>+ point staging alias"]
    J --> K["🧪 Playwright E2E<br/>against the real deployed URL"]
    K -->|pass| L["🚀 Promote to Production"]
    K -->|fail| M["⛔ Stop — no promotion<br/>(upload Playwright report)"]

    classDef ai fill:#6b46c1,stroke:#4c1d95,color:#fff;
    classDef gate fill:#0e7490,stroke:#164e63,color:#fff;
    classDef prod fill:#15803d,stroke:#14532d,color:#fff;
    classDef stop fill:#b91c1c,stroke:#7f1d1d,color:#fff;
    class B,H,D ai;
    class G,K gate;
    class L prod;
    class M stop;
```

## Reading the diagram

- **Kickoff is an assignment, not a keystroke.** Assigning the issue is the entire trigger — Claude runs in CI and hands back a PR.
- **ATDD is enforced by the pipeline**, not by hoping the author remembers it — the `ATDD` label routes work through test-first steps.
- **Two test gates, two purposes:** PR-gate CI (fast: static checks + unit + Playwright on the branch) vs. post-merge E2E against a **real deployed URL**.
- **Production is earned:** promotion only happens if end-to-end tests pass against the live preview.
