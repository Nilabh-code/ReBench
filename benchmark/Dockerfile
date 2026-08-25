# Pinned by digest, not by floating tag: reproducibility is the point of this
# repository, and it starts with the runner image itself. To refresh:
#   docker manifest inspect python:3.12-slim | grep digest   (multi-arch index)
FROM python:3.12-slim@sha256:7a8b475003c4fe15a2cd4e55e5cfc2f3560bdc9333d624f24cdd6d4340fd7a17

LABEL org.opencontainers.image.title="ReBench runner"
LABEL org.opencontainers.image.description="Measured benchmark runner for ReBench (performance suite)"
LABEL org.opencontainers.image.source="https://github.com/Nilabh-code/ReBench"
LABEL org.opencontainers.image.licenses="MIT"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN useradd --create-home --uid 10001 rebench
WORKDIR /app
COPY runner.py /app/runner.py
COPY performance.json /app/performance.json
RUN mkdir -p /output && chown -R rebench:rebench /app /output
USER rebench
VOLUME ["/output"]
ENTRYPOINT ["python", "/app/runner.py"]
CMD ["--help"]

# Example:
# docker run --rm -v "$PWD/out:/output" rebench-runner \
#   --base-url http://host.docker.internal:8000/v1 \
#   --model MODEL --contributor Nilabh-code \
#   --model-revision REVISION --git-commit COMMIT
