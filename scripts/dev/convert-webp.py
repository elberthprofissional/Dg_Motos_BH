#!/usr/bin/env python3
# ============================================================
# CONVERSOR EM LOTE PARA WEBP — DG MOTOS
# ============================================================
# Pega todos os .png / .jpg / .jpeg de img/, converte para
# .webp na MESMA pasta e APAGA o original (sobra só WebP).
#
# Uso:
#   python scripts/convert-webp.py            # converte img/
#   python scripts/convert-webp.py outra-pasta/  # converte outra pasta
#
# Requisito: Pillow  ->  pip install Pillow
# ============================================================

import sys
from pathlib import Path

from PIL import Image, ImageOps

# --- Ajuste aqui se quiser outra qualidade/tamanho máximo ---
QUALIDADE = 80        # 0-100 (quanto menor, mais leve e pior)
LARGURA_MAX = 1920    # reduz imagens maiores que isso (0 = não redimensiona)
EXTENSOES = {".png", ".jpg", ".jpeg"}


def converter(arquivo: Path) -> tuple[Path, int, int]:
    """Converte um arquivo para .webp na mesma pasta. Retorna (destino, antes, depois)."""
    destino = arquivo.with_suffix(".webp")

    with Image.open(arquivo) as im:
        # Respeita a rotação do EXIF (fotos de celular saem de lado sem isso)
        im = ImageOps.exif_transpose(im)

        # WebP não suporta os modos P/CMYK: converte para algo seguro
        if im.mode in ("P", "CMYK"):
            im = im.convert("RGBA" if "A" in im.getbands() or arquivo.suffix.lower() == ".png" else "RGB")

        # PNG com transparência preserva o canal alfa; o resto vira RGB (mais leve)
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if "A" in im.getbands() else "RGB")

        if LARGURA_MAX and im.width > LARGURA_MAX:
            nova_altura = round(im.height * LARGURA_MAX / im.width)
            im = im.resize((LARGURA_MAX, nova_altura), Image.LANCZOS)

        im.save(destino, "WEBP", quality=QUALIDADE, method=6)

    antes = arquivo.stat().st_size
    depois = destino.stat().st_size
    arquivo.unlink()  # remove o original: a pasta fica só com WebP
    return destino, antes, depois


def main() -> None:
    pasta = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("img")
    if not pasta.is_dir():
        print(f"Erro: pasta '{pasta}' não existe.")
        sys.exit(1)

    arquivos = sorted(a for a in pasta.iterdir() if a.suffix.lower() in EXTENSOES)
    if not arquivos:
        print(f"Nenhuma imagem .png/.jpg encontrada em '{pasta}'.")
        return

    total_antes = total_depois = 0
    print(f"Convertendo {len(arquivos)} imagem(ns) de '{pasta}' para WebP (qualidade {QUALIDADE})...\n")

    for arq in arquivos:
        destino, antes, depois = converter(arq)
        total_antes += antes
        total_depois += depois
        economia = (1 - depois / antes) * 100 if antes else 0
        print(f"  [ok] {arq.name} -> {destino.name}  "
              f"({antes / 1024:.0f} KB -> {depois / 1024:.0f} KB, -{economia:.0f}%)  original apagado")

    economia_total = (1 - total_depois / total_antes) * 100 if total_antes else 0
    print(f"\nPronto! {len(arquivos)} arquivo(s). "
          f"Total: {total_antes / 1024 / 1024:.1f} MB -> {total_depois / 1024 / 1024:.1f} MB "
          f"(-{economia_total:.0f}%). A pasta ficou só com .webp.")


if __name__ == "__main__":
    main()
