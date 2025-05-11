FROM python:3.11-buster AS builder

RUN pip install poetry

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

WORKDIR /app

COPY pyproject.toml poetry.lock ./
#RUN touch README.md

#RUN poetry install --no-root && rm -rf $POETRY_CACHE_DIR
#RUN poetry config virtualenvs.create false
RUN poetry install --no-root --no-cache

#COPY static ./static
#COPY src ./src

#ENTRYPOINT ["poetry","run","python", "-m", "src.adokqlbot.main"]

FROM python:3.11-slim-buster AS runtime

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

COPY static ./static
COPY src ./src

EXPOSE 8000
ENTRYPOINT ["python", "-m", "src.adokqlbot.main"]