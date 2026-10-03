interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: SectionHeadingProps) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="h-display mt-2 text-3xl sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-3 leading-relaxed text-steel-400">{description}</p>
      ) : null}
    </div>
  )
}
