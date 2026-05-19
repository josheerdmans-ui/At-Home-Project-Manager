import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import type { ImagePhotoKind } from "../../types";
import { useImageVaultMutations } from "../rooms/image-vault/useImageVault";

type Step = "camera" | "preview";

type Props = {
  kind: ImagePhotoKind;
  onClose: () => void;
  onSaved?: () => void;
};

export function HomeCameraCapture({ kind, onClose, onSaved }: Props) {
  const [step, setStep] = useState<Step>("camera");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captureFile, setCaptureFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mut = useImageVaultMutations();

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch {
      setCameraError("Could not access the front camera. Check browser permissions.");
    }
  }, [stopCamera]);

  useEffect(() => {
    if (step === "camera") void startCamera();
    return () => {
      if (step === "camera") stopCamera();
    };
  }, [step, startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [stopCamera, previewUrl]);

  const capture = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!blob) return;

    stopCamera();
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
    const url = URL.createObjectURL(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
    setCaptureFile(file);
    setStep("preview");
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCaptureFile(null);
    setStep("camera");
  };

  const save = async () => {
    if (!captureFile) return;
    await mut.createPhoto.mutateAsync({
      photo_kind: kind,
      file: captureFile,
      notes: notes.trim() || null,
    });
    onSaved?.();
    onClose();
  };

  const title = kind === "memory" ? "Memory" : "Person";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-black text-slate-900">
            {step === "camera" ? title : "Save to Image"}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === "camera" && (
            <div className="space-y-4">
              {cameraError ? (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{cameraError}</p>
              ) : (
                <div className="overflow-hidden rounded-2xl bg-slate-900">
                  <video ref={videoRef} className="aspect-[3/4] w-full object-cover mirror" playsInline muted />
                </div>
              )}
              <button
                type="button"
                onClick={() => void capture()}
                disabled={!!cameraError}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-cyan-600 py-4 text-lg font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                <Camera size={22} />
                Capture
              </button>
            </div>
          )}

          {step === "preview" && previewUrl && (
            <div className="space-y-4">
              <img src={previewUrl} alt="Preview" className="w-full rounded-2xl object-cover" />
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-600">Caption (optional)</span>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What is this photo?"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <button
                type="button"
                onClick={() => void save()}
                disabled={mut.createPhoto.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-cyan-600 py-3 font-bold text-white hover:bg-cyan-700 disabled:opacity-60"
              >
                <ImageIcon size={18} />
                {mut.createPhoto.isPending ? "Saving…" : "Save to Image"}
              </button>
              <button type="button" onClick={retake} className="w-full text-sm font-bold text-slate-500">
                Retake
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
