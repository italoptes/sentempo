from fastapi import APIRouter


roteador = APIRouter(tags=["saúde"])


@roteador.get("/saude")
async def consultar_saude() -> dict[str, str]:
    return {"situacao": "ok"}

