import os
import hashlib
from typing import List, Dict, Union, Optional
import numpy as np
from app.core.config import settings
from app.core.logging import logger

try:
    from sentence_transformers import SentenceTransformer
    HAS_ST = True
except ImportError:
    HAS_ST = False


class EmbeddingService:
    _instance = None

    def __new__(cls, model_name: str = None):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance.model_name = model_name or settings.EMBEDDING_MODEL
            cls._instance._model = None
            cls._instance.cache = {}
        return cls._instance

    @property
    def model(self):
        if self._model is None and HAS_ST:
            logger.info(f"Loading embedding model: {self.model_name}")
            try:
                self._model = SentenceTransformer(self.model_name)
            except Exception as e:
                logger.warning(f"Failed to load HuggingFace model {self.model_name}, falling back to all-MiniLM-L6-v2: {e}")
                try:
                    self._model = SentenceTransformer("all-MiniLM-L6-v2")
                except Exception as ex:
                    logger.error(f"Fallback model failed: {ex}")
                    self._model = None
        return self._model

    def _hash_text(self, text: str) -> str:
        return hashlib.md5(text.encode("utf-8")).hexdigest()

    def encode(self, text: str) -> List[float]:
        if not text:
            return [0.0] * 768

        h = self._hash_text(text)
        if h in self.cache:
            return self.cache[h]

        if self.model is not None:
            vec = self.model.encode(text, convert_to_numpy=True).tolist()
        else:
            # Deterministic mock fallback vector of size 768 based on hash for testing environments
            rng = np.random.RandomState(int(h[:8], 16))
            vec = rng.randn(768).astype(float).tolist()

        self.cache[h] = vec
        return vec

    def encode_batch(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        uncached_indices = []
        uncached_texts = []
        results = [None] * len(texts)

        for idx, text in enumerate(texts):
            h = self._hash_text(text)
            if h in self.cache:
                results[idx] = self.cache[h]
            else:
                uncached_indices.append(idx)
                uncached_texts.append(text)

        if uncached_texts:
            if self.model is not None:
                encoded = self.model.encode(uncached_texts, batch_size=settings.BATCH_SIZE, convert_to_numpy=True)
                for idx, text, vec in zip(uncached_indices, uncached_texts, encoded):
                    vec_list = vec.tolist()
                    h = self._hash_text(text)
                    self.cache[h] = vec_list
                    results[idx] = vec_list
            else:
                for idx, text in zip(uncached_indices, uncached_texts):
                    vec = self.encode(text)
                    results[idx] = vec

        return results


embedding_service = EmbeddingService()
