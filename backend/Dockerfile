FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

WORKDIR /aplicacao
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY alembic.ini .
COPY migracoes ./migracoes
COPY app ./app
COPY iniciar.sh ./iniciar.sh
RUN chmod +x ./iniciar.sh

# Configuração de usuário sem privilégios (non-root)
RUN useradd -m appuser && chown -R appuser /aplicacao
USER appuser

EXPOSE 8000
CMD ["./iniciar.sh"]

