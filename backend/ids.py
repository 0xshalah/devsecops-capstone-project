import secrets


def new_id(prefix: str, nbytes: int = 12) -> str:
    """Cryptographically random, non-sequential identifier, e.g. usr_9f2a..."""
    return f"{prefix}_{secrets.token_hex(nbytes)}"
