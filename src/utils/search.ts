import { MenuItem } from '../types/type';

export function fuzzySearch(query: string, items: MenuItem[]): MenuItem[] {
  const qNorm = query.toLowerCase().trim();
  if (qNorm === "") return items;

  const reverseQNorm = qNorm.split("").reverse().join("");

  // Levenshtein Distance
  const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  // Subsequence Match (e.g. "bgr" in "burger")
  const isSubsequenceMatch = (pattern: string, str: string): boolean => {
    let i = 0;
    let j = 0;
    while (i < pattern.length && j < str.length) {
      if (pattern[i] === str[j]) {
        i++;
      }
      j++;
    }
    return i === pattern.length;
  };

  const scored = items.map((item) => {
    const name = item.name.toLowerCase();
    const cat = item.category.toLowerCase();
    const desc = item.description.toLowerCase();
    let score = 0;

    // 1. Exact or Prefix match (Highest Priority)
    if (name === qNorm || cat === qNorm) {
      score = 100;
    } else if (name.startsWith(qNorm)) {
      score = 80;
    } 
    // 2. Substring match
    else if (name.includes(qNorm) || cat.includes(qNorm)) {
      score = 60;
    } else if (desc.includes(qNorm)) {
      score = 50;
    }
    // 3. Fuzzy Subsequence Match (e.g., 'bgr' for 'burger')
    else if (isSubsequenceMatch(qNorm, name)) {
      score = 40;
    } else if (isSubsequenceMatch(qNorm, cat)) {
      score = 30;
    } else if (isSubsequenceMatch(qNorm, desc)) {
      score = 25;
    }
    // 4. Reverse string match (e.g., 'seirf' for 'fries')
    else if (name === reverseQNorm || cat === reverseQNorm) {
      score = 90;
    } else if (name.includes(reverseQNorm) || cat.includes(reverseQNorm)) {
      score = 50;
    } else if (isSubsequenceMatch(reverseQNorm, name)) {
      score = 30;
    }
    // 5. Multi-word out-of-order and Typo match
    else {
      // Break search query and target into words to handle out-of-order words and partial typos
      const queryWords = qNorm.split(/\s+/);
      const targetWords = `${name} ${cat} ${desc}`.split(/[^a-z0-9]+/);
      
      let matchCount = 0;
      let totalScore = 0;

      for (const qWord of queryWords) {
        let bestWordScore = 0;
        for (const tWord of targetWords) {
          if (!tWord) continue;

          if (tWord === qWord) {
            bestWordScore = Math.max(bestWordScore, 20);
          } else if (tWord.startsWith(qWord)) {
            bestWordScore = Math.max(bestWordScore, 15);
          } else if (tWord.includes(qWord)) {
            bestWordScore = Math.max(bestWordScore, 10);
          } else if (Math.abs(qWord.length - tWord.length) <= 2) {
            const distance = getLevenshteinDistance(qWord, tWord);
            if (distance <= 2) {
              bestWordScore = Math.max(bestWordScore, 20 - (distance * 5));
            }
          }
        }
        if (bestWordScore > 0) {
          matchCount++;
          totalScore += bestWordScore;
        }
      }

      if (matchCount === queryWords.length && queryWords.length > 1) {
        // All words found, even if out of order
        score = 50 + (totalScore / queryWords.length);
      } else if (matchCount > 0 && matchCount >= Math.ceil(queryWords.length / 2)) {
        // Partial match of words
        score = totalScore / queryWords.length;
      }
    }

    return { item, score };
  });

  return scored
    .filter((res) => res.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((res) => res.item);
}
