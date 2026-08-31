const variants = {
  primary: 'bg-blue-deep text-cream hover:shadow-[0_6px_16px_rgba(22,50,79,.28)]',
  ghost: 'bg-transparent text-blue-deep border border-line',
  terracotta: 'bg-terracotta text-white hover:shadow-[0_6px_16px_rgba(201,106,68,.32)]',
  whatsapp: 'bg-green text-white',
}

function Button({ as: Tag = 'button', variant = 'primary', className = '', children, ...props }) {
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 rounded-[9px] px-5 py-[11px] text-[14.5px] font-semibold cursor-pointer transition-transform hover:-translate-y-px ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}

export default Button
