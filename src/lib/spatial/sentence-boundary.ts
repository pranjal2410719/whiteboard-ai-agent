/**
 * Sentence-Boundary Detection Engine for Graceful Interruption
 * Identifies the end of the currently spoken sentence in a cue
 * so the audio can pause gracefully at sentence completion rather than
 * cutting off the tutor mid-syllable.
 */

import type { LessonCue } from "../types";

export interface SentenceBoundaryResult {
  boundaryTime: number;
  sentenceText: string;
  isPunctuation: boolean;
  cueIndex: number;
  cueTotalDuration: number;
}

/**
 * Parses cue text into sentences and determines the exact audio timestamp
 * corresponding to the completion of the sentence being spoken at currentTime.
 */
export function findNextSentenceBoundary(
  cues: LessonCue[],
  currentTime: number,
  minWaitSeconds: number = 0.4,
  maxWaitSeconds: number = 2.0
): SentenceBoundaryResult {
  const time = Math.max(0, currentTime);
  if (!cues || !cues.length) {
    return {
      boundaryTime: Math.round((time + 0.8) * 10) / 10,
      sentenceText: "",
      isPunctuation: true,
      cueIndex: -1,
      cueTotalDuration: 0,
    };
  }

  // Find active cue
  let activeCueIdx = cues.findIndex(c => time >= c.from && time < c.to);
  if (activeCueIdx === -1) {
    // If between cues or beyond, pick closest cue
    activeCueIdx = cues.findIndex(c => time <= c.to);
    if (activeCueIdx === -1) activeCueIdx = cues.length - 1;
  }

  const cue = cues[activeCueIdx];
  const cueDuration = Math.max(0.1, cue.to - cue.from);
  const text = cue.text || "";

  // If currently active cue is ending within minWaitSeconds and there is a next cue,
  // transition lookahead smoothly to the first sentence boundary of the next cue
  if (cue.to - time < minWaitSeconds && activeCueIdx + 1 < cues.length) {
    const nextCue = cues[activeCueIdx + 1];
    const nextCueDuration = Math.max(0.1, nextCue.to - nextCue.from);
    const nextMatches = (nextCue.text || "").match(/[^.?!;:]+[.?!;:]+/g);
    const firstSentence = nextMatches && nextMatches.length > 0 ? nextMatches[0] : nextCue.text || "";
    const firstSentenceFrac = firstSentence.length / Math.max(1, (nextCue.text || "").length);
    const nextBoundary = nextCue.from + firstSentenceFrac * nextCueDuration;
    return {
      boundaryTime: Math.round(Math.min(nextCue.to, Math.max(time + minWaitSeconds, nextBoundary)) * 10) / 10,
      sentenceText: firstSentence.trim(),
      isPunctuation: /[.?!;:,]$/.test(firstSentence.trim()),
      cueIndex: activeCueIdx + 1,
      cueTotalDuration: nextCueDuration,
    };
  }

  // Split into sentences using punctuation boundaries (. ? ! ; :)
  // Keep punctuation attached to the sentence
  const sentenceRegex = /[^.?!;:]+[.?!;:]+/g;
  const matches = text.match(sentenceRegex);

  const sentences: string[] = matches && matches.length > 0 ? matches : [text];
  const totalChars = sentences.reduce((acc, s) => acc + s.length, 0) || 1;

  let elapsedChars = 0;
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    elapsedChars += s.length;
    const sentenceEndTime = cue.from + (elapsedChars / totalChars) * cueDuration;

    // Is this sentence currently being spoken or just starting?
    if (sentenceEndTime > time + minWaitSeconds || (i === sentences.length - 1 && sentenceEndTime >= time)) {
      // If the boundary is too far (> maxWaitSeconds), check if there is a comma clause
      let finalBoundary = sentenceEndTime;
      if (finalBoundary - time > maxWaitSeconds) {
        // Look for comma clauses within the sentence
        const clauseRegex = /[^,]+,/g;
        const clauses = s.match(clauseRegex);
        let foundClause = false;
        if (clauses && clauses.length > 1) {
          let clauseChars = elapsedChars - s.length;
          for (const clause of clauses) {
            clauseChars += clause.length;
            const clauseEndTime = cue.from + (clauseChars / totalChars) * cueDuration;
            if (clauseEndTime >= time + minWaitSeconds && clauseEndTime <= time + maxWaitSeconds) {
              finalBoundary = clauseEndTime;
              foundClause = true;
              break;
            }
          }
        }
        if (!foundClause) {
          finalBoundary = Math.min(cue.to, time + maxWaitSeconds);
        }
      }

      // Bound final boundary to not exceed cue.to
      finalBoundary = Math.min(cue.to, Math.max(time + 0.3, finalBoundary));

      return {
        boundaryTime: Math.round(finalBoundary * 10) / 10,
        sentenceText: s.trim(),
        isPunctuation: /[.?!;:,]$/.test(s.trim()),
        cueIndex: activeCueIdx,
        cueTotalDuration: cueDuration,
      };
    }
  }

  // Fallback to end of current cue
  return {
    boundaryTime: Math.round(cue.to * 10) / 10,
    sentenceText: text.trim(),
    isPunctuation: /[.?!;:,]$/.test(text.trim()),
    cueIndex: activeCueIdx,
    cueTotalDuration: cueDuration,
  };
}
