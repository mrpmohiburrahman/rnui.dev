# Select inactive and non-visual examples

Status: ready-for-agent
Type: grilling
Blocked by: 02

## Question

How does execution handle source examples that the current app cannot select, and examples without a visible result?

The repository scan found archived examples, unmounted components, inactive effect variants, and an age-range request with no visible result.
The [inventory](../research/repo-animations.md#route-disconnected-source) names those sources and links their exact implementations.
The inventory retains these sources. It does not silently remove them from the requested repository expansion.
The source reports distinguish active entry points from inactive source paths.

Present each affected example with its exact source, the missing selector or visible result, and the proposed action.
The maintainer decides whether execution can add a temporary local selector, or whether the example stays blocked.
A permission for a selector does not permit a change to the animation itself.
An archived example is not a confirmed catalogue duplicate.
A source-level constraint is not a measured build failure.

This ticket is HITL. Use the question tool and state the recommended option.
Do not decide an exclusion or a source change for the maintainer.

## Completion

- Record a maintainer decision for every inactive example, nonselected effect variant, and the age-range request.
- Preserve exact source pointers for blocked examples.
- Carry approved local selectors into the build and record plan.
- Preserve the rule that a failed build requires a maintainer prompt.
