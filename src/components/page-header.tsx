type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
};

export function PageHeader({ title, description, eyebrow }: PageHeaderProps) {
  return (
    <div className="border-b bg-accent/30">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        {eyebrow ? (
          <p className="mb-2 text-base font-medium text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
