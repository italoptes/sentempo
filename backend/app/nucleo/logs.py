import logging


class FiltroAcessoSaude(logging.Filter):
    """Oculta somente o acesso automático do healthcheck do Docker."""

    def filter(self, registro: logging.LogRecord) -> bool:
        argumentos = registro.args
        if not isinstance(argumentos, tuple) or len(argumentos) < 3:
            return True
        caminho = str(argumentos[2]).partition("?")[0]
        return caminho != "/api/saude"


def configurar_logs() -> None:
    logger_acesso = logging.getLogger("uvicorn.access")
    if not any(isinstance(filtro, FiltroAcessoSaude) for filtro in logger_acesso.filters):
        logger_acesso.addFilter(FiltroAcessoSaude())
