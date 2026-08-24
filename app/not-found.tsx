import Link from "next/link";

export const metadata = { title: "404" };

export default function NotFound() {
  return (
    <section className="paper-grid flex min-h-[70vh] items-center justify-center">
      <div className="mx-auto w-full max-w-page px-6 py-24 text-center md:px-10">
        <p className="mono text-[0.625rem] tracking-[0.3em] text-stone" data-reveal>
          ERR 0x404 · SEGMENT NOT FOUND
        </p>
        <pre
          aria-hidden
          className="mono mx-auto mt-8 max-w-md overflow-x-auto border border-ink/40 bg-paper-dim p-6 text-left text-[0.6875rem] leading-[1.9] text-graphite"
          data-reveal
        >
{`$ rebench locate <path>
  ▸ searching index … 0 results
  ▸ this run was never recorded.
  ▸ (or the number was trusted
     without being reproduced.)`}
        </pre>
        <div className="mt-10" data-reveal style={{ "--reveal-delay": "200ms" } as React.CSSProperties}>
          <Link href="/" className="btn btn-solid">RETURN TO INSTRUMENT</Link>
        </div>
      </div>
    </section>
  );
}
