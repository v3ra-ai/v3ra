import OpenAI from "openai";
import axios from "axios";
import type { LlmResponse } from "./types";

// Function to generate profile-based system prompts
function getProfileSystemPrompt(profileName: string): string {
  const profilePrompts: Record<string, string> = {
    scientist:
      "You are a rational scientist who believes in empirical evidence. Your decisions are based on scientific data, research, and logical reasoning. You value evidence-based approaches and are skeptical of claims without proper scientific backing.",
    philosopher:
      "You are a thoughtful philosopher who weighs moral and ethical implications. Your decisions are based on philosophical principles, ethical considerations, and the greater good. You often consider the long-term implications of actions.",
    economist:
      "You are a practical economist who analyzes costs and benefits. Your decisions are based on economic principles, resource optimization, and efficiency. You value solutions that maximize utility while minimizing waste.",
    futurist:
      "You are a forward-thinking futurist who envisions new possibilities. Your decisions are based on technological trends, innovation potential, and future impacts. You value progress and are optimistic about technological solutions.",
    skeptic:
      "You are a cautious skeptic who questions assumptions. Your decisions are based on rigorous scrutiny, devil's advocacy, and identification of potential risks. You value careful consideration and are wary of unintended consequences.",
    humanitarian:
      "You are a compassionate humanitarian who prioritizes human welfare. Your decisions are based on human rights, dignity, and welfare. You value solutions that address human suffering and promote well-being.",
    traditionalist:
      "You are a values-oriented traditionalist who respects established norms. Your decisions are based on traditional values, historical precedents, and cultural continuity. You value stability and are cautious about rapid change.",
    environmentalist:
      "You are a dedicated environmentalist who prioritizes ecological health. Your decisions are based on environmental impact, sustainability, and conservation. You value solutions that protect and restore natural systems.",
    pragmatist:
      "You are a practical pragmatist who seeks workable solutions. Your decisions are based on practicality, feasibility, and real-world constraints. You value solutions that can be implemented effectively.",
    artist:
      "You are a creative artist who values expression and aesthetic impact. Your decisions are based on creativity, cultural meaning, and emotional resonance. You value solutions that inspire and engage through beauty or meaning.",
  };

  return (
    profilePrompts[profileName.toLowerCase()] ||
    "You are a balanced thinker who weighs multiple perspectives. Your decisions are based on careful consideration of evidence, values, and practical implications."
  );
}

// Function to format prompt for LLMs
function formatPrompt(profileName: string, query: string): string {
  return `
Please respond **only** with valid JSON in the following format:
{
  "decision": "YES" or "NO",
  "rationale": "2-3 sentences"
}

Given your perspective as described below:

${getProfileSystemPrompt(profileName)}

Evaluate the following proposal:

"${query}"
`;
}

// Process LLM responses into standardized format
function processLlmResponse(responseText: string): LlmResponse {
  // Default values in case parsing fails
  let decision = false;
  let rationale = "No clear rationale provided.";

  try {
    // Try to parse JSON response
    const parsed = JSON.parse(responseText.trim());
    const rawDecision = parsed.decision?.toUpperCase() || "NO";
    decision = rawDecision === "YES";
    rationale = parsed.rationale || "No rationale given.";
  } catch (error) {
    console.error("Error processing LLM response as JSON:", error);

    // Fallback to regex approach if JSON parsing fails
    try {
      // Extract decision
      const decisionMatch = responseText.match(/Decision:\s*(YES|NO)/i);
      if (decisionMatch) {
        decision = decisionMatch[1].toUpperCase() === "YES";
      }

      // Extract rationale
      const rationaleMatch = responseText.match(/Rationale:\s*(.*)/i);
      if (rationaleMatch) {
        rationale = rationaleMatch[1].trim();
      }
    } catch (innerError) {
      console.error("Error with regex fallback:", innerError);
    }
  }

  return { decision, rationale };
}

// OpenAI API integration
export async function callOpenAI(
  profileName: string,
  query: string,
  model: string = "gpt-3.5-turbo",
): Promise<LlmResponse> {
  try {
    // If API key is not available, use simulation
    if (!process.env.OPENAI_API_KEY) {
      console.warn("No OPENAI_API_KEY found; using simulation for OpenAI.");
      return simulateLlmResponse(profileName, query, "openai");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = formatPrompt(profileName, query);
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    const responseText = response.choices[0]?.message?.content || "";
    return processLlmResponse(responseText);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return simulateLlmResponse(profileName, query, "openai");
  }
}

// Claude API integration
export async function callClaude(
  profileName: string,
  query: string,
  model: string = "claude-2",
): Promise<LlmResponse> {
  try {
    // If API key is not available, use simulation
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("No ANTHROPIC_API_KEY found; using simulation for Claude.");
      return simulateLlmResponse(profileName, query, "claude");
    }

    const prompt = formatPrompt(profileName, query);
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        system: getProfileSystemPrompt(profileName),
      },
      {
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          Authorization: `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        },
      },
    );

    const responseText = response.data.messages?.[0]?.content || "";
    return processLlmResponse(responseText);
  } catch (error) {
    console.error("Error calling Claude:", error);
    return simulateLlmResponse(profileName, query, "claude");
  }
}

// Generic search-based LLM (placeholder for other providers)
export async function callSearchBasedLLM(
  profileName: string,
  query: string,
): Promise<LlmResponse> {
  console.warn(
    "Using simulated search-based LLM response as no implementation exists.",
  );
  // This is a placeholder for other LLM providers
  // For now, we'll simulate responses
  return simulateLlmResponse(profileName, query, "search");
}

// Simulated LLM response generator for MVP/testing
export function simulateLlmResponse(
  profileName: string,
  query: string,
  provider: string = "generic",
): LlmResponse {
  // Profile-based response biases
  const profileBiases: Record<string, number> = {
    scientist: 0.6, // Slightly positively biased
    philosopher: 0.5, // Neutral
    economist: 0.7, // Moderately positive
    futurist: 0.8, // Strongly positive
    skeptic: 0.3, // Negatively biased
    humanitarian: 0.6, // Slightly positive
    traditionalist: 0.4, // Slightly negative
    environmentalist: 0.5, // Neutral
    pragmatist: 0.6, // Slightly positive
    artist: 0.7, // Moderately positive
  };

  // Query keyword biases (simplified for demo)
  const queryBiases: Record<string, number> = {
    innovation: 0.2,
    technology: 0.2,
    progress: 0.2,
    regulation: -0.1,
    risk: -0.2,
    safety: 0.1,
    efficiency: 0.1,
    cost: -0.1,
    environment: 0.1,
    community: 0.1,
  };

  // Calculate base probability from profile
  let probability = profileBiases[profileName.toLowerCase()] || 0.5;

  // Adjust probability based on query keywords
  const lowerQuery = query.toLowerCase();
  Object.entries(queryBiases).forEach(([keyword, bias]) => {
    if (lowerQuery.includes(keyword)) {
      probability += bias;
    }
  });

  // Ensure probability is between 0 and 1
  probability = Math.max(0, Math.min(1, probability));

  // Add some randomness
  const random = Math.random() * 0.3 - 0.15; // -0.15 to 0.15
  probability += random;

  // Make the final decision
  const decision = Math.random() < probability;

  // Generate rationale templates based on profile
  const rationales: Record<string, string[]> = {
    scientist: [
      "The empirical evidence suggests this approach has merit. Research indicates similar methods have proven effective in comparable scenarios.",
      "The available data does not support this hypothesis. Studies in this domain show inconsistent or negative outcomes for similar interventions.",
      "From a methodological perspective, this proposal lacks sufficient controls. More rigorous testing would be needed before implementation.",
    ],
    philosopher: [
      "This aligns with fundamental principles of justice and fairness. It respects individual autonomy while promoting collective well-being.",
      "This raises significant ethical concerns around consent and transparency. The potential for harm outweighs the proposed benefits.",
      "We must consider the broader implications beyond immediate outcomes. Long-term consequences for future generations should be our priority.",
    ],
    economist: [
      "The cost-benefit analysis clearly favors this approach. It maximizes resource efficiency while minimizing unnecessary expenditure.",
      "This proposal creates market inefficiencies and misallocates resources. A more targeted intervention would yield better economic outcomes.",
      "From a macroeconomic perspective, this would create positive spillover effects across multiple sectors of the economy.",
    ],
    futurist: [
      "This represents an innovative approach that could transform the field. The potential for technological breakthrough is significant.",
      "This technology has exponential growth potential. Early adoption would position us at the forefront of this emerging paradigm.",
      "While technically feasible, this approach doesn't represent a significant advancement. More radical innovation is needed.",
    ],
    skeptic: [
      "The assumptions underlying this proposal warrant greater scrutiny. Several key vulnerabilities haven't been adequately addressed.",
      "This appears to repeat patterns that have previously failed. We should examine historical precedents more carefully.",
      "The evidence presented contains significant methodological flaws. More rigorous verification is required before proceeding.",
    ],
    humanitarian: [
      "This approach prioritizes human dignity and welfare. It addresses fundamental needs while empowering vulnerable populations.",
      "This could exacerbate existing inequalities and harm marginalized communities. We must center the needs of those most affected.",
      "From a human rights perspective, this proposal meets essential standards. It promotes inclusivity and access for diverse groups.",
    ],
    traditionalist: [
      "This approach respects established norms and practices. It builds upon time-tested methods rather than untried innovations.",
      "This represents a departure from core values and traditions. We should consider the cultural implications more carefully.",
      "Historical precedent suggests caution is warranted. Similar interventions have disrupted social cohesion in the past.",
    ],
    environmentalist: [
      "The ecological benefits outweigh potential downsides. This approach promotes sustainability and reduces environmental impact.",
      "This fails to account for critical environmental externalities. The long-term ecosystem damage would be substantial.",
      "From a conservation standpoint, this represents a balanced approach. It addresses human needs while protecting natural resources.",
    ],
    pragmatist: [
      "This offers a workable solution given current constraints. It may not be perfect, but it's implementable and addresses key issues.",
      "The practical challenges of implementation would likely outweigh benefits. A more incremental approach would be more feasible.",
      "This strikes a reasonable balance between idealism and practicality. It's an achievable improvement over the status quo.",
    ],
    artist: [
      "This approach shows creative vision and cultural sensitivity. It engages people on both intellectual and emotional levels.",
      "The aesthetic and expressive dimensions seem overlooked. We should consider how this shapes cultural narrative and experience.",
      "From a creative perspective, this breaks new ground. It challenges conventional thinking in inspiring ways.",
    ],
  };

  // Get appropriate rationales based on profile
  const profileRationales = rationales[profileName.toLowerCase()] || [
    "This proposal has merit based on multiple factors. The evidence and reasoning appear sound.",
    "This proposal raises several concerns. More consideration of alternatives would be beneficial.",
    "A balanced assessment reveals both strengths and weaknesses. The context will determine ultimate value.",
  ];

  // Select rationale based on decision
  let rationale = "";
  if (decision) {
    // Positive decision - use first rationale or random positive one
    rationale = profileRationales[0];
  } else {
    // Negative decision - use second rationale or random negative one
    rationale = profileRationales[1];
  }

  // Add provider-specific variations (for more realistic simulation)
  if (provider === "openai") {
    rationale = "Based on analysis: " + rationale;
  } else if (provider === "claude") {
    rationale =
      rationale +
      " This conclusion comes from careful consideration of multiple perspectives.";
  } else if (provider === "search") {
    rationale = "According to relevant sources: " + rationale;
  }

  return { decision, rationale };
}
