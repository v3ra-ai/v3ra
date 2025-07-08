#!/bin/bash

# Script to clean test data from production database
# Run this before beta launch

echo "🧹 Cleaning test data from production database..."
echo "⚠️  This will remove all test/demo user data!"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "📊 Current database statistics:"
npx prisma db execute --stdin < <(cat <<EOF
SELECT 'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Test Users', COUNT(*) FROM "User" WHERE email LIKE 'test%@%' OR email LIKE 'demo%@%'
UNION ALL
SELECT 'MarketBets', COUNT(*) FROM "MarketBet"
UNION ALL
SELECT 'PredictionMarkets', COUNT(*) FROM "PredictionMarket"
UNION ALL
SELECT 'Pending Markets', COUNT(*) FROM "PredictionMarket" WHERE status = 'PENDING';
EOF
)

echo ""
echo "🔄 Running cleanup script..."

# Execute the cleanup SQL
npx prisma db execute --file ./scripts/clean-test-data.sql

if [ $? -eq 0 ]; then
    echo "✅ Test data cleaned successfully!"
    echo ""
    echo "📊 New database statistics:"
    npx prisma db execute --stdin < <(cat <<EOF
SELECT 'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'UserPoints', COUNT(*) FROM "UserPoints"
UNION ALL
SELECT 'PredictionMarkets', COUNT(*) FROM "PredictionMarket"
UNION ALL
SELECT 'MarketBets', COUNT(*) FROM "MarketBet";
EOF
)
else
    echo "❌ Error cleaning test data"
    exit 1
fi

echo ""
echo "🎯 Next steps:"
echo "1. Verify the counts look correct"
echo "2. Test a real user login to ensure data integrity"
echo "3. Deploy to production"