from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

def obter_ip_cliente(request: Request) -> str:
    """
    Obtém o IP real do cliente.
    Como a aplicação está atrás de um proxy (Cloudflare Tunnel),
    não podemos confiar em request.client.host diretamente,
    pois ele retornará o IP do túnel/proxy.
    Verificamos os headers usados pelo Cloudflare e proxies reversos.
    """
    # Cloudflare adiciona CF-Connecting-IP com o IP original do cliente.
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip

    # Fallback para X-Forwarded-For (padrão de proxies reversos)
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        # Pega o primeiro IP da lista (o cliente original)
        return x_forwarded_for.split(",")[0].strip()

    # Se não houver headers de proxy (ex: desenvolvimento local direto),
    # usamos o IP da conexão.
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"

# Inicializa o limitador com armazenamento em memória.
# Documentação da decisão:
# - O limite é local à instância do backend.
# - Reiniciar o container limpa os contadores.
# - Como o Sentempo roda com uma única instância, essa solução em memória é suficiente e
#   evita a complexidade de adicionar Redis.
limitador = Limiter(key_func=obter_ip_cliente)

def handler_limite_excedido(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "Muitas tentativas. Tente novamente em instantes."},
    )
