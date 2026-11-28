"""Export or check the album's square, transparent WebPs using the local archive.

Run with Pillow installed: python game/tools/export-card-portraits.py [--check]
"""

import argparse
from hashlib import sha256
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageOps, ImageStat


ROOT = Path(__file__).resolve().parents[2]
ARCHIVE = ROOT / 'production/seated-exports'
DESTINATION = ROOT / 'game/public/cards'
CHAPTERS = ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
FRAME = (320, 320)


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def by_traveler(records):
    indexed = {record['travelerId']: record for record in records}
    if len(indexed) != len(records):
        raise ValueError('Duplicate traveler ID in portrait sources')
    return indexed


def portrait_pixels(extraction, placement):
    path = ARCHIVE / extraction['file']
    if sha256(path.read_bytes()).hexdigest() != extraction['sha256']:
        raise ValueError(f'Source hash mismatch for {path}')

    with Image.open(path) as source:
        if source.mode != 'RGBA' or list(source.size) != extraction['size']:
            raise ValueError(f'Unexpected source mode or dimensions for {path}')
        if placement['flipX']:
            source = ImageOps.mirror(source)
        fitted = ImageOps.contain(source, FRAME, Image.Resampling.LANCZOS)

    frame = Image.new('RGBA', FRAME)
    frame.paste(fitted, ((FRAME[0] - fitted.width) // 2, FRAME[1] - fitted.height))
    return frame


def check_export(path, pixels):
    with Image.open(path) as exported:
        if exported.format != 'WEBP' or exported.mode != 'RGBA' or exported.size != FRAME:
            raise ValueError(f'Unexpected runtime format or dimensions for {path}')
        alpha = pixels.getchannel('A')
        if exported.getchannel('A').tobytes() != alpha.tobytes():
            raise ValueError(f'Runtime silhouette differs from the oriented source for {path}')
        # WebP compresses RGB. Compare the colors of solid pixels after decoding.
        solid = alpha.point(lambda value: 255 if value >= 128 else 0)
        difference = ImageChops.difference(exported.convert('RGB'), pixels.convert('RGB'))
        if max(ImageStat.Stat(difference, solid).mean) > 7:
            raise ValueError(f'Runtime colors differ from the oriented source for {path}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Compare every runtime portrait with its oriented source')
    args = parser.parse_args()
    crossed = [crossing for chapter in CHAPTERS
               for crossing in read_json(ROOT / 'release' / f'{chapter}.json')['chapter']['crossings']]
    if [crossing['ordinal'] for crossing in crossed] != list(range(1, 49)):
        raise ValueError('Release packs must provide crossings 1–48 in order')

    roster = by_traveler([{'travelerId': 'host.original', 'seatAnchorId': 'host.seat'}, *crossed])
    extractions = by_traveler(read_json(ARCHIVE / 'extraction.json')['figures'])
    placements = by_traveler(read_json(ARCHIVE / 'moonwater-finale-placement-v02.json')['figuresBackToFront'])
    if roster.keys() != extractions.keys() or roster.keys() != placements.keys():
        raise ValueError('Release, extraction and placement traveler IDs differ')

    if not args.check:
        DESTINATION.mkdir(parents=True, exist_ok=True)

    for traveler_id, character in roster.items():
        extraction, placement = extractions[traveler_id], placements[traveler_id]
        if any(record['seatAnchorId'] != character['seatAnchorId'] for record in (extraction, placement)):
            raise ValueError(f'Seat ID mismatch for {traveler_id}')
        if extraction['file'] != placement['file'] or type(placement['flipX']) is not bool:
            raise ValueError(f'Missing or inconsistent placement source for {traveler_id}')

        pixels = portrait_pixels(extraction, placement)
        path = DESTINATION / f'{traveler_id}.webp'
        if args.check:
            check_export(path, pixels)
        else:
            pixels.save(path, format='WEBP', quality=92, method=6, exact=True)

    print(f'{"Checked" if args.check else "Exported"} {len(roster)} portraits, '
          f'including {sum(placement["flipX"] for placement in placements.values())} horizontal flips.')


if __name__ == '__main__':
    main()
