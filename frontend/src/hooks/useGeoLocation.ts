import { useState } from "react";

export type GeoResult = {
  coords: string;       // "lat, lng"
  address: string;      // human-readable place name
};

type State =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "ok";    result: GeoResult }
  | { status: "error"; message: string };

export function useGeoLocation() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function locate() {
    if (!navigator.geolocation) {
      setState({ status: "error", message: "Geolocation is not supported by your browser." });
      return;
    }

    setState({ status: "locating" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const address =
            data.display_name ??
            [data.address?.village, data.address?.district, data.address?.country]
              .filter(Boolean)
              .join(", ") ??
            coords;

          setState({ status: "ok", result: { coords, address } });
        } catch {
          // Reverse geocode failed — coords alone are still valid
          setState({ status: "ok", result: { coords, address: coords } });
        }
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Location access denied. Please allow location access or enter coordinates manually.",
          2: "Location unavailable. Please enter coordinates manually.",
          3: "Location request timed out. Please try again.",
        };
        setState({ status: "error", message: messages[err.code] ?? "Unknown location error." });
      },
      { timeout: 10_000, maximumAge: 60_000 }
    );
  }

  function reset() { setState({ status: "idle" }); }

  return { state, locate, reset };
}
