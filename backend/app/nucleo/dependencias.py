from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.nucleo.configuracoes import Configuracoes, obter_configuracoes
from app.nucleo.seguranca import validar_token


esquema_bearer = HTTPBearer(auto_error=True)


def exigir_administrador(
    credenciais: Annotated[HTTPAuthorizationCredentials, Depends(esquema_bearer)],
    configuracoes: Annotated[Configuracoes, Depends(obter_configuracoes)],
) -> None:
    validar_token(credenciais.credentials, configuracoes)

