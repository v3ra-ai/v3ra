SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('UserPoints', 'PointsTransaction', 'User', 'VoteSession')
ORDER BY table_name, column_name;