from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Configuracoes(BaseSettings):
    banco_url: str = "sqlite:///./sentempo.db"
    chave_secreta_jwt: str = "chave-local-desenvolvimento-sentempo"
    algoritmo_jwt: str = "HS256"
    expiracao_token_minutos: int = 120
    nome_administrador: str = "pesquisador"
    codigo_administrador: str = "1234"
    origens_cors: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:8080"]
    )
    ambiente: str = "desenvolvimento"

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("origens_cors", mode="before")
    @classmethod
    def separar_origens(cls, valor: object) -> object:
        if isinstance(valor, str):
            return [item.strip() for item in valor.split(",") if item.strip()]
        return valor

    def validar_producao(self) -> None:
        if self.ambiente.lower() == "producao" and len(self.chave_secreta_jwt) < 32:
            raise RuntimeError("CHAVE_SECRETA_JWT deve ter ao menos 32 caracteres em produção")


@lru_cache
def obter_configuracoes() -> Configuracoes:
    configuracoes = Configuracoes()
    configuracoes.validar_producao()
    return configuracoes

