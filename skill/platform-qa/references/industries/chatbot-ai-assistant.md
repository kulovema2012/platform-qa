# Chatbot and AI assistant

| Role | Feature | Why it matters |
|---|---|---|
| User | Clear statement of what the bot can and cannot do | Sets expectations; fewer frustrated users |
| User | Conversation history and continue later | Users return to unfinished questions |
| User | Hand-off to a human, or a contact route | Some problems the bot cannot solve |
| User | Feedback on answers (helpful / not helpful, report) | Main source of quality signals |
| User | Stop or regenerate a reply | Recovers from bad or slow answers |
| User | Delete own conversations | Privacy and trust |
| User | Sources or citations for factual answers | Lets users check claims |
| User | Clear errors when the AI is unavailable | Silent failures look like the bot ignoring them |
| Admin | Read and search conversation logs (with privacy controls) | Finding and fixing bad answers |
| Admin | Export conversations | Analysis, compliance requests |
| Admin | Bot rules: topics, tone, refusals, system prompt management | Control without code changes |
| Admin | Knowledge base management (add, update, remove documents) | Answers go stale otherwise |
| Admin | Block or limit abusive users | Abuse costs money and harms other users |
| Admin | Usage and cost dashboard per day and per user | Runaway spend is found late otherwise |
| Admin | Spending caps and rate limits | Hard ceiling on cost |
| Admin | Review queue of low-rated or flagged answers | Systematic quality improvement |
| Admin | Test set and regression check before changing prompts or models | Changes silently break good answers |
| Admin | Model and version selection with change history | Knowing why answers changed |
| Owner | Data retention settings and personal-data handling | Legal duties for stored chats |
| System | Prompt-injection defences and permission checks on bot actions | The bot acts with the user's rights, never more |

This catalogue is a starting point. Check the app's own docs and decisions before calling anything missing.
