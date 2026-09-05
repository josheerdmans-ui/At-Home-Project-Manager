import { useState, type FormEvent, type ReactNode } from "react";
import { Swords } from "lucide-react";
import { clearNinjaUser, readNinjaUser, writeNinjaUser } from "./ninja-session";

type Props = {
  onBack: () => void;
  children: (user: string, switchPerson: () => void) => ReactNode;
};

export function NinjaWhoAreYou({ onBack, children }: Props) {
  const [user, setUser] = useState(readNinjaUser);
  const [name, setName] = useState("");

  const continueAs = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    writeNinjaUser(trimmed);
    setUser(trimmed);
    setName("");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    continueAs(name);
  };

  if (user) {
    return (
      <>
        {children(user, () => {
          clearNinjaUser();
          setUser(null);
        })}
      </>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-[#FF6A00] p-2 text-white">
            <Swords size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF6A00]">
              Studio
            </p>
            <h1 className="text-lg font-black text-slate-900">Ninja Survivors</h1>
          </div>
        </div>

        <h2 className="text-2xl font-black tracking-tight text-slate-900">Who is this?</h2>
        <p className="mt-2 text-sm text-slate-500">
          Type your name so the board knows who is moving cards and leaving updates. No login
          needed — this stays on this computer.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">Your name</span>
            <input
              autoFocus
              required
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Taylor Kim"
              className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-slate-800 outline-none focus:border-[#FF6A00]"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-[#FF6A00] py-3 text-sm font-bold text-white hover:bg-[#e65f00]"
          >
            Continue
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          className="mt-4 w-full text-center text-sm font-medium text-slate-500 hover:text-[#FF6A00]"
        >
          Back to apps
        </button>
      </div>
    </div>
  );
}
