import { useState, type FormEvent, type ReactNode } from "react";
import { clearNinjaUser, readNinjaUser, writeNinjaUser } from "./ninja-session";
import { NinjaIcon, NinjaLogo } from "./NinjaBrand";
import { NINJA } from "./ninja-ui";

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
    <div className={`relative flex min-h-screen items-center justify-center overflow-hidden p-6 ${NINJA.page}`}>
      <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-[#8B5CF6]/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-[#FF8C42]/15 blur-[110px]" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#1E2028]/80 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <NinjaIcon className="mb-3 h-24 w-24 ring-1 ring-[#FF8C42]/40" />
          <NinjaLogo className="h-14 w-full max-w-xs" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white">Who is this?</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Type your name so the board knows who is moving cards and leaving updates. No login
          needed — this stays on this computer.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-zinc-300">Your name</span>
            <input
              autoFocus
              required
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Taylor Kim"
              className={`w-full ${NINJA.input}`}
            />
          </label>
          <button type="submit" className={`w-full rounded-full py-3 text-sm font-bold ${NINJA.orangeBtn}`}>
            Continue
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          className="mt-4 w-full text-center text-sm font-medium text-zinc-500 hover:text-[#FF8C42]"
        >
          Back to apps
        </button>
      </div>
    </div>
  );
}
