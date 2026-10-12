'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import { cn } from '@/lib/cn'

function ToolbarButton({ active, onClick, label, children }: { active?: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn('grid h-8 min-w-8 place-items-center rounded-[2px] px-2 text-[0.82rem] transition-colors', active ? 'bg-walnut text-ivory' : 'text-walnut hover:bg-beige-soft')}
    >
      {children}
    </button>
  )
}

/** Simple, safe rich text: headings, bold, italic, lists, links, quotes. Output is sanitised on save. */
export function RichTextEditor({ value, onChange, id }: { value: string; onChange: (html: string) => void; id?: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose-looma min-h-[160px] px-4 py-3 focus:outline-none',
        ...(id ? { id } : {}),
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  })

  // Keep in sync if the value is replaced from outside (e.g. reset).
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) editor.commands.setContent(value || '', { emitUpdate: false })
  }, [editor, value])

  if (!editor) return <div className="min-h-[200px] rounded-[2px] border border-line-strong bg-surface" />

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link address (e.g. /shop or https://…)', prev ?? '')
    if (url === null) return
    if (!url) editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="overflow-hidden rounded-[2px] border border-line-strong bg-surface focus-within:border-walnut">
      <div className="flex flex-wrap gap-1 border-b border-line bg-ivory px-2 py-1.5">
        <ToolbarButton label="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton label="Subheading" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolbarButton>
        <span className="mx-1 w-px bg-line" />
        <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <u>U</u>
        </ToolbarButton>
        <span className="mx-1 w-px bg-line" />
        <ToolbarButton label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          “ ”
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive('link')} onClick={setLink}>
          Link
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
