"""Build the SGTS-NH land-only Natural Earth II terrain texture.

Run with Homebrew uv so Python packages remain isolated::

    uv run --with pillow --with pyshp python scripts/build-terrain-raster.py \
      --raster-source /path/to/NE2_LR_LC_SR_W.tif \
      --land-shapefile /path/to/ne_10m_land.shp \
      --output assets/maps/northwest-pacific-terrain-v1.webp

The output is visual-only. Simulation land/sea decisions continue to use the
validated SGTS map data rather than pixels from this texture.
"""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

import shapefile
from PIL import Image, ImageDraw


WEST = 100.0
SOUTH = 0.0
EAST = 160.0
NORTH = 40.0
OUTPUT_WIDTH = 2400
OUTPUT_HEIGHT = 1600
MASK_SCALE = 2


def pixel_from_coordinate(
    lon: float,
    lat: float,
    *,
    width: int,
    height: int,
) -> tuple[float, float]:
    return (
        (lon - WEST) / (EAST - WEST) * width,
        (NORTH - lat) / (NORTH - SOUTH) * height,
    )


def signed_ring_area(points: list[tuple[float, float]]) -> float:
    return sum(
        first[0] * second[1] - second[0] * first[1]
        for first, second in zip(points, points[1:] + points[:1], strict=True)
    ) / 2


def build_land_mask(shapefile_path: Path) -> Image.Image:
    width = OUTPUT_WIDTH * MASK_SCALE
    height = OUTPUT_HEIGHT * MASK_SCALE
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)

    with shapefile.Reader(str(shapefile_path)) as reader:
        for shape in reader.iterShapes():
            minimum_lon, minimum_lat, maximum_lon, maximum_lat = shape.bbox
            if (
                maximum_lon < WEST
                or minimum_lon > EAST
                or maximum_lat < SOUTH
                or minimum_lat > NORTH
            ):
                continue

            part_starts = [*shape.parts, len(shape.points)]
            for start, end in zip(part_starts, part_starts[1:]):
                ring = shape.points[start:end]
                if len(ring) < 3:
                    continue

                pixels = [
                    pixel_from_coordinate(
                        lon,
                        lat,
                        width=width,
                        height=height,
                    )
                    for lon, lat in ring
                ]
                # ESRI polygon exteriors are clockwise in geographic space;
                # counterclockwise rings are holes and must remain transparent.
                fill = 255 if signed_ring_area(ring) < 0 else 0
                draw.polygon(pixels, fill=fill)

    return mask.resize(
        (OUTPUT_WIDTH, OUTPUT_HEIGHT),
        Image.Resampling.LANCZOS,
    )


def build_terrain(raster_path: Path, land_path: Path) -> Image.Image:
    Image.MAX_IMAGE_PIXELS = None
    with Image.open(raster_path) as source_image:
        source = source_image.convert("RGB")
        source_width, source_height = source.size
        if source_width != source_height * 2:
            raise ValueError("Natural Earth II source must be 2:1 equirectangular.")

        source_box = (
            round((WEST + 180) / 360 * source_width),
            round((90 - NORTH) / 180 * source_height),
            round((EAST + 180) / 360 * source_width),
            round((90 - SOUTH) / 180 * source_height),
        )
        terrain = source.crop(source_box).resize(
            (OUTPUT_WIDTH, OUTPUT_HEIGHT),
            Image.Resampling.LANCZOS,
        ).convert("RGBA")

    terrain.putalpha(build_land_mask(land_path))
    return terrain


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--raster-source", required=True, type=Path)
    parser.add_argument("--land-shapefile", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    terrain = build_terrain(args.raster_source, args.land_shapefile)
    terrain.save(
        args.output,
        "WEBP",
        exact=True,
        method=6,
        quality=86,
    )
    digest = hashlib.sha256(args.output.read_bytes()).hexdigest()
    print(f"{args.output}: {terrain.width}x{terrain.height} sha256={digest}")


if __name__ == "__main__":
    main()
