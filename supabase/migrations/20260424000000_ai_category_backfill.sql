-- Backfill existing articles into the new 'ai' category when they match
-- AI/ML threat signals. Only reclassifies articles where the current
-- category is a weak generic bucket (vulnerability, malware, phishing),
-- so stronger primary categories (ransomware, zero-day, apt, etc.) stay
-- intact even when they happen to mention AI.

update articles
set category = 'ai',
    updated_at = now()
where category in ('vulnerability', 'malware', 'phishing')
  and (
    lower(title) ~ '(prompt injection|indirect prompt|jailbreak|model poisoning|data poisoning|adversarial ml|llm|large language model|generative ai|chatgpt|openai|anthropic|claude |gemini|copilot|model context protocol|\smcp\s|deepfake|deep fake|ai-powered|ai powered|ai agent|agentic)'
    or lower(summary) ~ '(prompt injection|indirect prompt|jailbreak|model poisoning|data poisoning|adversarial ml|llm|large language model|generative ai|chatgpt|openai|anthropic|claude |gemini|copilot|model context protocol|\smcp\s|deepfake|deep fake|ai-powered|ai powered|ai agent|agentic)'
    or exists (
      select 1 from unnest(tags) t
      where lower(t) ~ '(ai|llm|prompt-injection|jailbreak|deepfake|model-poisoning|copilot|chatgpt|anthropic|claude|gemini|agentic|mcp)'
    )
  );
