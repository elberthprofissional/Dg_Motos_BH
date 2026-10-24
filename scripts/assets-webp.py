#!/usr/bin/env python3
# ============================================================
# PUBLICADOR DE ASSETS DE IMAGEM — DG MOTOS
# ============================================================
# Converte as fotos novas de img/ para os WebP que a home consome
# em src/assets/ (hero e banner da troca). Os originais ficam em
# img/ como fonte da verdade; aqui só se publica.
#
# Uso:
#   python scripts/assets-webp.py
#
# Fluxo: o cliente troca a foto, sobrescreve o arquivo Fonte
# (mantendo o nome), e roda este comando — os WebP de src/assets/
# são regenerados do zero, com os mesmos nomes que os imports do
# Home.tsx já usam. Nada do código muda.
#
# Requisito: Pillow  ->  pip install Pillow
# ============================================================

import sys
from pathlib import Path

from PIL import Image, ImageOps

# ----------------------------------------------------------------
# O mapa: (fonte, qualidade) -> lista de (saída, largura máxima).
# A fonte pode ser .png, .jpg, .jpeg ou .webp. A largura controla só o
# teto de redimensionamento (nunca amplia): a proporção original
# da foto é respeitada — o CSS do site cuida do recorte visual.
# ----------------------------------------------------------------
QUALIDADE = 80  # 0-100 (method 6: compressão mais cautelosa e melhor)

MAPA = [
    {
        "fonte": "img/hero/home.png",
        "saidas": [
            # O hero desktop declara width=1920 height=642 no Home.tsx:
            # 2170×725 * 1920/2170 = 1920×642, na proporcionação exata.
            ("src/assets/hero/home-desktop.webp", 1920),
            ("src/assets/hero/home-mobile.webp", 1280),
        ],
    },
    {
        # img/troca guarda os WebP convertidos (convert-webp.py apagou
        # os PNG): a fonte agora é o próprio .webp, re-trabalhado só
        # no tamanho que cada versão do site usa.
        "fonte": "img/troca/banner-desktop.webp",
        "saidas": [
            ("src/assets/troca/banner-desktop.webp", 1760),
        ],
    },
    {
        "fonte": "img/troca/banner-mobile.webp",
        "saidas": [
            ("src/assets/troca/banner-mobile.webp", 1280),
        ],
    },
]


def converter(fonte: Path, saida: Path, largura_max: int, qualidade: int) -> tuple[int, int]:
    """Gera `saida` a partir de `fonte`. Retorna (antes, depois) em bytes."""
    with Image.open(fonte) as im:
        # Respeita a rotação do EXIF (foto de celular sai de lado sem isso).
        im = ImageOps.exif_transpose(im)

        # PNG com transparência preserva o alfa; o resto vira RGB (mais leve).
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if "A" in im.getbands() else "RGB")

        if largura_max and im.width > largura_max:
            nova_altura = round(im.height * largura_max / im.width)
            im = im.resize((largura_max, nova_altura), Image.LANCZOS)

        saida.parent.mkdir(parents=True, exist_ok=True)
        im.save(saida, "WEBP", quality=qualidade, method=6)

    return fonte.stat().st_size, saida.stat().st_size


def main() -> None:
    raiz = Path(__file__).resolve().parent.parent
    total_antes = total_depois = 0
    gerados = 0

    for item in MAPA:
        fonte = raiz / item["fonte"]
        if not fonte.is_file():
            print(f"AVISO: fonte não encontrada — {item['fonte']} (saídas mantidas como estão)")
            continue

        for destino_rel, largura in item["saidas"]:
            destino = raiz / destino_rel
            antes, depois = converter(fonte, destino, largura, QUALIDADE)
            total_antes += antes
            total_depois += depois
            gerados += 1
            economia = (1 - depois / antes) * 100 if antes else 0
            dim = Image.open(destino).size
            print(
                f"  [ok] {item['fonte']} -> {destino_rel}  "
                f"{dim[0]}x{dim[1]}  {antes / 1024:.0f} KB -> {depois / 1024:.0f} KB (-{economia:.0f}%)"
            )

    if gerados == 0:
        print("Nada foi gerado: nenhuma fonte encontrada.")
        sys.exit(1)

    economia = (1 - total_depois / total_antes) * 100
    print(
        f"\nPronto: {gerados} WebP gerado(s). "
        f"Total {total_antes / 1024 / 1024:.1f} MB -> {total_depois / 1024 / 1024:.1f} MB "
        f"(-{economia:.0f}%), originais preservados em img/."
    )


if __name__ == "__main__":
    main()
