import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  console.log("[Feedback API] Request received");
  
  // Check environment
  if (!process.env.DATABASE_URL) {
    console.error("[Feedback API] DATABASE_URL not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    console.log("[Feedback API] Request body:", { type: body.type, email: body.email, hasMessage: !!body.message });
    
    const { type, message, email, browserInfo } = body;

    // Validate required fields
    if (!type || !message || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First, ensure we have a system user for anonymous feedback
    let systemUser = await prisma.user.findFirst({
      where: { email: "system@v3ra.ai" }
    });

    if (!systemUser) {
      console.log("[Feedback API] Creating system user for anonymous feedback");
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
    console.log("[Feedback API] Creating feedback record...");
    const feedback = await prisma.feedback.create({
      data: feedbackData,
    });
    console.log("[Feedback API] Feedback created:", feedback.id);

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
}

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