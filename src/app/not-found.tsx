import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-4 py-16 text-center">
      <p className="text-4xl">🗺️</p>
      <h1 className="mt-3 text-2xl font-bold text-primary">Esta página não está no caderno</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Volta às viagens ou lança uma despesa na viagem activa.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
      >
        Ir para Viagens
      </Link>
    </div>
  );
}
