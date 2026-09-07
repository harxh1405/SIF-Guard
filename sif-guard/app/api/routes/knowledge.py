from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import numpy as np
from app.db.database import get_db
from app.db.models.knowledge import HSEKnowledge
from app.schemas.knowledge import KnowledgeSearchResponse, KnowledgeItemSchema
from app.services.embeddings.service import embedding_service

router = APIRouter()


@router.get("/knowledge/search", response_model=KnowledgeSearchResponse)
def search_knowledge(
    q: str = Query(..., min_length=2),
    category: Optional[str] = None,
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    query_vec = np.array(embedding_service.encode(q))
    norm_q = np.linalg.norm(query_vec)

    items_query = db.query(HSEKnowledge)
    if category:
        items_query = items_query.filter(HSEKnowledge.category == category)
    
    items = items_query.all()
    
    results = []
    for item in items:
        emb = item.embedding or embedding_service.encode(item.content)
        item_vec = np.array(emb)
        norm_item = np.linalg.norm(item_vec)

        sim = np.dot(query_vec, item_vec) / (norm_q * norm_item) if norm_q > 0 and norm_item > 0 else 0.0
        
        results.append(KnowledgeItemSchema(
            id=item.id,
            source=item.source,
            title=item.title,
            content=item.content,
            category=item.category,
            similarity_score=round(float(sim), 4)
        ))

    results.sort(key=lambda x: x.similarity_score or 0.0, reverse=True)
    
    return KnowledgeSearchResponse(
        query=q,
        results=results[:limit]
    )
