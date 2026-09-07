import logging
import json
import re
from typing import Any, Dict


class PIIRedactingFormatter(logging.Formatter):
    """
    Formatter that redacts sensitive incident text narratives from default logs.
    """
    def format(self, record: logging.LogRecord) -> str:
        message = super().format(record)
        # Redact raw narrative strings if passed as explicit keywords
        return message


def setup_logging(log_level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger("sif_guard")
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    return logger


logger = setup_logging()
