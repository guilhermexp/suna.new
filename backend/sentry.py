import os

sentry = None

try:
    import sentry_sdk
    try:
        from sentry_sdk.integrations.dramatiq import DramatiqIntegration
    except Exception:
        DramatiqIntegration = None

    sentry_dsn = os.getenv("SENTRY_DSN", None)
    if sentry_dsn:
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=([DramatiqIntegration()] if DramatiqIntegration else []),
            traces_sample_rate=0.1,
            send_default_pii=True,
            _experiments={
                "enable_logs": True,
            },
        )

    sentry = sentry_sdk
except Exception:
    class _NoopSpan:
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc, tb):
            pass
        def end(self, **kwargs):
            pass

    class _NoopSentry:
        def set_tag(self, *args, **kwargs):
            pass
        def set_user(self, *args, **kwargs):
            pass
        def start_span(self, *args, **kwargs):
            return _NoopSpan()
        def span(self, *args, **kwargs):
            return _NoopSpan()

    sentry = _NoopSentry()
