import { Toaster as Sonner, type ToasterProps } from 'sonner'

// Único sistema de toast do projeto (substitui o @radix-ui/react-toast).
export function Toaster(props: ToasterProps) {
  return <Sonner theme="dark" {...props} />
}
