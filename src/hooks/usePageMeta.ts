import { useEffect } from 'react'

/** Atualiza o título da aba e a meta description por página (SEO). */
export function usePageMeta(title: string, description?: string): void {
  useEffect(() => {
    document.title = title
    if (description) {
      let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
      if (!tag) {
        tag = document.createElement('meta')
        tag.name = 'description'
        document.head.appendChild(tag)
      }
      tag.content = description
    }
  }, [title, description])
}
