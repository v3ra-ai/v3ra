import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createSupabaseServerClient } from "@/lib/supabase-client";
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
    
    const { type, message, email, userId, browserInfo } = body;

    // Validate required fields
    if (!type || !message || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user from session if available
    console.log("[Feedback API] Getting user from session...");
    let supabaseUser = null;
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      supabaseUser = user;
      console.log("[Feedback API] Supabase user:", user ? "Found" : "Not found");
    } catch (error) {
      console.error("[Feedback API] Supabase auth error:", error);
    }

    // If user is not authenticated, find or create an anonymous user
    let feedbackUserId = supabaseUser?.id || userId;
    
    if (!feedbackUserId) {
      console.log("[Feedback API] Creating/finding anonymous user for email:", email);
      
      try {
        // Check if we have an anonymous user for this email
        let anonymousUser = await prisma.user.findUnique({
          where: { email },
        });

        // If not, create one
        if (!anonymousUser) {
          console.log("[Feedback API] Creating new user...");
          anonymousUser = await prisma.user.create({
            data: {
              id: crypto.randomUUID(),
              email,
              name: email.split("@")[0],
              updatedAt: new Date(),
            },
          });
          console.log("[Feedback API] User created:", anonymousUser.id);
        } else {
          console.log("[Feedback API] Existing user found:", anonymousUser.id);
        }

        feedbackUserId = anonymousUser.id;
      } catch (error) {
        console.error("[Feedback API] User creation/lookup error:", error);
        throw error;
      }
    }

    // Prepare feedback data
    const feedbackData = {
      id: crypto.randomUUID(),
      userId: feedbackUserId,
      username: supabaseUser?.user_metadata?.username || email.split("@")[0],
      email,
      component: type,
      action: "user_feedback",
      url: browserInfo?.url || "",
      browserInfo: browserInfo || {},
      explanation: message,
      rating: "feedback",
      options: [type],
      includeBrowserInfo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    console.log("[Feedback API] Creating feedback record...");
    try {
      const feedback = await prisma.feedback.create({
        data: feedbackData,
      });
      console.log("[Feedback API] Feedback created:", feedback.id);
    } catch (error) {
      console.error("[Feedback API] Feedback creation error:", error);
      throw error;
    }

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