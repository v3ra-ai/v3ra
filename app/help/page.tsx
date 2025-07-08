import { 
  HelpCircle, 
  Brain, 
  Coins, 
  TrendingUp, 
  Trophy, 
  MessageSquare,
  AlertCircle,
  Sparkles,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">V3RA Help Center</h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about using V3RA's AI consensus platform
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Beta Version</AlertTitle>
          <AlertDescription>
            V3RA is currently in beta. Features may change and occasional issues may occur. 
            Your feedback helps us improve!
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              What is V3RA?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              V3RA is an AI consensus network that allows you to query multiple AI models 
              simultaneously and see their collective intelligence at work.
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold">Key Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Query multiple AI models with a single question</li>
                <li>View consensus results and individual model responses</li>
                <li>Make predictions on future events</li>
                <li>Participate in prediction markets</li>
                <li>Compete on the global leaderboard</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              How V3RA Points Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h4 className="font-semibold mb-2">Earning Points</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Welcome Bonus:</strong> 1,000 points for new users</li>
                  <li>• <strong>Daily Bonus:</strong> 100 base points + streak bonus (up to 200 total)</li>
                  <li>• <strong>Winning Predictions:</strong> Earn based on your bet amount and odds</li>
                  <li>• <strong>Market Making:</strong> Stake points to activate prediction markets</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Spending Points</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>AI Queries:</strong> Each query costs 10 points</li>
                  <li>• <strong>Predictions:</strong> Bet on outcomes (minimum 10 points)</li>
                  <li>• <strong>Market Staking:</strong> Activate markets for others to bet on</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Truth Market Explained
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The Truth Market is V3RA's prediction market where you can bet on the likelihood 
              of future events and outcomes.
            </p>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">How it works:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mt-2">
                  <li>Browse available prediction markets</li>
                  <li>Choose YES or NO on an outcome</li>
                  <li>Place your bet (minimum 10 points)</li>
                  <li>Wait for the event to resolve</li>
                  <li>Win points based on the outcome and odds</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold">Dynamic Odds:</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Odds change based on how other users are betting. Early bets on 
                  the correct outcome earn higher returns!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Tomorrow's Headlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Make predictions on AI-generated future headlines and test your 
              forecasting abilities.
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold">Daily Predictions:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>New headlines generated daily across various categories</li>
                <li>Swipe or click to predict likelihood (1-5 scale)</li>
                <li>AI validators provide consensus predictions</li>
                <li>Earn points when your predictions align with outcomes</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Leaderboard & Competition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Compete with other users and climb the global rankings based on your 
              prediction accuracy and points earned.
            </p>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div>• Rankings update in real-time</div>
              <div>• View top performers and their strategies</div>
              <div>• Track your win rate and total earnings</div>
              <div>• Special rewards for top performers (coming soon)</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Getting Help & Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">Report Issues:</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the feedback widget (bottom-right corner) to report bugs or issues
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Feature Requests:</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Share your ideas through the feedback widget - we read everything!
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Community:</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Join our community discussions (link coming soon)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Beta Limitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Limited to 1,000 beta users initially</li>
              <li>• Some features may be temporarily unavailable</li>
              <li>• Points and rankings may be reset after beta</li>
              <li>• Email notifications are currently limited</li>
              <li>• Mobile experience is being optimized</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}