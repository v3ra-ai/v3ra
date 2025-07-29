import { NextRequest, NextResponse } from 'next/server'
import { broadcastAdaptiveQuery } from '@/app/actions-adaptive'
import { createSupabaseServerClient } from '@/lib/supabase-client'
import { getCsrfToken } from '@/lib/utils/csrf'

export async function POST(request: NextRequest) {
  try {
    const { prompt, models } = await request.json()

    if (!prompt || !models || models.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid request. Provide a prompt and exactly 2 model IDs.' },
        { status: 400 }
      )
    }

    // Get CSRF token
    const csrfToken = await getCsrfToken()

    // Get user session
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Query both models using the existing broadcast system
    const result = await broadcastAdaptiveQuery({
      query: prompt,
      selectedLlmIds: models,
      isPhilosophyMode: false,
      userId: user?.id,
      csrfToken
    })

    if (!result.success || !result.responses) {
      return NextResponse.json(
        { error: result.error || 'Failed to get AI responses' },
        { status: 500 }
      )
    }

    // Extract the responses for each model
    const modelResponses = models.map(modelId => {
      const response = result.responses.find(r => r.llmModelId === modelId)
      return response?.rationale || 'No response generated'
    })

    // Get model names from the responses
    const modelInfo = models.map(modelId => {
      const response = result.responses.find(r => r.llmModelId === modelId)
      return {
        id: modelId,
        name: response?.validatorName || modelId
      }
    })

    return NextResponse.json({
      prompt,
      models: modelInfo,
      responses: modelResponses
    })
    
  } catch (error) {
    console.error('AI Versus error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}