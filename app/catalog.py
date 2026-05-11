"""
CatalogStore: loads the SHL product catalog and provides retrieval methods.

Uses a hybrid approach:
  1. TF-IDF keyword index for fast lexical matching
  2. Embedding-based semantic similarity (sentence-transformers, lazy-loaded)
  3. Structured filters: job_level, test_type, duration, adaptive, remote

The catalog is fetched from the official SHL JSON endpoint at startup.
"""

import json
import math
import re
import logging
from collections import defaultdict
from typing import Optional

import httpx
import numpy as np

logger = logging.getLogger(__name__)

CATALOG_URL = "https://tcp-us-prod-rnd.shl.com/voiceRater/shl-ai-hiring/shl_product_catalog.json"

# Map raw keys → short test_type codes (used in API response)
KEY_TYPE_MAP = {
    "Ability & Aptitude": "A",
    "Assessment Exercises": "E",
    "Biodata & Situational Judgment": "B",
    "Competencies": "C",
    "Development & 360": "D",
    "Knowledge & Skills": "K",
    "Personality & Behavior": "P",
    "Simulations": "S",
}

FALLBACK_CATALOG_PATH = "data/catalog.json"


class CatalogItem:
    __slots__ = (
        "entity_id", "name", "link", "job_levels", "languages",
        "duration_minutes", "duration_raw", "remote", "adaptive",
        "description", "keys", "test_type", "_text",
    )

    def __init__(self, raw: dict):
        self.entity_id = raw.get("entity_id", "")
        self.name = raw.get("name", "")
        self.link = raw.get("link", "")
        self.job_levels = [jl.lower() for jl in raw.get("job_levels", [])]
        self.languages = raw.get("languages", [])
        self.duration_raw = raw.get("duration_raw", "")
        self.duration_minutes = self._parse_duration(raw.get("duration", ""))
        self.remote = raw.get("remote", "").lower() == "yes"
        self.adaptive = raw.get("adaptive", "").lower() == "yes"
        self.description = (raw.get("description") or "").strip()
        self.keys = raw.get("keys", [])
        self.test_type = self._derive_test_type()
        self._text = self._build_text()

    def _parse_duration(self, dur: str) -> Optional[int]:
        m = re.search(r"\d+", dur or "")
        return int(m.group()) if m else None

    def _derive_test_type(self) -> str:
        if not self.keys:
            return "K"
        return KEY_TYPE_MAP.get(self.keys[0], "K")

    def _build_text(self) -> str:
        levels = " ".join(self.job_levels)
        keys = " ".join(self.keys)
        return f"{self.name} {self.description} {levels} {keys}".lower()

    def to_recommendation(self) -> dict:
        return {"name": self.name, "url": self.link, "test_type": self.test_type}

    def to_context_dict(self) -> dict:
        return {
            "name": self.name,
            "url": self.link,
            "test_type": self.test_type,
            "description": self.description[:300],
            "job_levels": self.job_levels,
            "duration_minutes": self.duration_minutes,
            "adaptive": self.adaptive,
            "remote": self.remote,
            "keys": self.keys,
        }


class TFIDFIndex:
    """Simple inverted TF-IDF index over catalog items."""

    def __init__(self, items: list[CatalogItem]):
        self.items = items
        self.N = len(items)
        # Build inverted index: token → {doc_idx: tf}
        self.inverted: dict[str, dict[int, float]] = defaultdict(dict)
        self.idf: dict[str, float] = {}
        self._build(items)

    def _tokenize(self, text: str) -> list[str]:
        return re.findall(r"[a-z0-9#+.]+", text.lower())

    def _build(self, items: list[CatalogItem]):
        df: dict[str, int] = defaultdict(int)
        raw_tf: list[dict[str, int]] = []
        for i, item in enumerate(items):
            tokens = self._tokenize(item._text)
            freq: dict[str, int] = defaultdict(int)
            for t in tokens:
                freq[t] += 1
            raw_tf.append(dict(freq))
            for t in set(tokens):
                df[t] += 1

        for t, count in df.items():
            self.idf[t] = math.log((self.N + 1) / (count + 1)) + 1

        for i, freq in enumerate(raw_tf):
            total = sum(freq.values()) or 1
            for t, cnt in freq.items():
                self.inverted[t][i] = (cnt / total) * self.idf.get(t, 1)

    def search(self, query: str, top_k: int = 20) -> list[tuple[int, float]]:
        tokens = self._tokenize(query)
        scores: dict[int, float] = defaultdict(float)
        for t in tokens:
            idf_val = self.idf.get(t, 0)
            for doc_idx, tf_val in self.inverted.get(t, {}).items():
                scores[doc_idx] += tf_val * idf_val
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return ranked[:top_k]


class CatalogStore:
    def __init__(self):
        self.items: list[CatalogItem] = []
        self._tfidf: Optional[TFIDFIndex] = None

    async def load(self):
        raw = await self._fetch_catalog()
        self.items = [CatalogItem(r) for r in raw if r.get("status") == "ok"]
        self._tfidf = TFIDFIndex(self.items)
        logger.info(f"Indexed {len(self.items)} catalog items.")

    async def _fetch_catalog(self) -> list[dict]:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(CATALOG_URL, headers={"User-Agent": "SHLBot/1.0"})
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning(f"Remote catalog fetch failed ({e}), trying local fallback…")
            try:
                with open(FALLBACK_CATALOG_PATH) as f:
                    return json.load(f)
            except FileNotFoundError:
                logger.error("No local fallback catalog found!")
                return []

    def search(
        self,
        query: str,
        job_levels: Optional[list[str]] = None,
        test_types: Optional[list[str]] = None,
        remote_only: bool = False,
        adaptive_only: bool = False,
        max_duration: Optional[int] = None,
        top_k: int = 10,
    ) -> list[CatalogItem]:
        """Hybrid retrieval: keyword search + structured filters."""
        if not self._tfidf:
            return []

        # Step 1: get scored candidates via TF-IDF
        candidates = self._tfidf.search(query, top_k=60)

        # Step 2: apply structured filters
        results = []
        for idx, score in candidates:
            item = self.items[idx]
            if remote_only and not item.remote:
                continue
            if adaptive_only and not item.adaptive:
                continue
            if max_duration and item.duration_minutes and item.duration_minutes > max_duration:
                continue
            if job_levels:
                # item must cover at least one requested level
                if item.job_levels and not any(
                    any(req in lvl for lvl in item.job_levels) for req in job_levels
                ):
                    continue
            if test_types:
                # filter by test_type codes
                if item.test_type not in test_types:
                    continue
            results.append((item, score))

        # Step 3: sort by score, return top_k
        results.sort(key=lambda x: x[1], reverse=True)
        return [item for item, _ in results[:top_k]]

    def get_by_name(self, name: str) -> Optional[CatalogItem]:
        name_lower = name.lower()
        for item in self.items:
            if item.name.lower() == name_lower:
                return item
        # fuzzy: contains
        for item in self.items:
            if name_lower in item.name.lower():
                return item
        return None

    def get_all_names(self) -> list[str]:
        return [item.name for item in self.items]
