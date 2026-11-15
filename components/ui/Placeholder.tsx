// Visible marker for content that is still missing. Renders in amber with a
// dashed outline and a data attribute, so placeholders are easy to spot on the
// page and to find in the DOM: document.querySelectorAll('[data-placeholder]').
export default function Placeholder({ id, children, block = false }: { id: string; children: React.ReactNode; block?: boolean }) {
  const Tag = block ? 'div' : 'span';
  return (
    <Tag
      data-placeholder={id}
      title={`PLACEHOLDER: ${id} — see PLACEHOLDERS.md`}
      className={`${block ? 'flex' : 'inline-flex'} items-center gap-1 border border-dashed border-amber/70 bg-amber/10 px-1.5 text-amber`}
    >
      {children}
    </Tag>
  );
}
