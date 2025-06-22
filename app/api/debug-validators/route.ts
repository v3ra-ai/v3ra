import { NextResponse } from "next/server";
import { validatorService } from "@/lib/services/validatorService";

export async function GET() {
  try {
    const validators = await validatorService.getActiveDbValidators();
    const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
    
    return NextResponse.json({
      validatorCount: validators.length,
      hasOpenRouterKey,
      validators: validators.map(v => ({
        id: v.id,
        name: v.profileName,
        provider: v.provider,
        active: v.active,
        hasApiKeys: v.apiKeys?.length > 0
      })),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}