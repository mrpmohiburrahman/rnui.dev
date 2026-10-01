# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

## Design / UI

- Modals and overlays should be visually beautiful and self-contained: content must stay within the modal/viewport, and the panel needs breathing room from the viewport edges — a panel touching the screen's edge reads as content being cut off and is treated as a bug. Prefer sizing modal content so everything fits with no scrollbars at all (user explicitly asked for the modal and its content sized "so that there wouldn't be any scroll bar" and content "perfectly managed"); internal scrolling is a last resort, not the goal. Confidence: 0.7

## Workflow / Communication

- Wants the agent to keep working autonomously through a task without stopping or pausing to wait for input — explicitly pushed back on mid-task stoppages ("why are you stopping? continue"). Confidence: 0.7

