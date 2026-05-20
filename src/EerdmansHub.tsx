import {
  useState,
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import type { LucideIcon } from "lucide-react";
import { HomeNotificationsWidget } from "./components/HomeNotificationsWidget";
import { GarageRoom } from "./rooms/garage/GarageRoom";
import { HouseProjectsRoom } from "./rooms/projects/HouseProjectsRoom";
import { KitchenRoom } from "./rooms/kitchen/KitchenRoom";
import { CalendarRoom } from "./rooms/calendar/CalendarRoom";
import { ImageVaultRoom } from "./rooms/image-vault/ImageVaultRoom";
import { VaultRoom } from "./rooms/vault/VaultRoom";
import { HomeCameraCapture } from "./components/HomeCameraCapture";
import { PhotoKindBubbles } from "./components/PhotoKindBubbles";
import type { ImagePhotoKind } from "../types";
import { useStandaloneApp } from "./hooks/useStandaloneApp";
import {
  Wifi,
  ChefHat,
  Car,
  Archive,
  Users,
  CalendarDays,
  Eraser,
  Trash2,
  ChevronLeft,
  Camera,
  Images,
} from "lucide-react";

// Schedule logic
const isInternetOn = (date: Date) => {
  const day = date.getDay();
  const hour = date.getHours();

  if (day >= 0 && day <= 4) {
    // Sun-Thu
    return hour >= 17 && hour < 21; // 5 PM to 9 PM
  } else {
    // Fri-Sat
    return (hour >= 9 && hour < 11) || (hour >= 17 && hour < 22); // 9 AM - 11 AM & 5 PM - 10 PM
  }
};

const getNextInternetToggle = (date: Date): Date | null => {
  const tempDate = new Date(date);
  tempDate.setSeconds(0, 0); // zero out seconds for clean comparison

  // Look forward minute by minute until the state changes (up to 48 hours to be safe)
  const currentState = isInternetOn(tempDate);
  for (let i = 1; i < 48 * 60; i++) {
    tempDate.setMinutes(tempDate.getMinutes() + 1);
    if (isInternetOn(tempDate) !== currentState) {
      return tempDate;
    }
  }
  return null;
};

const formatCountdown = (targetDate: Date | null, currentDate: Date) => {
  if (!targetDate) return "";
  const diffMs = targetDate.getTime() - currentDate.getTime();
  if (diffMs <= 0) return "Just now";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

  let out = "";
  if (diffHours > 0) out += `${diffHours}h `;
  if (diffMins > 0 || diffHours > 0) out += `${diffMins}m `;
  out += `${diffSecs}s`;
  return out;
};

type RoomId =
  | "network"
  | "kitchen"
  | "garage"
  | "vault"
  | "image_vault"
  | "projects"
  | "roster"
  | "calendar";

function TopNavigation({
  activeRoom,
  setActiveRoom,
}: {
  activeRoom: RoomId | null;
  setActiveRoom: (room: RoomId) => void;
}) {
  const navItems = [
    { id: "network" as const, icon: <Wifi size={20} />, label: "Network" },
    { id: "kitchen" as const, icon: <ChefHat size={20} />, label: "Kitchen" },
    { id: "garage" as const, icon: <Car size={20} />, label: "Garage" },
    { id: "vault" as const, icon: <Archive size={20} />, label: "Vault" },
    { id: "image_vault" as const, icon: <Images size={20} />, label: "Image" },
    { id: "projects" as const, icon: <Archive size={20} />, label: "Projects" },
    { id: "roster" as const, icon: <Users size={20} />, label: "Roster" },
    { id: "calendar" as const, icon: <CalendarDays size={20} />, label: "Calendar" },
  ];

  if (activeRoom) return null; // Hidden when in a room

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 p-2 bg-white/40 backdrop-blur-2xl rounded-full border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveRoom(item.id)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full hover:bg-white/60 hover:shadow-sm transition-all duration-300 text-slate-700 font-medium hover:text-cyan-700"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TodayWidget() {
  const events = [
    { time: "5:00 PM", title: "Internet turns ON", type: "network" },
    { time: "6:30 PM", title: "Dinner (Tacos)", type: "meal" },
    { time: "8:00 PM", title: "Family Movie", type: "roster" },
  ];

  return (
    <div className="w-full rounded-3xl border border-white/60 bg-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl pointer-events-none">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <CalendarDays size={18} className="text-cyan-600" />
        Today's Timeline
      </h3>
      <div className="space-y-4">
        {events.map((ev, i) => (
          <div key={i} className="flex gap-4 items-start">
            <span className="text-sm font-semibold text-slate-500 w-16 pt-0.5">{ev.time}</span>
            <div className="flex-1">
              <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 absolute -ml-[11px]"></div>
              <div className="border-l-2 border-cyan-200 pl-4 pb-2">
                <p className="font-medium text-slate-800">{ev.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarkerBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#00f3ff"); // Default Cyber Cyan
  const [isEraser, setIsEraser] = useState(false);

  const colors = [
    { name: "Cyber Cyan", hex: "#00f3ff" },
    { name: "Hot Magenta", hex: "#ff00ff" },
    { name: "Toxic Green", hex: "#39ff14" },
    { name: "Electric Yellow", hex: "#e8ff00" },
    { name: "Neon Red", hex: "#ff0055" },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set actual size in memory (scaled to account for pixel ratio for sharpness)
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth * 2;
      canvas.height = parent.clientHeight * 2;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(2, 2);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const getCoordinates = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e && e.touches.length > 0) {
      return {
        offsetX: e.touches[0]!.clientX - rect.left,
        offsetY: e.touches[0]!.clientY - rect.top,
      };
    }
    const mouse = e as ReactMouseEvent<HTMLCanvasElement>;
    return {
      offsetX: mouse.nativeEvent.offsetX,
      offsetY: mouse.nativeEvent.offsetY,
    };
  };

  const startDrawing = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 40;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;

      // Neon glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
    }

    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.closePath();
    ctx.shadowBlur = 0; // Reset shadow so it doesn't slow down context over time
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="absolute inset-0 w-full h-full z-10 overflow-hidden bg-white/20 backdrop-blur-2xl shadow-[inset_0_0_100px_rgba(255,255,255,0.6)]">
      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="cursor-crosshair w-full h-full relative z-20"
      />

      {/* Floating Toolbar */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3 p-3 bg-white/60 backdrop-blur-3xl rounded-full border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        {colors.map((c) => (
          <button
            key={c.hex}
            onClick={() => {
              setColor(c.hex);
              setIsEraser(false);
            }}
            className={`w-10 h-10 rounded-full transition-all duration-300 border-2 flex items-center justify-center ${color === c.hex && !isEraser ? "scale-110 shadow-lg" : "scale-100 hover:scale-105"} `}
            style={{
              backgroundColor: c.hex,
              borderColor: color === c.hex && !isEraser ? "white" : "transparent",
              boxShadow: color === c.hex && !isEraser ? `0 0 15px ${c.hex}` : "none",
            }}
            title={c.name}
          />
        ))}
        <div className="w-full h-px bg-slate-300/50 my-1" />
        <button
          onClick={() => setIsEraser(true)}
          className={`w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center ${isEraser ? "bg-slate-800 text-white shadow-lg scale-110" : "bg-white/50 text-slate-600 hover:bg-white"}`}
          title="Eraser"
        >
          <Eraser size={20} />
        </button>
        <button
          onClick={clearCanvas}
          className="w-10 h-10 rounded-full bg-red-100/50 text-red-600 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center mt-1"
          title="Clear Board"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}

function NetworkRoom() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentIsOn = isInternetOn(time);
  const nextToggle = getNextInternetToggle(time);
  const countdown = formatCountdown(nextToggle, time);

  const scheduleInfo = [
    { days: "Sun - Thu", times: "5:00 PM - 9:00 PM" },
    { days: "Fri - Sat", times: "9:00 AM - 11:00 AM" },
    { days: "Fri - Sat", times: "5:00 PM - 10:00 PM" },
  ];

  return (
    <div className="p-12 max-w-5xl mx-auto h-full flex flex-col items-center justify-center">
      <div
        className={`w-64 h-64 rounded-full flex flex-col items-center justify-center mb-12 shadow-[0_0_100px_rgba(0,0,0,0.1)] backdrop-blur-3xl border-4 transition-colors duration-1000 ${currentIsOn ? "bg-green-500/10 border-green-400 shadow-green-500/50" : "bg-red-500/10 border-red-400 shadow-red-500/50"}`}
      >
        <Wifi size={80} className={currentIsOn ? "text-green-500" : "text-red-500"} />
        <h2 className={`text-4xl font-black mt-4 ${currentIsOn ? "text-green-600" : "text-red-600"}`}>
          {currentIsOn ? "ONLINE" : "OFFLINE"}
        </h2>
      </div>

      <div className="bg-white/50 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-xl w-full max-w-2xl text-center">
        <h3 className="text-xl font-bold text-slate-700 mb-2">Turning {currentIsOn ? "OFF" : "ON"} in</h3>
        <div className="text-5xl font-mono font-black text-cyan-600 mb-8 tracking-tighter">{countdown}</div>

        <div className="w-full h-px bg-slate-300/50 mb-8" />

        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-center gap-2">
          <CalendarDays size={20} /> Weekly Schedule
        </h3>
        <div className="grid gap-3 text-left max-w-md mx-auto">
          {scheduleInfo.map((sch, i) => (
            <div key={i} className="flex justify-between items-center bg-white/40 p-4 rounded-xl border border-white/50">
              <span className="font-semibold text-slate-600">{sch.days}</span>
              <span className="font-mono font-bold text-slate-800">{sch.times}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StubRoom({ title, icon: Icon, desc }: { title: string; icon: LucideIcon; desc: string }) {
  return (
    <div className="p-12 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-cyan-100 rounded-2xl text-cyan-700">
          <Icon size={40} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">{title}</h1>
      </div>
      <div className="flex-1 bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl p-8 flex items-center justify-center">
        <p className="text-2xl text-slate-500 font-medium text-center max-w-lg">{desc}</p>
      </div>
    </div>
  );
}

export default function EerdmansHub() {
  useStandaloneApp();
  const [activeRoom, setActiveRoom] = useState<RoomId | null>(null);
  const [showPhotoKindPick, setShowPhotoKindPick] = useState(false);
  const [captureKind, setCaptureKind] = useState<ImagePhotoKind | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const internetStatus = isInternetOn(currentTime);

  const renderRoom = () => {
    switch (activeRoom) {
      case "network":
        return <NetworkRoom />;
      case "kitchen":
        return <KitchenRoom />;
      case "garage":
        return <GarageRoom />;
      case "vault":
        return <VaultRoom />;
      case "image_vault":
        return <ImageVaultRoom />;
      case "projects":
        return <HouseProjectsRoom />;
      case "roster":
        return (
          <StubRoom
            title="Family Roster"
            icon={Users}
            desc="Shared bulletin board and family synchronization."
          />
        );
      case "calendar":
        return <CalendarRoom onGoBack={() => setActiveRoom(null)} />;
      default:
        return null;
    }
  };

  return (
    <div className="hub-shell relative h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-800 selection:bg-cyan-200">
      {/* Ambient Glass Refraction Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-cyan-400/30 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-rose-400/30 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] bg-indigo-400/20 rounded-full blur-[150px] pointer-events-none z-0"></div>

      <div className="relative w-full h-full z-10 flex flex-col">
        {activeRoom ? (
          <div
            className={`hub-room-viewport flex h-full w-full flex-col bg-white/20 backdrop-blur-lg${activeRoom === "calendar" ? " hub-room-viewport--calendar" : ""}`}
          >
            {activeRoom !== "calendar" && (
              <header className="hub-room-bar flex shrink-0 items-center border-b border-white/50 bg-white/40 px-3 py-2 backdrop-blur-md sm:px-4">
                <button
                  type="button"
                  onClick={() => setActiveRoom(null)}
                  className="flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-sm font-bold text-slate-800 shadow-sm backdrop-blur-xl transition-all hover:bg-cyan-600 hover:text-white sm:gap-2 sm:px-4 sm:py-2"
                >
                  <ChevronLeft size={18} className="shrink-0" />
                  Go Back
                </button>
              </header>
            )}
            <div className="hub-room-scroll min-h-0 flex-1">{renderRoom()}</div>
          </div>
        ) : (
          <>
            <MarkerBoard />
            <TopNavigation activeRoom={activeRoom} setActiveRoom={setActiveRoom} />

            {/* Minimal Internet Status Widget (No Background) */}
            <div className="fixed top-8 left-8 z-40 flex items-center gap-3 cursor-default pointer-events-none select-none">
              <div
                className={`w-4 h-4 rounded-full transition-colors duration-500 ${internetStatus ? "bg-green-500 shadow-[0_0_15px_#22c55e]" : "bg-red-500 shadow-[0_0_15px_#ef4444]"}`}
              ></div>
              <span
                className={`text-2xl font-black tracking-tight ${internetStatus ? "text-green-600" : "text-red-600 drop-shadow-md"}`}
              >
                INTERNET {internetStatus ? "ON" : "OFF"}
              </span>
            </div>

            <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex w-72 flex-col gap-4">
              <TodayWidget />
              <HomeNotificationsWidget />
            </div>

            <button
              type="button"
              onClick={() => {
                setCaptureKind(null);
                setShowPhotoKindPick((v) => !v);
              }}
              className="fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-full border border-white/80 bg-white/90 px-6 py-4 font-bold text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.15)] backdrop-blur-xl transition hover:bg-cyan-600 hover:text-white"
            >
              <Camera size={22} />
              Take a photo
            </button>

            {showPhotoKindPick && (
              <PhotoKindBubbles
                onClose={() => setShowPhotoKindPick(false)}
                onPick={(kind) => {
                  setShowPhotoKindPick(false);
                  setCaptureKind(kind);
                }}
              />
            )}

            {captureKind && (
              <HomeCameraCapture
                kind={captureKind}
                onClose={() => setCaptureKind(null)}
                onSaved={() => setCaptureKind(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
