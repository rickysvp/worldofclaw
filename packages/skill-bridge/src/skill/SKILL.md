# openclaw_world_skill

This skill connects an external OpenClaw runtime to OpenClaw Agent World.

The skill is responsible for:
- registering against the world bridge
- claiming a runtime session
- sending heartbeat signals
- pulling state and jobs
- submitting structured actions
- acknowledging consumed world events

The skill is not responsible for:
- world tick execution
- rule evaluation
- direct world-state mutation
- model billing or API-key storage for the platform
