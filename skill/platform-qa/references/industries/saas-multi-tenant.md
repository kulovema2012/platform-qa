# SaaS and multi-tenant platforms

| Role | Feature | Why it matters |
|---|---|---|
| User | Switch between organizations or workspaces | Many users belong to several |
| User | Clear indication of which workspace is active | Actions in the wrong workspace cause damage |
| Workspace admin | Invite, remove and change roles of members | Team changes |
| Workspace admin | Custom roles or fine-grained permissions (where the plan offers it) | Larger customers need them |
| Workspace admin | Single sign-on and domain-based joining (business plans) | Expected by larger companies |
| Workspace admin | Workspace settings, branding, time zone, locale | Fits each customer |
| Workspace admin | Usage against plan limits | No surprise blocks |
| Workspace admin | Billing: plan, seats, invoices, payment method, cancel | Self-service lowers support load |
| Workspace admin | Data export of the whole workspace | Trust and portability |
| Workspace admin | Delete the workspace with a grace period | Accidental deletion recovery |
| Workspace admin | API keys or integrations with scopes and revocation | Safe automation |
| Workspace admin | Workspace audit log | Security reviews by customers |
| Platform admin | Look up a tenant and its users for support | Support needs context |
| Platform admin | Impersonation with consent and an audit record | Debugging without asking for passwords |
| Platform admin | Suspend a tenant; adjust plan or limits | Abuse and billing problems |
| Platform admin | Feature flags per tenant | Gradual rollouts |
| System | Strict tenant isolation on every query and file | Cross-tenant leaks are the worst SaaS failure |
| System | Per-tenant rate limits | One tenant cannot slow everyone |
| System | Status page or incident notices | Customers need to know about outages |

This catalogue is a starting point. Check the app's own docs and decisions before calling anything missing.
