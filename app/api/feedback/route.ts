import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { createSupabaseServerClient } from "@/lib/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, email, userId, browserInfo } = body;

    // Validate required fields
    if (!type || !message || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user from session if available
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Prepare feedback data
    const feedbackData = {
      userId: user?.id || userId || "anonymous",
      username: user?.user_metadata?.username || email.split("@")[0],
      email,
      component: type,
      action: "user_feedback",
      url: browserInfo?.url || "",
      browserInfo: browserInfo || {},
      explanation: message,
      rating: "feedback",
      options: [type],
      includeBrowserInfo: true,
    };

    // Save to database
    await prisma.feedback.create({
      data: feedbackData,
    });

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
  } catch {
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