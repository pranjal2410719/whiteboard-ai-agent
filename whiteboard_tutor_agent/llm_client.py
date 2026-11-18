"""
LLM Provider Adapter for Whiteboard Tutor Agent
==============================================
Provides intelligent generative reasoning for:
1. Dynamic evaluation of student responses (semantic assessment beyond keywords).
2. Deep pedagogical doubt resolution.
3. Generative whiteboard diagram synthesis.

Supports:
- Google Gemini API (via GEMINI_API_KEY)
- OpenAI-compatible endpoints (OPENAI_API_KEY / Local Ollama / vLLM)
- Built-in pedagogical heuristic engine (when offline or no API keys configured)
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)


class LLMClient:
    """Pluggable LLM interface with automatic fallback to local heuristic engine."""

    def __init__(self, provider: Optional[str] = None, model: Optional[str] = None):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.openai_base = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        self.ollama_host = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")

        if provider:
            self.provider = provider
        elif self.gemini_key:
            self.provider = "gemini"
        elif self.openai_key:
            self.provider = "openai"
        else:
            self.provider = "heuristic"

        self.model = model or ("gemini-1.5-flash" if self.provider == "gemini" else "gpt-4o-mini")
        logger.info(f"Initialized LLMClient with provider='{self.provider}' (model='{self.model}')")

    # -------------------------------------------------------------------------
    # Core LLM Completion
    # -------------------------------------------------------------------------

    def complete(self, prompt: str, system_prompt: str = "") -> str:
        """Query LLM or return empty string on error/heuristic mode."""
        if self.provider == "gemini" and self.gemini_key:
            return self._call_gemini(prompt, system_prompt)
        elif self.provider == "openai" and self.openai_key:
            return self._call_openai(prompt, system_prompt)
        elif self.provider == "ollama":
            return self._call_ollama(prompt, system_prompt)
        return ""

    def _call_gemini(self, prompt: str, system_prompt: str = "") -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.gemini_key}"
        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": f"System Instruction: {system_prompt}"}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        body = json.dumps({"contents": contents}).encode("utf-8")
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            logger.warning(f"Gemini API request failed: {e}")
            return ""

    def _call_openai(self, prompt: str, system_prompt: str = "") -> str:
        url = f"{self.openai_base}/chat/completions"
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        body = json.dumps({"model": self.model, "messages": messages, "temperature": 0.3}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {self.openai_key}"},
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.warning(f"OpenAI API request failed: {e}")
            return ""

    def _call_ollama(self, prompt: str, system_prompt: str = "") -> str:
        url = f"{self.ollama_host}/api/generate"
        body = json.dumps({"model": self.model, "prompt": f"{system_prompt}\n\n{prompt}", "stream": False}).encode("utf-8")
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("response", "").strip()
        except Exception as e:
            logger.warning(f"Ollama request failed: {e}")
            return ""

    # -------------------------------------------------------------------------
    # Pedagogical Capabilities
    # -------------------------------------------------------------------------

    def evaluate_student_answer(
        self,
        checkpoint_question: str,
        expected_keywords: List[str],
        student_answer: str,
        step_title: str = "",
    ) -> Dict[str, Any]:
        """Semantically evaluate student answer using LLM, with heuristic fallback."""
        if self.provider in ("gemini", "openai", "ollama"):
            sys_msg = (
                "You are an encouraging, expert Physics tutor for Class 10 students. "
                "Evaluate the student's answer to the checkpoint question. Respond ONLY with valid JSON with keys: "
                "'is_correct' (boolean), 'feedback' (string praising or correcting gently), and 'remedial_hint' (string if incorrect)."
            )
            user_msg = (
                f"Topic Step: {step_title}\n"
                f"Question: {checkpoint_question}\n"
                f"Target Concept Keywords: {', '.join(expected_keywords)}\n"
                f"Student Answer: {student_answer}\n\n"
                "JSON Output:"
            )
            raw = self.complete(user_msg, sys_msg)
            if raw:
                try:
                    cleaned = raw.strip()
                    if cleaned.startswith("```json"):
                        cleaned = cleaned[7:]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    parsed = json.loads(cleaned.strip())
                    return {
                        "is_correct": bool(parsed.get("is_correct")),
                        "feedback": parsed.get("feedback", "Good effort!"),
                        "hint": parsed.get("remedial_hint", ""),
                        "source": "llm",
                    }
                except Exception as e:
                    logger.debug(f"Could not parse LLM JSON response: {e}")

        # Heuristic fallback matching with word boundaries
        import re
        ans_lower = student_answer.lower()
        matched = []
        for kw in expected_keywords:
            kw_clean = kw.lower().strip()
            if " " in kw_clean:
                if kw_clean in ans_lower:
                    matched.append(kw)
            else:
                if re.search(r'\b' + re.escape(kw_clean) + r'\b', ans_lower):
                    matched.append(kw)

        is_correct = len(matched) > 0
        return {
            "is_correct": is_correct,
            "feedback": "Correct! Well reasoned." if is_correct else "Good try!",
            "hint": "" if is_correct else "Look closely at the formula and contact interaction.",
            "source": "heuristic",
        }

    def answer_student_doubt(
        self,
        doubt: str,
        current_step_context: str = "",
    ) -> str:
        """Generate pedagogical explanation for any student doubt."""
        if self.provider in ("gemini", "openai", "ollama"):
            sys_msg = (
                "You are a friendly, world-class Whiteboard Physics tutor teaching Class 10. "
                "Answer the student's question clearly, concisely, and with intuition and everyday examples. "
                "Keep your answer under 3-4 sentences so it fits on a whiteboard note."
            )
            user_msg = f"Current Lesson Context: {current_step_context}\nStudent Doubt: {doubt}\nAnswer:"
            resp = self.complete(user_msg, sys_msg)
            if resp:
                return resp

        # Heuristic fallback
        d = doubt.lower()
        if "normal force" in d or "what is n" in d:
            return (
                "Normal Force (N) is the perpendicular contact reaction force exerted by a supporting surface "
                "(Newton's 3rd Law). On a flat horizontal plane, N = mg. On an incline, N = mg·cos(θ)."
            )
        if "unit of friction" in d or "mu" in d or "coefficient" in d:
            return (
                "Frictional force (f) is measured in Newtons (N). The coefficient of friction (μ) has NO units "
                "because it is a pure dimensionless ratio: μ = f / N."
            )
        if "area" in d:
            return (
                "Friction is independent of the apparent surface area! Whether a brick lies flat or on its edge, "
                "the total normal force and microscopic contact area remain identical, producing the same friction."
            )
        if "feather" in d or "vacuum" in d:
            return (
                "In a vacuum, a feather and a hammer accelerate at the exact same rate (g = 9.8 m/s²) and land together! "
                "Air resistance is what slows the feather down in atmosphere."
            )
        return (
            f"Great inquiry! In physics, forces always follow equilibrium and reaction laws. "
            f"Regarding '{doubt}', analyze the Free Body Diagram, check the friction coefficient (μ), "
            f"and verify whether net force is zero or accelerating."
        )
