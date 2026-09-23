import hmac
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, status

from app.nucleo.configuracoes import Configuracoes


def credenciais_validas(nome: str, codigo: str, configuracoes: Configuracoes) -> bool:
    nome_valido = hmac.compare_digest(
        nome.strip().casefold().encode(), configuracoes.nome_administrador.casefold().encode()
    )
    codigo_valido = hmac.compare_digest(codigo.encode(), configuracoes.codigo_administrador.encode())
    return nome_valido and codigo_valido


def criar_token(configuracoes: Configuracoes) -> tuple[str, datetime]:
    agora = datetime.now(timezone.utc)
    expira_em = agora + timedelta(minutes=configuracoes.expiracao_token_minutos)
    token = jwt.encode(
        {"sub": "administracao", "iat": agora, "exp": expira_em},
        configuracoes.chave_secreta_jwt,
        algorithm=configuracoes.algoritmo_jwt,
    )
    return token, expira_em


def validar_token(token: str, configuracoes: Configuracoes) -> None:
    try:
        conteudo = jwt.decode(
            token,
            configuracoes.chave_secreta_jwt,
            algorithms=[configuracoes.algoritmo_jwt],
        )
        if conteudo.get("sub") != "administracao":
            raise ValueError
    except (jwt.PyJWTError, ValueError) as erro:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token administrativo inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        ) from erro

