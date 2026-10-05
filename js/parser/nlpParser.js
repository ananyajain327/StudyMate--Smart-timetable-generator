/**
 * Natural Language Command Bar Parser for StudyMate Next-Gen
 * Parses complex natural language dumps like:
 * "Prep presentation 2h tomorrow before 4pm, high focus"
 * "10-hour research project due friday deep work"
 * "Running 30m late"
 */

export class NLPParser {
  /**
   * Parse arbitrary natural language input string into a structured Task or Action
   * @param {string} input 
   * @param {Date} [referenceDate=new Date()]
   * @returns {Object} Parsed task object or command action
   */
  static parse(input, referenceDate = new Date()) {
    if (!input || typeof input !== 'string') {
      throw new Error('Input must be a non-empty string');
    }

    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error('Input cannot be empty');
    }

    // 1. Check for quick domino/late cascade commands
    const dominoMatch = trimmed.match(/(?:running\s+)?(?:late|delay|shift|cascade|push)\s*(?:by\s*)?(\d+)\s*(?:m|min|mins|minutes)?/i) ||
                        trimmed.match(/running\s+(\d+)\s*(?:m|min|mins|minutes)?\s+late/i);
    if (dominoMatch) {
      const minutes = parseInt(dominoMatch[1], 10);
      return {
        type: 'COMMAND',
        command: 'DOMINO_SHIFT',
        minutes: isNaN(minutes) ? 30 : minutes,
        raw: trimmed
      };
    }

    // Check for rebalance / optimize command
    if (/^(rebalance|optimize|auto-schedule|regenerate|replan)$/i.test(trimmed)) {
      return {
        type: 'COMMAND',
        command: 'REBALANCE',
        raw: trimmed
      };
    }

    let remaining = trimmed;

    // 2. Parse Duration (e.g., "2h", "1h 30m", "90m", "10-hour", "45 mins", "1.5 hours")
    let durationMinutes = 60; // default 1 hour
    let durationMatched = false;

    // Compound pattern: "1h 30m" or "2 hours 15 mins"
    const compoundDurMatch = remaining.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\s*(?:and\s*)?(\d+)\s*(?:m|min|mins|minutes?)/i);
    if (compoundDurMatch) {
      const hours = parseFloat(compoundDurMatch[1]);
      const mins = parseInt(compoundDurMatch[2], 10);
      durationMinutes = Math.round(hours * 60 + mins);
      durationMatched = true;
      remaining = remaining.replace(compoundDurMatch[0], ' ');
    } else {
      // Single duration pattern: "2h", "1.5h", "90m", "10-hour"
      const singleDurMatch = remaining.match(/(\d+(?:\.\d+)?)\s*(?:-| )?(h|hr|hrs|hours?|m|min|mins|minutes?)\b/i);
      if (singleDurMatch) {
        const val = parseFloat(singleDurMatch[1]);
        const unit = singleDurMatch[2].toLowerCase();
        if (unit.startsWith('h')) {
          durationMinutes = Math.round(val * 60);
        } else {
          durationMinutes = Math.round(val);
        }
        durationMatched = true;
        remaining = remaining.replace(singleDurMatch[0], ' ');
      }
    }

    // 3. Parse Priority (urgent, high, medium, low, p0, p1, p2, p3)
    let priority = 'medium';
    const urgentMatch = remaining.match(/\b(urgent|p0|asap|critical)\b/i);
    const highMatch = remaining.match(/\b(high(?:\s+priority)?|p1)\b/i);
    const lowMatch = remaining.match(/\b(low(?:\s+priority)?|p3|optional)\b/i);
    const medMatch = remaining.match(/\b(medium(?:\s+priority)?|p2|normal)\b/i);

    if (urgentMatch) {
      priority = 'urgent';
      remaining = remaining.replace(urgentMatch[0], ' ');
    } else if (highMatch) {
      priority = 'high';
      remaining = remaining.replace(highMatch[0], ' ');
    } else if (lowMatch) {
      priority = 'low';
      remaining = remaining.replace(lowMatch[0], ' ');
    } else if (medMatch) {
      priority = 'medium';
      remaining = remaining.replace(medMatch[0], ' ');
    }

    // 4. Parse Cognitive Load / Mental Strain
    let energyLevel = 'deep';
    const deepMatch = remaining.match(/\b(deep(?:\s*work)?|high\s*focus|intense|hard|focus)\b/i);
    const shallowMatch = remaining.match(/\b(shallow(?:\s*work)?|low\s*focus|admin|easy|light|chores?|routine)\b/i);
    const reviewMatch = remaining.match(/\b(review|revision|recap|practice|read(?:ing)?|summary)\b/i);

    if (shallowMatch) {
      energyLevel = 'shallow';
      remaining = remaining.replace(shallowMatch[0], ' ');
    } else if (reviewMatch) {
      energyLevel = 'review';
      remaining = remaining.replace(reviewMatch[0], ' ');
    } else if (deepMatch) {
      energyLevel = 'deep';
      remaining = remaining.replace(deepMatch[0], ' ');
    } else {
      // Default heuristic based on duration or keywords in title
      if (durationMinutes <= 30) {
        energyLevel = 'shallow';
      } else if (durationMinutes >= 90) {
        energyLevel = 'deep';
      } else {
        energyLevel = 'deep';
      }
    }

    // 5. Parse Locked / Fixed indicator
    let isLocked = false;
    const lockMatch = remaining.match(/\b(locked|fixed|class|lecture|meeting|appointment|call|sync)\b/i);
    if (lockMatch) {
      isLocked = true;
      if (/\b(locked|fixed)\b/i.test(lockMatch[0])) {
        remaining = remaining.replace(lockMatch[0], ' ');
      }
    }

    // 6. Parse Date (today, tomorrow, weekday names, YYYY-MM-DD, in N days)
    const targetDate = new Date(referenceDate);
    targetDate.setHours(0, 0, 0, 0);

    const todayMatch = remaining.match(/\b(today|tonight)\b/i);
    const tomorrowMatch = remaining.match(/\b(tomorrow|tmrw)\b/i);
    const inDaysMatch = remaining.match(/\bin\s+(\d+)\s+days?\b/i);
    const weekdayMatch = remaining.match(/\b(?:on\s+|due\s+|this\s+|next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    const isoDateMatch = remaining.match(/\b(\d{4}-\d{2}-\d{2})\b/);

    if (isoDateMatch) {
      const parts = isoDateMatch[1].split('-').map(Number);
      targetDate.setFullYear(parts[0], parts[1] - 1, parts[2]);
      remaining = remaining.replace(isoDateMatch[0], ' ');
    } else if (tomorrowMatch) {
      targetDate.setDate(targetDate.getDate() + 1);
      remaining = remaining.replace(tomorrowMatch[0], ' ');
    } else if (inDaysMatch) {
      targetDate.setDate(targetDate.getDate() + parseInt(inDaysMatch[1], 10));
      remaining = remaining.replace(inDaysMatch[0], ' ');
    } else if (weekdayMatch) {
      const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = weekdays.indexOf(weekdayMatch[1].toLowerCase());
      const currentDay = referenceDate.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7; // next occurrence
      targetDate.setDate(targetDate.getDate() + diff);
      remaining = remaining.replace(weekdayMatch[0], ' ');
    } else if (todayMatch) {
      remaining = remaining.replace(todayMatch[0], ' ');
    }

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // 7. Parse Exact Time or Deadline
    let requestedStartMinutes = null;
    let deadlineMinutes = null;
    let timePreference = null; // 'morning' | 'afternoon' | 'evening'

    // Check "before 4pm", "by 4:30pm", "due 5pm"
    const deadlineMatch = remaining.match(/\b(?:before|by|due|until)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (deadlineMatch) {
      deadlineMinutes = NLPParser._parseTimeToMinutes(deadlineMatch[1], deadlineMatch[2], deadlineMatch[3]);
      remaining = remaining.replace(deadlineMatch[0], ' ');
    }

    // Check "at 10am", "at 14:00", "starts 2pm", "from 10am"
    const atTimeMatch = remaining.match(/\b(?:at|starts?|from)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (atTimeMatch) {
      requestedStartMinutes = NLPParser._parseTimeToMinutes(atTimeMatch[1], atTimeMatch[2], atTimeMatch[3]);
      remaining = remaining.replace(atTimeMatch[0], ' ');
    }

    // Time window preference
    if (/\b(morning|early)\b/i.test(remaining)) {
      timePreference = 'morning';
      remaining = remaining.replace(/\b(morning|early)\b/i, ' ');
    } else if (/\b(afternoon|midday)\b/i.test(remaining)) {
      timePreference = 'afternoon';
      remaining = remaining.replace(/\b(afternoon|midday)\b/i, ' ');
    } else if (/\b(evening|night|tonight)\b/i.test(remaining)) {
      timePreference = 'evening';
      remaining = remaining.replace(/\b(evening|night|tonight)\b/i, ' ');
    }

    // 8. Clean up title from punctuation and extra spaces
    let title = remaining
      .replace(/[,\-–:]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!title) {
      title = 'Study Session';
    }

    // Capitalize first letter of title
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // Auto-detect Subject / Category
    const category = NLPParser._inferCategory(title);

    return {
      type: 'TASK',
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      title,
      category,
      duration: durationMinutes,
      energyLevel,
      priority,
      date: dateStr,
      requestedStartMinutes,
      deadlineMinutes,
      timePreference,
      isLocked,
      isChunk: false,
      parentId: null,
      chunkIndex: null,
      totalChunks: null,
      raw: trimmed
    };
  }

  static _parseTimeToMinutes(hourStr, minStr, ampm) {
    let hours = parseInt(hourStr, 10);
    const mins = minStr ? parseInt(minStr, 10) : 0;
    if (ampm) {
      const isPm = ampm.toLowerCase() === 'pm';
      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;
    }
    return hours * 60 + mins;
  }

  static _inferCategory(title) {
    const t = title.toLowerCase();
    if (/\b(math|calculus|algebra|geometry|physics|formula)\b/.test(t)) return 'Mathematics';
    if (/\b(code|coding|programming|java|python|javascript|react|dsa|sql|git|bug)\b/.test(t)) return 'Computer Science';
    if (/\b(presentation|slides|pitch|deck|demo)\b/.test(t)) return 'Communication';
    if (/\b(exam|test|quiz|midterm|finals?)\b/.test(t)) return 'Exams';
    if (/\b(research|paper|thesis|literature|survey)\b/.test(t)) return 'Research';
    if (/\b(design|ui|ux|figma|prototype|sketch)\b/.test(t)) return 'Design';
    if (/\b(email|inbox|admin|plan|organize|cleanup)\b/.test(t)) return 'Admin';
    return 'General';
  }
}
