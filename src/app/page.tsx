import Image from "next/image";

export default function Home() {
  return (
    <div className="grid gap-4">
      <a className="underline" href="/dashboard">Go to Dashboard</a>
      <a className="underline" href="/log">Add a Log</a>
      <a className="underline" href="/exercises">Exercises</a>
    </div>
  );
}
