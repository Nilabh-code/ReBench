# results/

One directory per model family, one JSON file per measured run.
Files are produced by the runner (see ../CONTRIBUTING.md) and must be named
after their run id: <RUN-YYYY-MM-DD-hhhhhh>.json. The id is a content hash of
the record, so a hand-picked or edited file fails CI.

This directory is empty until the first measured run lands. That is honest.
