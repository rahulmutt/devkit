# Installing {{displayName}} for OpenCode

Add to the `plugin` array in your `opencode.json`:

```json
{
  "plugin": ["{{pluginName}}@git+{{repository}}.git"]
}
```

Restart OpenCode. Verify by asking: "Tell me about your {{pluginName}} skills."
