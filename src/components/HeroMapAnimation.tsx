'use client';

import { useEffect, useRef } from 'react';

interface ProspectPin {
  x: number; // 0..1 relative position
  y: number; // 0..1 relative position
  name: string;
  category: string;
  rating: string;
  reviews: number;
  hasWA: boolean;
  discovered: boolean;
  pulsePhase: number;
  highlightIntensity: number;
  accentColor: 'orange' | 'indigo';
}

const SAMPLE_PROSPECTS: Omit<ProspectPin, 'x' | 'y' | 'discovered' | 'pulsePhase' | 'highlightIntensity'>[] = [
  { name: 'Kopi Tembalang', category: 'Coffee Shop', rating: '4.9', reviews: 342, hasWA: true, accentColor: 'orange' },
  { name: 'Barbershop Senopati', category: 'Grooming', rating: '4.8', reviews: 189, hasWA: true, accentColor: 'indigo' },
  { name: 'CV Karya Mandiri', category: 'Kontraktor', rating: '4.7', reviews: 95, hasWA: true, accentColor: 'orange' },
  { name: 'Klinik Estetika Glow', category: 'Klinik Kecantikan', rating: '4.9', reviews: 520, hasWA: true, accentColor: 'indigo' },
  { name: 'Resto Aroma Nusantara', category: 'Kuliner B2B', rating: '4.8', reviews: 410, hasWA: true, accentColor: 'orange' },
  { name: 'Graha Bangun Mandiri', category: 'Supplier Material', rating: '4.6', reviews: 78, hasWA: true, accentColor: 'indigo' },
  { name: 'Florist Senja Asri', category: 'Florist', rating: '5.0', reviews: 164, hasWA: true, accentColor: 'orange' },
  { name: 'Studio Foto Kolase', category: 'Creative Agency', rating: '4.9', reviews: 215, hasWA: true, accentColor: 'indigo' },
  { name: 'Logistik Cepat Sejahtera', category: 'Ekspedisi', rating: '4.7', reviews: 310, hasWA: true, accentColor: 'orange' },
  { name: 'Percetakan Digital Multi', category: 'Percetakan B2B', rating: '4.8', reviews: 140, hasWA: true, accentColor: 'indigo' },
];

export default function HeroMapAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Fixed realistic relative coordinates to feel like a real metropolitan map layout
    const coords = [
      { x: 0.12, y: 0.28 },
      { x: 0.22, y: 0.68 },
      { x: 0.32, y: 0.42 },
      { x: 0.44, y: 0.22 },
      { x: 0.58, y: 0.76 },
      { x: 0.68, y: 0.32 },
      { x: 0.78, y: 0.62 },
      { x: 0.88, y: 0.25 },
      { x: 0.26, y: 0.84 },
      { x: 0.74, y: 0.82 },
    ];

    const pins: ProspectPin[] = SAMPLE_PROSPECTS.map((p, idx) => ({
      ...p,
      x: coords[idx % coords.length].x,
      y: coords[idx % coords.length].y,
      discovered: true,
      pulsePhase: Math.random() * Math.PI * 2,
      highlightIntensity: 0,
    }));

    // Data packet particles moving between extracted nodes
    interface DataPulse {
      fromPinIdx: number;
      toPinIdx: number;
      progress: number;
      speed: number;
      color: string;
    }

    const dataPulses: DataPulse[] = [
      { fromPinIdx: 0, toPinIdx: 2, progress: 0.1, speed: 0.005, color: '#FF642D' },
      { fromPinIdx: 2, toPinIdx: 3, progress: 0.5, speed: 0.006, color: '#6366f1' },
      { fromPinIdx: 5, toPinIdx: 7, progress: 0.3, speed: 0.004, color: '#FF642D' },
      { fromPinIdx: 4, toPinIdx: 6, progress: 0.7, speed: 0.005, color: '#6366f1' },
    ];

    // Scanning radar line position
    let scanSweepX = 0;

    const resize = () => {
      if (!container || !canvas) return;
      width = container.clientWidth;
      height = container.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    // Mouse movement handler
    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000, active: false };
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Render loop
    const render = (time: number) => {
      if (!ctx || width === 0 || height === 0) return;

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Colors adapted for light & dark mode to ensure subtle, non-intrusive aesthetic
      const gridColor = isDark ? 'rgba(148, 163, 184, 0.05)' : 'rgba(100, 116, 139, 0.04)';
      const roadLineColor = isDark ? 'rgba(99, 102, 241, 0.07)' : 'rgba(99, 102, 241, 0.05)';
      const routeLineColor = isDark ? 'rgba(255, 100, 45, 0.09)' : 'rgba(255, 100, 45, 0.07)';

      // ── 1. Draw subtle geometric map grid (Google Maps coordinates feel) ──
      const gridSize = 72;
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ── 2. Draw stylized map roads / connection paths ──
      ctx.strokeStyle = roadLineColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);

      // Path connecting first cluster
      ctx.beginPath();
      ctx.moveTo(pins[0].x * width, pins[0].y * height);
      ctx.lineTo(pins[2].x * width, pins[2].y * height);
      ctx.lineTo(pins[3].x * width, pins[3].y * height);
      ctx.lineTo(pins[5].x * width, pins[5].y * height);
      ctx.stroke();

      // Path connecting second cluster
      ctx.strokeStyle = routeLineColor;
      ctx.beginPath();
      ctx.moveTo(pins[1].x * width, pins[1].y * height);
      ctx.lineTo(pins[4].x * width, pins[4].y * height);
      ctx.lineTo(pins[6].x * width, pins[6].y * height);
      ctx.lineTo(pins[7].x * width, pins[7].y * height);
      ctx.stroke();

      ctx.setLineDash([]); // Reset dash

      // ── 3. Radar Scraping Sweep Line ──
      scanSweepX = (scanSweepX + 0.8) % (width + 240);
      const sweepX = scanSweepX - 120;

      // Soft vertical radar scraping beam gradient
      const sweepGrad = ctx.createLinearGradient(sweepX - 70, 0, sweepX + 70, 0);
      sweepGrad.addColorStop(0, 'rgba(255, 100, 45, 0)');
      sweepGrad.addColorStop(0.5, isDark ? 'rgba(255, 100, 45, 0.07)' : 'rgba(255, 100, 45, 0.05)');
      sweepGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

      ctx.fillStyle = sweepGrad;
      ctx.fillRect(sweepX - 70, 0, 140, height);

      // Radar sweep thin laser line
      ctx.strokeStyle = isDark ? 'rgba(255, 100, 45, 0.22)' : 'rgba(255, 100, 45, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, height);
      ctx.stroke();

      // ── 4. Data Packets Moving Along Discovery Network ──
      dataPulses.forEach((pulse) => {
        pulse.progress += pulse.speed;
        if (pulse.progress > 1) pulse.progress = 0;

        const p1 = pins[pulse.fromPinIdx];
        const p2 = pins[pulse.toPinIdx];
        const px = p1.x * width + (p2.x * width - p1.x * width) * pulse.progress;
        const py = p1.y * height + (p2.y * height - p1.y * height) * pulse.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = pulse.color;
        ctx.shadowColor = pulse.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // ── 5. Render Prospect Pin Locations (Google Maps Style Pins & Badges) ──
      const mouse = mouseRef.current;

      pins.forEach((pin) => {
        const px = pin.x * width;
        const py = pin.y * height;
        const distToMouse = Math.hypot(mouse.x - px, mouse.y - py);
        const isHovered = mouse.active && distToMouse < 90;

        // Target highlight intensity smoothly
        const targetIntensity = isHovered ? 1 : Math.max(0, 1 - distToMouse / 200);
        pin.highlightIntensity += (targetIntensity - pin.highlightIntensity) * 0.1;

        // Base pin colors: Semrush Orange (#FF642D) or Tech Indigo (#6366f1)
        const primaryHex = pin.accentColor === 'orange' ? '#FF642D' : '#6366f1';
        const pulseSize = 10 + Math.sin(time * 0.003 + pin.pulsePhase) * 3;

        // Draw interactive connection line to mouse cursor if nearby
        if (mouse.active && distToMouse < 190) {
          ctx.strokeStyle = pin.accentColor === 'orange'
            ? `rgba(255, 100, 45, ${0.32 * (1 - distToMouse / 190)})`
            : `rgba(99, 102, 241, ${0.32 * (1 - distToMouse / 190)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        // Concentric pulse beacon
        ctx.beginPath();
        ctx.arc(px, py, pulseSize + pin.highlightIntensity * 8, 0, Math.PI * 2);
        ctx.strokeStyle = pin.accentColor === 'orange'
          ? `rgba(255, 100, 45, ${0.16 + pin.highlightIntensity * 0.25})`
          : `rgba(99, 102, 241, ${0.16 + pin.highlightIntensity * 0.25})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Pin Outer Core
        ctx.beginPath();
        ctx.arc(px, py, 4 + pin.highlightIntensity * 2, 0, Math.PI * 2);
        ctx.fillStyle = primaryHex;
        ctx.shadowColor = primaryHex;
        ctx.shadowBlur = 6 + pin.highlightIntensity * 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner white dot
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // ── Miniature Prospect Tooltip Tag ──
        const showFullBadge = pin.highlightIntensity > 0.3 || isHovered;
        const badgeOpacity = 0.5 + pin.highlightIntensity * 0.5;

        ctx.save();
        ctx.font = '500 10px sans-serif';
        const labelText = showFullBadge ? `${pin.name} • ${pin.rating}★` : `${pin.rating}★`;
        const textMetrics = ctx.measureText(labelText);
        const tagWidth = textMetrics.width + 14;
        const tagHeight = 18;
        const tagX = px + 8;
        const tagY = py - tagHeight - 4;

        // Tooltip container background
        ctx.fillStyle = isDark
          ? `rgba(30, 41, 59, ${0.85 * badgeOpacity})`
          : `rgba(255, 255, 255, ${0.92 * badgeOpacity})`;
        ctx.strokeStyle = pin.accentColor === 'orange'
          ? `rgba(255, 100, 45, ${0.35 * badgeOpacity})`
          : `rgba(99, 102, 241, ${0.35 * badgeOpacity})`;
        ctx.lineWidth = 1;

        // Rounded pill box
        const r = 4;
        ctx.beginPath();
        ctx.moveTo(tagX + r, tagY);
        ctx.lineTo(tagX + tagWidth - r, tagY);
        ctx.arcTo(tagX + tagWidth, tagY, tagX + tagWidth, tagY + r, r);
        ctx.lineTo(tagX + tagWidth, tagY + tagHeight - r);
        ctx.arcTo(tagX + tagWidth, tagY + tagHeight, tagX + tagWidth - r, tagY + tagHeight, r);
        ctx.lineTo(tagX + r, tagY + tagHeight);
        ctx.arcTo(tagX, tagY + tagHeight, tagX, tagY + tagHeight - r, r);
        ctx.lineTo(tagX, tagY + r);
        ctx.arcTo(tagX, tagY, tagX + r, tagY, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Text inside tag
        ctx.fillStyle = isDark
          ? `rgba(241, 245, 249, ${badgeOpacity})`
          : `rgba(15, 23, 42, ${badgeOpacity})`;
        ctx.fillText(labelText, tagX + 7, tagY + 12);

        ctx.restore();
      });

      // ── 6. Cursor Reticle Indicator ──
      if (mouse.active) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 20, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? 'rgba(255, 100, 45, 0.22)' : 'rgba(255, 100, 45, 0.18)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-auto select-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Soft gradient fade-out at bottom edge to transition gracefully into content */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-base-100 to-transparent pointer-events-none" />
      {/* Subtle radial overlay to keep center content (H1 headline) effortlessly readable */}
      <div className="absolute inset-0 bg-radial from-transparent via-base-100/30 to-base-100/60 pointer-events-none" />
    </div>
  );
}
