/**
 * Normalizes prediction outcomes to handle variations in phrasing
 */
export class PredictionNormalizer {
  private teamMappings: Map<string, string> = new Map([
    // MLB Teams
    ['dodgers', 'Los Angeles Dodgers'],
    ['la dodgers', 'Los Angeles Dodgers'],
    ['los angeles dodgers', 'Los Angeles Dodgers'],
    ['yankees', 'New York Yankees'],
    ['ny yankees', 'New York Yankees'],
    ['new york yankees', 'New York Yankees'],
    ['astros', 'Houston Astros'],
    ['houston astros', 'Houston Astros'],
    ['braves', 'Atlanta Braves'],
    ['atlanta braves', 'Atlanta Braves'],
    ['padres', 'San Diego Padres'],
    ['san diego padres', 'San Diego Padres'],
    ['mets', 'New York Mets'],
    ['ny mets', 'New York Mets'],
    ['new york mets', 'New York Mets'],
    // Add more teams as needed
  ]);

  normalizeOutcome(outcome: string, category?: string): string {
    const cleaned = outcome
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\bwin\b|\bwins\b|\bwinning\b|\bwill win\b/g, '')
      .replace(/\bthe\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // For sports predictions, try to match team names
    if (category === 'sports') {
      // Check for "other teams" variations
      if (cleaned.includes('other') || cleaned.includes('field') || cleaned.includes('another')) {
        return 'Other teams';
      }

      // Try to match known teams
      for (const [pattern, teamName] of this.teamMappings) {
        if (cleaned.includes(pattern)) {
          return teamName;
        }
      }
    }

    // For non-sports or unmatched, return cleaned version
    return outcome.trim();
  }

  /**
   * Groups similar predictions together
   */
  groupPredictions(predictions: Array<{ outcome: string; probability: number }>, category?: string): Map<string, number[]> {
    const groups = new Map<string, number[]>();

    for (const pred of predictions) {
      const normalized = this.normalizeOutcome(pred.outcome, category);
      const existing = groups.get(normalized) || [];
      existing.push(pred.probability);
      groups.set(normalized, existing);
    }

    return groups;
  }
}