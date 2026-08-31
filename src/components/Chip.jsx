function Chip({ active = false, className = '', children, ...props }) {
  return (
    <span
      className={`cursor-pointer rounded-full border-[1.3px] px-3.5 py-[7px] text-[13.5px] font-medium ${
        active ? 'border-blue-deep bg-blue-deep text-cream' : 'border-line bg-white text-ink-soft'
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

export default Chip
