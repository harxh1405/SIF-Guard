from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple
import pandas as pd
from app.db.models.report import SafetyReport


class DataSourceAdapter(ABC):

    @abstractmethod
    def validate(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        """Validates dataframe columns and schema, returning (valid_df, invalid_count)."""
        pass

    @abstractmethod
    def normalize(self, record: Dict[str, Any]) -> SafetyReport:
        """Converts raw source record into unified SafetyReport instance."""
        pass

    @abstractmethod
    def ingest(self, df: pd.DataFrame) -> List[SafetyReport]:
        """Processes dataframe and converts into normalized SafetyReport models."""
        pass
