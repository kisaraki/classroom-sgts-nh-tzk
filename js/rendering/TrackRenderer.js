import { geoToCanvas } from "../utils/geo.js";

export class TrackRenderer {
  draw({ bounds, context, height, padding, trackHistory, width }) {
    if (!trackHistory || trackHistory.length < 2) {
      return;
    }

    context.save();
    context.beginPath();

    trackHistory.forEach((point, index) => {
      const canvasPoint = geoToCanvas(point, {
        bounds,
        height,
        padding,
        width
      });

      if (index === 0) {
        context.moveTo(canvasPoint.x, canvasPoint.y);
      } else {
        context.lineTo(canvasPoint.x, canvasPoint.y);
      }
    });

    context.strokeStyle = "rgba(217, 249, 255, 0.54)";
    context.lineWidth = 2;
    context.setLineDash([4, 6]);
    context.stroke();
    context.setLineDash([]);
    context.restore();
  }
}
