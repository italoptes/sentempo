from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.nucleo.configuracoes import obter_configuracoes
from app.nucleo.limitador import handler_limite_excedido, limitador
from app.rotas import administracao, modo_livre, participantes, saude, tentativas


configuracoes = obter_configuracoes()
documentacao = configuracoes.ambiente.lower() != "producao"

aplicacao = FastAPI(
    title="API Sentempo",
    version="1.0.0",
    docs_url="/docs" if documentacao else None,
    redoc_url="/redoc" if documentacao else None,
    openapi_url="/openapi.json" if documentacao else None,
)

aplicacao.state.limiter = limitador
aplicacao.add_exception_handler(RateLimitExceeded, handler_limite_excedido)

aplicacao.add_middleware(
    CORSMiddleware,
    allow_origins=configuracoes.origens_cors,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
aplicacao.include_router(saude.roteador, prefix="/api")
aplicacao.include_router(participantes.roteador, prefix="/api")
aplicacao.include_router(tentativas.roteador, prefix="/api")
aplicacao.include_router(modo_livre.roteador, prefix="/api")
aplicacao.include_router(administracao.roteador, prefix="/api")
