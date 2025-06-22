"use client";

import { useEffect } from "react";
import { useLLMStore } from "@/store/llm-store";
import AIModelsList from "./ai-models-list";

// Sample AI models for demonstration
const sampleModels = [
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    enabled: true,
    avatar: null,
    pinned: false,
    usage: 1250,
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    enabled: true,
    avatar: null,
    pinned: true,
    usage: 890,
  },
  {
    id: "llama-3-70b",
    name: "Llama 3 70B",
    provider: "Meta",
    enabled: false,
    avatar: null,
    pinned: false,
    usage: 567,
  },
  {
    id: "mixtral-8x7b",
    name: "Mixtral 8x7B",
    provider: "Mistral AI",
    enabled: true,
    avatar: null,
    pinned: false,
    usage: 445,
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    enabled: true,
    avatar: null,
    pinned: false,
    usage: 723,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    enabled: true,
    avatar: null,
    pinned: false,
    usage: 2100,
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    enabled: false,
    avatar: null,
    pinned: false,
    usage: 334,
  },
  {
    id: "palm-2",
    name: "PaLM 2",
    provider: "Google",
    enabled: false,
    avatar: null,
    pinned: false,
    usage: 223,
  },
];

export default function AIHubDemoWrapper() {
  const { init } = useLLMStore();

  useEffect(() => {
    // Initialize with sample data for demo
    init(sampleModels);
  }, [init]);

  return <AIModelsList />;
}
