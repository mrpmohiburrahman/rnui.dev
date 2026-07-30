export function Hero({
  children,
  title,
}: {
  children?: React.ReactNode
  // Required, so a caller that forgets it gets a compiler error rather than a
  // heading reading "360 car seats review" — the starter template's default, which
  // shipped here for as long as this file has existed.
  title: string
}) {
  return (
    <div className="flex flex-col items-center md:items-start md:px-2 justify-center gap-2">
      <div className="flex items-center space-x-2">
        <h1 className="text-4xl font-black text-left">{title}</h1>
      </div>
      {children}
    </div>
  )
}
