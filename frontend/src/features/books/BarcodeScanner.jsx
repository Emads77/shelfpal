import { useEffect, useId, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

export default function BarcodeScanner({ onDetected, onError }) {
  const regionId = `scanner${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const onDetectedRef = useRef(onDetected);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onDetectedRef.current = onDetected;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const scanner = new Html5Qrcode(regionId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      verbose: false,
    });
    let handled = false;
    const starting = scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 300, height: 140 },
        videoConstraints: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      (text) => {
        if (handled) return;
        handled = true;
        onDetectedRef.current(text);
      },
      () => {},
    );
    starting.catch(() => onErrorRef.current());

    return () => {
      starting
        .then(() => scanner.stop())
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, [regionId]);

  return <div id={regionId} className="scan-book__camera" />;
}
