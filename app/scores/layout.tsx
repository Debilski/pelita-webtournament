export default function ScoresLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main
      className={`min-h-screen flex-col pt-10 justify-between px-24 py-12 bg-white dark:bg-gray-800`}
    >
      <div className="z-10 w-full max-w-screen items-center justify-between font-mono text-sm space-y-4">{children}</div>
    </main>
  );
}
