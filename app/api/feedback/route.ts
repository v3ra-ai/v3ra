import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import crypto from "crypto";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";
import { rateLimitNormal } from "@/lib/middleware/rate-limit";

const feedbackSchema = z.object({
  type: z.enum(["bug", "feature", "ux", "other"]),
  message: z.string().min(1).max(5000),
  email: z.string().email(),
  browserInfo: z.object({
    userAgent: z.string(),
    platform: z.string(),
    language: z.string(),
    screenResolution: z.string(),
    timezone: z.string(),
    url: z.string().url(),
  }).optional(),
  category: z.string().optional(),
  component: z.string().optional(),
  action: z.string().optional(),
  url: z.string().url().optional(),
});

export const POST = rateLimitNormal(async (request: NextRequest) => {
  logger.debug("Request received", null, { context: "Feedback API" });
  
  // Check environment
  if (!process.env.DATABASE_URL) {
    logger.error("DATABASE_URL not configured", null, { context: "Feedback API" });
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = feedbackSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    const { type, message, email, browserInfo } = validationResult.data;
    logger.debug("Request body:", { type, email, hasMessage: !!message }, { context: "Feedback API" });

    // First, ensure we have a system user for anonymous feedback
    let systemUser = await prisma.user.findFirst({
      where: { email: "system@v3ra.ai" }
    });

    if (!systemUser) {
      logger.debug("Creating system user for anonymous feedback", null, { context: "Feedback API" });
      systemUser = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: "system@v3ra.ai",
          name: "System",
          updatedAt: new Date(),
        }
      });
    }

    // Prepare feedback data using system user
    const feedbackData = {
      id: crypto.randomUUID(),
      userId: systemUser.id,
      username: email.split("@")[0],
      email,
      component: type,
      action: "user_feedback",
      url: browserInfo?.url || "",
      browserInfo: browserInfo || {},
      explanation: message,
      rating: "feedback",
      options: [type],
      includeBrowserInfo: true,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Feedback`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    logger.debug("Creating feedback record...", null, { context: "Feedback API" });
    const feedback = await prisma.feedback.create({
      data: feedbackData,
    });
    logger.debug("Feedback created:", feedback.id, { context: "Feedback API" });

    // Send to Slack if webhook is configured
    const slackWebhookUrl = process.env.SLACK_FEEDBACK_WEBHOOK_URL;
    if (slackWebhookUrl) {
      await sendToSlack(slackWebhookUrl, {
        type,
        message,
        email,
        url: browserInfo?.url,
        userAgent: browserInfo?.userAgent,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback submission error:", error);
    
    // Return more detailed error in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        { 
          error: "Failed to submit feedback",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
});

interface SlackFeedback {
  type: string;
  message: string;
  email: string;
  url?: string;
  userAgent?: string;
}

async function sendToSlack(webhookUrl: string, feedback: SlackFeedback) {
  const { type, message, email, url, userAgent } = feedback;

  // Determine emoji and color based on type
  const typeConfig: Record<string, { emoji: string; color: string }> = {
    bug: { emoji: "🐛", color: "#dc2626" },
    feature: { emoji: "✨", color: "#3b82f6" },
    ux: { emoji: "🎨", color: "#8b5cf6" },
    other: { emoji: "💬", color: "#6b7280" },
  };

  const config = typeConfig[type] || typeConfig.other;

  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${config.emoji} New Feedback: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*From:*\n${email}`,
          },
          {
            type: "mrkdwn",
            text: `*Type:*\n${type}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Message:*\n${message}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `📍 ${url || "No URL"} | 🖥️ ${userAgent ? userAgent.substring(0, 50) + "..." : "No user agent"}`,
          },
        ],
      },
    ],
    attachments: [
      {
        color: config.color,
        footer: "v3ra Feedback System",
        footer_icon: "https://v3ra.ai/favicon.ico",
        ts: Math.floor(Date.now() / 1000).toString(),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to send to Slack");
    }
  } catch {
    // Log error but don't fail the feedback submission
  }
}