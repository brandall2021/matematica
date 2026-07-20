package com.matematica.rag;

public enum ModelProvider {
    OPENAI("OpenAI", "gpt-4"),
    CLAUDE("Anthropic Claude", "claude-sonnet-4-20250514"),
    GEMINI("Google Gemini", "gemini-2.0-flash"),
    DEEPSEEK("DeepSeek", "deepseek-chat"),
    OLLAMA("Ollama (Local)", "llama3");

    private final String displayName;
    private final String defaultModel;

    ModelProvider(String displayName, String defaultModel) {
        this.displayName = displayName;
        this.defaultModel = defaultModel;
    }

    public String getDisplayName() { return displayName; }
    public String getDefaultModel() { return defaultModel; }
}