"use client";

import { useEffect, useRef, useState } from "react";

interface GlobePin {
  lat: number;
  lng: number;
  count: number;
}

interface GlobeProps {
  /** Optional: filter to a single profile's pins */
  profilePins?: Array<{ latitude: number; longitude: number; label?: string }>;
  /** Height of the globe container in px */
  height?: number;
  /** Show the total count overlay */
  showCounter?: boolean;
  /** Total profile count for the overlay */
  totalCount?: number;
  /** Whether to show cluster hover labels */
  showLabels?: boolean;
}

export default function Globe({
  profilePins,
  height = 400,
  showCounter = false,
  totalCount,
  showLabels: _showLabels = false,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [pins, setPins] = useState<GlobePin[]>([]);
  const [loaded, setLoaded] = useState(false);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const rotationY = useRef(0);
  const rotationSpeed = useRef(0.003);

  // Load cluster pins from API (homepage) or use profile-specific pins
  useEffect(() => {
    if (profilePins) {
      setPins(profilePins.map(p => ({ lat: p.latitude, lng: p.longitude, count: 1 })));
      setLoaded(true);
      return;
    }
    fetch("/api/globe-pins")
      .then(r => r.json())
      .then(data => {
        setPins(data ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [profilePins]);

  useEffect(() => {
    if (!loaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.42;

    function latLngToXY(lat: number, lng: number, rot: number) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + rot * (180 / Math.PI)) * (Math.PI / 180);
      const x = cx + radius * Math.sin(phi) * Math.cos(theta);
      const y = cy + radius * Math.cos(phi);
      // Dot product to determine if facing toward viewer
      const z = Math.sin(phi) * Math.sin(theta);
      return { x, y, visible: z > -0.1 };
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, w, h);

      // Stars background
      ctx.fillStyle = "rgba(245,240,232,0.0)";
      // (Stars are drawn in the parent container via CSS)

      // Atmospheric glow
      const atmosphereGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.2);
      atmosphereGrad.addColorStop(0, "rgba(68,136,255,0)");
      atmosphereGrad.addColorStop(0.7, "rgba(68,136,255,0.04)");
      atmosphereGrad.addColorStop(1, "rgba(68,136,255,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = atmosphereGrad;
      ctx.fill();

      // Globe surface
      const globeGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.2, 0, cx, cy, radius);
      globeGrad.addColorStop(0, "#1e3a5f");
      globeGrad.addColorStop(0.5, "#162d4a");
      globeGrad.addColorStop(1, "#0d1f35");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = globeGrad;
      ctx.fill();

      // Globe edge
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(245,158,11,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Latitude/longitude grid lines
      ctx.strokeStyle = "rgba(245,240,232,0.04)";
      ctx.lineWidth = 0.5;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        for (let lng = -180; lng <= 180; lng += 5) {
          const { x, y, visible } = latLngToXY(lat, lng, rotationY.current);
          if (visible) {
            if (lng === -180) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
      for (let lng = 0; lng < 360; lng += 30) {
        const adjLng = ((lng - 180) % 360 + 360) % 360 - 180;
        ctx.beginPath();
        for (let lat = -90; lat <= 90; lat += 5) {
          const { x, y, visible } = latLngToXY(lat, adjLng, rotationY.current);
          if (visible) {
            if (lat === -90) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Pins
      for (const pin of pins) {
        const { x, y, visible } = latLngToXY(pin.lat, pin.lng, rotationY.current);
        if (!visible) continue;

        const size = pin.count > 100 ? 5 : pin.count > 20 ? 3.5 : 2.5;

        // Glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
        glow.addColorStop(0, "rgba(245,158,11,0.4)");
        glow.addColorStop(1, "rgba(245,158,11,0)");
        ctx.beginPath();
        ctx.arc(x, y, size * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = "#F59E0B";
        ctx.fill();
      }

      // Auto-rotate
      rotationY.current += rotationSpeed.current;
    }

    function animate() {
      draw();
      animFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    // Drag to rotate
    function onMouseDown(e: MouseEvent) {
      isDragging.current = true;
      lastMouseX.current = e.clientX;
      rotationSpeed.current = 0;
    }
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouseX.current;
      rotationY.current += dx * 0.005;
      lastMouseX.current = e.clientX;
    }
    function onMouseUp() {
      isDragging.current = false;
      rotationSpeed.current = 0.003;
    }
    function onTouchStart(e: TouchEvent) {
      isDragging.current = true;
      lastMouseX.current = e.touches[0].clientX;
      rotationSpeed.current = 0;
    }
    function onTouchMove(e: TouchEvent) {
      if (!isDragging.current) return;
      const dx = e.touches[0].clientX - lastMouseX.current;
      rotationY.current += dx * 0.005;
      lastMouseX.current = e.touches[0].clientX;
    }
    function onTouchEnd() {
      isDragging.current = false;
      rotationSpeed.current = 0.003;
    }

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pins, loaded]);

  return (
    <div className="globe-container relative" style={{ height }}>
      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden rounded-full" style={{ pointerEvents: "none" }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i}
            className="absolute rounded-full bg-warm-primary"
            style={{
              width: Math.random() * 1.5 + 0.5,
              height: Math.random() * 1.5 + 0.5,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.4 + 0.1,
            }} />
        ))}
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ display: "block" }}
      />

      {showCounter && totalCount !== undefined && totalCount > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <p className="text-flame text-sm font-medium">
            {totalCount.toLocaleString()} lives in the record
          </p>
        </div>
      )}

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="skeleton w-full h-full rounded-full" />
        </div>
      )}
    </div>
  );
}
