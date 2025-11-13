import type { ParsedScene } from '@/types';

/**
 * Parses Gemini's text response into structured montage entries
 */
export function parseGeminiResponse(text: string): ParsedScene[] {
  const scenes: ParsedScene[] = [];
  
  // Split by timecode sections (e.g., **15:20 - 15:29**)
  const timecodeRegex = /\*\*(\d{1,2}:\d{2}(?::\d{2})?\s*-\s*\d{1,2}:\d{2}(?::\d{2})?)\*\*/g;
  
  const sections = text.split(timecodeRegex);
  
  // Process sections in pairs: [text, timecode, content, timecode, content, ...]
  for (let i = 1; i < sections.length; i += 2) {
    const timecode = sections[i].trim();
    const content = sections[i + 1] || '';
    
    const scene = parseScene(timecode, content);
    if (scene) {
      scenes.push(scene);
    }
  }
  
  return scenes;
}

function parseScene(timecode: string, content: string): ParsedScene | null {
  try {
    // Parse timecode (e.g., "15:20 - 15:29")
    const timecodeMatch = timecode.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)/);
    if (!timecodeMatch) return null;
    
    const startTimecode = normalizeTimecode(timecodeMatch[1]);
    const endTimecode = normalizeTimecode(timecodeMatch[2]);
    
    // Extract plan type (e.g., "Крупный", "Средний", etc.)
    const planTypeMatch = content.match(/\*\*План\s+([^:]+):\*\*/i);
    const planType = planTypeMatch ? planTypeMatch[1].trim() : '';
    
    // Extract description (everything between plan type and dialogue markers)
    let description = '';
    const descriptionMatch = content.match(/\*\*План\s+[^:]+:\*\*\s*([^\n]+?)(?=\s*\*\*|$)/s);
    if (descriptionMatch) {
      description = descriptionMatch[1].trim();
      // Remove bullet points
      description = description.replace(/^\*\s+/, '').trim();
    }
    
    // Extract dialogues/sounds (everything with ГЗК, НДП, etc.)
    const dialogues: string[] = [];
    const dialogueRegex = /\*\*([^:]+):\*\*\s*([^\n]+)/g;
    let dialogueMatch;
    
    while ((dialogueMatch = dialogueRegex.exec(content)) !== null) {
      const label = dialogueMatch[1].trim();
      const text = dialogueMatch[2].trim();
      
      // Skip the "План" line
      if (label.startsWith('План')) continue;
      
      dialogues.push(`${label}: ${text}`);
    }
    
    return {
      timecode,
      start_timecode: startTimecode,
      end_timecode: endTimecode,
      plan_type: planType,
      description: description || '',
      dialogues: dialogues.join('\n') || '',
    };
  } catch (error) {
    console.error('Error parsing scene:', error);
    return null;
  }
}

/**
 * Normalizes timecode to HH:MM:SS format
 */
function normalizeTimecode(timecode: string): string {
  const parts = timecode.split(':');
  
  if (parts.length === 2) {
    // MM:SS -> 00:MM:SS
    return `00:${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  } else if (parts.length === 3) {
    // HH:MM:SS
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
  }
  
  return timecode;
}

/**
 * Alternative parser for raw line-by-line format
 */
export function parseAlternativeFormat(text: string): ParsedScene[] {
  const scenes: ParsedScene[] = [];
  const lines = text.split('\n');
  
  let currentScene: Partial<ParsedScene> | null = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for timecode line
    const timecodeMatch = trimmedLine.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)/);
    if (timecodeMatch) {
      // Save previous scene if exists
      if (currentScene && currentScene.start_timecode) {
        scenes.push(currentScene as ParsedScene);
      }
      
      // Start new scene
      currentScene = {
        timecode: `${timecodeMatch[1]} - ${timecodeMatch[2]}`,
        start_timecode: normalizeTimecode(timecodeMatch[1]),
        end_timecode: normalizeTimecode(timecodeMatch[2]),
        plan_type: '',
        description: '',
        dialogues: '',
      };
      continue;
    }
    
    // Check for plan type
    const planMatch = trimmedLine.match(/План\s+([^:]+):/i);
    if (planMatch && currentScene) {
      currentScene.plan_type = planMatch[1].trim();
      // Extract description after plan type
      const descMatch = trimmedLine.match(/План\s+[^:]+:\s*(.+)/i);
      if (descMatch) {
        currentScene.description = descMatch[1].trim();
      }
      continue;
    }
    
    // Check for dialogue markers
    if ((trimmedLine.includes('ГЗК:') || trimmedLine.includes('НДП:') || 
         trimmedLine.includes('Диалог:') || trimmedLine.includes('Музыка:')) && currentScene) {
      if (currentScene.dialogues) {
        currentScene.dialogues += '\n' + trimmedLine;
      } else {
        currentScene.dialogues = trimmedLine;
      }
    }
  }
  
  // Save last scene
  if (currentScene && currentScene.start_timecode) {
    scenes.push(currentScene as ParsedScene);
  }
  
  return scenes;
}

