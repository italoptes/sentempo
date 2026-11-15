import logging

from app.nucleo.logs import FiltroAcessoSaude, configurar_logs


def _registro(caminho: str) -> logging.LogRecord:
    return logging.LogRecord(
        name="uvicorn.access",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg='%s - "%s %s HTTP/%s" %d',
        args=("127.0.0.1:1234", "GET", caminho, "1.1", 200),
        exc_info=None,
    )


def test_filtro_oculta_apenas_healthcheck():
    filtro = FiltroAcessoSaude()
    assert filtro.filter(_registro("/api/saude")) is False
    assert filtro.filter(_registro("/api/saude?detalhado=true")) is False
    assert filtro.filter(_registro("/api/administracao/estudo-a")) is True


def test_configuracao_nao_duplica_filtro():
    logger = logging.getLogger("uvicorn.access")
    logger.filters = [filtro for filtro in logger.filters if not isinstance(filtro, FiltroAcessoSaude)]
    configurar_logs()
    configurar_logs()
    assert sum(isinstance(filtro, FiltroAcessoSaude) for filtro in logger.filters) == 1
