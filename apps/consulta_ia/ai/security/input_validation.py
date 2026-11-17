
def neutralize_delimiters(texto: str) -> str:
    """para o usuario não fechar as tags dos dados do prompt."""
    return texto.replace("<", "&lt;")