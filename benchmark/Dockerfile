FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN useradd --create-home --uid 10001 rebench
WORKDIR /app
COPY runner.py /app/runner.py
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
