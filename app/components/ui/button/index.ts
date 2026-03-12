import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  `
    inline-flex shrink-0 cursor-pointer items-center justify-center gap-2
    rounded-sm text-base font-medium tracking-wider whitespace-nowrap
    transition-all outline-none
    focus-visible:ring-2 focus-visible:ring-ring/50
    disabled:pointer-events-none disabled:opacity-50
    aria-invalid:border-destructive
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-5
  `,
  {
    variants: {
      variant: {
        'default':
          'bg-primary-300 text-neutral-0 hover:bg-primary-400',
        'destructive':
          'bg-destructive text-white hover:bg-destructive/90',
        'outline':
          `
            border border-neutral-200 bg-neutral-0 text-neutral-900
            hover:bg-neutral-100
          `,
        'outline-primary':
          `
            border border-primary-300 bg-neutral-0 text-primary-300
            hover:bg-primary-100
          `,
        'secondary':
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        'ghost':
          'hover:bg-neutral-100 hover:text-neutral-900',
        'link': 'text-primary-300 underline-offset-4 hover:underline',
      },
      size: {
        'default': 'px-4 py-2',
        'sm': 'rounded-xs px-3 py-1.5 text-sm',
        'lg': 'px-6 py-3',
        'icon': 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
export interface ButtonVariants {
  variant?: 'default' | 'destructive' | 'outline' | 'outline-primary' | 'secondary' | 'ghost' | 'link' | null
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg' | null
}
