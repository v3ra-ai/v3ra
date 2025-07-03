import { TruthStatement } from './core';
import { v4 as uuidv4 } from 'uuid';

/**
 * StatementNormalizer converts any query into a verifiable truth statement
 * 
 * Examples:
 * - "Will AI be conscious?" → "AI will achieve consciousness"
 * - "Is climate change real?" → "Climate change is real"
 * - "Who will win the 2025 election?" → "[Candidate] will win the 2025 election"
 * - "What is the capital of France?" → "Paris is the capital of France"
 */
export class StatementNormalizer {
  /**
   * Convert any query to a verifiable statement
   */
  static normalize(query: string): TruthStatement {
    const cleaned = query.trim();
    let statement = cleaned;
    let timeframe: Date | undefined;
    let context: string | undefined;
    
    // Extract timeframe if present
    const timeframeResult = this.extractTimeframe(cleaned);
    if (timeframeResult.timeframe) {
      timeframe = timeframeResult.timeframe;
      statement = timeframeResult.cleanedQuery;
    }
    
    console.log('StatementNormalizer:', {
      query: cleaned,
      hasTimeframe: !!timeframe,
      timeframe,
      isFuture: timeframe && timeframe > new Date()
    });
    
    // Convert question formats to statements
    statement = this.convertToStatement(statement);
    
    // Extract context if query is complex
    const contextResult = this.extractContext(statement);
    if (contextResult.context) {
      context = contextResult.context;
      statement = contextResult.mainStatement;
    }
    
    return {
      id: uuidv4(),
      originalQuery: query,
      statement: statement,
      context: context,
      timeframe: timeframe,
      createdAt: new Date()
    };
  }
  
  /**
   * Convert various question formats to declarative statements
   */
  private static convertToStatement(query: string): string {
    // Handle "Will X happen?" format
    if (query.toLowerCase().startsWith('will ')) {
      return query.substring(5).replace(/\?$/, '');
    }
    
    // Handle "Is X true?" format
    if (query.toLowerCase().startsWith('is ')) {
      return query.substring(3).replace(/\?$/, ' is true');
    }
    
    // Handle "Are X?" format
    if (query.toLowerCase().startsWith('are ')) {
      return query.substring(4).replace(/\?$/, ' are true');
    }
    
    // Handle "Does X?" format
    if (query.toLowerCase().startsWith('does ')) {
      return query.substring(5).replace(/\?$/, ' is true');
    }
    
    // Handle "Can X?" format
    if (query.toLowerCase().startsWith('can ')) {
      return query.substring(4).replace(/\?$/, ' is possible');
    }
    
    // Handle "Should X?" format
    if (query.toLowerCase().startsWith('should ')) {
      return query.substring(7).replace(/\?$/, ' is advisable');
    }
    
    // Handle "Who will?" format - need more context
    if (query.toLowerCase().startsWith('who will ')) {
      // This needs the user to be more specific
      return query.replace(/\?$/, '') + ' [specific person/entity needed]';
    }
    
    // Handle "What is?" format
    if (query.toLowerCase().match(/^what is (the )?/)) {
      const match = query.match(/^what is (?:the )?(.+?)\??$/i);
      if (match) {
        // Try to infer a factual statement
        const subject = match[1];
        return `The answer to '${query}' is correctly stated`;
      }
    }
    
    // Handle "How many/much?" format
    if (query.toLowerCase().match(/^how (many|much)/)) {
      return query.replace(/\?$/, '') + ' is the correct amount';
    }
    
    // Handle yes/no questions that don't fit above patterns
    if (query.endsWith('?')) {
      return query.slice(0, -1) + ' is true';
    }
    
    // If it's already a statement, return as is
    return query;
  }
  
  /**
   * Extract timeframe from queries about future events
   */
  private static extractTimeframe(query: string): { 
    timeframe?: Date; 
    cleanedQuery: string 
  } {
    const currentYear = new Date().getFullYear();
    
    // Look for month + year patterns (e.g., "December 2025", "Jan 2026")
    const monthYearMatch = query.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(20\d{2})\b/i);
    if (monthYearMatch) {
      const monthStr = monthYearMatch[1];
      const year = parseInt(monthYearMatch[2]);
      
      const monthMap: Record<string, number> = {
        'january': 0, 'jan': 0,
        'february': 1, 'feb': 1,
        'march': 2, 'mar': 2,
        'april': 3, 'apr': 3,
        'may': 4,
        'june': 5, 'jun': 5,
        'july': 6, 'jul': 6,
        'august': 7, 'aug': 7,
        'september': 8, 'sep': 8, 'sept': 8,
        'october': 9, 'oct': 9,
        'november': 10, 'nov': 10,
        'december': 11, 'dec': 11
      };
      
      const month = monthMap[monthStr.toLowerCase()];
      if (month !== undefined) {
        // Set to end of that month
        const lastDay = new Date(year, month + 1, 0).getDate();
        return {
          timeframe: new Date(year, month, lastDay, 23, 59, 59),
          cleanedQuery: query
        };
      }
    }
    
    // Look for specific years (2024-2100)
    const yearMatch = query.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      if (year > currentYear) {
        // Set to end of that year for evaluation
        return {
          timeframe: new Date(year, 11, 31, 23, 59, 59),
          cleanedQuery: query
        };
      }
    }
    
    // Look for relative time phrases
    const relativeTimePatterns = [
      { pattern: /next (\d+) years?/i, unit: 'year' },
      { pattern: /next (\d+) months?/i, unit: 'month' },
      { pattern: /next (\d+) weeks?/i, unit: 'week' },
      { pattern: /next (\d+) days?/i, unit: 'day' },
      { pattern: /within (\d+) years?/i, unit: 'year' },
      { pattern: /within (\d+) months?/i, unit: 'month' },
      { pattern: /by next year/i, value: 1, unit: 'year' },
      { pattern: /by next month/i, value: 1, unit: 'month' },
      { pattern: /this year/i, value: 0, unit: 'endOfYear' },
      { pattern: /this month/i, value: 0, unit: 'endOfMonth' }
    ];
    
    for (const { pattern, unit, value } of relativeTimePatterns) {
      const match = query.match(pattern);
      if (match) {
        const amount = value !== undefined ? value : parseInt(match[1]);
        let timeframe = new Date();
        
        switch (unit) {
          case 'year':
            timeframe.setFullYear(timeframe.getFullYear() + amount);
            break;
          case 'month':
            timeframe.setMonth(timeframe.getMonth() + amount);
            break;
          case 'week':
            timeframe.setDate(timeframe.getDate() + (amount * 7));
            break;
          case 'day':
            timeframe.setDate(timeframe.getDate() + amount);
            break;
          case 'endOfYear':
            timeframe = new Date(currentYear, 11, 31, 23, 59, 59);
            break;
          case 'endOfMonth':
            const nextMonth = new Date(timeframe.getFullYear(), timeframe.getMonth() + 1, 0);
            timeframe.setTime(nextMonth.getTime());
            break;
        }
        
        return { timeframe, cleanedQuery: query };
      }
    }
    
    // Look for future tense indicators without specific time
    const futureTenseWords = ['will', 'going to', 'shall', 'predict', 'forecast'];
    const hasFutureTense = futureTenseWords.some(word => 
      query.toLowerCase().includes(word)
    );
    
    if (hasFutureTense) {
      // Default to 1 year from now if no specific time given
      const timeframe = new Date();
      timeframe.setFullYear(timeframe.getFullYear() + 1);
      return { timeframe, cleanedQuery: query };
    }
    
    return { cleanedQuery: query };
  }
  
  /**
   * Extract context from complex queries
   */
  private static extractContext(statement: string): {
    mainStatement: string;
    context?: string;
  } {
    // Look for context indicators
    const contextPatterns = [
      /(.+?)\s*[,;]\s*given that\s+(.+)/i,
      /(.+?)\s*[,;]\s*assuming\s+(.+)/i,
      /(.+?)\s*[,;]\s*considering\s+(.+)/i,
      /(.+?)\s*[,;]\s*in the context of\s+(.+)/i,
      /(.+?)\s*[,;]\s*based on\s+(.+)/i
    ];
    
    for (const pattern of contextPatterns) {
      const match = statement.match(pattern);
      if (match) {
        return {
          mainStatement: match[1].trim(),
          context: match[2].trim()
        };
      }
    }
    
    // If statement is very long, consider the additional info as context
    if (statement.length > 150 && statement.includes(',')) {
      const parts = statement.split(',');
      if (parts.length > 1) {
        return {
          mainStatement: parts[0].trim(),
          context: parts.slice(1).join(',').trim()
        };
      }
    }
    
    return { mainStatement: statement };
  }
}