"""
SHL Assessment Recommender Agent
FastAPI service with conversational AI agent backed by the SHL product catalog.
"""

import json
import os
import re
import time
import logging
from typing import Optional
from contextlib import asynccontextmanager

import httpx
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv

load_dotenv()

from app.catalog import CatalogStore
from app.agent import AssessmentAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Global singletons ──────────────────────────────────────────────────────────
catalog_store: Optional[CatalogStore] = None
agent: Optional[AssessmentAgent] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global catalog_store, agent
    logger.info("Loading SHL catalog…")
    catalog_store = CatalogStore()
    await catalog_store.load()
    agent = AssessmentAgent(catalog_store)
    logger.info(f"Catalog ready: {len(catalog_store.items)} assessments indexed.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="SHL Assessment Recommender",
    description="Conversational AI agent for SHL assessment selection",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ───────────────────────────────────────────────────────────────────

class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v not in ("user", "assistant"):
            raise ValueError("role must be 'user' or 'assistant'")
        return v


class ChatRequest(BaseModel):
    messages: list[Message]

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v):
        if not v:
            raise ValueError("messages cannot be empty")
        if len(v) > 16:
            raise ValueError("Too many messages (max 16)")
        return v


class Recommendation(BaseModel):
    name: str
    url: str
    test_type: str


class ChatResponse(BaseModel):
    reply: str
    recommendations: list[Recommendation]
    end_of_conversation: bool


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "message": "SHL Assessment Recommender API is running"
    }
@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if catalog_store is None or agent is None:
        raise HTTPException(503, "Service initializing, please retry.")
    
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    
    try:
        result = await agent.respond(messages)
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"Agent error: {e}", exc_info=True)
        raise HTTPException(500, f"Agent error: {str(e)}")
