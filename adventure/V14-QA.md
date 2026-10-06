# v14 QA

Automated/static checks completed:
- JavaScript syntax passes `node --check`.
- All six newly embedded generated-art assets decode successfully from the final HTML.
- Police map patrol and boss route points were checked against the new walkable geometry.
- v14 service-worker cache version is 14.0.0.
- Secret-door return logic offsets the player away from the triggering door to prevent the first-level re-entry loop.

Runtime browser navigation is restricted in this execution environment, so physical iPhone playtesting remains required for final feel/performance validation.
